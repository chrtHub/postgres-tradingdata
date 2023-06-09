//-- AWS Client --//

//-- Database Clients --//

//-- Utility Functions --//

//-- NPM Functions --//

//-- Express router --//
import express from "express";
const router = express.Router();

//-- Middleware --//

//-- Controllers --//
import { grantConsent } from "../controllers/Legal/grantConsent";
import { withdrawConsent } from "../controllers/Legal/withdrawConsent";

//-- ********** Routes ********** --//

router.post("/grant_consent", grantConsent);

router.get("/withdraw_consent", withdrawConsent);

//-- ********** Export ********** --//
export default router;
