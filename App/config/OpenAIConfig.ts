import retry from "async-retry";

//-- Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});

let OPENAI_API_KEY: string;

//-- Get OpenAPI API Key from AWS Secrets Manager --//
export const getOpenAI_API_Key = async () => {
  if (OPENAI_API_KEY) {
    return OPENAI_API_KEY;
  }

  try {
    await retry(
      async () => {
        console.log("AWS Secrets Manager - fetching OpenAI API Key");
        let res = await secretsManager_client.send(
          new GetSecretValueCommand({
            SecretId: "OpenAI/APIKey/0tRy",
            VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
          })
        );

        //-- Parse Secret String in res as JSON --//
        if (res.SecretString) {
          const SecretStringJSON = JSON.parse(res.SecretString);

          //-- Set Open API Key value --//
          OPENAI_API_KEY = SecretStringJSON.OPENAI_API_KEY;
        } else {
          throw new Error("OpenAI SecretString is empty");
        }
      },
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
  }

  return OPENAI_API_KEY;
};
