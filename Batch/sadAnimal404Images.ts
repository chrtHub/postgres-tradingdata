//-- AWS client(s) --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

import { S3Client } from "@aws-sdk/client-s3";
import {
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

//-- NPM Functions --//
import axios from "axios";
import * as retry from "async-retry";
import { Configuration, OpenAIApi } from "openai";

//-- Utility Functions --//

//-- Types --//

//-- AWS Client(s) config --//
const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});
const s3_client = new S3Client({
  region: "us-east-1",
});

console.log("----- before main -----"); // DEV

async function main() {
  console.log("----- main -----"); // DEV
  //-- Get OpenAPI API Key from AWS Secrets Manager --//
  const getOpenAI_API_Key = async () => {
    let OPENAI_API_KEY: string = "";
    console.log("----- getOpenAI_API_Key -----"); // DEV
    try {
      await retry(
        async () => {
          console.log("AWS Secrets Manager - fetching OpenAI API Key");
          let res = await secretsManager_client.send(
            new GetSecretValueCommand({
              SecretId: "OpenAI/APIKey/0tRy",
              VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
            })
          );

          //-- Parse Secret String in res as JSON --//
          if (res.SecretString) {
            const SecretStringJSON = JSON.parse(res.SecretString);

            //-- Set Open API Key value --//
            OPENAI_API_KEY = SecretStringJSON.OPENAI_API_KEY;
          } else {
            throw new Error("OpenAI SecretString is empty");
          }
        },
        {
          retries: 2,
          minTimeout: 1000,
          factor: 2,
        }
      );
    } catch (err) {
      console.log(err);
    }

    return OPENAI_API_KEY;
  };

  let OPENAI_API_KEY: string = await getOpenAI_API_Key();
  const configuration = new Configuration({
    apiKey: OPENAI_API_KEY,
  });
  const OpenAIClient = new OpenAIApi(configuration);

  let styles = [
    "claymation",
    "award winning 4K photography",
    "flat art",
    "geometric",
    "anime",
    "minimalism",
    "3D illustration",
    "futurism",
    "synthwave",
    "vector",
  ];
  let animals = [
    "dog",
    "cat",
    "squirrel",
    "cow",
    "koala bear",
    "penguin",
    "sloth",
  ];
  let emotions = [
    "sad",
    "perplexed",
    "confused",
    "disappointed",
    "frustrated",
    "furious",
    "irritated",
  ];

  //-- End index --//
  // let styleLoopStopper = 1;
  // let animallLoopStopper = 1;
  // let emotionLoopStopper = 2;

  let styleLoopStopper = styles.length;
  let animallLoopStopper = animals.length;
  let emotionLoopStopper = emotions.length;

  //-- Function Loops --//
  for (let emotionIdx = 0; emotionIdx < emotionLoopStopper; emotionIdx++) {
    let emotion = emotions[emotionIdx];

    for (let animalIdx = 0; animalIdx < animallLoopStopper; animalIdx++) {
      let animal = animals[animalIdx];

      for (let styleIdx = 1; styleIdx < styleLoopStopper; styleIdx++) {
        let style = styles[styleIdx];

        const bucket = "sad-animal-404-images";
        const key = `${style}/${animal}/${emotion}`;
        console.log(
          `about to create image for ${style}, ${animal}, ${emotion}`
        );
        try {
          await retry(
            async () => {
              //-- Call OpenAI API to Generate Image --//
              const response = await OpenAIClient.createImage({
                prompt: `a cute ${animal} that is feeling ${emotion} because its computer crashed, ${style}`,
                n: 1,
                size: "512x512",
                response_format: "b64_json",
              });
              let base64JSON = response.data.data[0].b64_json;

              console.log("saving to s3");
              //-- Upload to S3 --//
              if (base64JSON) {
                try {
                  await retry(
                    async () => {
                      let base64Buffer = Buffer.from(base64JSON!, "base64"); //-- Non-null assertion --//
                      await s3_client.send(
                        new PutObjectCommand({
                          Body: base64Buffer,
                          Bucket: bucket,
                          Key: key,
                        })
                      );
                    },
                    {
                      retries: 2,
                      minTimeout: 1000,
                      factor: 2,
                    }
                  );
                  console.log("success!");
                } catch (error) {
                  console.log("s3 error");
                  console.log(error);
                }
              }
              //----//
            },
            {
              retries: 1,
              minTimeout: 1000,
              factor: 2,
            }
          );
        } catch (err) {
          console.log("generate image error");
          console.log(err);
        }
      }
    }
  }
}

main().catch((err) => console.error(err));
