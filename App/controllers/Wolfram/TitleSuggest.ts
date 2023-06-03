//-- AWS client(s) --//

//-- Database Clients --//
import { knex } from "../../../index";
import { Mongo } from "../../../index.js";
import axios from "axios";
import retry from "async-retry";

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../../../App/utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";

//-- ********************* Some Controller ********************* --//
export const TitleSuggest = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);
  console.log(user_db_id); // DEV

  const body: { prompt: string } = req.body;
  const { prompt } = body;

  if (!prompt) {
    return res.status(400).send("Missing title param");
  }

  try {
    await retry(
      async () => {
        // TODO - run the Wolfram Language LLMFunction "TitleSuggest"
        return res.status(200).json({ title: "todo" });
      },
      {
        retries: 1,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send("error message while trying to beep boop");
  }
};
