//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/openAIControllers.js";

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//

// router.post("/openai", ctrl.gpt35turboController);

router.post("/v1/chat/completions", ctrl.gpt35turboStreamController);

//-- ********** Export ********** --//
export default router;
