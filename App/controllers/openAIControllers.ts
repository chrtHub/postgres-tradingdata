// TODO - clean up imports
//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import { createParser } from "eventsource-parser";
import produce from "immer";
import { Readable } from "stream";
import axios from "axios";
import { getOpenAI_API_Key } from "../config/OpenAIConfig.js";
import { MongoClient } from "../../index.js";
import sortBy from "lodash/sortBy.js";
import reverse from "lodash/reverse.js";
import { getUUIDV4 } from "../utils/getUUIDV4.js";
import { ObjectId } from "mongodb";
//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";
import {
  IAPIResponse,
  IMessage,
  IModel,
  IConversation,
  IChatCompletionRequestBody,
  ChatCompletionRequestMessage,
  UUIDV4,
} from "./chatson_types.js";

//-- OpenAI Client --//
import { openai } from "../../index.js";
import { tiktoken } from "./tiktoken.js";
import { getNewConversation } from "../utils/getNewConversation.js";

//-- ***** ***** ***** GPT-3.5 Turbo SSE ***** ***** ***** //
export const gpt35TurboSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log(" ----- gpt35TurboSSEController -----"); // DEV
  //-- Get user_db_id --//
  let user_db_id = getUserDbId(req);

  //-- Get params from req.body --//
  let body: IChatCompletionRequestBody = req.body;
  let _id = body._id;
  let new_message = body.new_message;
  let version_of = body.version_of;
  let model = body.model;

  let conversation: IConversation;
  let is_new_conversation: boolean = false;

  //-- If convsersation_uuid is the 'dummy' value, start a new conversation --//
  if (_id == new ObjectId("000000000000000000000000")) {
    conversation = getNewConversation(model, null);
    is_new_conversation = true;
  } else {
    //-- Else continue conversation --//
    let res = await MongoClient.db("chrtgpt-journal")
      .collection("conversations")
      .findOne({ _id: _id });
    if (res) {
      conversation = res as IConversation; // TO TEST THIS
    } else {
      conversation = getNewConversation(model, null);
    }
  }

  //-- Set user_db_id --//
  if ((conversation.user_db_id = "dummy_user_db_id")) {
    conversation = produce(conversation, (draft) => {
      draft.user_db_id = user_db_id;
    });
  }

  //-- Timestamps to use for new_message and completion version and order --//
  let timestamp_unix_ms = Date.now();
  let new_message_order_timestamp = version_of || timestamp_unix_ms;
  let new_message_version_timestamp = timestamp_unix_ms;
  let completion_pseudo_timestamp = timestamp_unix_ms + 1;

  //-- Update `messages` and `message_order` --//
  conversation = produce(conversation, (draft) => {
    //- Add 'new_message' to 'conversation.messages' --//
    draft.messages[new_message.message_uuid] = new_message;

    //-- Add 'order' and 'version' of 'new_message' to 'conversation.message_order' --//
    draft.message_order[new_message_order_timestamp] = {
      [new_message_version_timestamp]: new_message.message_uuid,
    };
  });

  //-- Save to MongoDB via insert or update --//
  if (is_new_conversation) {
    try {
      await MongoClient.db("chrtgpt-journal") // DEV - await or no??
        .collection("conversations")
        .insertOne(conversation);
    } catch (err) {
      console.log(err);
    }
  } else {
    try {
      await MongoClient.db("chrtgpt-journal") // DEV - await or no??
        .collection("conversations")
        .updateOne({ _id: conversation._id }, { $set: conversation });
    } catch (err) {
      console.log(err);
    }
  }

  //-- Build requests messages array to send to LLM --//
  let system_message = conversation.messages[conversation.message_order[1][1]];
  let request_messages: ChatCompletionRequestMessage[] = [
    //-- System Message--//
    {
      role: system_message.role,
      content: system_message.message,
    },
  ];

  //-- Add to to 3k tokens of messages to request_messages. Add their uuids to prompt_message_uuids --//
  let request_messages_token_sum = 0;
  request_messages_token_sum += tiktoken(system_message.message);

  let request_messages_uuids: UUIDV4[] = [];
  request_messages_uuids.push(system_message.message_uuid);

  let message_order_timestamps_desc = reverse(
    sortBy(Object.keys(conversation.message_order).map(Number))
  );

  message_order_timestamps_desc.forEach((message_order_timestamp) => {
    //-- Get versions within the current message order --//
    let message_version_timestamps_desc = reverse(
      sortBy(
        Object.keys(conversation.message_order[message_order_timestamp]).map(
          Number
        )
      )
    );
    let latest_version = message_version_timestamps_desc[0];

    //-- next message --//
    let next_message_uuid =
      conversation.message_order[message_order_timestamp][latest_version];
    let next_message = conversation.messages[next_message_uuid];
    let next_message_tokens = tiktoken(new_message.message);

    //-- Add next message if sum will be under 3k tokens --//
    if (next_message_tokens + request_messages_token_sum < 3000) {
      let request_message: ChatCompletionRequestMessage = {
        role: next_message.role,
        content: next_message.message,
      };
      request_messages.push(request_message);

      request_messages_uuids.push(next_message.message_uuid);
      request_messages_token_sum += tiktoken(next_message.message);
    }
  });

  //----//

  //-- Set headers needed for SSE and to initialize IMessage object client-side --//
  const conversation_id_string = conversation._id.toString();
  const completion_message_uuid = getUUIDV4();
  res.set({
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Access-Control-Expose-Headers":
      "CHRT-conversation-id-string, CHRT-completion-message-uuid, CHRT-new-message-order-timestamp, CHRT-new-message-version-timestamp, CHRT-completion-pseudo-timestamp",
    "CHRT-new-message-order-timestamp": new_message_order_timestamp,
    "CHRT-new-message-version-timestamp": new_message_version_timestamp,
    "CHRT-completion-pseudo-timestamp": completion_pseudo_timestamp,
    "CHRT-conversation-id-string": conversation_id_string,
    "CHRT-completion-message-uuid": completion_message_uuid,
  });
  res.flushHeaders(); //-- Send headers immediately (don't wait for first chunk or message end) --//

  try {
    //-- Get API Key --//
    let OPENAI_API_KEY = await getOpenAI_API_Key();

    //-- Axios POST request to OpenAI --//
    let response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: model.api_name, // TODO - add type here, e.g. Interface for OpenAI Chat Completions Request Body. Allow parameters such as temperature, etc.
        messages: request_messages,
        stream: true,
      },
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
    const response_chunks: string[] = [];

    //-- Inside parser, send each chunk to the client, then close the connection --//
    function onParse(event: any) {
      if (event.type === "event") {
        if (event.data !== "[DONE]") {
          let data = JSON.parse(event.data).choices[0].delta?.content || "";

          //-- Add chunk to response chunks (to be accessed post-stream) --//
          response_chunks.push(data);

          //-- URI Encode to avoid content and delimeter `\n\n` collisions --//
          const uriEncodedData = encodeURI(data);

          //-- Send data to the client --//
          res.write(`data: ${uriEncodedData}\n\n`);
          //----//
        } else if (event.data === "[DONE]") {
          //-- Build completion_message_content and count its tokens --//
          const completion_message_content = response_chunks.join("");
          const completion_tokens = tiktoken(
            completion_message_content.toString()
          );

          const completion_created_at = new Date();

          //-- Build and send completion_message --//
          const completion_message: IMessage = {
            message_uuid: completion_message_uuid,
            author: model.api_name,
            model: model,
            created_at: completion_created_at,
            role: "assistant",
            message: completion_message_content,
          };
          const completion_message_string = JSON.stringify(completion_message);
          res.write(
            `id: completion_message\ndata: ${completion_message_string}\n\n`
          );

          //-- Build and send api_response_metadata --//
          const api_response_metadata: IAPIResponse = {
            user: user_db_id || "user_db_id_not_found",
            model_api_name: model.api_name,
            created_at: completion_created_at,
            completion_tokens: completion_tokens,
            prompt_tokens: request_messages_token_sum,
            total_tokens: request_messages_token_sum + completion_tokens,
            request_messages_uuids: [],
            prompt_message_uuid: new_message.message_uuid,
            completion_message_uuid: completion_message_uuid,
          };
          const apiResponseMetadataString = JSON.stringify(
            api_response_metadata
          );
          res.write(
            `id: api_response_metadata\ndata: ${apiResponseMetadataString}\n\n`
          );

          //-- Close connection --//
          res.end();

          //-- ***** ***** ***** ***** ***** --//

          //-- Update conversation --//
          conversation = produce(conversation, (draft) => {
            //-- `messages` - add completion_message --//
            draft.messages[completion_message.message_uuid] =
              completion_message;

            //-- `message_order` - completion_pseudo_timestamp is 1ms more than new_message's order_timestamp_unix_ms --//
            draft.message_order[completion_pseudo_timestamp] = {
              [completion_pseudo_timestamp]: completion_message.message_uuid,
            };

            //-- `api_responses` --//
            draft.api_responses.push(api_response_metadata);
          });

          //-- Save conversation to MongoDB --//
          MongoClient.db("chrtgpt-journal")
            .collection("conversations")
            .updateOne({ _id: conversation._id }, { $set: conversation });
        }
      } else if (event.type === "reconnect-interval") {
        console.log("%d milliseconds reconnect interval", event.value);
      }
    }
    //----//
  } catch (err) {
    console.log(err);
    // Send the error as a standard SSE message with a specific event type
    res.write(
      `id: error\ndata: ${JSON.stringify({
        message: "error during gpt35turboStreamController llm query",
        error: err,
      })}\n\n`
    ); // TODO - test that frontend parses this correctly

    // Close the connection after sending the error message
    res.end();
  }
};

//-- ***** ***** ***** GPT-3.5 Turbo (non-SSE) ***** ***** ***** --//
export const gpt35TurboController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  /** get prompt from request */
  let model = req.body.model;
  let chatRequestMessages = req.body.chatRequestMessages;

  /** send prompt to OpenAI API */
  try {
    const response = await openai.createChatCompletion({
      model: model,
      messages: chatRequestMessages,
    });
    console.log("llm response received", Date.now()); // DEV
    console.log(response.data.model); // DEV
    return res.status(200).json(response.data); // DEV
  } catch (err) {
    console.log(err);
    return res.status(500).send("error during gpt35turboController llm query");
  }
};
