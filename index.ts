//-- *************** Imports *************** --//
import fs from "fs";

//-- Database config --//
import {
  getRDSDatabaseConfigFromSecretsManager,
  getDocDBDatabaseConfigFromSecretsManager,
} from "./App/config/dbConfig.js";
import { MongoClient, ReadPreference } from "mongodb";

// import { Client as SSH_Client } from "ssh2"; //-- Dev mode, ssh tunnel to RDS instance --//

//-- Express server --//
import express from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";

//-- OpenAI --//
import { getOpenAI_API_Key } from "./App/config/OpenAIConfig.js";
import { Configuration, OpenAIApi } from "openai";

//-- Routes --//
import dataRoutes from "./App/routes/dataRoutes.js";
import journalRoutes from "./App/routes/journalRoutes.js";
import journalFilesRoutes from "./App/routes/journalFilesRoutes.js";
import openAIRoutes from "./App/routes/openAIRoutes.js";

//-- Auth & Middleware --//
import { auth } from "express-oauth2-jwt-bearer";
import { dataAuthMiddleware } from "./App/Auth/dataAuthMiddleware.js";
import { journalAuthMiddleware } from "./App/Auth/journalAuthMiddleware.js";
import { openAIAuthMiddleware } from "./App/Auth/openAIAuthMiddleware.js";

//-- OpenAPI Spec --//
import swaggerJsdoc from "swagger-jsdoc";

//-- Allow for a CommonJS "require" (inside ES Modules file) --//
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//-- Types --//
import { Request, Response, NextFunction } from "express";
import { IRequestWithAuth } from "./index.d";

//-- Print current value of process.env.NODE_ENV --//
console.log("process.env.NODE_ENV: " + process.env.NODE_ENV);

//-- *************** PostgreSQL Client connection *************** --//
//-- Get RDS PostgreSQL database config values --//
const rdsDBConfig = await getRDSDatabaseConfigFromSecretsManager();
const { rdsDB_username, rdsDB_password, rdsDB_dbname } = rdsDBConfig;
let { rdsDB_host, rdsDB_port } = rdsDBConfig;

//-- Get DocumentDB-MongoDB database config values --//
const docDBConfig = await getDocDBDatabaseConfigFromSecretsManager();
const { docDB_username, docDB_password, docDB_dbname } = docDBConfig;
let { docDB_host, docDB_port } = docDBConfig;

//-- `true` will allow use of `127.0.0.1:PORT` for dev mode --//
let tlsAllowInvalidHostnames = false;

//-- In development mode, connect to rds and docdb via SSH tunnel --//
//-- NOTE - must establish SSH tunnel outside this server for this to work --//
//-- NOTE - Currently using `npm run ssh` script to establish ssh tunnel --//
if (process.env.NODE_ENV === "development") {
  rdsDB_host = "127.0.0.1";
  rdsDB_port = 2222;
  docDB_host = "127.0.0.1";
  docDB_port = 22222;
  tlsAllowInvalidHostnames = true;
}

//-- Establish RDS-PostgreSQL connection using Knex --//
console.log(
  `PostgreSQL-knex requesting connection to postgres at ${rdsDB_host}:${rdsDB_port}`
);
const knex = require("knex")({
  client: "pg",
  connection: {
    host: rdsDB_host,
    port: rdsDB_port,
    user: rdsDB_username,
    password: rdsDB_password,
    database: rdsDB_dbname,
  },
});
export { knex };
try {
  const res = await knex.raw('SELECT NOW() as "current_time"');
  const currentTime = res.rows[0].current_time;
  console.log("PostgreSQL-knex test query succeeded at:", currentTime);
  console.log("PostgreSQL-knex user is:", knex.client.connectionSettings.user);
  console.log("PostgreSQL-knex using database:", rdsDB_dbname);
} catch (error) {
  console.log("PostgreSQL-knex connection error");
  console.log(error);
}

