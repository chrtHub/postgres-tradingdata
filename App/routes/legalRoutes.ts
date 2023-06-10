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
import { clickwrapStatus } from "../controllers/Legal/clickwrapStatus.js";

//-- ********** Routes ********** --//
router.get("/clickwrap_status", clickwrapStatus);
router.post("/grant_clickwrap", grantClickwrap);
router.post("/withdraw_clickwrap", withdrawClickwrap);

//-- ********** Export ********** --//
export default router;
