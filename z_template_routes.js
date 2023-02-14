//-- AWS client(s) --//

//-- knex client --//

//-- Utility Functions --//

//-- NPM Functions --//

//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/some_Controllers.js";

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//

router.get("/some_route", ctrl.some_controller);

//-- ********** Export ********** --//
export default router;
