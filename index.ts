//-- *************** Imports *************** --//
import fs from "fs";
import retry from "async-retry";

//-- Database config --//
import {
  getRDSDatabaseConfigFromSecretsManager,
  getDocDBDatabaseConfigFromSecretsManager,
} from "./App/config/dbConfig.js";
import { MongoClient as _MongoClient } from "mongodb";

//-- Express server --//
import express, { NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import bodyParser from "body-parser";

//-- Clients --//
import { getAuth0ClientSecretFromSecretsManager } from "./App/config/auth0Config.js";
import { ManagementClient } from "auth0";

import { getOpenAI_API_Key } from "./App/config/OpenAIConfig.js";
import { Configuration, OpenAIApi } from "openai";

//-- Wrapper for async controllers, calls next(err) for uncaught errors --//
import "express-async-errors"; //-- Must import before importing routes --//

//-- Routes --//
import journalRoutes from "./App/routes/journalRoutes.js";
import journalFilesRoutes from "./App/routes/journalFilesRoutes.js";
import openAIRoutes from "./App/routes/openAIRoutes.js";
import wolframRoutes from "./App/routes/wolframRoutes.js";
import conversationRoutes from "./App/routes/conversationRoutes.js";
import legalRoutes from "./App/routes/legalRoutes.js";
import auth0Routes from "./App/routes/auth0Routes.js";
import errorRoutes from "./App/routes/errorRoutes.js";

//-- Auth & Middleware --//
import { auth } from "express-oauth2-jwt-bearer";
import { journalAuthMiddleware } from "./App/Auth/journalAuthMiddleware.js";
import { llmAuthMiddleware } from "./App/Auth/llmAuthMiddleware.js";

//-- OpenAPI Spec --//
import swaggerJsdoc from "swagger-jsdoc";

//-- Types --//
import { Request, Response } from "express";
import {
  IClickwrapLog_Mongo,
  IClickwrapUserStatus_Mongo,
} from "./App/controllers/Legal/clickwrap_types.js";
import {
  IConversation_Mongo,
  IMessageNode_Mongo,
} from "./App/controllers/chatson/chatson_types.js";
import { AxiosError } from "axios";

//-- Allow for a CommonJS "require" (inside ES Modules file) --//
import { createRequire } from "module";

const require = createRequire(import.meta.url);

//-- Print current value of process.env.NODE_ENV --//
console.log("process.env.NODE_ENV: " + process.env.NODE_ENV);

//-- *************** Database Client Connections *************** --//
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

//-- In prod, use the filepath for the docker container --//
let tlsCAFilepath = "/app/PUBLIC-rds-ca-bundle.pem";

//-- In development mode, connect to rds and docdb via SSH tunnel --//
//-- NOTE - must establish SSH tunnel outside this server for this to work --//
//-- NOTE - Currently using `npm run ssh` script to establish ssh tunnel --//
if (process.env.NODE_ENV === "development") {
  rdsDB_host = "127.0.0.1";
  rdsDB_port = "2222";
  docDB_host = "127.0.0.1";
  docDB_port = "22222";
  tlsAllowInvalidHostnames = true;
  tlsCAFilepath = "./PUBLIC-rds-ca-bundle.pem";
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
export { knex };

//-- Establish DocDB-MongoDB connection using MongoClient --//
console.log(
  "DocumentDB-MongoDB tlsAllowInvalidHostnames:",
  tlsAllowInvalidHostnames
);
console.log(
  `DocumentDB-MongoDB requesting connection at ${docDB_host}:${docDB_port}`
);
const MongoClient = new _MongoClient(`mongodb://${docDB_host}:${docDB_port}`, {
  tls: true,
  tlsCAFile: tlsCAFilepath,
  tlsAllowInvalidHostnames: tlsAllowInvalidHostnames,
  auth: {
    username: docDB_username,
    password: docDB_password,
  },
  // replicaSet: "rs0",
  retryWrites: false, //-- Okay to declare here, by don't declare retryWrites: false when using Mongo Shell --//
  directConnection: true,
  serverSelectionTimeoutMS: 5000, //-- Default: 30,000ms --//
});
try {
  await retry(
    async () => {
      await MongoClient.connect();
      const res = await MongoClient.db().command({ serverStatus: 1 });
      console.log("DocumentDB-MongoDB test query succeeded at:", res.localTime);
      console.log("DocumentDB-MongoDB user is:", docDB_username);
    },
    {
      retries: 2,
      minTimeout: 1000,
      factor: 2,
    }
  );
} catch (error) {
  console.log("DocumentDB-MongoDB connection error");
  console.log(error);
}
const Mongo = {
  //-- Clickwrap --//
  clickwrapLogs:
    MongoClient.db("legal").collection<IClickwrapLog_Mongo>("clickwrapLogs"),
  clickwrapUserStatus: MongoClient.db(
    "legal"
  ).collection<IClickwrapUserStatus_Mongo>("clickwrapUserStatus"),
  //-- ChrtGPT --//
  conversations:
    MongoClient.db("chrtgpt-journal").collection<IConversation_Mongo>(
      "conversations"
    ),
  message_nodes:
    MongoClient.db("chrtgpt-journal").collection<IMessageNode_Mongo>(
      "message_nodes"
    ),
};
export { Mongo, MongoClient };

//-- *************** Auth0 Client *************** --//
//-- NOTE - When in Dev, use a static test token from the Auth0 Management API page --> Test --> Express Server. This prevents having many refreshes which count against the 1,000 M2M access tokens monthly limit for the Auht0 "Essentials" subscription plan (link - https://manage.auth0.com/dashboard/us/chrt-prod/apis/63deb97098e5943185f2e769/test) --//
let auth0ManagementClient: ManagementClient | undefined;
if (process.env.NODE_ENV === "development") {
  console.log("Configuring Auth0 Client using static token");
  auth0ManagementClient = new ManagementClient({
    domain: "chrt-prod.us.auth0.com",
    clientId: "BeRyX8MY9nAGpxvVIFD3FKqRV0PfVcSu", //-- Application name: "Express Server" --//
    token:
      "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Imp6V2V3WGkyaV81WnpVSHpFZWwzRSJ9.eyJpc3MiOiJodHRwczovL2NocnQtcHJvZC51cy5hdXRoMC5jb20vIiwic3ViIjoiQmVSeVg4TVk5bkFHcHh2VklGRDNGS3FSVjBQZlZjU3VAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vY2hydC1wcm9kLnVzLmF1dGgwLmNvbS9hcGkvdjIvIiwiaWF0IjoxNjg2MzYyNzEzLCJleHAiOjE2ODY0NDkxMTMsImF6cCI6IkJlUnlYOE1ZOW5BR3B4dlZJRkQzRktxUlYwUGZWY1N1Iiwic2NvcGUiOiJyZWFkOnVzZXJzIHVwZGF0ZTp1c2VycyByZWFkOnJvbGVzIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.Rxt-VtHcf3JmJkVqXPP7MTZrXAYMo-Mb0jNtHktsg3pVnlqhTL50y3q9PwDzOw_MzDW798GwXIWtNUkmRZIN55GH1_RCaP6Vo53EBkaYO2i28KMsw8xMSq8iQP3wSyYyg-TK-tKLc2wwZKL9jLiNfqmrnQEfZv1k89w5Jue_Ks0NMYYN1k0Y0t8udi2uGiCY72OZX4r1rtF9Lnp-kQiJeFZqxwUthNd1FZUzjWkh8t-q3Xc8Gkxdqxiv3S7TobH2SBoYAvNUNfPG6EqGhFfP4tMwTHc2J6Oa4qQHFo9SYKaJIWxw7fzutd4U91JY4uyvuVOtMcGHV-3-JrNEV0BhFg",
    telemetry: false,
  });
}
if (process.env.NODE_ENV === "production") {
  const auth0ClientSecret = await getAuth0ClientSecretFromSecretsManager();
  auth0ManagementClient = new ManagementClient({
    domain: "chrt-prod.us.auth0.com",
    clientId: "BeRyX8MY9nAGpxvVIFD3FKqRV0PfVcSu", //-- Application name: "Express Server" --//
    clientSecret: auth0ClientSecret,
    telemetry: false,
    //-- NOTE - scope is determiend by the Express Server application's Management API permissions --//
  });
}
export { auth0ManagementClient };

//-- *************** OpenAI Client *************** --//
let OPENAI_API_KEY: string = await getOpenAI_API_Key();
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
export const OpenAIClient = new OpenAIApi(configuration); // Does this expire / timeout?

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

//-- Dev utility for logging token --//
// app.use((req, res, next) => {
//   let { header, payload, token } = req.auth;
//   console.log("header: " + JSON.stringify(header));
//   console.log("payload: " + JSON.stringify(payload));
//   console.log("token: " + token);
//   next();
// });

//-- Emits 'Request' with shape 'IRequestWithAuth' by adding: --//
//-- Request.auth.header, Request.auth.payload --//
const jwtCheck = auth({
  audience: "https://chrt.com",
  issuerBaseURL: "https://auth.chrt.com/",
  tokenSigningAlg: "RS256",
});

//-- *************** Routes w/ authentication *************** --//
//-- Routes --//
app.use("/journal", jwtCheck, journalAuthMiddleware, journalRoutes);
app.use("/journal_files", jwtCheck, journalAuthMiddleware, journalFilesRoutes);
app.use("/openai", jwtCheck, openAIRoutes); //-- middleware in routes --//
app.use("/wolfram", jwtCheck, wolframRoutes); //-- middleware in routes --//
app.use("/conversation", jwtCheck, llmAuthMiddleware, conversationRoutes);
app.use("/legal", jwtCheck, legalRoutes); //-- middleware in routes --//
app.use("/auth0/api/v2", jwtCheck, auth0Routes); //-- middleware in routes --//
app.use("/error", jwtCheck, errorRoutes); //-- test errors purposely thrown in route logic --//

//-- *************** Error Handler *************** --//
/* eslint-disable-next-line  @typescript-eslint/no-explicit-any */
const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AxiosError) {
    console.log("AxiosError: ", err);
  } else if (err?.name === "UnauthorizedError") {
    return res
      .status(401)
      .send(
        "Authentication failed OR resource not found beep boop. Everything except '/' and '/spec.json' requires a Bearer token."
      );
  } else {
    return res.status(500).send("unexpected error, beep boop");
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
