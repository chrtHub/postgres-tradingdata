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
} from "./chatson_types.js";
import { ObjectId } from "mongodb";
//-- ***** ***** ***** GPT-3.5 Turbo SSE ***** ***** ***** //
export const gpt35TurboSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //-- Get params based on request --//
  const llm_provider: LLMProvider = "openai";
  const user_db_id = getUserDbId(req);
  const body: IChatCompletionRequestBody = req.body;
  const { model, prompt, conversation_id, parent_node_id } = body;
  const new_conversation = Boolean(conversation_id);

  // if (new_conversation)
  // createNewConversation

  // else
  // // MongoDB read- fetch conversation by conversation_id
  // // MongoDB read - fetch all message_node by conversation_id

  // create new message_node

  // build conversation tree
  // package request_messages
  // // add system message, prompt.
  // // starting from the parent_node_id, add up to 3000 total tokens by recursively getting the prompt+completion pair from each parent node (don't add single messages, only pairs)
  // // // for each node added, add the node_id to request_messages_node_ids
  // // // calculate the total tokens as the propmt_tokens

  // MongoDB write
  // // new conversation - store conversation, message_node
  // // continuing conversation - store message_node, update parent_node

  // LLM request - send request_messages to LLM

  // create a completion_message with message = ""

  // upon completion start
  // // new conversation - send conversation_id and message_node w/o completion message
  // // continuting conversation - n/a

  // proxy stream SSE completion message
  // // build up completion_message message

  // when SSE done
  // // write completion_message to message_node in MongoDB
  // // update conversation with APIReqResMetadata - append via update or append using immer then update?
  // // send completion_message to the client
};
