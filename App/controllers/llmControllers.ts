//-- MongoDB Client --//
import { Mongo } from "../../index.js";

//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import orderBy from "lodash/orderBy.js";

//-- NPM Functions --//
import produce from "immer";

//-- Utility Functions --//

//-- Types --//
import { IRequestWithAuth } from "../../index.d";
import { Response } from "express";
import { IConversation, IMessageNode } from "./chatson_types.js";
import { ObjectId } from "mongodb";

//-- ********************* List Conversations ********************* --//
export const listConversationsController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("-- list conversations --"); // DEV
  let { skip } = req.params;
  let skipInt: number = parseInt(skip);

  let user_db_id = getUserDbId(req);

  try {
    let conversationsArray: IConversation[] = await Mongo.conversations
      .find({ user_db_id: user_db_id }) //-- Security --//
      .skip(skipInt)
      .limit(42) //-- arbitrary number --//
      .sort({ created_at: -1 })
      .toArray();

    return res.json(conversationsArray);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error while fetching conversations list");
  }
};

//-- ********************* Get Conversation ********************* --//
export const getConversationAndMessagesController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("-- get conversation --"); // DEV
  //-- Get data from params --//
  let { objectIdString } = req.params;
  let conversation_id = ObjectId.createFromHexString(objectIdString);
  let user_db_id = getUserDbId(req);

  //-- Fetch conversation --//
  try {
    let conversation: IConversation | null = await Mongo.conversations.findOne({
      user_db_id: user_db_id, //-- Security --//
      _id: conversation_id,
    });

    if (conversation) {
      //-- Fetch messages --//
      try {
        let message_nodes: IMessageNode[] = await Mongo.message_nodes
          .find({
            user_db_id: user_db_id, //-- Security --//
            conversation_id: conversation_id,
          })
          .toArray();
        if (message_nodes) {
          //-- Redact system message --//
          message_nodes = produce(message_nodes, (draft) => {
            let system_node = draft.find(
              (node) => node.prompt.role === "system"
            );
            if (system_node) {
              system_node.prompt.content = "redacted system message";
            }
          });

          return res.status(200).json({ conversation, message_nodes });
          //----//
        } else {
          throw new Error(
            `no message_nodes found for conversation_id: ${conversation_id}`
          );
        }
      } catch (err) {
        console.log(err);
        throw new Error("Error while fetching messages");
      }
      //
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error while fetching conversation list");
  }
};
