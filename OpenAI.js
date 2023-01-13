//-- AWS Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

//-- OpenAI package --//
import { createRequire } from "module"; //-- Allow CommonJS "require" --//
const require = createRequire(import.meta.url);
const { Configuration, OpenAIApi } = require("openai");

//-- Get OpenAI API Key from AWS Secrets Manager --//
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});
let SecretStringJSON;
let OPENAI_API_KEY;
try {
  let res = await secretsManager_client.send(
    new GetSecretValueCommand({
      SecretId: "OpenAI/APIKey/0tRy",
      VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
    })
  );
  //-- Parse Secret String in res as JSON --//
  SecretStringJSON = JSON.parse(res.SecretString);
  //-- Set Open API Key value --//
  OPENAI_API_KEY = SecretStringJSON.OPENAI_API_KEY;
  //----//
} catch (error) {
  console.log(error);
}

//-- Configure OpenAI API --//
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

//-- ***** ***** ***** ***** ***** --//

// -- Complete text --//
const completion = await openai.createCompletion({
  model: "text-davinci-002",
  prompt: "It was the best of times, it was the",
  // maxTokens: 100,
  // temperature: 0.5,
});
console.log(completion.data.choices[0].text);
