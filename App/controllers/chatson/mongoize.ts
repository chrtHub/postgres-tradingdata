import {
  IConversation,
  IConversation_Mongo,
  IMessageNode,
  IMessageNode_Mongo,
} from "./chatson_types";
import { ObjectId } from "mongodb";

//-- ***** ***** ***** ***** DMongoize ***** ***** ***** ***** --//

//-- Conversations --//
export function mongoize_conversation(__: IConversation): IConversation_Mongo {
  return {
    _id: ObjectId.createFromHexString(__._id), //-- Changed --//
    created_at: new Date(__.created_at), //-- Changed --//
    last_edited: new Date(__.last_edited), //-- Changed --//
    api_provider_name: __.api_provider_name,
    model_developer_name: __.model_developer_name,
    user_db_id: __.user_db_id,
    title: __.title,
    root_node_id: __.root_node_id,
    schema_version: __.schema_version,
    api_req_res_metadata: __.api_req_res_metadata,
    system_tags: __.system_tags,
    user_tags: __.user_tags,
  };
}
export function mongoize_conversations(
  conversations: IConversation[]
): IConversation_Mongo[] {
  return conversations.map((conversation) =>
    mongoize_conversation(conversation)
  );
}

//-- Message Nodes --//
export function mongoize_message_node(node: IMessageNode): IMessageNode_Mongo {
  const mongoizedNode: IMessageNode_Mongo = {
    _id: new ObjectId(node._id), //-- Changed --//
    conversation_id: new ObjectId(node.conversation_id), //-- Changed --//
    created_at: new Date(node.created_at), //-- Changed --//
    user_db_id: node.user_db_id,
    parent_node_id: node.parent_node_id,
    children_node_ids: node.children_node_ids,
    prompt: node.prompt,
    completion: node.completion,
  };

  return mongoizedNode;
}
export function mongoize_message_nodes(
  messageNodes: IMessageNode[]
): IMessageNode_Mongo[] {
  return messageNodes.map((node) => mongoize_message_node(node));
}
//-- ***** ***** ***** ***** De-Mongoize ***** ***** ***** ***** --//

//-- Conversations --//
export function demongoize_conversation(
  conversation: IConversation_Mongo
): IConversation {
  return {
    _id: conversation._id.toHexString(), //-- Changed --//
    created_at: conversation.created_at.toISOString(), //-- Changed --//
    last_edited: conversation.last_edited.toISOString(), //-- Changed --//
    api_provider_name: conversation.api_provider_name,
    model_developer_name: conversation.model_developer_name,
    user_db_id: conversation.user_db_id,
    title: conversation.title,
    root_node_id: conversation.root_node_id,
    schema_version: conversation.schema_version,
    api_req_res_metadata: conversation.api_req_res_metadata,
    system_tags: conversation.system_tags,
    user_tags: conversation.user_tags,
  };
}
export function demongoize_conversations(
  conversations: IConversation_Mongo[]
): IConversation[] {
  return conversations.map((conversation) =>
    demongoize_conversation(conversation)
  );
}

//-- Message Nodes --//
export function demongoize_message_node(
  message_node: IMessageNode_Mongo
): IMessageNode {
  return {
    _id: message_node._id.toString(), //-- Changed --//
    conversation_id: message_node.conversation_id.toString(), //-- Changed --//
    created_at: message_node.created_at.toISOString(), //-- Changed --//
    user_db_id: message_node.user_db_id,
    parent_node_id: message_node.parent_node_id,
    children_node_ids: message_node.children_node_ids,
    prompt: message_node.prompt,
    completion: message_node.completion,
  };
}
export function demongoize_message_nodes(
  messageNodes: IMessageNode_Mongo[]
): IMessageNode[] {
  return messageNodes.map(demongoize_message_node);
}
