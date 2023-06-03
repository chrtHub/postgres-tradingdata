//-- AWS Client --//

//-- Database Clients --//

//-- Utility Functions --//

//-- NPM Functions --//

//-- Express router --//
import express from "express";
const router = express.Router();

//-- Middleware --//

//-- Controllers --//
import { wolframAuthMiddleware } from "../Auth/wolframAuthMiddleware.js";
import { TitleSuggest } from "../controllers/Wolfram/TitleSuggest.js";

//-- ********** Routes ********** --//

router.post("/LLMFunction/TitleSuggest", wolframAuthMiddleware, TitleSuggest);

//-- ********** Export ********** --//
export default router;
