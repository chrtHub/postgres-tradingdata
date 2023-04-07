//-- Utility Functions --//
// import getUserDbId from "../utils/getUserDbId.js";
import { createParser } from "eventsource-parser";
import { Readable } from "stream";
import axios from "axios";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";
import { CreateChatCompletionResponse } from "openai";

//-- OpenAI Client --//
import { openai } from "../../index.js";
import { TextDecoderStream } from "stream/web";

//-- ********************* Prompt ********************* --//
export const promptController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //   let user_db_id = getUserDbId(req);
  let prompt = req.params.prompt;

  try {
    /// send prompt to ChatGPT
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `${prompt}` }],
    });

    return res.json(response.data);
    //----//
  } catch (e) {
    console.log(e);
    return res.status(500).send("error during llm query");
  }
};

export const gpt35turboController = async (
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

//-- Stream --//
export const gpt35turboStreamController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  /** get prompt from request */
  let model = req.body.model;
  let chatRequestMessages = req.body.chatRequestMessages;

  //-- parser --//
  function onParse(event: any) {
    if (event.type === "event") {
      if (event.data !== "[DONE]") {
        console.log(JSON.parse(event.data).choices[0].delta?.content || ""); // DEV
        res.write(JSON.parse(event.data).choices[0].delta?.content || ""); // DEV
      }
    } else if (event.type === "reconnect-interval") {
      console.log(
        "We should set reconnect interval to %d milliseconds",
        event.value
      );
    }
  }
  const parser = createParser(onParse);
  try {
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

    //-- Create readable stream from response.data --//
    const readableStream = new Readable({
      read() {},
    });
    response.data.on("data", (chunk: any) => readableStream.push(chunk));
    response.data.on("end", () => readableStream.push(null));

    //-- Decode chunks from readableStream and feed them to the parser --//
    const textDecoder = new TextDecoder();
    readableStream.on("data", (chunk) => {
      parser.feed(textDecoder.decode(chunk));
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("error during gpt35turboStreamController llm query");
  }
};
