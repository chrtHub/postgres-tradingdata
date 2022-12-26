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
try {
  getParameter_response = await ssm_client.send(
    new GetParameterCommand({
      Name: "/chrt/journal/prod/rds-postgres/instance-url",
    })
  );
} catch (error) {
  console.error(error);
}
const database_url = getParameter_response.Parameter.Value;

//-- Database password from secrets manager --//
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});
let getSecret_response;
try {
  getSecret_response = await secretsManager_client.send(
    new GetSecretValueCommand({
      SecretId: "/chrt/journal/prod/rds-postgres/password",
      VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
    })
  );
} catch (error) {
  console.error(error);
  // For a list of exceptions thrown, see: https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
  // throw error;
}
const database_password = getSecret_response.SecretString;

// pg connect to rds instance
