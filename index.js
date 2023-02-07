//-- *************** Imports *************** --//
//-- Database config --//
import { getDatabaseConfigFromSecretsManager } from "./App/config/dbConfig.js";

//-- Express server --//
import express from "express";
import cors from "cors";
import helmet from "helmet";

//-- Routes --//
import dataRoutes from "./App/routes/dataRoutes.js";
import journalRoutes from "./App/routes/journalRoutes.js";

//-- Auth & Middleware --//
import { auth } from "express-oauth2-jwt-bearer";
import { dataAuthMiddleware } from "./App/Auth/dataAuthMiddleware.js";
import { journalAuthMiddleware } from "./App/Auth/journalAuthMiddleware.js";

//-- Allow for a CommonJS "require" (inside ES Modules file) --//
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//-- *************** PostgreSQL Client connection *************** --//
//-- Get config values --//
let { db_host, db_port, db_username, db_password, db_dbname } =
  await getDatabaseConfigFromSecretsManager();

// DRAFT
// if (process.env.NODE_ENV === "development") {
//  connect via bastion host to RDS
// postgres://<database-user>:<database-password>@localhost:5432/<database-name>
// //-- Note: need to have an active SSH tunnel to bastion host to RDS --//
// } else {
//  connect to RDS directly
// }

//-- Knex --//
console.log("knex requesting connection to postgres...");
const knex = require("knex")({
  client: "pg",
  connection: {
    host: db_host,
    port: db_port,
    user: db_username,
    password: db_password,
    database: db_dbname,
  },
});
//-- Export knex for use in controllers --//
export { knex };

//-- Test Knex connection --//
try {
  const currentTime = await knex.raw('SELECT NOW() as "current_time"');

  //-- If query succeeds, log the current time and database user --//
  console.log(
    "knex test query succeeded at: " + currentTime.rows[0].current_time
  );
  console.log("knex user is: " + knex.client.connectionSettings.user);
} catch (error) {
  //-- If query fails, assume connection is in error --//
  console.log("knex connection error");
  console.log(error);
}

//-- *************** Express Server + Middleware *************** --//
const PORT = 8080;
const app = express();

//-- Helmet middlware for security --//
app.use(helmet());

//-- CORS middleware --//
const corsConfig = {
  credentials: true, //-- allows header with key 'authorization' --//
  methods: ["GET", "POST", "DELETE"],
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
  res.append("Answer-to-Life-Universe-Everything", 42);
  next();
});

//-- Health check route --//
app.get("/", (req, res) => {
  res.send("Hello World");
});

//-- Valid JWTs have 3 properties added: auth.header, auth.payload, auth.token --//
const jwtCheck = auth({
  audience: "https://chrt.com",
  issuerBaseURL: "https://chrt-prod.us.auth0.com/",
  tokenSigningAlg: "RS256",
});
app.use(jwtCheck); //-- returns 401 if token invalid or not found --//

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
app.use("/data", dataAuthMiddleware, dataRoutes);
app.use("/journal", journalAuthMiddleware, journalRoutes);

//-- Listener --//
app.listen(PORT, () => {
  console.log(`express listening on port ${PORT}`);
});
