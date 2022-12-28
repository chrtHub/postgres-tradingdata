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

app.get("/data", async (req, res) => {
  // res.json({ foo: "bar" });
  let rows = await fetchFunction();
  res.json(rows);
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
  //-- Start connection --//
  await pgClient.connect();

  //-- (1) Query - hit database --//
  const res = await pgClient.query("SELECT * FROM employees LIMIT 10;");
  let arrayOfRows = res.rows;

  //-- End connection --//
  await pgClient.end();
  return arrayOfRows;
};
// await fetchFunction();
