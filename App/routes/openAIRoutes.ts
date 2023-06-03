//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";

//-- Proxy-ish Routes --//
import { chatCompletionsSSE } from "../controllers/OpenAI/chatCompletionSSE.js";
// import { createImage } from "../controllers/OpenAIStableDiffusion/createImage.js";

//-- Routes with Custom Functionality --//
import { createTitle } from "../controllers/OpenAI/createTitle.js";

//-- Express router --//
const router = express.Router();

//-- Middlewares --//
import { llmAuthMiddleware } from "../Auth/llmAuthMiddleware.js";
// import { stableDiffusionAuthMiddleware } from "../Auth/stableDiffusionAuthMiddleware.js";

//-- Types ---//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

//-- ********** Proxy-ish Routes ********** --//
router.post(
  "/v1/chat/completions",
  llmAuthMiddleware,
  (req: IRequestWithAuth, res: Response) => {
    //-- If request has `accept: text/event-stream` header, use the SSE controller --//
    const acceptHeader = req.get("Accept") || req.get("accept");
    if (acceptHeader && acceptHeader.includes("text/event-stream")) {
      return chatCompletionsSSE(req, res);
    } else {
      // return ctrl.gpt35TurboController(req, res);
    }
  }
);

// TODO - implement controller
// router.post(
//   "/v1/images/generations",
//   stableDiffusionAuthMiddleware,
//   createImage
// );

//-- ********** Routes with Custom Functionality ********** --//
router.post("/create_title", llmAuthMiddleware, createTitle);

//-- ********** Export ********** --//
export default router;
