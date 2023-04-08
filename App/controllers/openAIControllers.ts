//-- Utility Functions --//
// import getUserDbId from "../utils/getUserDbId.js";
import { createParser } from "eventsource-parser";
import { Readable } from "stream";
import axios from "axios";

import { getOpenAI_API_Key } from "../config/OpenAIConfig.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

//-- OpenAI Client --//
import { openai } from "../../index.js";

//-- ***** ***** ***** GPT-3.5 Turbo SSE ***** ***** ***** //
export const gpt35TurboSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("gpt35turboStreamController() called"); // DEV

  // if headers don't include text/event-stream, use the non-stream controller?

  //-- Get model and messages from request --//
  let model = req.body.model;
  let chatRequestMessages = req.body.chatRequestMessages;

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

    //-- Feed response.data to readableStream --//
    response.data.on("data", (chunk: any) => readableStream.push(chunk));
    response.data.on("end", () => readableStream.push(null));

    //-- Create text decoder (binary --> string) --//
    //-- UInt8Array | ArrayBuffer | Buffer --> UTF-8 (default) --//
    const textDecoder = new TextDecoder();

    //-- Decode readableStream chunks and feed them to the parser --//
    readableStream.on("data", (chunk) => {
      parser.feed(textDecoder.decode(chunk));
    });

    //-- Create parser --//
    const parser = createParser(onParse);

    //-- Inside parser, send each chunk to the client, then close the connection --//
    function onParse(event: any) {
      if (event.type === "event") {
        if (event.data !== "[DONE]") {
          let data = JSON.parse(event.data).choices[0].delta?.content || "";
          res.write(`data: ${data}\n\n`); //-- Send data to the client --//
          console.log(data);
        } else if (event.data === "[DONE]") {
          //-- Prepare and send metadata --//
          const metadata = {
            eventType: "metadata",
            timestamp: new Date(),
            tokens: 420,
          };
          const metadataString = JSON.stringify(metadata);
          res.write(`id: CHRT_METADATA\ndata: ${metadataString}\n\n`); // DEV

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
