//-- MongoDB Client --//
import { MongoClient } from "../../index.js";

//-- OpenAI Client --//
import { getOpenAI_API_Key } from "../config/OpenAIConfig.js";
import { openai } from "../../index.js";
import { tiktoken } from "./tiktoken.js";

//-- Node Functions --//
import { Readable } from "stream";

//-- NPM Functions --//
import axios from "axios";
import produce from "immer";
import { createParser } from "eventsource-parser";
import sortBy from "lodash/sortBy.js";
import reverse from "lodash/reverse.js";

//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import { getUUIDV4 } from "../utils/getUUIDV4.js";
import { createConversation } from "../utils/createConversation.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";
import {
  IAPIReqResMetadata,
  IMessage,
  IModel,
  IConversation,
  IChatCompletionRequestBody,
  ChatCompletionRequestMessage,
  LLMProvider,
  IMessageNode,
} from "./chatson_types.js";
import { ObjectId } from "mongodb";
//-- ***** ***** ***** GPT-3.5 Turbo SSE ***** ***** ***** //
export const gpt35TurboSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //-- Constants based on request --//
  const llm_provider: LLMProvider = "openai";
  const user_db_id = getUserDbId(req);
  const body: IChatCompletionRequestBody = req.body;
  const { model, prompt } = body;

  //-- Variables based on new/existing conversation --//
  let { conversation_id, parent_node_id } = body;
  let conversation: IConversation;
  let root_node: IMessageNode;

  //-- Other --//
  const new_conversation = Boolean(conversation_id);
  let existing_conversation_message_nodes: IMessageNode[];

  //-- MongoDB Collection Clients --//
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
  if (!conversation_id || !parent_node_id) {
    //-- Create new conversation --//
    let res = createConversation(user_db_id, model, llm_provider, null);
    conversation_id = res.conversation_id;
    parent_node_id = res.root_node_id;
    conversation = res.conversation;
    root_node = res.root_node;
  } else {
    //-- Fetch conversation --//
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
    //-- Fetch all message_nodes --//
    try {
      let res = await Mongo.message_nodes.find({ conversation_id }).toArray();
      if (res) {
        //-- set existing_conversation_message_nodes --//
        existing_conversation_message_nodes = res;
      } else {
        throw new Error(
          `no existing_conversation_message_nodes found for conversation_id: ${conversation_id}`
        );
      }
    } catch (err) {
      console.log(err);
      throw new Error("fetching message_nodes error");
    }
    //-- Find root_node --//
    let res = existing_conversation_message_nodes.find((message_node) =>
      message_node._id.equals(root_node._id)
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

  //-- Update root_node by adding message_node to its children --//
  root_node = produce(root_node, (draft) => {
    draft.children_node_ids.push(new_message_node._id);
  });

  //-- For new conversation  --//
  if (new_conversation) {
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

  // build conversation tree from message_nodes
  // // starting from the parent_node_id, add up to 3000 total tokens by recursively getting the prompt+completion pair from each parent node (don't add single messages, only pairs)

  // request_tokens += tiktoken(message)
  // request_messages.splice(1, 0, message)

  // // // for each node added, add the node_id to request_messages_node_ids
  // // // calculate the total tokens as the prompt_tokens

  let api_req_res_metadata: IAPIReqResMetadata;

  let completion_content: string;

  //-- Set headers --//
  res.set({
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Access-Control-Expose-Headers":
      "CHRT-conversation-id, CHRT-new-message-node-id, CHRT-new-message-created-at, CHRT-parent-node-id",
    "CHRT-conversation-id": new_message_node.conversation_id,
    "CHRT-new-message-node-id": new_message_node._id,
    "CHRT-new-message-created-at": new_message_node.created_at,
    "CHRT-parent-node-id": new_message_node.parent_node_id,
  });
  //-- Send headers immediately (don't wait for first chunk or message end) --//
  res.flushHeaders();

  // LLM request - send request_messages to LLM
  try {
    //-- Get API Key --//
    let OPENAI_API_KEY = await getOpenAI_API_Key();

    // TODO - add type here, e.g. Interface for OpenAI Chat Completions Request Body. Allow parameters such as temperature, etc.
    const request_body = {
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
    async function onParse(event: any) {
      if (event.type === "event") {
        if (event.data !== "[DONE]") {
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

          //-- Send completion to client --//
          const completion_string = JSON.stringify(completion);
          res.write(`id: completion_message\ndata: ${completion_string}\n\n`);

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
      })}\n\n`
    );
    //-- Close the connection after sending the error message --//
    res.end();
  } // TODO - test that frontend parses this correctly
};
