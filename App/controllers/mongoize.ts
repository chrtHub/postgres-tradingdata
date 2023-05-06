import { IConversation, IMessageNode } from "./chatson_types";
import { ObjectId } from "mongodb";

/**
 * Converts ISO 8601 date strings to Date objects and ObjectId Hex Strings to ObjectId objects
 *
 * @param object
 */
export function mongoize_conversation(conversation: IConversation) {
  const mongoizedConversation: any = { ...conversation };

  //-- _id --//
  mongoizedConversation._id = ObjectId.createFromHexString(conversation._id);

  //-- root_node_id --//
  mongoizedConversation.root_node_id = ObjectId.createFromHexString(
    conversation.root_node_id
  );

  //-- created_at --//
  mongoizedConversation.created_at = new Date(conversation.created_at);

  return mongoizedConversation;
}

function convertAPIReqResMetadata(
  metadata: IAPIReqResMetadata
): IAPIReqResMetadata {
  const mongoizedMetadata: IAPIReqResMetadata = { ...metadata };

  // Convert created_at to Date
  mongoizedMetadata.created_at = new Date(metadata.created_at);

  // Convert node_id to ObjectId
  mongoizedMetadata.node_id = ObjectId.createFromHexString(metadata.node_id);

  // Convert request_messages_node_ids to ObjectId[]
  mongoizedMetadata.request_messages_node_ids =
    metadata.request_messages_node_ids.map((nodeId) =>
      ObjectId.createFromHexString(nodeId)
    );

  return mongoizedMetadata;
}

/**
 * Converts ISO 8601 date strings to Date objects and ObjectId Hex Strings to ObjectId objects
 *
 * @param object
 */
function mongoize_message_node(messageNode: IMessageNode) {
  const mongoizedMessageNode: any = { ...messageNode };

  //-- _id --//
  mongoizedMessageNode._id = ObjectId.createFromHexString(messageNode._id);

  //-- created_at --//
  mongoizedMessageNode.created_at = new Date(messageNode.created_at);

  //-- conversation_id --//
  mongoizedMessageNode.conversation_id = ObjectId.createFromHexString(
    messageNode.conversation_id
  );

  //-- parent_node_id --//
  if (messageNode.parent_node_id) {
    mongoizedMessageNode.parent_node_id = ObjectId.createFromHexString(
      messageNode.parent_node_id
    );
  }

  //-- children_node_ids[] --//
  if (
    Array.isArray(messageNode.children_node_ids) &&
    messageNode.children_node_ids.length > 0
  ) {
    mongoizedMessageNode.children_node_ids = messageNode.children_node_ids.map(
      (nodeId) => ObjectId.createFromHexString(nodeId)
    );
  }

  //-- Prompt (IMessage) created_at --//
  if (mongoizedMessageNode.prompt && mongoizedMessageNode.prompt.created_at) {
    mongoizedMessageNode.prompt.created_at = new Date(
      mongoizedMessageNode.prompt.created_at
    );
  }

  //-- Completion (IMessage) created_at --//
  if (
    mongoizedMessageNode.completion &&
    mongoizedMessageNode.completion.created_at
  ) {
    mongoizedMessageNode.completion.created_at = new Date(
      mongoizedMessageNode.completion.created_at
    );
  }

  return mongoizedMessageNode;
}
