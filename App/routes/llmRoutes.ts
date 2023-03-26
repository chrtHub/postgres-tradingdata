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

router.post("/gpt-3.5-turbo", ctrl.gpt35turboController);

//-- ********** Export ********** --//
export default router;
