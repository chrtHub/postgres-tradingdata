let OPENAI_API_KEY = "TODO"; // TODO

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

  //-- Send fetch request to OpenAI --//
  let response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `${PROMPT}` }],
      stream: true,
    }),
  });

  //-- Async iterator - decode response and feed each value to the parser --//
  for await (const value of response.body?.pipeThrough(
    new TextDecoderStream()
  )) {
    parser.feed(value);
  }
}

await openAI_API_Call();
