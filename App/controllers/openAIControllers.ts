//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import { createParser } from "eventsource-parser";
import { Readable } from "stream";
import axios from "axios";
import { getUnixTime } from "date-fns";

import { getOpenAI_API_Key } from "../config/OpenAIConfig.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

//-- OpenAI Client --//
import { openai } from "../../index.js";
import { tiktoken } from "./tiktoken.js";

//-- ***** ***** ***** GPT-3.5 Turbo SSE ***** ***** ***** //
export const gpt35TurboSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("gpt35turboStreamController() called"); // DEV
  //-- Get user_db_id --//
  let user_db_id = getUserDbId(req);

  //-- Get model and messages from request --//
  let model = req.body.model;
  let chatRequestMessages = req.body.chatRequestMessages; // TO BE DEPRACATED
  // let message = req.body.message;
  // let conversation_uuid = req.body.conversation_uuid;

  //-- Get conversation from EFS and bundle --//
  // (0) if request has a conversation_uuid
  // // else create a new conversation object + uuid and save it to EFS
  // (1) load conversation from EFS
  // (2) Add new message content and metadata to the conversation object
  // (3) use tiktoken and conversation json to package up to 3k tokens worth of messages into chatRequestMessages to be sent to the LLM
  // (4) set variable as the token count for this api call, use that in the api_call_metadata reponse
  // // let prompt_tokens = tiktoken(chatRequestMessages)

  //-- Set headers needed for SSE --//
  res.set({
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
  });
  res.flushHeaders(); //-- Send headers immediately (don't wait for first chunk or message end) --//

  try {
    //-- Get API Key --//
    let OPENAI_API_KEY = await getOpenAI_API_Key();

    //-- Axios POST request to OpenAI --//
    let response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: model,
        messages: chatRequestMessages,
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

    //
    const response_chunks: string[] = []; // NEW

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

    //-- Inside parser, send each chunk to the client, then close the connection --//
    function onParse(event: any) {
      if (event.type === "event") {
        if (event.data !== "[DONE]") {
          let data = JSON.parse(event.data).choices[0].delta?.content || "";

          //-- Add chunk to response chunks (to be accessed post-stream) --//
          response_chunks.push(data);

          //-- Send data to the client --//
          res.write(`data: ${data}\n\n`);
        } else if (event.data === "[DONE]") {
          //-- Build completion_message string and count its tokens --//
          const completion_message = response_chunks.join("");
          const completion_tokens = tiktoken(completion_message.toString());

          //-- Build metadata object --//
          const apiResponseMetadata = {
            user: user_db_id,
            model: model,
            created: getUnixTime(new Date()).toString(),
            // prompt_tokens: prompt_tokens,
            completion_tokens: completion_tokens,
            // total_tokens: prompt_tokens + completion_tokens,
          };
          const apiResponseMetadataString = JSON.stringify(apiResponseMetadata);

          //-- Send metadata and close connection --//
          res.write(
            `id: apiResponseMetadata\ndata: ${apiResponseMetadataString}\n\n`
          );
          res.end();

          //-- Save entire response to conversation object in EFS --//
          console.log(
            "TODO - save to EFS - completion_message: ",
            completion_message
          );
          console.log(
            "save to EFS - apiResponseMetadata: ",
            JSON.stringify(apiResponseMetadata, null, 2)
          );
        }
      } else if (event.type === "reconnect-interval") {
        console.log("%d milliseconds reconnect interval", event.value);
      }
    }
    //----//
  } catch (err) {
    console.log(err);
    res.status(500).send("error during gpt35turboStreamController llm query");
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
