//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import { createParser } from "eventsource-parser";
import produce from "immer";
import { Readable } from "stream";
import axios from "axios";
import { getUnixTime } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { getOpenAI_API_Key } from "../config/OpenAIConfig.js";
import { MongoClient } from "../../index.js";
import sortBy from "lodash/sortBy.js";
import reverse from "lodash/reverse.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";
import {
  IAPIResponse,
  IMessage,
  IModel,
  IConversation,
  IChatCompletionRequestBody,
} from "./openAIControllersTypes.js";

//-- OpenAI Client --//
import { openai } from "../../index.js";
import { tiktoken } from "./tiktoken.js";

//-- ***** ***** ***** GPT-3.5 Turbo SSE ***** ***** ***** //
export const gpt35TurboSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //-- Get user_db_id --//
  let user_db_id = getUserDbId(req);

  //-- Get request body --//
  let body: IChatCompletionRequestBody = req.body;

  //-- Get model and messages from body --//
  let model: IModel = body.model;
  let conversation_uuid: string = body.conversation_uuid; // NEW
  let new_message: IMessage = body.new_message;

  // TODO - if order specified, message will become the next version (possibly 1) for that order
  let new_message_order: number | null = req.body.order;

  let request_messages = req.body.request_messages; // TO BE DEPRACATED

  //-- Start new conversation --//
  if ((conversation_uuid = "00000000-0000-0000-0000-000000000000")) {
    conversation_uuid = uuidv4();
    const system_message_uuid = uuidv4();
    const timestamp = getUnixTime(new Date()).toString();

    let conversation: IConversation = {
      conversation_uuid: conversation_uuid,
      message_order: {
        1: {
          1: system_message_uuid,
        },
      },
      messages: {
        [system_message_uuid]: {
          message_uuid: system_message_uuid,
          author: "chrt",
          model: model,
          timestamp: timestamp,
          role: "system",
          message:
            "Your name is ChrtGPT. Refer to yourself as ChrtGPT. You are ChrtGPT, a helpful assistant that helps power a day trading performance journal. You sometimes make jokes and say silly things on purpose.",
        },
      },
      api_responses: [],
    };

    //- Add new_message to conversation --//
    conversation = produce(conversation, (draft) => {
      draft.messages[new_message.message_uuid] = new_message;
    });

    //-- Use descending 'order' value to build request_messages array --//
    const message_order_keys = Object.keys(conversation.message_order).map(
      Number
    );
    const message_order_keys_descending = reverse(sortBy(message_order_keys));
    // TODO - if new_message_order specified, use that instead of maxOrder
    let insert_order =
      new_message_order || message_order_keys_descending[0] + 1;
    let order_counter = message_order_keys_descending[0];

    //-- Update conversation message_order --//
    conversation = produce(conversation, (draft) => {
      draft.message_order[insert_order] = {
        1: new_message.message_uuid, // TODO - also insert versions when order specified
      };
    });

    console.log(JSON.stringify(conversation, null, 2)); // DEV
    // save to mongodb
  } else {
    //-- Continue conversation --//
    // mongo - get conversation with uuid === conversation_uuid
    console.log(
      "TODO - mongo - get conversation with uuid === conversation_uuid"
    );
  }

  // (2) Add prompt content and metadata to the conversation object
  // (3) use tiktoken and conversation json to package up to 3k tokens worth of messages into chatRequestMessages to be sent to the LLM
  // // from chatRequestMessages, store each message_uuid in an array chatRequestMessagesUUIDs to be stored in apiResponseMetadata.message_uuids array
  // // const chatRequestMessages_message_uuids = ["TODO"];
  // (4) set variable as the token count for this api call, use that in the api_call_metadata reponse
  // // let prompt_tokens = tiktoken(chatRequestMessages)

  //-- DEV - MongoDB Sandbox--//

  const databaseList = await MongoClient.db().admin().listDatabases();
  console.log("Databases: ");
  databaseList.databases.forEach((db) => console.log(` - ${db.name}`));

  //----//

  //-- Create completion_message_uuid and send to client one time --//
  const completion_message_uuid = uuidv4();
  const completion_timestamp = getUnixTime(new Date()).toString();

  //-- Set headers needed for SSE and to initialize IMessage object client-side --//
  res.set({
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Access-Control-Expose-Headers":
      "CHRT-completion-message-uuid, CHRT-timestamp",
    "CHRT-completion-message-uuid": completion_message_uuid,
    "CHRT-timestamp": completion_timestamp,
  });
  res.flushHeaders(); //-- Send headers immediately (don't wait for first chunk or message end) --//

  try {
    //-- Get API Key --//
    let OPENAI_API_KEY = await getOpenAI_API_Key();

    //-- Axios POST request to OpenAI --//
    let response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: model.api_name, // TODO - add type here, e.g. Interface for OpenAI Chat Completions Request Body
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

    //-- Use array to save response to EFS when streaming finishes --//
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

          //-- Build and send completion_message --//
          const completion_message: IMessage = {
            message_uuid: completion_message_uuid,
            author: model.api_name,
            model: model,
            timestamp: completion_timestamp,
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
            completion_timestamp: completion_timestamp,
            completion_tokens: completion_tokens,
            prompt_tokens: 100, // TODO - implement tiktoken(prompt)
            total_tokens: 100 + completion_tokens, // TODO - implement tiktoken(prompt)
            completion_message_uuid: completion_message_uuid,
            message_uuids: [completion_message_uuid], // TODO - implement [...chatRequestMessagesUUIDs, completion_message_uuid]
          };
          const apiResponseMetadataString = JSON.stringify(
            api_response_metadata
          );
          res.write(
            `id: api_response_metadata\ndata: ${apiResponseMetadataString}\n\n`
          );

          //-- Close connection --//
          res.end();

          //-- Save entire response to conversation object in EFS --//
          // console.log(
          //   "TODO - save to EFS - completion_message: ",
          //   completion_message
          // );
          // console.log(
          //   "save to EFS - api_response_metadata: ",
          //   JSON.stringify(api_response_metadata, null, 2)
          // );
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
