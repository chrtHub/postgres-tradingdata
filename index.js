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

//-- *************** PostgreSQL Client connection *************** --//
//-- Get config values --//
let { db_host, db_port, db_username, db_password, db_dbname } =
  await getDatabaseConfigFromSecretsManager();

//-- Knex --//
console.log("knex requesting connection to postgres...");
const knex = require("knex")({
  client: "pg",
  connection: {
    host: db_host,
    post: db_port,
    user: db_username,
    password: db_password,
    database: db_dbname,
  },
});
console.log("knex connected to postgres(?)");
//-- Export knex for use in controllers --//
export { knex };

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
