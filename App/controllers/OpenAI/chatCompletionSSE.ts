//-- MongoDB Client --//
import { Mongo, MongoClient } from "../../../index.js";

//-- OpenAI Client --//
import { getOpenAI_API_Key } from "../../config/OpenAIConfig.js";
import { tiktoken } from "../chatson/tiktoken.js";

//-- Node Functions --//
import { Readable } from "stream";

//-- TypeScript Functions --//
import { RESPONSE_BUFFERS, TOKEN_LIMITS } from "../chatson/chatson_vals.js";

//-- NPM Functions --//
import axios from "axios";
import produce from "immer";
import { createParser } from "eventsource-parser";
import retry from "async-retry";

//-- Utility Functions --//
import getUserDbId from "../../utils/getUserDbId.js";
import { createConversation } from "../chatson/createConversation.js";
import {
  mongoize_conversation,
  mongoize_message_node,
  demongoize_message_nodes,
} from "../chatson/mongoize.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import {
  IAPIReqResMetadata,
  IMessage,
  IConversation,
  IChatCompletionRequestBody_OpenAI,
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  IMessageNode,
  APIProviderNames,
  ModelDeveloperNames,
} from "../chatson/chatson_types.js";
import { ObjectId } from "mongodb";
import { getSHA256Hash } from "../../utils/getSHA256Hash.js";
class ErrorForClient extends Error {}

//-- Steps --//
//== (1) get request data, check prompt + LLM params against limits ==//
//== (2) create conversation. or fetch existing conversation + messages + root node ==//
//== (3) create new message node ==//
//== (4) build request messages ==//
//== (5) set and send headers ==//
//== (6) start SSE request ==//
//== (7) on each data event, parse data and send to client ==//
//== (8) on [DONE] event, build full completion and req_res_metadata objects and send to client ==//
//== (9) for new conversations, insert conversation, root node, and new message node ==//
//== (10) for existing conversations, update conversation and parent node, insert new message node ==//

