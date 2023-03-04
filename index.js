"use strict";
exports.__esModule = true;
exports.knex = void 0;
//-- *************** Imports *************** --//
//-- Database config --//
var dbConfig_js_1 = require("./App/config/dbConfig.js");
//-- Express server --//
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
//-- Routes --//
var dataRoutes_js_1 = require("./App/routes/dataRoutes.js");
var journalRoutes_js_1 = require("./App/routes/journalRoutes.js");
var journalFilesRoutes_js_1 = require("./App/routes/journalFilesRoutes.js");
//-- Auth & Middleware --//
var express_oauth2_jwt_bearer_1 = require("express-oauth2-jwt-bearer");
var dataAuthMiddleware_js_1 = require("./App/Auth/dataAuthMiddleware.js");
var journalAuthMiddleware_js_1 = require("./App/Auth/journalAuthMiddleware.js");
//-- OpenAPI Spec --//
var swagger_jsdoc_1 = require("swagger-jsdoc");
//-- Allow for a CommonJS "require" (inside ES Modules file) --//
var module_1 = require("module");
var require = (0, module_1.createRequire)(import.meta.url);
//-- Print current value of process.env.NODE_ENV --//
console.log("process.env.NODE_ENV: " + process.env.NODE_ENV);
//-- *************** PostgreSQL Client connection *************** --//
//-- Get database config values --//
var _a = await (0, dbConfig_js_1.getDatabaseConfigFromSecretsManager)(), db_host = _a.db_host, db_port = _a.db_port, db_username = _a.db_username, db_password = _a.db_password, db_dbname = _a.db_dbname;
//-- In development mode, connect to db via SSH tunnel --//
//-- NOTE - must establish SSH tunnel outside this server for this to work --//
if (process.env.NODE_ENV === "development") {
    db_host = "127.0.0.1";
    db_port = 2222;
}
//-- Knex --//
console.log("knex requesting connection to postgres at ".concat(db_host, ":").concat(db_port));
var knex = require("knex")({
    client: "pg",
    connection: {
        host: db_host,
        port: db_port,
        user: db_username,
        password: db_password,
        database: db_dbname
    }
});
exports.knex = knex;
//-- Test Knex connection --//
try {
    var currentTime = await knex.raw('SELECT NOW() as "current_time"');
    //-- If query succeeds, log the current time and database user --//
    console.log("knex test query succeeded at: " + currentTime.rows[0].current_time);
    console.log("knex user is: " + knex.client.connectionSettings.user);
}
catch (error) {
    //-- If query fails, assume connection is in error --//
    console.log("knex connection error");
    console.log(error);
}
//-- *************** Express Server, Middleware, Swagger-JSDoc *************** --//
var PORT = 8080;
var app = (0, express_1["default"])();
//-- Helmet middlware for security --//
app.use((0, helmet_1["default"])());
//-- CORS middleware --//
var corsConfig = {
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    origin: [
        "https://chrt.com",
        "https://*.chrt.com",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
    ],
    maxAge: 3600
};
app.use((0, cors_1["default"])(corsConfig));
//-- Just-for-fun middleware --//
app.use(function (req, res, next) {
    res.append("Answer-to-Life-Universe-Everything", "42");
    next();
});
var apiSpecOptions = {
    swaggerDefinition: {
        info: {
            title: "CHRT API",
            version: "1.0.0",
            description: "CHRT API docs",
            contact: {
                name: "Aaron Carver",
                email: "aaron@chrt.com"
            }
        }
    },
    apis: ["./App/routes/*.js"]
};
var apiSpec = (0, swagger_jsdoc_1["default"])(apiSpecOptions);
app.get("/spec", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.send(apiSpec);
});
//-- Health check route --//
/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check that returns "Hello World"
 *       description: Returns "Hello World"
 *       produces:
 *         - text/plain
 *       responses:
 *         200:
 *           description: "Hello World"
 */
app.get("/", function (req, res) {
    res.send("Hello World");
});
//-- Auth - valid JWTs have 3 properties added: auth.header, auth.payload, auth.token --//
var jwtCheck = (0, express_oauth2_jwt_bearer_1.auth)({
    audience: "https://chrt.com",
    issuerBaseURL: "https://chrt-prod.us.auth0.com/",
    tokenSigningAlg: "RS256"
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
app.use("/data", dataAuthMiddleware_js_1.dataAuthMiddleware, dataRoutes_js_1["default"]);
app.use("/journal", journalAuthMiddleware_js_1.journalAuthMiddleware, journalRoutes_js_1["default"]);
app.use("/journal_files", journalAuthMiddleware_js_1.journalAuthMiddleware, journalFilesRoutes_js_1["default"]);
//-- *************** Error Handler *************** --//
var errorHandler = function (err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        return res
            .status(401)
            .send("Authentication failed OR resource not found beep boop. Everything except '/' and '/spec' requires a Bearer token.");
    }
    else {
        return res.status(500).send("Internal server error beep boop");
    }
};
app.use(errorHandler);
//-- *************** Listener *************** --//
app.listen(PORT, function () {
    console.log("express listening at http://localhost:".concat(PORT));
    console.log("api spec at http://localhost:".concat(PORT, "/spec"));
});
