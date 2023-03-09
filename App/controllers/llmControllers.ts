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
  console.log("foo");

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

// TODO:
// How to allow Bring-Your-Own API Key?
// Or to track user's usage of the API and charge them cost plus 15% per usage?
// Use same secrets manager as for db config?
