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
console.log("pgClient requesting connection...");
await pgClient.connect();
console.log("pgClient connected");
//-- Export pgClient for use in controllers --//
export { pgClient };

//-- *************** Express server setup *************** --//
const PORT = 8080;
const app = express();
app.disable("x-powered-by");
const corsConfig = {
  // allowedHeaders: ["*"],
  credentials: true, //-- allows header with key 'authorization' --//
  methods: ["GET", "POST", "DELETE"],
  origin: [
    "https://chrt.com",
    "https://*.chrt.com",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ],
  // exposedHeaders: ['foo'],
  maxAge: 3600,
};
app.use(cors(corsConfig)); //-- CORS middlware --//

app.use((req, res, next) => {
  res.append("Meaning-Of-Life", 42); //-- just for fun --//
  res.append("X-Powred-By", "Lisp (Arc)"); //-- just for fun --//
  next();
});

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

//-- NOTE - pg connection fails (crashing entire server) unless using VPN Client Endpoint --//
