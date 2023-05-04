//-- MongoDB Client --//
import { Mongo } from "../../index.js";

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
  IOpenAIChatCompletionRequestBody,
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  IMessageNode,
  APIProviderNames,
  ModelDeveloperNames,
} from "./chatson_types.js";
import { ObjectId } from "mongodb";
import { getSHA256Hash } from "../utils/getSHA256Hash.js";

//-- Outline --//
// (1) Receive:
// // interface IChatCompletionRequestBody {
// //   prompt: IMessage;
// //   conversation_id_string: string | null;
// //   parent_node_id_string: string | null;
// // }

// (2a) New conversation
// // create a new conversation
// (2b) Existing conversation:
// // fetch conversation from MongoDB by conversation_id

// // // TODO - check if conversation has a lock on it. if so, fail request and send error to client. notify client that the conversation can only have a single prompt at a time. if no lock, set a lock (TTL 60 seconds) and proceed.

// // fetch message nodes from MongoDB by conversation_id
// // find root node

// (3) Create new message node based on received prompt, leaving completion as null

// (4a) New conversation
// // add new node's id to root node's children ids array
// // write conversation object to MongoDB

// // // TODO - lock conversation

// // write root node to MongoDB
// (4b) Existing conversation
// // write new node's id to parent node's children ids array in MongoDB

// (5) create request_messages array
// // start with root node prompt content (system message) and new nodes's prompt content
// // // count tokens for each message, add to token count
// // traverse each parent node, adding the completion and the prompt, stopping at the root node or 3k tokens
// // // count tokens for each message, add to token count

// (6) Set headers, send to client. Make POST request to LLM. Create a readable stream and call parser for each received chunk.

// (7a) New conversation - on first received chunk
// // send the conversation object to the client

// (7b) All conversations - on each chunk
// // push the chunks content onto the completion_chunks string to be sent on [DONE]
// // URI encode the chunk's content and write it to the client

// (8) On the "[DONE]" event, handle the completion object:
// // build the completion object including the concatenated completion_chunks, its token count, and the creation time
// // add the completion object to the new_message_node
// // write the new_message_node to the MongoDB
// // send the completion object to the client

// (9) Also on the "[DONE]" event, handle the api_req_res_metadata object:
// // build the api_req_res_metatdata object
// // write the api_req_res_metatdata object to the conversation's api_req_res_metatdata array in MongoDB
// // send the api_req_res_metatdata object to the client

// // // TODO - delete the lock on the conversation. send event to client to inform client. client-side use that event to allow another submission.

// (10) Close the SSE connection to the client.

