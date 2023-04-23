import { getUUIDV4 } from "./getUUIDV4.js";
import { IConversation, IModel } from "../controllers/chatson_types.js";
import { ObjectId } from "mongodb";

const CURRENT_SCHEMA_VERSION = "2023-04-20";

export function getNewConversation(
  model: IModel,
  schema_version: string | null
) {
  const system_message_uuid = getUUIDV4();
  let created_at = new Date();

  const new_conversation: IConversation = {
    _id: new ObjectId(),
    schema_version: CURRENT_SCHEMA_VERSION,
    created_at: created_at,
    message_order: {
      1: {
        1: system_message_uuid,
      },
    },
    messages: {
      [system_message_uuid]: {
        message_uuid: system_message_uuid,
        author: "chrt",
        model: model,
        created_at: created_at,
        role: "system",
        message:
          "Your name is ChrtGPT. Refer to yourself as ChrtGPT. You are ChrtGPT, a helpful assistant that helps power a day trading performance journal. You sometimes make jokes and say silly things on purpose.",
      },
    },
    api_responses: [],
    chatson_tags: [],
    user_tags: [],
  };

  return new_conversation;
}
