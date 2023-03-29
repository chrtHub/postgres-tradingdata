//-- Utility Functions --//
// import getUserDbId from "../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

//-- OpenAI Client --//
import { openai } from "../../index.js";

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
    return res.status(200).json(response.data); // DEV
  } catch (err) {
    console.log(err);
    return res.status(500).send("error during gpt35turboController llm query");
  }
};

// TODO:
// How to allow Bring-Your-Own API Key?
// Or to track user's usage of the API and charge them cost plus 15% per usage?
// Use same secrets manager as for db config?
