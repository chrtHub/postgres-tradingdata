//-- MongoDB Client --//
import { Mongo } from "../../index.js";

//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";

//-- NPM Functions --//
import produce from "immer";

//-- Utility Functions --//

//-- Types --//
import { IRequestWithAuth } from "../../index.d";
import { Response } from "express";
import {
  IConversation_Mongo,
  IMessageNode_Mongo,
} from "./chatson/chatson_types.js";
import { ObjectId } from "mongodb";

//-- ********************* List Conversations ********************* --//
export const listConversationsController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("-- list conversations --"); // DEV
  let user_db_id = getUserDbId(req);

  let { sort_by, skip } = req.params;
  let skipInt: number = parseInt(skip);

  let sort_param = "last_edited";
  if (sort_by === "created_at") {
    sort_param = "created_at";
  }

  try {
    let conversationsArray: IConversation_Mongo[] = await Mongo.conversations
      .find({ user_db_id: user_db_id }) //-- Security --//
      .skip(skipInt)
      .limit(20) //-- arbitrary number --//
      .sort({ [sort_param]: -1 })
      .toArray();

    return res.status(200).json(conversationsArray);
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
  let { conversation_id } = req.params;
  let user_db_id = getUserDbId(req);

  //-- Fetch conversation --//
  try {
    let conversation: IConversation_Mongo | null =
      await Mongo.conversations.findOne({
        user_db_id: user_db_id, //-- Security --//
        _id: ObjectId.createFromHexString(conversation_id),
      });

    if (conversation) {
      //-- Fetch messages --//
      try {
        let message_nodes: IMessageNode_Mongo[] = await Mongo.message_nodes
          .find({
            user_db_id: user_db_id, //-- Security --//
            conversation_id: ObjectId.createFromHexString(conversation_id),
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

//-- ********************* Get Conversation ********************* --//
export const deleteConversationAndMessagesController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("-- delete conversation --"); // DEV
  //-- Get data from params --//
  let { conversation_id } = req.params;
  let user_db_id = getUserDbId(req);

  try {
    let msg_res = await Mongo.message_nodes.deleteMany({
      user_db_id: user_db_id, //-- security --//
      conversation_id: ObjectId.createFromHexString(conversation_id),
    });
    console.log(msg_res); // DEV

    try {
      let convo_res = await Mongo.conversations.deleteOne({
        user_db_id: user_db_id, //-- security --//
        _id: ObjectId.createFromHexString(conversation_id),
      });
      console.log(convo_res); // DEV
    } catch (error) {
      console.log(error);
      return res.status(500).send("Error while deleting conversation");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error while deleting messages");
  }
};
