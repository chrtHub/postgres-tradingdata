//-- Require Secrets Manager --//
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

//-- Require SSM (for Parameter Store) --//
const { SSMClient } = require("@aws-sdk/client-ssm");

//-- Require express --//
const express = require("express");

//-- Express server --//
const app = express();
const PORT = 8080;

app.get("/", function (req, res) {
  res.send("Hello World");
});

app.get("/data", function (req, res) {
  res.json({ foo: "bar" });
});

app.get("/rolling", function (req, res) {
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
  } catch (error) {
    console.error(error);
  }
}
await getParams();

//-- Database password from secrets manager --//
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
  } catch (error) {
    console.error(error);
    // For a list of exceptions thrown, see: https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    // throw error;
  }
}
await getSecrets();

// pg connect to rds instance
