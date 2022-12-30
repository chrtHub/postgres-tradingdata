//-- *************** Imports *************** --//
//-- Database config --//
import { getDatabaseConfigFromSecretsManager } from "./config/dbConfig.js";

//-- Express server --//
import express from "express";
import cors from "cors";

//-- Routes --//
import dataRoutes from "./routes/dataRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";

//-- Middleware --//
import { journalAuthMiddleware } from "./middleware/journalAuthMiddleware.js";

//-- Allow for a CommonJS "require" (inside ES Modules file) --//
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { Client } = require("pg"); //-- 'pg' for PostgreSQL --//

//-- *************** PostgreSQL Client connection *************** --//
//-- Get config values --//
let { db_host, db_port, db_dbname, db_username, db_password } =
  await getDatabaseConfigFromSecretsManager();
//-- Configure pg Client to connect to RDS Instance --//
const pgClient = new Client({
  host: db_host,
  port: db_port,
  database: db_dbname,
  user: db_username,
  password: db_password,
});
//-- Start connection --//
await pgClient.connect(); // Disconnect?? await pgClient.end();
//-- Export pgClient for use in controllers --//
export { pgClient };

//-- *************** Express server setup *************** --//
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
app.use(cors(corsConfig)); //-- CORS middlware --//

//-- *************** Routes *************** --//
//-- Health check --//
app.get("/", (req, res) => {
  res.send("Hello World");
});

//-- Routes --//
app.use("/data", dataRoutes);
app.use("/journal", journalAuthMiddleware, journalRoutes);

//-- Listener --//
app.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
