//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/ChrtGPT/conversationControllers.js";

//-- Express router --//
const router = express.Router();

// import { Response } from "express";
// import { IRequestWithAuth } from "../../Types/index.js";

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//
router.get(
  "/list_conversations/:sort_by/:skip",
  ctrl.listConversationsController
);
router.get(
  "/get_conversation_and_messages/:conversation_id",
  ctrl.getConversationAndMessagesController
);
router.delete(
  "/delete_conversation_and_messages/:conversation_id",
  ctrl.deleteConversationAndMessagesController
);
router.post("/retitle", ctrl.retitle);

//-- ********** Export ********** --//
export default router;
