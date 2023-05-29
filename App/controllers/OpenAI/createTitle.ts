//-- MongoDB Client --//
import { Mongo } from "../../../index.js";

//-- OpenAI Client --//
import { getOpenAI_API_Key } from "../../config/OpenAIConfig.js";

//-- Node Functions --//

//-- NPM Functions --//
import axios from "axios";
import retry from "async-retry";

//-- Utility Functions --//
import getUserDbId from "../../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import {
  CreateChatCompletionRequest,
  IMessageNode_Mongo,
} from "../chatson/chatson_types.js";
import { ObjectId } from "mongodb";
import { getSHA256Hash } from "../../utils/getSHA256Hash.js";

//-- ***** ***** ***** Titles ***** ***** ***** --//
export const createTitle = async (req: IRequestWithAuth, res: Response) => {
  console.log("----- createTitle -----");

  //-- Get data from params --//
  let { conversation_id } = req.body;
  let user_db_id = getUserDbId(req);
  let message_node: IMessageNode_Mongo[] = [];
  let new_title: string = "TODO - new title";

  try {
    await retry(
      async () => {
        message_node = await Mongo.message_nodes
          .find({
            conversation_id: ObjectId.createFromHexString(conversation_id),
            user_db_id: user_db_id, //-- Security --//
          })
          .sort({ created_at: -1 })
          .limit(1)
          .toArray();
      },
      {
        retries: 1,
        minTimeout: 1000,
        factor: 2,
      }
    );

    //-- Build request body --//
    const request_body: CreateChatCompletionRequest = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "Please create a chat conversation title by capturing the essence of the following message(s). Use approximately 50 characters or less. Do not include anything else in your response - only include the exact text of the chat conversation title.",
        },
        {
          role: "user",
          content: `User's prompt: ${
            message_node[0].prompt.content
          }. Assistant's first completion: ${
            message_node[0].completion?.content || ""
          }`,
        },
      ],
      user: await getSHA256Hash(user_db_id),
    };

    //-- Make LLM request to generate a title --//
    let OPENAI_API_KEY = await getOpenAI_API_Key();
    try {
      await retry(
        async () => {
          //-- Axios POST request to OpenAI --//
          let chat_completion = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            request_body,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
              },
            }
          );
          new_title = chat_completion.data.choices[0].message.content;
        },
        {
          retries: 1,
          minTimeout: 1000,
          factor: 2,
        }
      );
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .send("Error calling LLM to create title, please try again");
    }

    //-- Clean up --//
    //-- Remove quotation marks from start and end, remove trailing period --//
    new_title = new_title.replace(/^"|"$/g, "").replace(/\.$/g, "");

    //-- Enforce title max length 60 chars. If char 60 is whitespace, remove it. --//
    if (new_title.length > 60) {
      new_title = new_title.substring(0, 60).trim();
      if (new_title.endsWith(" ")) {
        new_title = new_title.substring(0, new_title.length - 1);
      }
      new_title += "...";
    }

    //-- Update conversation --//
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
      return res
        .status(500)
        .send("Error writing title to database, please try again");
    }
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send("Error fetching most recent message node, please try again");
  }
};
