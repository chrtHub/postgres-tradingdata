//-- MongoDB Client --//
import { MongoClient } from "../../index.js";

//-- OpenAI Client --//
import { getOpenAI_API_Key } from "../config/OpenAIConfig.js";
import { tiktoken } from "./tiktoken.js";

//-- Node Functions --//
import { Readable } from "stream";

//-- NPM Functions --//
import axios from "axios";
import produce from "immer";
import { createParser } from "eventsource-parser";

//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import { createConversation } from "../utils/createConversation.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";
import {
  IAPIReqResMetadata,
  IMessage,
  IConversation,
  IChatCompletionRequestBody,
  ChatCompletionRequestMessage,
  IOpenAIChatCompletionsRequestBody,
  LLMProvider,
  IMessageNode,
} from "./chatson_types.js";
import { ObjectId } from "mongodb";

//-- ***** ***** ***** GPT-3.5 Turbo SSE ***** ***** ***** //
export const gpt35TurboSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("----- gpt35TurboSSEController -----"); // DEV
  //-- Constants based on request --//
  const llm_provider: LLMProvider = "openai";
  const user_db_id = getUserDbId(req);
  const body: IChatCompletionRequestBody = req.body;
  const { prompt } = body;
  const model = prompt.model;

  //-- Variables for on new/existing conversation --//
  let { conversation_id_string, parent_node_id_string } = body;

  //-- Other --//
  let conversation_id: ObjectId | null = null;
  let parent_node_id: ObjectId | null = null;
  let new_conversation: boolean = false;

  if (conversation_id_string && parent_node_id_string) {
    conversation_id = ObjectId.createFromHexString(conversation_id_string);
    parent_node_id = ObjectId.createFromHexString(parent_node_id_string);
  } else {
    new_conversation = true;
  }

  let existing_conversation_message_nodes: IMessageNode[] = [];

  //-- MongoDB client for each databse collection --//
  const Mongo = {
    conversations:
      MongoClient.db("chrtgpt-journal").collection<IConversation>(
        "conversations"
      ),
    message_nodes:
      MongoClient.db("chrtgpt-journal").collection<IMessageNode>(
        "message_nodes"
      ),
  };

  //-- New or existing conversation --//
  let conversation: IConversation;
  let root_node: IMessageNode | null = null;
  if (!conversation_id || !parent_node_id) {
    //-- Create new conversation --//
    console.log("CREATE NEW CONVERSATION"); // DEV
    let res = createConversation(user_db_id, model, llm_provider, null);
    conversation_id = res.conversation_id;
    parent_node_id = res.root_node_id;
    conversation = res.conversation;
    root_node = res.root_node;
  } else {
    //-- Fetch conversation --//
    console.log("FETCH CONVERSATION"); // DEV
    console.log(conversation_id); // DEV
    try {
      let res = await Mongo.conversations.findOne({ _id: conversation_id });
      if (res) {
        conversation = res; //-- set conversation --//
      } else {
        throw new Error(`unknown conversation_id: ${conversation_id}`);
      }
    } catch (err) {
      console.log(err);
      throw new Error("fetching conversation error");
    }
    //-- Fetch existing_conversation_nodes --//
    console.log("FETCH EXISTING CONVERSATION NODES"); // DEV
    try {
      let res = await Mongo.message_nodes
        .find({ conversation_id: conversation_id })
        .toArray();
      if (res) {
        //-- set existing_conversation_message_nodes --//
        existing_conversation_message_nodes = res;
        console.log(existing_conversation_message_nodes); // DEV
      } else {
        throw new Error(
          `no existing_conversation_message_nodes found for conversation_id: ${conversation_id}`
        );
      }
    } catch (err) {
      console.log(err);
      throw new Error("fetching message_nodes error");
    }
    //-- Find root_node for existing conversations --//
    let res = existing_conversation_message_nodes.find((message_node) =>
      message_node._id.equals(conversation.root_node_id)
    );
    if (res) {
      root_node = res; //-- Set root_node --//
    } else {
      throw new Error(
        `root node not found for conversation_id: ${conversation_id}`
      );
    }
  }

  //-- Create new message_node --//
  const new_message_node: IMessageNode = {
    _id: new ObjectId(),
    user_db_id: user_db_id,
    created_at: new Date(),
    conversation_id: conversation_id,
    parent_node_id: parent_node_id,
    children_node_ids: [],
    prompt: prompt,
    completion: null,
  };

  //-- For new conversation  --//
  if (new_conversation) {
    //-- Update root_node by adding message_node to its children --//
    root_node = produce(root_node, (draft) => {
      draft.children_node_ids.push(new_message_node._id);
    });

    try {
      //-- Write conversation and root_node to database  --//
      await Mongo.conversations.insertOne(conversation);
      await Mongo.message_nodes.insertOne(root_node);
    } catch (err) {
      console.log(err);
      throw new Error("error storing new conversation and/or root_node");
    }
  } else {
    //-- For existing conversation --//
    try {
      //-- Write message_node's _id to parent_node's children array --//
      await Mongo.message_nodes.updateOne(
        { _id: parent_node_id },
        { $addToSet: { children_node_ids: new_message_node._id } }
      );
    } catch (err) {
      console.log(err);
      throw new Error("error updating parent node");
    }
  }

  //-- Start request_messages with system message + prompt --//
  let request_messages: ChatCompletionRequestMessage[] = [
    {
      role: root_node.prompt.role,
      content: root_node.prompt.content,
    },
    {
      role: new_message_node.prompt.role,
      content: new_message_node.prompt.content,
    },
  ];

  //-- Start tracking request_message_node_ids and request_tokens --//
  const request_messages_node_ids: ObjectId[] = [];
  request_messages_node_ids.push(new_message_node._id);
  let request_tokens: number = 0;
  request_tokens += tiktoken(root_node.prompt.content);
  request_tokens += tiktoken(new_message_node.prompt.content);

  //-- If continuing a conversation, add messages from thread --//
  if (!new_conversation) {
    //-- Just ensuring new_message_node.parent_node_id exist --//
    if (new_message_node.parent_node_id) {
      //-- Create node_map for O(1) lookups inside the while loop --//
      let node_map: Record<string, IMessageNode> = {};
      existing_conversation_message_nodes.forEach((node) => {
        node_map[node._id.toString()] = node;
      });

      //-- Initial id and node --//
      let id: ObjectId = new_message_node.parent_node_id;
      let node: IMessageNode = node_map[id.toString()];

      let token_limit_hit: boolean = false;
      while (!token_limit_hit) {
        //-- Just ensuring id and node.completion exist --//
        if (id && node?.completion) {
          //-- Check if node's messages fit within 3k token running total --//
          let prompt_tokens = tiktoken(node.prompt.content);
          let completion_tokens = tiktoken(node.completion.content);

          if (request_tokens + prompt_tokens + completion_tokens < 3000) {
            request_messages.splice(1, 0, node.completion); //-- Newest to oldest --//
            request_messages.splice(1, 0, node.prompt);
            request_tokens += prompt_tokens + completion_tokens;

            //- Add id to request_messages_node_ids --//
            request_messages_node_ids.push(id);

            //-- Traverse back thru history by getting parent node --//
            if (node.parent_node_id) {
              node = node_map[node.parent_node_id.toString()];
            }
          } else {
            token_limit_hit = true;
          }
        }
      }
    }
  }

  let api_req_res_metadata: IAPIReqResMetadata;

  //-- Set headers --//
  res.set({
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    //-- Send headers with info for the IMessageNode --//
    // NOTE - could include completion object w/o content here
    "Access-Control-Expose-Headers":
      "CHRT-root-node-id, CHRT-root-node-created-at, CHRT-conversation-id, CHRT-new-node-id, CHRT-new-node-created-at, CHRT-parent-node-id",
    "CHRT-root-node-id": new_conversation ? root_node._id : null,
    "CHRT-root-node-created-at": new_conversation ? root_node.created_at : null,
    "CHRT-conversation-id": new_message_node.conversation_id,
    "CHRT-new-node-id": new_message_node._id,
    "CHRT-new-node-created-at": new_message_node.created_at,
    "CHRT-parent-node-id": new_message_node.parent_node_id,
  });
  //-- Send headers immediately (don't wait for first chunk or message end) --//
  res.flushHeaders();

  //-- Send request to LLM --//
  try {
    //-- Get API Key --//
    let OPENAI_API_KEY = await getOpenAI_API_Key();

    //-- Reqeuest body --//
    const request_body: IOpenAIChatCompletionsRequestBody = {
      model: model.api_name,
      messages: request_messages,
      stream: true,
    };

    //-- Axios POST request to OpenAI --//
    let response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      request_body,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        responseType: "stream",
      }
    );

    //-- Create readable stream --//
    const readableStream = new Readable({
      read() {},
    });

    //-- Feed response.data to readableStream --//
    response.data.on("data", (chunk: any) => readableStream.push(chunk));
    response.data.on("end", () => readableStream.push(null));

    //-- Create text decoder (binary --> string) --//
    //-- UInt8Array | ArrayBuffer | Buffer --> UTF-8 (default) --//
    const textDecoder = new TextDecoder();

    //-- Create parser --//
    const parser = createParser(onParse);

    //-- Decode readableStream chunks and feed them to the parser --//
    readableStream.on("data", (chunk) => {
      parser.feed(textDecoder.decode(chunk));
    });

    //-- Use array to save response to MongoDB when streaming finishes --//
    const completion_chunks: string[] = [];

    //-- Inside parser, send each chunk to the client, then close the connection --//
    let conversation_sent: boolean = false;
    async function onParse(event: any) {
      if (event.type === "event") {
        if (event.data !== "[DONE]") {
          //-- For new conversations, send conversation upon first event --//
          if (new_conversation && !conversation_sent) {
            let conversation_string = JSON.stringify(conversation);
            res.write(`id: conversation\ndata: ${conversation_string}\n\n`);
            conversation_sent = true;
          }

          //-- Get data from event --//
          let data = JSON.parse(event.data).choices[0].delta?.content || "";

          //-- Add chunk to response chunks (to be accessed post-stream) --//
          completion_chunks.push(data);

          //-- URI Encode to avoid content and delimeter `\n\n` collisions --//
          const uriEncodedData = encodeURI(data);

          //-- Send data to the client --//
          res.write(`data: ${uriEncodedData}\n\n`);
          //----//
        } else if (event.data === "[DONE]") {
          //-- Build completion --//
          const completion_content = completion_chunks.join("");
          const completion_tokens = tiktoken(completion_content.toString());
          const completion_created_at = new Date();
          const completion: IMessage = {
            author: model.api_name,
            model: model,
            created_at: completion_created_at,
            role: "assistant",
            content: completion_content,
          };

          //-- Update new_message_node by adding completion --//
          root_node = produce(new_message_node, (draft) => {
            draft.completion = completion;
          });

          //-- Write new_message_node to database --//
          try {
            await Mongo.message_nodes.insertOne(new_message_node);
          } catch (err) {
            console.log(err);
            throw new Error("error storing new message_node");
          }

          //-- Send completion to client --//
          const completion_string = JSON.stringify(completion);
          res.write(`id: completion\ndata: ${completion_string}\n\n`);

          //-- Update api_req_res_metadata --//
          api_req_res_metadata = {
            user: user_db_id,
            model_api_name: model.api_name,
            created_at: new Date(),
            request_tokens: request_tokens,
            completion_tokens: completion_tokens,
            total_tokens: request_tokens + completion_tokens,
            node_id: new_message_node._id,
            request_messages_node_ids: request_messages_node_ids,
          };

          //-- Write api_req_res_metadata as update to conversation --//
          try {
            await Mongo.conversations.updateOne(
              { _id: new_message_node.conversation_id },
              { $addToSet: { api_req_res_metadata: api_req_res_metadata } }
            );
          } catch (err) {
            console.log(err);
            throw new Error(
              "error adding api_req_res_metadata to conversation"
            );
          }

          //-- Send api_req_res_metatdata to client --//
          const api_req_res_metadata_string =
            JSON.stringify(api_req_res_metadata);
          res.write(
            `id: api_req_res_metadata\ndata: ${api_req_res_metadata_string}\n\n`
          );

          //-- Close connection --//
          res.end();
        }
      } else if (event.type === "reconnect-interval") {
        console.log("%d milliseconds reconnect interval", event.value);
      }
    }
    //----//
  } catch (err) {
    console.log(err);
    res.write(
      `id: error\ndata: ${JSON.stringify({
        message: "error during gpt35turboStreamController LLM query",
        error: err,
      })}\n\n` // TODO - test that frontend parses this correctly
    );

    //-- Close the connection after sending the error message --//
    res.end();
  }
};
