import produce from "immer";
import { IConversation, IMessageNode } from "./chatson_types";

/**
 *
 * @param object
 */
export function mongoize_conversation(
  object: IConversation,
) {

    object = produce(object, (draft) => {
      draft.created_at = new Date(draft.created_at)
    });

}

// export interface IConversation {
//     _id: string; //-- ObjectId as Hex String --//
//     api_provider_name: APIProviderNames;
//     model_developer_name: ModelDeveloperNames;
//     user_db_id: string;
//     title: string;
//     root_node_id: string; //-- ObjectId as Hex String --//
//     schema_version: string;
//     created_at: string; //-- Date as ISO 8601 string, e.g. new Date().toISOString() --//
//     api_req_res_metadata: IAPIReqResMetadata[];
//     system_tags: string[]; //-- predefined lists for favorites, etc. --//
//     user_tags: string[]; //-- user-defined tags --//
//   }

/**
 *
 * @param object
 */
export function mongoize_message_node(
  object: IConversation,
) {

    object = produce(object, (draft) => {
      draft.
    });

}