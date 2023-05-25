//-- MongoDB Client --//
import { Mongo, MongoClient } from "../../index.js";

//-- OpenAI Client --//
import { getOpenAI_API_Key } from "../config/OpenAIConfig.js";
import { tiktoken } from "./chatson/tiktoken.js";

//-- Node Functions --//
import { Readable } from "stream";

//-- NPM Functions --//
import axios from "axios";
import produce from "immer";
import { createParser } from "eventsource-parser";
import retry from "async-retry";

//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import { createConversation } from "./chatson/createConversation.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";
import {
  IAPIReqResMetadata,
  IMessage,
  IConversation,
  IChatCompletionRequestBody_OpenAI,
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  IMessageNode,
  IMessageNode_Mongo,
  APIProviderNames,
  ModelDeveloperNames,
  ModelAPINames,
  TokenLimit,
} from "./chatson/chatson_types.js";
import { ObjectId } from "mongodb";
import { getSHA256Hash } from "../utils/getSHA256Hash.js";
import {
  mongoize_conversation,
  mongoize_message_node,
  demongoize_message_nodes,
  demongoize_conversation,
  demongoize_message_node,
} from "./chatson/mongoize.js";

//-- Outline --//
// (1) Receive:
// // interface IChatCompletionRequestBody {
// //   prompt: IMessage;
// //   conversation_id_string: string | null;
// //   parent_node_id_string: string | null;
// // }

// (2a) New conversation
// // create a new conversation
// (2b) Existing conversation:
// // fetch conversation from MongoDB by conversation_id

// // // TODO - check if conversation has a lock on it. if so, fail request and send error to client. notify client that the conversation can only have a single prompt at a time. if no lock, set a lock (TTL 60 seconds) and proceed.

// // fetch message nodes from MongoDB by conversation_id
// // find root node

// (3) Create new message node based on received prompt, leaving completion as null

// (4a) New conversation
// // add new node's id to root node's children ids array
// // write conversation object to MongoDB

// // // TODO - lock conversation

// // write root node to MongoDB
// (4b) Existing conversation
// // write new node's id to parent node's children ids array in MongoDB

// (5) create request_messages array
// // start with root node prompt content (system message) and new nodes's prompt content
// // // count tokens for each message, add to token count
// // traverse each parent node, adding the completion and the prompt, stopping at the root node or 3k tokens
// // // count tokens for each message, add to token count

// (6) Set headers, send to client. Make POST request to LLM. Create a readable stream and call parser for each received chunk.

// (7a) New conversation - on first received chunk
// // send the conversation object to the client

// (7b) All conversations - on each chunk
// // push the chunks content onto the completion_chunks string to be sent on [DONE]
// // URI encode the chunk's content and write it to the client

// (8) On the "[DONE]" event, handle the completion object:
// // build the completion object including the concatenated completion_chunks, its token count, and the creation time
// // add the completion object to the new_message_node
// // write the new_message_node to the MongoDB
// // send the completion object to the client

// (9) Also on the "[DONE]" event, handle the api_req_res_metadata object:
// // build the api_req_res_metatdata object
// // write the api_req_res_metatdata object to the conversation's api_req_res_metatdata array in MongoDB
// // send the api_req_res_metatdata object to the client

// // // TODO - delete the lock on the conversation. send event to client to inform client. client-side use that event to allow another submission.

// (10) Close the SSE connection to the client.

class ErrorForClient extends Error {}

