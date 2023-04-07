//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/llmControllers.js";

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//

//-- Send prompt --//
router.get("/:prompt", ctrl.promptController);

// router.post("/openai", ctrl.gpt35turboController);
router.post("/openai", ctrl.gpt35turboStreamController);

//-- ********** Export ********** --//
export default router;
