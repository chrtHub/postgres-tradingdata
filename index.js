//-- Require Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

//-- Require SSM (for Parameter Store) --//
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

//-- Require express --//
import express from "express";

//-- Express server --//
const app = express();
const PORT = 8080;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/data", (req, res) => {
  res.json({ foo: "bar" });
});

app.get("/rolling", (req, res) => {
  res.send("rolling update");
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

// // Is this needed?? or just hardcode??
//-- Database instance URL from Parameter Store --//
const ssm_client = new SSMClient({
  region: "us-east-1",
});
let getParameter_response;
let database_url;

async function getParams() {
  try {
    getParameter_response = await ssm_client.send(
      new GetParameterCommand({
        Name: "/chrt/journal/prod/rds-postgres/instance-url",
      })
    );
    database_url = getParameter_response.Parameter.Value;
    console.log("database_url: " + database_url); // DEV
  } catch (error) {
    console.error(error);
  }
}
await getParams();

//-- Database password from Secrets Manager --//
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});
let getSecret_response;
let database_password;

async function getSecrets() {
  try {
    getSecret_response = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId: "/chrt/journal/prod/rds-postgres/password",
        VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
      })
    );
    database_password = getSecret_response.SecretString;
    console.log("database_url: " + database_password); // DEV
  } catch (error) {
    console.log(error);
    // For a list of exceptions thrown, see: https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    // throw error;
  }
}
await getSecrets();

// pg connect to rds instance
