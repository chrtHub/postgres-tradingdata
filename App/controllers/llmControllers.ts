//-- Utility Functions --//
// import getUserDbId from "../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

// TODO:
// How to allow Bring-Your-Own API Key?
// Or to track user's usage of the API and charge them cost plus 15% per usage?
// Use same secrets manager as for db config?

//-- AWS client(s) --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import { Configuration, OpenAIApi } from "openai";
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});
let OPENAI_API_KEY: string;

//-- Get OpenAPI API Key from AWS Secrets Manager --//
try {
  const res = await secretsManager_client.send(
    new GetSecretValueCommand({
      SecretId: "OpenAI/APIKey/0tRy",
      //-- VersionStage defaults to AWSCURRENT if unspecified --//
      VersionStage: "AWSCURRENT",
    })
  );
  //-- Parse Secret String in res as JSON --//
  if (res.SecretString) {
    const SecretStringJSON = JSON.parse(res.SecretString);
    //-- Set Open API Key value --//
    OPENAI_API_KEY = SecretStringJSON.OPENAI_API_KEY;
  }

  //----//
} catch (error) {
  console.log(error);
}

//-- ********************* Prompt ********************* --//
export const promptController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //   let user_db_id = getUserDbId(req);
  let prompt = req.params.prompt;

  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

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
