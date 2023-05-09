//-- Types --//
import {
  IConversation,
  IMessage,
  IMessageNode,
  IModel,
  ModelDeveloperNames,
  APIProviderNames,
} from "./chatson_types.js";
import { ObjectId } from "mongodb";

//-- Schemas --//
const CURRENT_SCHEMA_VERSION = "2023-04-20";

//-- System Messages --//
const CURRENT_SYSTEM_MESSAGE =
  "Your name is ChrtGPT. Refer to yourself as ChrtGPT. You are ChrtGPT, a helpful assistant that helps power a day trading performance journal. You sometimes make jokes and say silly things on purpose.";

//-- ***** ***** Exported function ***** ***** --//
export function createConversation(
  user_db_id: string,
  model: IModel,
  api_provider_name: APIProviderNames,
  model_developer_name: ModelDeveloperNames,
  schema_version: string | null
) {
  //-- Generate timestamp, _id values --//
  let created_at = new Date().toISOString();
  const root_node_id = new ObjectId().toHexString();
  const conversation_id = new ObjectId().toHexString();

  //-- Use system_message as prompt --//
  const system_message: IMessage = {
    author: "chrt",
    model: model,
    created_at: created_at,
    role: "system",
    content: CURRENT_SYSTEM_MESSAGE,
  };

  //-- ***** ***** Documents to be persisted in database ***** ***** --//

  //-- Create root_node document --//
  const root_node: IMessageNode = {
    _id: root_node_id,
    user_db_id: user_db_id,
    created_at: created_at,
    conversation_id: conversation_id,
    parent_node_id: null, //-- because this is the root node --//
    children_node_ids: [],
    prompt: system_message,
    completion: null, //-- because the system_message has no completion --//
  };

  //-- Create conversation document --//
  const conversation: IConversation = {
    _id: conversation_id,
    api_provider_name: api_provider_name,
    model_developer_name: model_developer_name,
    user_db_id: user_db_id,
    title: "",
    root_node_id: root_node_id,
    schema_version: CURRENT_SCHEMA_VERSION,
    created_at: created_at,
    last_edited: created_at,
    api_req_res_metadata: [],
    system_tags: [],
    user_tags: [],
  };

  return { root_node, conversation, conversation_id, root_node_id };
}
