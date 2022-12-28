//-- *************** Imports & Secrets *************** --//
//-- Express server --//
import express from "express";

//-- Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

//-- Allow for a CommonJS "require" statement inside this ES Modules file --//
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("pg"); //-- 'pg' for PostgreSQL --//

//-- Database password from Secrets Manager --//
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});
let getSecretValueResponse;
let db_host;
let db_port;
let db_dbname;
let db_username;
let db_password;

async function getDatabasePasswordFromSecretsManager() {
  try {
    getSecretValueResponse = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId: "/chrt/journal/prod/rds-postgres/password",
        VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
      })
    );
    //-- Parse string into JSON, store values into variables --//
    let SecretStringJSON = JSON.parse(getSecretValueResponse.SecretString);
    db_host = SecretStringJSON.host;
    db_port = SecretStringJSON.port;
    db_dbname = SecretStringJSON.dbname;
    db_username = SecretStringJSON.username;
    db_password = SecretStringJSON.password;
  } catch (error) {
    console.log(error);
  }
}
await getDatabasePasswordFromSecretsManager();

//-- *************** Express server *************** --//
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

//-- *************** PostgreSQL Client *************** --//
//-- Configure pg Client to connect to RDS Instance --//
let clientConfig = {
  host: db_host,
  port: db_port,
  database: db_dbname,
  user: db_username,
  password: db_password,
};
console.log(clientConfig); // DEV

const pgClient = new Client(clientConfig);

const fetchFunction = async () => {
  await pgClient.connect(); // currently not connecting
  console.log("post-connect()"); // DEV

  //-- (1) Query - don't hit database --//
  const res = await pgClient.query("SELECT $1::text as message", [
    "Hello world!",
  ]);
  console.log(res.rows[0].message); // Hello world!

  //-- (2) Query - hit database --//
  const res2 = await pgClient.query("SELECT * FROM employees LIMIT 5;");
  console.log(res2.rows[0].message); // Alice, Bob, Charlie, Dave, Eve. Id, Name, Salary

  console.log("post-query()"); // DEV
  await pgClient.end();
  console.log("post-end()"); // DEV
};
await fetchFunction();