//-- ***** ***** ***** GPT-3.5 Turbo SSE ***** ***** ***** //
export const gpt35TurboSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("----- gpt35TurboSSEController -----"); // DEV
  //-- Cosntants based on route --//
  const api_provider_name: APIProviderNames = "openai";
  const model_developer_name: ModelDeveloperNames = "openai";

  //-- Constants based on request --//
  const user_db_id = getUserDbId(req);
  const body: IOpenAIChatCompletionRequestBody = req.body;
  const { prompt } = body;
  const model = prompt.model;

  //-- Variables for on new/existing conversation --//
  let { conversation_id_string, parent_node_id_string, temperature } = body;

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

  if (temperature) {
    if (temperature < 0) {
      temperature = 0;
    } else if (temperature > 2) {
      temperature = 2;
    }
  }

  //-- New or existing conversation --//
  let conversation: IConversation;
  let existing_conversation_message_nodes: IMessageNode[] = [];
  let root_node: IMessageNode | null = null;
  if (!conversation_id || !parent_node_id) {
    //-- Create new conversation --//
    let response = createConversation(
      user_db_id,
      model,
      api_provider_name,
      model_developer_name,
      null
    );
    conversation_id = response.conversation_id;
    parent_node_id = response.root_node_id;
    conversation = response.conversation;
    root_node = response.root_node;
  } else {
    //-- Fetch conversation --//
    try {
      let response = await Mongo.conversations.findOne({
        _id: conversation_id,
        user_db_id: user_db_id, //-- Security --//
      });
      if (response) {
        conversation = response; //-- set conversation --//
      } else {
        throw new Error(`unknown conversation_id: ${conversation_id}`);
      }
    } catch (err) {
      console.log(err);
      throw new Error("fetching conversation error");
    }
    //-- Fetch existing_conversation_nodes --//
    try {
      let response = await Mongo.message_nodes
        .find({
          conversation_id: conversation_id,
          user_db_id: user_db_id, //-- Security --//
        })
        .toArray();
      if (response) {
        //-- set existing_conversation_message_nodes --//
        existing_conversation_message_nodes = response;
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
    let response = existing_conversation_message_nodes.find((message_node) =>
      message_node._id.equals(conversation.root_node_id)
    );
    if (response) {
      root_node = response; //-- Set root_node --//
    } else {
      throw new Error(
        `root node not found for conversation_id: ${conversation_id}`
      );
    }
  }

  //-- Create new message_node --//
  let new_message_node: IMessageNode = {
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

  //-- Build request_messages and request_message_node_ids. Count tokens. --//
  const request_messages_node_ids: ObjectId[] = [];
  request_messages_node_ids.push(new_message_node._id);
  let request_tokens: number = 0;
  request_tokens += tiktoken(root_node.prompt.content);
  request_tokens += tiktoken(new_message_node.prompt.content);

  //-- Create node_map for O(1) lookups inside the while loop --//
  let node_map: Record<string, IMessageNode> = {};
  existing_conversation_message_nodes.forEach((node) => {
    node_map[node._id.toString()] = node;
  });

  //-- For new conversation, request messages is ready. For !new_conversation, add up to 3k tokens of messages. Newest node was already added, start from its parent. --//
  if (!new_conversation && new_message_node.parent_node_id) {
    let node = node_map[new_message_node.parent_node_id.toString()];
    let tokenLimitHit: boolean = false;

    //-- Stop when root node reached (parent id will be null) or token limit hit --//
    while (node?.parent_node_id && !tokenLimitHit) {
      //-- Add completion if it exists --//
      let completion_content = node.completion?.content;
      if (completion_content) {
        let completionTokens: number = tiktoken(completion_content);

        if (request_tokens + completionTokens < 3000) {
          let completion_request_message: ChatCompletionRequestMessage = {
            content: completion_content,
            role: "assistant",
          };
          request_messages.splice(1, 0, completion_request_message);
          request_tokens += completionTokens;
        } else {
          tokenLimitHit = true;
        }
      }

      //-- Add prompt --//
      let prompt_content = node.prompt.content;
      let promptTokens = tiktoken(prompt_content);
      if (request_tokens + promptTokens < 3000) {
        let prompt_request_message: ChatCompletionRequestMessage = {
          content: prompt_content,
          role: "user",
        };
        request_messages.splice(1, 0, prompt_request_message);
        request_tokens += promptTokens;
        request_messages_node_ids.push(node._id);
      }

      //-- Get the parent node --//
      node = node_map[node.parent_node_id.toString()];
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
    "CHRT-root-node-id": new_conversation ? root_node._id : "none",
    "CHRT-root-node-created-at": new_conversation
      ? root_node.created_at
      : "none",
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
    const request_body: CreateChatCompletionRequest = {
      model: model.model_api_name,
      messages: request_messages,
      stream: true,
      user: await getSHA256Hash(user_db_id),
      temperature: temperature,
    };

    //-- Axios POST request to OpenAI --//
    let response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      request_body,
      {
        // TODO - implement AbortController?
        // signal
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
            author: model.model_api_name,
            model: model,
            created_at: completion_created_at,
            role: "assistant",
            content: completion_content,
          };

          //-- Update new_message_node by adding completion --//
          new_message_node = produce(new_message_node, (draft) => {
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
            model_api_name: model.model_api_name,
            params: {
              temperature: temperature,
            },
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
