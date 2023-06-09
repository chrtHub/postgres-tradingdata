//-- AWS Client --//

//-- Database Clients --//

//-- Utility Functions --//

//-- NPM Functions --//

//-- Express router --//
import express from "express";
const router = express.Router();

//-- Middleware --//

//-- Controllers --//
import * as ctrl from "../controllers/Legal/legalControllers";

//-- ********** Routes ********** --//

router.post("/grant_consent", ctrl.grant_consent);

router.get("/withdraw_consent", ctrl.withdraw_consent);

//-- ********** Export ********** --//
export default router;
