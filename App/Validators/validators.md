### Create a validator and add it to a collection in MongoDB

- Prompt ChatGPT
- Template:

```txt
Can you build an ajv validator from these typescript interfaces? Just provide the validator - don't repeat the type interfaces please.
<<PASTE TYPE INTERFACES HERE>>
```

- 2023-04-20 Example:

```js
import Ajv from "ajv";

const conversationSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "http://alb.chrt.com/conversation-schema-2023-04-20.json",
  title: "IConversation",
  type: "object",
  additionalProperties: false,
  required: [
    "conversation_uuid",
    "schema_version",
    "created_at",
    "message_order",
    "messages",
    "api_responses",
    "chatson_tags",
    "user_tags",
  ],
  properties: {
    conversation_uuid: {
      type: "string",
      format: "uuid",
    },
    schema_version: {
      type: "string",
    },
    created_at: {
      type: "string",
      format: "date-time",
    },
    message_order: {
      type: "object",
      additionalProperties: {
        type: "object",
        additionalProperties: {
          type: "string",
          format: "uuid",
        },
      },
    },
    messages: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: {
          message_uuid: {
            type: "string",
            format: "uuid",
          },
          author: {
            type: "string",
          },
          model: {
            type: "object",
            properties: {
              api_name: {
                type: "string",
              },
              friendly_name: {
                type: "string",
              },
              description: {
                type: "string",
              },
            },
            required: ["api_name", "friendly_name", "description"],
          },
          created_at: {
            type: "string",
            format: "date-time",
          },
          role: {
            type: "string",
            enum: ["user", "system", "assistant"],
            description: "roles defined by OpenAI SDK",
          },
          message: {
            type: "string",
          },
        },
        required: [
          "message_uuid",
          "author",
          "model",
          "created_at",
          "role",
          "message",
        ],
      },
    },
    api_responses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          model: {
            type: "object",
            properties: {
              api_name: {
                type: "string",
              },
              friendly_name: {
                type: "string",
              },
              description: {
                type: "string",
              },
            },
            required: ["api_name", "friendly_name", "description"],
          },
          response: {
            type: "object",
          },
        },
        required: ["model", "response"],
      },
    },
    chatson_tags: {
      type: "array",
      items: {
        type: "string",
      },
    },
    user_tags: {
      type: "array",
      items: {
        type: "string",
      },
    },
  },
};

const ajv = new Ajv({ allErrors: true });
const validateConversation = ajv.compile(conversationSchema);
```
