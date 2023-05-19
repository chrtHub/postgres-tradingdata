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
      .limit(25) //-- arbitrary number --//
      .sort({ [sort_param]: -1 })
      .toArray();

    //-- Lazy Migration to add last_edited --//
    const bulkUpdateOperations = [];
    for (let conversation of conversationsArray) {
      //-- If no 'last_edited', use time of last API req. --//
      if (!conversation.last_edited) {
        conversation.api_req_res_metadata.sort((a, b) => {
          const timestampA = new Date(a.created_at).getTime();
          const timestampB = new Date(b.created_at).getTime();
          return timestampB - timestampA; //-- Descending --//
        });
        const newestMetadata = conversation.api_req_res_metadata[0];

        //-- Update in conversationsArray --//
        conversation.last_edited = new Date(newestMetadata.created_at);

        //-- Add to bulkWrite array to update MongoDB --//
        bulkUpdateOperations.push({
          updateOne: {
            filter: { _id: conversation._id },
            update: { $set: { last_edited: conversation.last_edited } },
          },
        });
      }
    }

    res.status(200).json(conversationsArray);

    //-- Execute bulk write --//
    if (bulkUpdateOperations.length > 0) {
      try {
        console.log("bulk update conversation last_edited");
        await Mongo.conversations.bulkWrite(bulkUpdateOperations);
      } catch (err) {
        console.log(err);
      }
    }

    return;
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
    return res
      .status(500)
      .send("Error while fetching conversation and messages");
  }
};

//-- ********************* Get Conversation ********************* --//
export const deleteConversationAndMessagesController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //-- Get data from params --//
  let { conversation_id } = req.params;
  let user_db_id = getUserDbId(req);

  try {
    await Mongo.message_nodes.deleteMany({
      user_db_id: user_db_id, //-- security --//
      conversation_id: ObjectId.createFromHexString(conversation_id),
    });
    try {
      await Mongo.conversations.deleteOne({
        user_db_id: user_db_id, //-- security --//
        _id: ObjectId.createFromHexString(conversation_id),
      });
      return res
        .status(200)
        .send(`deleted ${conversation_id} and its messages`);
    } catch (error) {
      console.log(error);
      return res.status(500).send("Error while deleting conversation");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("error deleting conversation and messages");
  }
};

//-- ********************* Retitle Conversation ********************* --//
export const retitle = async (req: IRequestWithAuth, res: Response) => {
  console.log("----- retitle -----");
  //-- Get data from params --//
  let { conversation_id, new_title } = req.body;
  let user_db_id = getUserDbId(req);

  if (new_title) {
    //-- Enforce title max length 60 chars --//
    if (new_title.length > 60) {
      new_title = new_title.substring(0, 60) + "...";
    }

    try {
      await Mongo.conversations.updateOne(
        {
          _id: ObjectId.createFromHexString(conversation_id),
          user_db_id: user_db_id, //-- security --//
        },
        { $set: { title: new_title } }
      );
      return res.status(200).send(`title updated to: ${new_title}`);
    } catch (err) {
      console.log(err);
      return res.status(500).send("error setting title");
    }
  } else {
    return res.status(500).send("no new_title received");
  }
};