//-- ***** ***** ***** Titles ***** ***** ***** --//
export const createTitleController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  console.log("----- createTitle -----");

  //-- Get data from params --//
  let { conversation_id } = req.body;
  let user_db_id = getUserDbId(req);
  console.log("conversation_id: ", conversation_id); // DEV

  let new_title: string = "TODO - new title";

  try {
    let message_node: IMessageNode_Mongo[] = await Mongo.message_nodes
      .find({
        conversation_id: ObjectId.createFromHexString(conversation_id),
        user_db_id: user_db_id, //-- Security --//
      })
      .sort({ created_at: -1 })
      .limit(1)
      .toArray();

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
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .send("Error calling LLM to create title, please try again");
    }

    //-- Clean up --//
    //-- Remove quotation marks from start and end --//
    new_title = new_title.replace(/^"|"$/g, "");

    //-- Enforce title max length 60 chars. If char 60 is whitespace, remove it. --//
    if (new_title.length > 60) {
      new_title = new_title.substring(0, 60).trim();
      if (new_title.endsWith(" ")) {
        new_title = new_title.substring(0, new_title.length - 1);
      }
      new_title += "...";
    }
    try {
      await Mongo.conversations.updateOne(
        {
          _id: ObjectId.createFromHexString(conversation_id),
          user_db_id: user_db_id, //-- security --//
        },
        { $set: { title: new_title } }
      );
      return res.status(200).send(`title updated to: ${new_title}`);
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

//-- Token Limit per model --//
const BUFFER: number = 96;
const TOKEN_LIMITS: TokenLimit = {
  "gpt-3.5-turbo": 4096 - BUFFER,
  "gpt-4": 4096 - BUFFER,
  "gpt-4-32k": 0,
  claude: 0,
  "jurrasic-2": 0,
  "amazon-titan": 0,
  "google-palm-2": 0,
};

//-- ***** ***** ***** Chat Completions SSE ***** ***** ***** --//
export const chatCompletionsSSEController = async (
  req: IRequestWithAuth,
  res: Response
) => {
  //-- Controller Try --//
  try {
    //-- Cosntants based on route --//
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

    //-- Variables for on new/existing conversation --//
    let { conversation_id_string, parent_node_id_string, temperature } = body;

    //-- Other --//
    let conversation_id: string | null = null;
    let parent_node_id: string | null = null;
    let new_conversation: boolean = false;

    if (conversation_id_string && parent_node_id_string) {
      conversation_id = conversation_id_string;
      parent_node_id = parent_node_id_string;
    } else {
      new_conversation = true;
    }

    if (temperature) {
      if (temperature < 0) {
        temperature = 0;
      } else if (temperature > 2) {
        temperature = 2;
      }
    }

    //-- New or existing conversation? --//
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
            .send(`unknown conversation_id: ${conversation_id}`);
        }
      } catch (err) {
        console.log(err);
        return res
          .status(500)
          .send("error finding conversation, please try again");
      }
      //-- Fetch existing_conversation_nodes --//
      try {
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
            .send(`no messages found for conversation_id: ${conversation_id}`);
        }
      } catch (err) {
        console.log(err);
        return res
          .status(500)
          .send(
            `error fetching messages for conversation_id: ${conversation_id}, please try again`
          );
      }
      //-- Find root_node for existing conversations --//
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

    //-- Create new message_node --//
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

    //-- For new conversation  --//
    if (new_conversation) {
      //-- Update root_node by adding message_node to its children --//
      root_node = produce(root_node, (draft) => {
        draft.children_node_ids.push(new_message_node._id);
      });
    }

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

    //-- Build request_messages and request_message_node_ids. Count tokens. --//
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

          if (request_tokens + completionTokens < 3000) {
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
        if (request_tokens + promptTokens < 3000) {
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

    //-- Set headers --//
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
          // TODO - implement AbortController?
          // signal
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

      //-- Use array to save response to MongoDB when streaming finishes --//
      const completion_chunks: string[] = [];

      //-- Inside parser, send each chunk to the client, then close the connection --//
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
            } else if (event.data === "[DONE]") {
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

              //-- Start MongoClient session to use for transactions --//
              const mongoSession = MongoClient.startSession({
                causalConsistency: false,
              });

              //-- For new conversation  --//
              if (new_conversation) {
                try {
                  //-- Start Transaction --//
                  mongoSession.startTransaction();

                  //-- Bundle operations into async 'transact' function --//
                  const transact = async () => {
                    //-- Insert conversation --//
                    await Mongo.conversations.insertOne(
                      mongoize_conversation(conversation),
                      { session: mongoSession }
                    );

                    //-- Update api_req_res_metadata --//
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

                    //-- Insert root_node --//
                    await Mongo.message_nodes.insertOne(
                      mongoize_message_node(root_node!), //-- Non-Null Assertion --//
                      { session: mongoSession }
                    );

                    //-- Insert new_message_node --//
                    await Mongo.message_nodes.insertOne(
                      mongoize_message_node(new_message_node)
                    );

                    //-- Commit transaction --//
                    let res = await mongoSession.commitTransaction();
                    console.log(res);
                  };
                  await transact();
                  //----//
                } catch (err) {
                  //-- Abort transaction --//
                  mongoSession.abortTransaction();
                  throw new ErrorForClient(
                    "error saving new messages, please submit the prompt again"
                  );
                } finally {
                  //-- End MongoClient session --//
                  mongoSession.endSession();
                }
              } else {
                //-- Else for existing conversation --//
                try {
                  //-- Start Transaction --//
                  mongoSession.startTransaction();

                  //-- Bundle operations into async 'transact' function --//
                  const transact = async () => {
                    //-- Update parent node's children_node_ids --//
                    await Mongo.message_nodes.updateOne(
                      { _id: ObjectId.createFromHexString(parent_node_id!) }, //-- Non-Null Assertion --//
                      {
                        $addToSet: {
                          children_node_ids: new_message_node._id,
                        },
                      },
                      { session: mongoSession }
                    );

                    //-- Insert new_message_node --//
                    await Mongo.message_nodes.insertOne(
                      mongoize_message_node(new_message_node),
                      { session: mongoSession }
                    );

                    //-- Update conversation with api_req_res_metadata --//
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

                    //-- Commit transaction --//
                    let res = await mongoSession.commitTransaction();
                    console.log(res);
                  };
                  await transact();
                  //----//
                } catch (err) {
                  //-- Abort transaction, end session --//
                  mongoSession.abortTransaction();
                  throw new ErrorForClient(
                    "error saving new messages, please submit the prompt again"
                  );
                } finally {
                  //-- End MongoClient session --//
                  mongoSession.endSession();
                }
              }

              //-- Send api_req_res_metatdata to client --//
              const api_req_res_metadata_string =
                JSON.stringify(api_req_res_metadata);
              res.write(
                `id: api_req_res_metadata\ndata: ${api_req_res_metadata_string}\n\n`
              );

              //-- Close connection (end of event.data === "[DONE]" section) --//
              res.end();
            }
          } else if (event.type === "reconnect-interval") {
            console.log("%d milliseconds reconnect interval", event.value); // TODO - how to handle this? is a retry needed?
          }
        } catch (err) {
          //-- onParse Catch --//
          if (err instanceof ErrorForClient) {
            res.write(
              `id: error\ndata: ${JSON.stringify({
                message: `${err}`,
              })}\n\n`
            );
          }
        }
      } //-- end of onParse function --//
      //----//
    } catch (err) {
      //-- Axios Send Request Catch --//
      // DEV - perhaps this one can be non res.write??
      res.write(
        `id: error\ndata: ${JSON.stringify({
          message: `LLM request failed, please try again`,
        })}\n\n`
      );
      res.end(); //-- Close connection --//
    }
    //-- Controller Catch --//
  } catch (err: any) {
    res.status(400);
  }
};
