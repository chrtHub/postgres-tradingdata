//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/llmControllers.js";

//-- Express router --//
const router = express.Router();

// import { Response } from "express";
// import { IRequestWithAuth } from "../../index.d";

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//

router.get("/list_conversations/:skip", ctrl.listConversationsController);

//-- ********** Export ********** --//
export default router;
