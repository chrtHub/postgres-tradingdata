//-- AWS Client --//

//-- Database Clients --//

//-- Utility Functions --//

//-- NPM Functions --//

//-- Express router --//
import express from "express";
const router = express.Router();

//-- Middleware --//

//-- Controllers --//
import { grantClickwrap } from "../controllers/Legal/grantClickwrap.js";
import { withdrawClickwrap } from "../controllers/Legal/withdrawClickwrap.js";
import { checkClickwrapStatus } from "../controllers/Legal/checkClickwrapStatus.js";

//-- ********** Routes ********** --//
router.get("/check_clickwrap_status", checkClickwrapStatus);
router.post("/grant_clickwrap", grantClickwrap);
router.get("/withdraw_clickwrap", withdrawClickwrap);

//-- ********** Export ********** --//
export default router;
