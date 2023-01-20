//-- *************** Imports *************** --//
//-- Database config --//
import { getDatabaseConfigFromSecretsManager } from "./config/dbConfig.js";

//-- Express server --//
import express from "express";
import cors from "cors";
import helmet from "helmet";

//-- Routes --//
import dataRoutes from "./routes/dataRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";

//-- Middleware --//
import { journalAuthMiddleware } from "./middleware/journalAuthMiddleware.js";

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
    "http://127.0.0.1:3000",
    "http://localhost:3000",
  ],
  maxAge: 3600,
};
app.use(cors(corsConfig));

//-- Just-for-fun middleware --//
app.use((req, res, next) => {
  res.append("Answer-to-Life-Universe-Everything", 42);
  res.append("X-Powred-By", "Lisp (Arc)");
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
  console.log(`express listening on port ${PORT}`);
});
