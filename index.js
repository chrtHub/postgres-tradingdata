//-- *************** Imports & Secrets *************** --//
//-- Express server --//
import express from "express";
import cors from "cors";

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
  } catch (err) {
    console.log(err);
  }
}
await getDatabasePasswordFromSecretsManager();

//-- *************** Express server *************** --//
const PORT = 8080;
const app = express();

const corsConfig = {
  allowedHeaders: ["*"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE"],
  allowedOrigins: [
    "https://chrt.com",
    "https://*.chrt.com",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ],
  exposedHeaders: [],
  maxAge: 3600,
};
app.use(cors(corsConfig));

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/data", async (req, res) => {
  let rows = await fetchData();
  res.json(rows);
});

app.get("/journal/sales", async (req, res) => {
  let rows = await fetchSales();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

//-- *************** PostgreSQL Client *************** --//
//-- Configure pg Client to connect to RDS Instance --//
const pgClient = new Client({
  host: db_host,
  port: db_port,
  database: db_dbname,
  user: db_username,
  password: db_password,
});
//-- Start connection --//
await pgClient.connect();

const fetchData = async () => {
  //-- Query - hit database --//
  let employeesData;
  try {
    const res = await pgClient.query("SELECT * FROM employees LIMIT 10;");
    employeesData = res.rows;
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching data");
  }

  console.log(employeesData); // DEV

  return employeesData;
};

const fetchSales = async () => {
  //-- Query - hit database --//
  let salesData;
  try {
    const res = await pgClient.query("SELECT * FROM sales LIMIT 10;");
    salesData = res.rows;
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching data");
  }

  console.log(salesData); // DEV

  return salesData;
};

// // When to disconnect??
// await pgClient.end();
