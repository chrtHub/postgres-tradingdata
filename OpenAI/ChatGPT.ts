//-- AWS Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

//-- OpenAI package --//
import { Configuration, OpenAIApi } from "openai";

//-- Get OpenAI API Key from AWS Secrets Manager --//
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});

let OPENAI_API_KEY: string;

async function getOpenAI_API_Key() {
  try {
    const res = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId: "OpenAI/APIKey/0tRy",
        //-- VersionStage defaults to AWSCURRENT if unspecified --//
        VersionStage: "AWSCURRENT",
      })
    );
    //-- Parse Secret String in res as JSON --//
    if (res.SecretString) {
      const SecretStringJSON = JSON.parse(res.SecretString);
      //-- Set Open API Key value --//
      OPENAI_API_KEY = SecretStringJSON.OPENAI_API_KEY;
    }
    //----//
  } catch (error) {
    console.log(error);
  }
}

//-- Call OpenAI API --//
async function openAI_API_Call() {
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  //-- List Models --//
  // const res = await openai.listEngines();
  // console.log(res.data.data);

  //-- Retrieve Model --//
  // const res = await openai.retrieveModel("text-davinci-003");
  // console.log(res.data);

  //-- Create Completion --//
  // const res = await openai.createCompletion({
  //   model: "text-davinci-003",
  //   prompt: "Say hello world",
  //   max_tokens: 100,
  //   temperature: 0.5,
  // });
  // console.log(res.data);

  //-- Create Chat Completion --//

  const CODE = `router.get("/dashboard/pl_last_45_calendar_days", ctrl.plLast45CalendarDays);

//-- Days --//
router.get("/trade_uuids_by_date/:date", ctrl.tradeUUIDsByDate);

//-- Trades --//
router.get(
  "/trade_summary_by_trade_uuid/:trade_uuid",
  ctrl.tradeSummaryByTradeUUID
);

//-- Txns --//
router.get("/txns_by_trade_uuid/:trade_uuid", ctrl.txnsByTradeUUID);
`;

  const res = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: `Are there errors in this code? ${CODE}` },
    ],
  });
  console.log(JSON.stringify(res.data, null, 2));
}

await getOpenAI_API_Key();
await openAI_API_Call();
