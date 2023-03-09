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
export const getOpenAI_API_Key_FromSecretsManager = async () => {
  let db_host, db_port, db_dbname, db_username, db_password;

  try {
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
  } catch (err) {
    console.log(err);
  }

  return OPENAI_API_KEY;
};