//-- Establish DocDB-MongoDB connection using MongoClient --//
console.log(
  "DocumentDB-MongoDB tlsAllowInvalidHostnames:",
  tlsAllowInvalidHostnames
);
console.log(
  `DocumentDB-MongoDB requesting connection at ${docDB_host}:${docDB_port}`
);
const mongoClient = new MongoClient(`mongodb://${docDB_host}:${docDB_port}`, {
  tls: true,
  tlsCAFile: "./rds-combined-ca-bundle.pem",
  tlsAllowInvalidHostnames: tlsAllowInvalidHostnames,
  auth: {
    username: docDB_username,
    password: docDB_password,
  },
  directConnection: true, // NOTE - will this be unnecessary once a replica set is being used?
});
export { mongoClient }; // TODO - is this good?
try {
  await mongoClient.connect();
  const res = await mongoClient.db().command({ serverStatus: 1 });
  const currentTime = res.localTime;
  console.log("DocumentDB-MongoDB test query succeeded at:", currentTime);
  console.log("DocumentDB-MongoDB user is:", docDB_username);
  console.log("DocumentDB-MongoDB datbase is:", docDB_dbname);
} catch (error) {
  console.log("DocumentDB-MongoDB connection error");
  console.log(error);
}

//-- OpenAI --//
let OPENAI_API_KEY: string = await getOpenAI_API_Key();
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
export const openai = new OpenAIApi(configuration); // Does this expire / timeout?

//-- *************** Express Server, Middleware, Swagger-JSDoc *************** --//
const PORT = 8080;
const app = express();

//-- Body parser for handling POST request body JSON objects --//
app.use(bodyParser.json());

//-- Helmet middlware for security --//
app.use(helmet());

//-- CORS middleware --//
const corsConfig = {
  credentials: true, //-- allows header with key 'authorization' --//
  methods: ["GET", "POST", "PUT", "DELETE"],
  origin: [
    "https://chrt.com",
    "https://*.chrt.com",
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:4173",
    "http://localhost:4173",
  ],
  maxAge: 3600,
};
app.use(cors(corsConfig));

//-- Just-for-fun middleware --//
app.use((req, res, next) => {
  res.append("Answer-to-Life-Universe-Everything", "42");
  next();
});

//-- API Spec --//
const apiSpecOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CHRT API",
      version: "1.0.0",
      contact: {
        name: "CHRT Support",
        email: "support@chrt.com",
      },
    },
  },
  apis: ["./index.ts", "./App/routes/*.ts"],
};
const apiSpec = swaggerJsdoc(apiSpecOptions);
fs.writeFileSync("./spec.json", JSON.stringify(apiSpec, null, 2));

/**
 * @swagger
 * /spec:
 *   get:
 *     summary: Get OpenAPI Specification
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
app.get("/spec", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(apiSpec);
});

//-- Health check route --//
/**
 * @openapi
 * /:
 *   get:
 *     description: Health check route
 *     responses:
 *       200:
 *         description: Returns a Hello World message
 */
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

//-- Emits 'Request' with shape 'IRequestWithAuth' by adding: --//
//-- Request.auth.header, Request.auth.payload --//
const jwtCheck = auth({
  audience: "https://chrt.com",
  issuerBaseURL: "https://chrt-prod.us.auth0.com/",
  tokenSigningAlg: "RS256",
});

//-- Dev utility for logging token --//
// app.use((req, res, next) => {
//   let { header, payload, token } = req.auth;
//   console.log("header: " + JSON.stringify(header));
//   console.log("payload: " + JSON.stringify(payload));
//   console.log("token: " + token);
//   next();
// });

//-- *************** Routes w/ authentication *************** --//
//-- Routes --//
app.use("/data", jwtCheck, dataAuthMiddleware, dataRoutes);
app.use("/journal", jwtCheck, journalAuthMiddleware, journalRoutes);
app.use("/journal_files", jwtCheck, journalAuthMiddleware, journalFilesRoutes);
app.use("/openai", jwtCheck, openAIAuthMiddleware, openAIRoutes);

//-- *************** Error Handler *************** --//
/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
const errorHandler = (err: any, res: Response) => {
  if (err.name === "UnauthorizedError") {
    return res
      .status(401)
      .send(
        "Authentication failed OR resource not found beep boop. Everything except '/', '/spec', and '/docs' requires a Bearer token."
      );
  } else {
    return res.status(500).send("Internal server error beep boop");
  }
};
app.use(errorHandler);

//-- *************** Listener *************** --//
app.listen(PORT, () => {
  if (process.env.NODE_ENV === "development") {
    console.log(`express listening at http://localhost:${PORT}`);
    console.log(`api spec at http://localhost:${PORT}/spec`);
  }
  if (process.env.NODE_ENV === "production") {
    console.log(`express listening on port ${PORT}`);
    console.log(`api spec at http://alb.chrt.com/spec`);
  }
});
