//-- AWS client(s) --//

//-- knex client --//
import axios from "axios";
import retry from "async-retry";

//-- NPM Functions --//

//-- Utility Functions --//

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";
import { OpenAIClient } from "../../../index.js";

//-- ********************* Some Controller ********************* --//
export const createImage = async (req: IRequestWithAuth, res: Response) => {
  console.log("----- createImage -----");
  //   let { foo } = req.params; // for route like 'some_route/:foo'

  //   if (!foo) {
  //     return res.status(400).send("Missing foo param");
  //   }

  //-- Ad lib inputs --//
  let animal = [
    "dog",
    "cat",
    "puppy",
    "kitten",
    "bear",
    "cow",
    "squirrel",
    "koala bear",
    "penguin",
    "sloth",
  ];
  let emotion = [
    "worried",
    "nervous",
    "perplexed",
    "confused",
    "disappointed",
    "jealous",
    "frustrated",
    "anxious",
    "sad",
    "furious",
  ];
  let style = [
    "realism",
    "minimalism",
    "retro/vintage",
    "lettering",
    "geometric",
    "flat art",
    "3D illustration",
    "surrealism",
    "psychedelic",
  ];

  let selectedAnimal = animal[Math.floor(Math.random() * animal.length)];
  let selectedEmotion = emotion[Math.floor(Math.random() * emotion.length)];
  let selectedStyle = style[Math.floor(Math.random() * style.length)];

  try {
    await retry(
      async () => {
        const response = await OpenAIClient.createImage({
          prompt: `a cute ${selectedAnimal} that is feeling ${selectedEmotion} because its computer crashed, ${selectedStyle}`,
          n: 1,
          size: "512x512",
          response_format: "b64_json",
        });
        let base64JSON = response.data.data[0].b64_json;
        res.status(200).json({
          animal: selectedAnimal,
          emotion: selectedEmotion,
          style: selectedStyle,
          base64JSON: base64JSON,
        });
      },
      {
        retries: 1,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error generating image, please try again");
  }
};
