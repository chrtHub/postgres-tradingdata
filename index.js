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
const { Client } = require("pg");

//-- Express server --//
const app = express();
const PORT = 8080;

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/data", (req, res) => {
  res.json({ foo: "bar" });
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

//-- Database password from Secrets Manager --//
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});
let getSecretResponse;
let db_host;
let db_port;
let db_dbname;
let db_username;
let db_password;

async function getDatabasePasswordFromSecretsManager() {
  try {
    getSecretResponse = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId: "/chrt/journal/prod/rds-postgres/password",
        VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
      })
    );
    db_host = getSecretResponse.SecretString.host;
    db_port = getSecretResponse.SecretString.port;
    db_dbname = getSecretResponse.SecretString.dbname;
    db_username = getSecretResponse.SecretString.username;
    db_password = getSecretResponse.SecretString.password;
  } catch (error) {
    console.log(error);
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
//   host: `${db_host}`,
//   port: `${db_port}`,
//   database: `${db_dbname}`,
//   user: `${db_username}`,
//   password: `${db_password}`,
// });

// // run sample query
// await pgClient.connect();
// const res2 = await pgClient.query("SELECT * FROM employees LIMIT 5;");
// console.log(res2.rows[0].message); // Alice, Bob, Charlie, Dave, Eve. Id, Name, Salary
// await pgClient.end();
