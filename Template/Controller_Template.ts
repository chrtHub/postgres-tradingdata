//-- Clients --//
import { knex } from "../index.js";
import { Mongo, MongoClient } from "../index.js";
import axios from "axios";
import retry from "async-retry";

//-- TypeScript --//

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../App/utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../Types/index.js";

//-- Data --//

//-- ********************* Controller ********************* --//
export const some_Function = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);
  let { foo } = req.params; // for route like 'some_route/:foo'
  const body: { title: string } = req.body;
  const { title } = body;

  if (!foo) {
    return res.status(400).send("Missing foo param");
  }

  try {
    await retry(
      async () => {
        // axios, knex, or mongo call
        // return res.json(data)
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
