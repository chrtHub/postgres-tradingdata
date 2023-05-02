//-- MongoDB Client --//
import { MongoClient } from "../../index.js";

//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import orderBy from "lodash/orderBy.js";

//-- NPM Functions --//

//-- Utility Functions --//

//-- Types --//
import { IRequestWithAuth } from "../../index.d";
import { Response } from "express";
import { IConversation } from "./chatson_types.js";

//-- ********************* List Conversations ********************* --//
export const listConversationsController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("-- list conversations --"); // DEV
  let user_db_id = getUserDbId(req);

  //-- MongoDB client for each conversations collection --//
  const Mongo = {
    conversations:
      MongoClient.db("chrtgpt-journal").collection<IConversation>(
        "conversations"
      ),
  };

  try {
    let conversationsArray: IConversation[] = await Mongo.conversations
      .find({ user_db_id: user_db_id }) //-- Security --//
      .sort({ created_at: -1 })
      .toArray();

    res.json(conversationsArray);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error while fetching conversations list");
  }
};
