//-- Express server --//
import express from "express";

//-- Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

//-- SSM (for Parameter Store) --//
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

//-- Allow for a CommonJS "require" statement inside this ES Modules file --//
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//-- Use "require" statement for 'pg' package used for PosgtgreSQL queries --//
const Client = require("pg");

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

//-- Database instance URL from Parameter Store --//
const ssm_client = new SSMClient({
  region: "us-east-1",
});
let getParameter_response;
let databaseURL;

async function getDatabaseUrlFromParameterStore() {
  try {
    getParameter_response = await ssm_client.send(
      new GetParameterCommand({
        Name: "/chrt/journal/prod/rds-postgres/instance-url",
      })
    );
    databaseURL = getParameter_response.Parameter.Value;
    console.log("databaseURL: " + databaseURL); // DEV
  } catch (error) {
    console.error(error);
  }
}
await getDatabaseUrlFromParameterStore();

//-- Database password from Secrets Manager --//
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});
let getSecret_response;
let databasePassword;

async function getDatabasePasswordFromSecretsManager() {
  try {
    getSecret_response = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId: "/chrt/journal/prod/rds-postgres/password",
        VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
      })
    );
    databasePassword = getSecret_response.SecretString;
    console.log("databasePassword: " + databasePassword); // DEV
  } catch (error) {
    console.log(error);
    // For a list of exceptions thrown, see: https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    // throw error;
  }
}
await getDatabasePasswordFromSecretsManager();

//-- pg connect to RDS Instance --//
const pgClient = new Client();
await pgClient.connect();

const res = await pgClient.query("SELECT $1::text as message", [
  "Hello world!",
]);
console.log(res.rows[0].message); // Hello world!
await pgClient.end();

//-- Configure pg Client to connect to RDS Instance --//
// const client = new Client({
//   host: `${databaseURL}`,
//   port: 5432,
//   user: "postgres",
//   password: `${databasePassword}`,
//   database: "chrtUserTradingData",
// });

// // run sample query
// await pgClient.connect();
// const res2 = await pgClient.query("SELECT * FROM employees LIMIT 5;");
// console.log(res2.rows[0].message); // Alice, Bob, Charlie, Dave, Eve. Id, Name, Salary
// await pgClient.end();
