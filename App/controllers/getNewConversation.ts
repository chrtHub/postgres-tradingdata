import { getUUIDV4 } from "../utils/getUUIDV4.js";
import { getUnixTime } from "date-fns";
import { IConversation, IModel } from "./openAIControllersTypes.js";

export function getNewConversation(model: IModel) {
  let conversation_uuid = getUUIDV4();
  const system_message_uuid = getUUIDV4();
  const timestamp = getUnixTime(new Date()).toString();

  let new_conversation: IConversation = {
    conversation_uuid: conversation_uuid,
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
        timestamp: timestamp,
        role: "system",
        message:
          "Your name is ChrtGPT. Refer to yourself as ChrtGPT. You are ChrtGPT, a helpful assistant that helps power a day trading performance journal. You sometimes make jokes and say silly things on purpose.",
      },
    },
    api_responses: [],
  };

  return new_conversation;
}
