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

  // build conversation tree from message_nodes

  // // starting from the parent_node_id, add up to 3000 total tokens by recursively getting the prompt+completion pair from each parent node (don't add single messages, only pairs)
  // request_messages.splice(1, 0, message)

  // // // for each node added, add the node_id to request_messages_node_ids
  // // // calculate the total tokens as the propmt_tokens

  // LLM request - send request_messages to LLM

  // create a completion_message with message = ""

  // upon completion start
  // // new conversation - send conversation_id and message_node w/o completion message
  // // continuting conversation - n/a

  // proxy stream SSE completion message
  // // build up completion_message message

  // when SSE done

  let completion: IMessage = {
    author: model.api_name,
    model: model,
    created_at: new Date(),
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
  // // update conversation with APIReqResMetadata - append via update or append using immer then update?
  // // send completion_message to the client
};
