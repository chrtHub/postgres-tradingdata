//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
// import * as ctrl from "../controllers/openAICreateTitle.js";
import { createTitle } from "../controllers/OpenAI/createTitle.js";
import { chatCompletionsSSE } from "../controllers/OpenAI/chatCompletionSSE.js";

//-- Express router --//
const router = express.Router();

import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//

router.post("/v1/chat/completions", (req: IRequestWithAuth, res: Response) => {
  //-- If request has `accept: text/event-stream` header, use the SSE controller --//
  const acceptHeader = req.get("Accept") || req.get("accept");
  if (acceptHeader && acceptHeader.includes("text/event-stream")) {
    return chatCompletionsSSE(req, res);
  } else {
    // return ctrl.gpt35TurboController(req, res);
  }
});

router.post("/create_title", createTitle);

//-- ********** Export ********** --//
export default router;
