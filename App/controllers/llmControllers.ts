//-- MongoDB Client --//
import { Mongo } from "../../index.js";

//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";

//-- NPM Functions --//
import produce from "immer";
import retry from "async-retry";

//-- Utility Functions --//

//-- Types --//
import { IRequestWithAuth } from "../../index.d";
import { Response } from "express";
import {
  IConversation_Mongo,
  IMessageNode_Mongo,
} from "./chatson/chatson_types.js";
import { ObjectId } from "mongodb";

class CustomError extends Error {}

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
    await retry(
      async () => {
        let conversationsArray: IConversation_Mongo[] =
          await Mongo.conversations
            .find({ user_db_id: user_db_id }) //-- Security --//
            .skip(skipInt)
            .limit(25) //-- arbitrary number --//
            .sort({ [sort_param]: -1 })
            .toArray();

        return res.status(200).json(conversationsArray);
      },
      {
        retries: 1,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (error) {
    if (error instanceof CustomError) {
      return res.status(400).send(error.message);
    } else {
      console.log(error);
      return res.status(500).send("Error while fetching conversations list");
    }
  }
};

//-- **************** Get Conversation and Messages **************** --//
export const getConversationAndMessagesController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //-- Get data from params --//
  let { conversation_id } = req.params;
  let user_db_id = getUserDbId(req);

  //--Fetch conversation --//
  try {
    await retry(
      async () => {
        let conversation: IConversation_Mongo | null =
          await Mongo.conversations.findOne({
            user_db_id: user_db_id, //-- Security --//
            _id: ObjectId.createFromHexString(conversation_id),
          });

        if (conversation) {
          try {
            await retry(
              async () => {
                let message_nodes: IMessageNode_Mongo[] =
                  await Mongo.message_nodes
                    .find({
                      user_db_id: user_db_id, //-- Security --//
                      conversation_id:
                        ObjectId.createFromHexString(conversation_id),
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
                  return res
                    .status(400)
                    .send(
                      `No messages found for conversation_id: ${conversation_id}`
                    );
                }
              },
              {
                retries: 1,
                minTimeout: 1000,
                factor: 2,
              }
            );
          } catch (err) {
            console.log(err);
            return res.status(500).send("Error while fetching messages");
          }
        } else {
          return res
            .status(400)
            .send(
              "Conversation unavailable - either it doesn't exist or you lack permission to view it"
            );
        }
      },
      {
        retries: 1,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error while fetching conversation");
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
    await retry(
      async () => {
        await Mongo.message_nodes.deleteMany({
          user_db_id: user_db_id, //-- security --//
          conversation_id: ObjectId.createFromHexString(conversation_id),
        });
        try {
          await retry(
            async () => {
              await Mongo.conversations.deleteOne({
                user_db_id: user_db_id, //-- security --//
                _id: ObjectId.createFromHexString(conversation_id),
              });
              return res
                .status(200)
                .send(`deleted ${conversation_id} and its messages`);
            },
            {
              retries: 1,
              minTimeout: 1000,
              factor: 2,
            }
          );
        } catch (error) {
          console.log(error);
          return res.status(500).send("Error while deleting conversation");
        }
      },
      {
        retries: 1,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (error) {
    console.log(error);
    return res.status(500).send("error deleting conversation and messages");
  }
};

//-- ********************* Retitle Conversation ********************* --//
export const retitle = async (req: IRequestWithAuth, res: Response) => {
  //-- Get data from params --//
  let { conversation_id, new_title } = req.body;
  let user_db_id = getUserDbId(req);

  if (new_title) {
    //-- Enforce title max length 60 chars --//
    if (new_title.length > 60) {
      new_title = new_title.substring(0, 60) + "...";
    }

    try {
      await retry(
        async () => {
          await Mongo.conversations.updateOne(
            {
              _id: ObjectId.createFromHexString(conversation_id),
              user_db_id: user_db_id, //-- security --//
            },
            { $set: { title: new_title } }
          );
          return res.status(200).send(`title updated to: ${new_title}`);
        },
        {
          retries: 1,
          minTimeout: 1000,
          factor: 2,
        }
      );
    } catch (err) {
      console.log(err);
      return res.status(500).send("error setting title");
    }
  } else {
    return res.status(500).send("no new_title received");
  }
};
