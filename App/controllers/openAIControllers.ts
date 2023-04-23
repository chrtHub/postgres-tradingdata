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
  console.log("gpt35TurboSSEController"); // DEV
  //-- Get user_db_id --//
  let user_db_id = getUserDbId(req);

  //-- Get params from req.body --//
  let body: IChatCompletionRequestBody = req.body;
  let _id = body._id; // NEW
  let request_messages = body.request_messages; // TO BE DEPRACATED
  let new_message = body.new_message;
  let new_message_order = body.new_message_order; // TO ADD - if order specified, message will become the next version (possibly 1) for that order
  let model = body.model;

  //-- If convsersation_uuid is the 'dummy' value, start a new conversation --//
  let conversation: IConversation;
  let is_new_conversation: boolean = false;
  if (_id === new ObjectId("000000000000000000000000")) {
    conversation = getNewConversation(model, null);
    is_new_conversation = true;
  } else {
    //-- Else continue conversation --//
    // TODO - get conversation from mongodb where _id === _id
    // TODO - replace with mongoose ODM (Object Data Modeling) code
    // let res = await MongoClient.db("chrtgpt-journal")
    //   .collection("conversations")
    //   .findOne({ _id: _id });

    conversation = getNewConversation(model, null); // DEV
  }

  //- Add 'new_message' to 'conversation.messages' --//
  conversation = produce(conversation, (draft) => {
    draft.messages[new_message.message_uuid] = new_message;
  });

  //-- Determine correct insert_order and insert_version --//
  let insert_order: number;
  let insert_version: number;
  const order_keys_desc: number[] = reverse(
    sortBy(Object.keys(conversation.message_order).map(Number))
  );

  if (!new_message_order) {
    insert_order = order_keys_desc[0] + 1; //-- By default, increment order by 1 --//
    insert_version = 1; //-- By default, version = 1 --//
  } else {
    insert_order = new_message_order; //-- Use specified order --//

    const version_keys_desc: number[] = reverse(
      sortBy(
        Object.keys(conversation.message_order[new_message_order]).map(Number)
      )
    ); // TODO - what happens here in the case of no existing versions for new_message_order?
    insert_version = version_keys_desc[0] + 1; //-- Increment version --//
  }

  //-- Add 'order' and 'version' of 'new_message' to 'conversation.message_order' --//
  conversation = produce(conversation, (draft) => {
    draft.message_order[insert_order] = {
      [insert_version]: new_message.message_uuid,
    };
  });

  // console.log(JSON.stringify(conversation, null, 2)); // DEV

  //-- Save to MongoDB via insert or update --//
  if (is_new_conversation) {
    MongoClient.db("chrtgpt-journal")
      .collection("conversations")
      .insertOne(conversation);
  } else {
    MongoClient.db("chrtgpt-journal")
      .collection("conversations")
      .updateOne({ _id: conversation._id }, { $set: conversation });
  }

  // (2) Add prompt content and metadata to the conversation object

  // (3) use tiktoken and conversation json to package up to 3k tokens worth of messages into chatRequestMessages to be sent to the LLM
  // // from chatRequestMessages, store each message_uuid in an array chatRequestMessagesUUIDs to be stored in apiResponseMetadata.message_uuids array
  // // const chatRequestMessages_message_uuids = ["TODO"];

  //-- Starts counter at max order--//
  let order_counter: number = order_keys_desc[0];

  // (4) set variable as the token count for this api call, use that in the api_call_metadata reponse
  // // let prompt_tokens = tiktoken(chatRequestMessages)

  //----//

  //-- Create completion_message_uuid and send to client one time --//
  const completion_message_uuid = getUUIDV4();
  const completion_created_at = new Date();

  //-- Set headers needed for SSE and to initialize IMessage object client-side --//
  res.set({
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    "Access-Control-Expose-Headers": "CHRT-completion-message-uuid",
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

          //-- Update conversation --//

          //-- Save entire response to conversation object in MongoDB --//
          MongoClient.db("chrtgpt-journal")
            .collection("conversations")
            .updateOne({ _id: conversation._id }, { $set: conversation });

          console.log(
            "TODO - save to MongoDB - completion_message: ",
            completion_message
          );
          console.log(
            "save to MongoDB - api_response_metadata: ",
            JSON.stringify(api_response_metadata, null, 2)
          );
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