//-- ***** ***** ***** Chat Completions SSE ***** ***** ***** --//
export const chatCompletionsSSE = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //-- Accumulate completion in an array --//
  const completion_chunks: string[] = [];

  //-- Abort Controller for aborting outbound request to OpenAI LLM --//
  const controller = new AbortController();
  controller.signal.addEventListener("abort", () => {
    console.log("aborting SSE request to OpenAI"); // DEV
    if (completion_chunks.length > 0) {
      completionDoneHandler();
    }
  });

  //-- Detect abort signal (or other closures) --//
  res.on("close", () => {
    console.log("client closed response connection"); // DEV
    controller.abort();
  });

  //== (1) get request data, check prompt + LLM params against limits ==//
  //-- Constants based on route --//
  const api_provider_name: APIProviderNames = "openai";
  const model_developer_name: ModelDeveloperNames = "openai";

  //-- Constants based on request --//
  const user_db_id = getUserDbId(req);
  const body: IChatCompletionRequestBody_OpenAI = req.body;
  const { prompt } = body;
  const model = prompt.model;
  const incomingPromptTokens = tiktoken(prompt.content);

  //-- Check token count against token limit --//
  const tokenLimit = TOKEN_LIMITS[prompt.model.model_api_name];
  if (incomingPromptTokens > tokenLimit) {
    return res
      .status(400)
      .send(
        `Prompt was too long: ${incomingPromptTokens} tokens (Limit ${tokenLimit})`
      );
  }

  //-- Existing conversation if conversation_id_string && parent_node_id_string. Else new. --//
  let { conversation_id_string, parent_node_id_string } = body;
  let conversation_id: string | null = null;
  let parent_node_id: string | null = null;
  let new_conversation: boolean = false;
  if (conversation_id_string && parent_node_id_string) {
    conversation_id = conversation_id_string;
    parent_node_id = parent_node_id_string;
  } else {
    new_conversation = true;
  }

  //-- LLM Parameters (just temperature for now) --//
  let { temperature } = body;
  if (temperature) {
    if (temperature < 0) {
      temperature = 0;
    } else if (temperature > 2) {
      temperature = 2;
    }
  }

  //== (2) create conversation. or fetch existing conversation + messages + root node ==//
  let conversation: IConversation;
  let existing_conversation_message_nodes: IMessageNode[] = [];
  let root_node: IMessageNode | null = null;
  if (!conversation_id || !parent_node_id) {
    //-- Create new conversation --//
    let response = createConversation(
      user_db_id,
      model,
      api_provider_name,
      model_developer_name,
      null
    );
    conversation_id = response.conversation_id;
    parent_node_id = response.root_node_id;
    conversation = response.conversation;
    root_node = response.root_node;
  } else {
    //-- Fetch conversation --//
    try {
      await retry(
        async () => {
          if (!conversation_id) {
            return res.status(400).send(`missing conversation_id`);
          }
          let response = await Mongo.conversations.findOne({
            _id: ObjectId.createFromHexString(conversation_id),
            user_db_id: user_db_id, //-- Security --//
          });
          if (response) {
            conversation = {
              _id: response._id.toHexString(),
              created_at: response.created_at.toISOString(),
              last_edited: response.last_edited?.toISOString(),
              api_provider_name: response.api_provider_name,
              model_developer_name: response.model_developer_name,
              user_db_id: response.user_db_id,
              title: response.title,
              root_node_id: response.root_node_id,
              schema_version: response.schema_version,
              api_req_res_metadata: response.api_req_res_metadata,
              system_tags: response.system_tags,
              user_tags: response.user_tags,
            };
          } else {
            return res
              .status(400)
              .send(
                `no conversation found for conversation_id: ${conversation_id}`
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
      return res
        .status(500)
        .send("error finding conversation, please try again");
    }
    //-- Fetch messages --//
    try {
      await retry(
        async () => {
          if (!conversation_id) {
            return res.status(400).send(`missing conversation_id`);
          }
          let response = await Mongo.message_nodes
            .find(
              {
                conversation_id: ObjectId.createFromHexString(conversation_id),
                user_db_id: user_db_id, //-- Security --//
              }
              //-- NOTE - tradeoffs here. Currently choosing (a). --//
              //-- (a) always fetching all message nodes incurs perfomance cost for fetching large conversations --//
              //-- (b) compound index on {conversation_id: 1, created_at: -1} with numerical limit per fetch results in potentially missing conversation context for a highly-branched conversation which needs to have a message with an old created_at that puts it beyond the fetch limit--//
            )
            .toArray();
          if (response) {
            //-- set existing_conversation_message_nodes --//
            existing_conversation_message_nodes =
              demongoize_message_nodes(response);
          } else {
            return res
              .status(400)
              .send(
                `no messages found for conversation_id: ${conversation_id}`
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
      return res
        .status(500)
        .send(
          `error fetching messages for conversation_id: ${conversation_id}, please try again`
        );
    }
    //-- Find root_node (for existing conversations) --//
    let response = existing_conversation_message_nodes.find(
      (message_node) => message_node._id === conversation.root_node_id
    );
    if (response) {
      root_node = response; //-- Set root_node --//
    } else {
      return res
        .status(400)
        .send(
          `root message node not found for conversation_id: ${conversation_id}`
        );
    }
  }

  //== (3) create new message node ==//
  let new_message_node: IMessageNode = {
    _id: new ObjectId().toHexString(),
    user_db_id: user_db_id,
    created_at: new Date(new Date().getTime() + 1).toISOString(), //-- 1 ms in the future to avoid collision with root node --//
    conversation_id: conversation_id,
    parent_node_id: parent_node_id,
    children_node_ids: [],
    prompt: prompt,
    completion: null,
  };

  //-- For new conversations only --//
  if (new_conversation) {
    //-- Update root_node by adding message_node to its children --//
    root_node = produce(root_node, (draft) => {
      draft.children_node_ids.push(new_message_node._id);
    });
  }

  //== (4) build request messages ==//
  //-- Start request_messages with system message + prompt --//
  let request_messages: ChatCompletionRequestMessage[] = [
    {
      role: root_node.prompt.role,
      content: root_node.prompt.content,
    },
    {
      role: new_message_node.prompt.role,
      content: new_message_node.prompt.content,
    },
  ];

  const request_messages_node_ids: string[] = [];
  request_messages_node_ids.push(new_message_node._id);
  let request_tokens: number = 0;
  request_tokens += tiktoken(root_node.prompt.content);
  request_tokens += tiktoken(new_message_node.prompt.content);

  //-- Create node_map for O(1) lookups inside the while loop --//
  let node_map: Record<string, IMessageNode> = {};
  existing_conversation_message_nodes.forEach((node) => {
    node_map[node._id] = node;
  });

  //-- For new conversation, request messages is ready. For !new_conversation, add up to 3k tokens of messages. Newest node was already added, start from its parent. --//
  if (!new_conversation && new_message_node.parent_node_id) {
    let node = node_map[new_message_node.parent_node_id];
    let tokenLimitHit: boolean = false;

    //-- Stop when root node reached (parent id will be null) or token limit hit --//
    while (node?.parent_node_id && !tokenLimitHit) {
      //-- Add completion if it exists --//
      let completion_content = node.completion?.content;
      if (completion_content) {
        let completionTokens: number = tiktoken(completion_content);
        if (
          request_tokens + completionTokens <
          TOKEN_LIMITS[prompt.model.model_api_name] -
            RESPONSE_BUFFERS[prompt.model.model_api_name]
        ) {
          let completion_request_message: ChatCompletionRequestMessage = {
            content: completion_content,
            role: "assistant",
          };
          request_messages.splice(1, 0, completion_request_message);
          request_tokens += completionTokens;
        } else {
          tokenLimitHit = true;
        }
      }

      //-- Add prompt --//
      let prompt_content = node.prompt.content;
      let promptTokens = tiktoken(prompt_content);
      if (
        request_tokens + promptTokens <
        TOKEN_LIMITS[prompt.model.model_api_name] -
          RESPONSE_BUFFERS[prompt.model.model_api_name]
      ) {
        let prompt_request_message: ChatCompletionRequestMessage = {
          content: prompt_content,
          role: "user",
        };
        request_messages.splice(1, 0, prompt_request_message);
        request_tokens += promptTokens;
        request_messages_node_ids.push(node._id);
      }

      //-- Get the parent node --//
      node = node_map[node.parent_node_id.toString()];
    }
  }

  let api_req_res_metadata: IAPIReqResMetadata;

  //== (5) set and send headers ==//
  res.set({
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Content-Type": "text/event-stream",
    //-- Send headers with info for the IMessageNode --//
    // NOTE - could include completion object w/o content here
    "Access-Control-Expose-Headers":
      "CHRT-root-node-id, CHRT-root-node-created-at, CHRT-conversation-id, CHRT-new-node-id, CHRT-new-node-created-at, CHRT-parent-node-id",
    "CHRT-root-node-id": new_conversation ? root_node._id : "none",
    "CHRT-root-node-created-at": new_conversation
      ? root_node.created_at
      : "none",
    "CHRT-conversation-id": new_message_node.conversation_id,
    "CHRT-new-node-id": new_message_node._id,
    "CHRT-new-node-created-at": new_message_node.created_at,
    "CHRT-parent-node-id": new_message_node.parent_node_id,
  });
  //-- Send headers immediately (don't wait for first chunk or message end) --//
  res.flushHeaders();

  //== (6) start SSE request ==//
  //-- Axios Send Request Try --//
  try {
    //-- Get API Key --//
    let OPENAI_API_KEY = await getOpenAI_API_Key();

    //-- Reqeuest body --//
    const request_body: CreateChatCompletionRequest = {
      model: model.model_api_name,
      messages: request_messages,
      stream: true,
      user: await getSHA256Hash(user_db_id),
      temperature: temperature,
    };

    //-- Axios POST SSE request to OpenAI --//
    let response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      request_body,
      {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        responseType: "stream",
      }
    );

    //-- Create readable stream --//
    const readableStream = new Readable({
      read() {},
    });

    //-- Feed response.data to readableStream --//
    response.data.on("data", (chunk: any) => readableStream.push(chunk));
    response.data.on("end", () => readableStream.push(null));

    //-- Create text decoder (binary --> string) --//
    //-- UInt8Array | ArrayBuffer | Buffer --> UTF-8 (default) --//
    const textDecoder = new TextDecoder();

    //-- Create parser --//
    const parser = createParser(onParse);

    //-- Decode readableStream chunks and feed them to the parser --//
    readableStream.on("data", (chunk) => {
      parser.feed(textDecoder.decode(chunk));
    });

    //== (7) on each data event, parse data and send to client ==//
    let conversation_sent: boolean = false;
    async function onParse(event: any) {
      try {
        if (event.type === "event") {
          if (event.data !== "[DONE]") {
            //-- For new conversations, send conversation upon first event --//
            if (new_conversation && !conversation_sent) {
              let conversation_string = JSON.stringify(conversation);
              res.write(`id: conversation\ndata: ${conversation_string}\n\n`);
              conversation_sent = true;
            }

            //-- Get data from event --//
            let data = JSON.parse(event.data).choices[0].delta?.content || "";

            //-- Add chunk to response chunks (to be accessed post-stream) --//
            completion_chunks.push(data);

            //-- URI Encode to avoid content and delimeter `\n\n` collisions --//
            const uriEncodedData = encodeURI(data);

            //-- Send data to the client --//
            res.write(`data: ${uriEncodedData}\n\n`);
            //----//
          }
          //== (8) on [DONE] event, build full completion and req_res_metadata objects and send to client ==//
          else if (event.data === "[DONE]") {
            console.log("[DONE]"); // DEV
            completionDoneHandler();
          }
        } else if (event.type === "reconnect-interval") {
          console.log("%d milliseconds reconnect interval", event.value); // TODO - how to handle this? is a retry needed?
        }
      } catch (err) {
        //-- onParse Catch --//
        console.log(err); // TODO - what to do here?
      }
    } //-- end of onParse function --//
    //----//
  } catch (err) {
    if (err instanceof Error) {
      //-- Axios Send Request Catch --//
      res.write(
        `id: error\ndata: ${JSON.stringify({
          message: `LLM request failed, please try again`,
        })}\n\n` // DEV - perhaps this one can be non res.write??
      );
    }
    res.end(); //-- Close connection --//
  }

  //-- ***** ***** ***** Completion Done Handler ***** ***** ***** --//
  const completionDoneHandler = async () => {
    console.log("completionDoneHandler"); // DEV
    //-- Build completion --//
    const completion_content = completion_chunks.join("");
    const completion_tokens = tiktoken(completion_content.toString());
    const completion_created_at = new Date().toISOString();
    const completion: IMessage = {
      author: model.model_api_name,
      model: model,
      created_at: completion_created_at,
      role: "assistant",
      content: completion_content,
    };

    //-- Send completion to client --//
    const completion_string = JSON.stringify(completion);
    res.write(`id: completion\ndata: ${completion_string}\n\n`);

    //-- Update new_message_node by adding completion --//
    new_message_node = produce(new_message_node, (draft) => {
      draft.completion = completion;
    });

    //-- Update api_req_res_metadata --//
    let api_req_res_metadata_date = new Date();
    api_req_res_metadata = {
      user: user_db_id,
      model_api_name: model.model_api_name,
      params: {
        temperature: temperature,
      },
      created_at: api_req_res_metadata_date.toISOString(),
      request_tokens: request_tokens,
      completion_tokens: completion_tokens,
      total_tokens: request_tokens + completion_tokens,
      node_id: new_message_node._id,
      request_messages_node_ids: request_messages_node_ids,
    };

    //-- Send api_req_res_metatdata to client --//
    const api_req_res_metadata_string = JSON.stringify(api_req_res_metadata);
    res.write(
      `id: api_req_res_metadata\ndata: ${api_req_res_metadata_string}\n\n`
    );

    //-- Start MongoClient session to use for transactions --//
    const mongoSession = MongoClient.startSession({
      causalConsistency: false,
    });

    //== (9) for new conversations, insert conversation, root node, and new message node ==//
    if (new_conversation) {
      //-- Before inserting conversation, update (a) api_req_res_metadata, (b) last_edited --//
      conversation = produce(conversation, (draft) => {
        draft.api_req_res_metadata.push(api_req_res_metadata);
        draft.last_edited = api_req_res_metadata_date.toISOString();
      });
      try {
        await retry(
          async () => {
            //-- Start Transaction --//
            mongoSession.startTransaction();

            //-- Transaction function --//
            const transaction = async () => {
              //-- (1/3) Insert conversation --//
              await Mongo.conversations.insertOne(
                mongoize_conversation(conversation),
                { session: mongoSession }
              );

              //-- (2/3) Insert root_node --//
              await Mongo.message_nodes.insertOne(
                mongoize_message_node(root_node!), //-- Non-Null Assertion --//
                { session: mongoSession }
              );

              //-- (3/3) Insert new_message_node --//
              await Mongo.message_nodes.insertOne(
                mongoize_message_node(new_message_node),
                { session: mongoSession }
              );
            };
            //-- Execute transaction --//
            await transaction();

            //-- Commit transaction --//
            await mongoSession.commitTransaction();
          },
          {
            retries: 2,
            minTimeout: 1000,
            factor: 2,
            onRetry: async () => {
              if (mongoSession.inTransaction()) {
                await mongoSession.abortTransaction();
              }
            },
          }
        );
        console.log("new conversation stored in MongoDB"); // DEV
        //----//
      } catch (err) {
        //-- Abort transaction --//
        await mongoSession.abortTransaction();
        res.write(
          `id: error\ndata: ${JSON.stringify({
            message:
              "error saving new conversation and messages, please open a new conversation and submit the prompt again",
          })}\n\n`
        );
      } finally {
        //-- End MongoClient session --//
        await mongoSession.endSession();
      }
    }
    //== (10) for existing conversations, update conversation and parent node, insert new message node ==//
    else {
      try {
        await retry(
          async () => {
            //-- Start Transaction --//
            mongoSession.startTransaction();

            //-- Transaction function --//
            const transaction = async () => {
              //-- (1/3) Update conversation with api_req_res_metadata --//
              await Mongo.conversations.updateOne(
                {
                  _id: ObjectId.createFromHexString(
                    new_message_node.conversation_id
                  ),
                },
                {
                  $addToSet: {
                    api_req_res_metadata: api_req_res_metadata,
                  },
                  $set: { last_edited: api_req_res_metadata_date },
                },
                { session: mongoSession }
              );

              //-- (2/3) Update parent node's children_node_ids --//
              await Mongo.message_nodes.updateOne(
                {
                  _id: ObjectId.createFromHexString(parent_node_id!),
                }, //-- Non-Null Assertion --//
                {
                  $addToSet: {
                    children_node_ids: new_message_node._id,
                  },
                },
                { session: mongoSession }
              );

              //-- (3/3) Insert new_message_node --//
              await Mongo.message_nodes.insertOne(
                mongoize_message_node(new_message_node),
                { session: mongoSession }
              );
            };
            //-- Execute transcation --//
            await transaction();

            //-- Commit transaction --//
            await mongoSession.commitTransaction();
          },
          {
            retries: 2,
            minTimeout: 1000,
            factor: 2,
            onRetry: async () => {
              if (mongoSession.inTransaction()) {
                await mongoSession.abortTransaction();
              }
            },
          }
        );
        console.log("existing conversation updated in MongoDB"); // DEV
        //----//
      } catch (err) {
        //-- Abort transaction, end session --//
        await mongoSession.abortTransaction();
        res.write(
          `id: error\ndata: ${JSON.stringify({
            message:
              "error saving new messages, please submit the prompt again",
          })}\n\n`
        );
      } finally {
        //-- End MongoClient session --//
        await mongoSession.endSession();
      }
    }

    //-- Close connection (end of event.data === "[DONE]" section) --//
    res.end();
  };
};
