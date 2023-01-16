//-- *************** Imports *************** --//
//-- Database config --//
import { getDatabaseConfigFromSecretsManager } from "./config/dbConfig.js";

//-- Express server --//
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createClient as createRedisClient } from "redis";

//-- Routes --//
import dataRoutes from "./routes/dataRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";

//-- Middleware --//
import { journalAuthMiddleware } from "./middleware/journalAuthMiddleware.js";

//-- Allow for a CommonJS "require" (inside ES Modules file) --//
import { createRequire } from "module";
const require = createRequire(import.meta.url);

//-- Sessions using express-session, connect-redis --//
let session = require("express-session");
let connectRedis = require("connect-redis");
let RedisStore = connectRedis(session);
// let RedisStore = require("connect-redis")(session);

//-- redis client --//
let redisClient = createRedisClient({
  legacyMode: true, // TESTING
  host: "localhost", // DEV
  // host: "clustercfg.chrt-us-east-1.agvpqr.memorydb.us-east-1.amazonaws.com",
  port: 6379,
  logErrors: true,
});
redisClient.on("error", function (err) {
  console.log("Could not establish a connection with redis. " + err);
});
redisClient.on("connect", function () {
  console.log("redisClient connected");
});
redisClient.on("reconnecting", function () {
  console.log("redisClient reconnecting");
});
redisClient.connect();

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

//-- Trust headers added by ALB reverse proxy --//
app.set("trust proxy", 1);

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

//-- Sessions middleware --//
// DEV - express-session debug mode - DEBUG=express-session npm run dev
app.use(
  session({
    name: "chrt-session-3", // what to do here?
    logErrors: true,
    store: new RedisStore({
      client: redisClient,
    }),
    secret: "TODO",
    saveUninitialized: false, // WHAT TO DO HERE??
    resave: false,
    cookie: {
      secure: false, //-- Force HTTPS, to be set to 'true' in production --//
      httpOnly: true, //-- Prevent client-side JS from reading the cookie --//
      path: "/",
      maxAge: 1000 * 60 * 60 * 1, //-- 1 hour (session max age in ms) --//
    },
  })
);

// DEV - log session and clientId
app.use((req, res, next) => {
  console.log("session: " + JSON.stringify(req.session));
  next();
});

//-- Just-for-fun middleware --//
app.use((req, res, next) => {
  res.append("Answer-to-Life-Universe-Everything", 42);
  res.append("X-Powred-By", "Lisp (Arc)");
  next();
});

//-- *************** Routes *************** --//
//-- Health check --//
app.get("/", (req, res) => {
  // DEV
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }

  res.send("Hello World");
});

//-- Routes --//
app.use("/data", dataRoutes);
app.use("/journal", journalAuthMiddleware, journalRoutes);

//-- Listener --//
app.listen(PORT, () => {
  console.log(`express listening on port ${PORT}`);
});
