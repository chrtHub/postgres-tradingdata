//-- *************** Imports *************** --//
//-- Database config --//
import { getDatabaseConfigFromSecretsManager } from "./App/config/dbConfig.js";
import { Client as SSH_Client } from "ssh2"; //-- Dev mode, ssh tunnel to RDS instance --//
import fs from "fs";

//-- Express server --//
import express from "express";
import cors from "cors";
import helmet from "helmet";

//-- Routes --//
import dataRoutes from "./App/routes/dataRoutes.js";
import journalRoutes from "./App/routes/journalRoutes.js";
import journalFilesRoutes from "./App/routes/journalFilesRoutes.js";

//-- Auth & Middleware --//
import { auth } from "express-oauth2-jwt-bearer";
import { dataAuthMiddleware } from "./App/Auth/dataAuthMiddleware.js";
import { journalAuthMiddleware } from "./App/Auth/journalAuthMiddleware.js";

//-- Allow for a CommonJS "require" (inside ES Modules file) --//
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//-- Print current value of process.env.NODE_ENV --//
console.log("process.env.NODE_ENV: " + process.env.NODE_ENV);

//-- *************** PostgreSQL Client connection *************** --//
//-- Get database config values --//
let { db_host, db_port, db_username, db_password, db_dbname } =
  await getDatabaseConfigFromSecretsManager();

//-- SSH tunnel config values --//
let src_host = "localhost";
let src_port = 2222;

let ec2_username = "ec2-user";
let ec2_host = "18.207.101.199"; //-- Subject to change --//
let ec2_pemFile = fs.readFileSync("./chrt-1-bastion-postgres-02.pem"); //-- Local file --//

//-- In development mode, connect to db via SSH tunnel --//
if (process.env.NODE_ENV === "development") {
  console.log("To use SSH tunnell...");

  const setupSSHTunnel = async () => {
    return new Promise((resolve, reject) => {
      //-- Establish ssh tunnel via EC2 bastion host to RDS --//
      const ssh_conn = new SSH_Client();
      ssh_conn.connect({
        host: ec2_host,
        username: ec2_username,
        privateKey: ec2_pemFile,
      });

      //-- On ready, create forwarding --//
      ssh_conn.on("ready", () => {
        console.log("ssh connection :: ready");
        ssh_conn.forwardOut(
          src_host,
          src_port,
          db_host,
          db_port,
          (err, stream) => {
            if (err) {
              console.log("ssh_conn.forwardOut() err: " + err);
              reject(err);
            } else {
              //-- Override db_host to point to local ssh tunnel, not directly to RDS --//
              db_host = src_host;
              db_port = src_port;

              console.log("SSH tunnel (forwardOut) ready");
              resolve();
            }
          }
        );
      });
    });
  };

  await setupSSHTunnel();
}

console.log(`db_host:db_port - ${db_host}:${db_port}`);

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
  // ssh: {
  //   host: ec2_host,
  //   user: ec2_username,
  //   privateKey: ec2_pemFile,
  //   port: 22,
  //   dstPort: db_port,
  // },
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
  res.append("Answer-to-Life-Universe-Everything", 42);
  next();
});

//-- Health check route --//
app.get("/", (req, res) => {
  res.send("Hello World");
});

//-- Auth - valid JWTs have 3 properties added: auth.header, auth.payload, auth.token --//
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
app.use("/journal_files", journalAuthMiddleware, journalFilesRoutes);

//-- Listener --//
app.listen(PORT, () => {
  console.log(`express listening on port ${PORT}`);
});
