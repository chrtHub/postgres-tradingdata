let OPENAI_API_KEY = "TODO"; // TODO

import axios from "axios";
import { createParser } from "eventsource-parser";

//-- Parser --//
function onParse(event) {
  if (event.type === "event") {
    if (event.data !== "[DONE]") {
      console.log(JSON.parse(event.data).choices[0].delta?.content || "");
    }
  } else if (event.type === "reconnect-interval") {
    console.log(
      "We should set reconnect interval to %d milliseconds",
      event.value
    );
  }
}
const parser = createParser(onParse);

async function openAI_API_Call() {
  //-- API Key and Prompt --//
  let OPENAI_API_KEY = await getOpenAIKey();
  let PROMPT = "It was the best of times";

  //-- Axios POST request to OpenAI --//
  let response = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `${PROMPT}` }],
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

  // JS VERSION (??) DOM??
  //   //-- Create a ReadableStream that wraps response.data --//
  //   const readableStream = new ReadableStream({
  //     start(controller) {
  //       response.data.on("data", (chunk) => controller.enqueue(chunk));
  //       response.data.on("end", () => controller.close());
  //     },
  //   });

  //   //-- Async iterator - decode redableStream and feed each value to the parser --//
  //   for await (const value of readableStream.pipeThrough(
  //     new TextDecoderStream()
  //   )) {
  //     parser.feed(value);
  //   }

  // NODE.JS VERSION
  // Create a Node.js readable stream that wraps response.data
  const readableStream = new Readable({
    read() {},
  });
  response.data.on("data", (chunk) => readableStream.push(chunk));
  response.data.on("end", () => readableStream.push(null));

  // Consume the readable stream using the 'data' event listener
  const textDecoder = new TextDecoder();
  readableStream.on("data", (chunk) => {
    parser.feed(textDecoder.decode(chunk));
  });
}

await openAI_API_Call();
