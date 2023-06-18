//-- Clients --//
import { knex } from "../../../../index.js";
import { Mongo, MongoClient } from "../../../../index.js";
import axios from "axios";
import retry from "async-retry";

//-- TypeScript --//

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../../../../App/utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../../Types/index.js";
import { ILayoutsOption } from "../Types/journal_types.js";

//-- Data --//

//-- ********************* getLayoutsOptions ********************* --//
export const getLayoutsOptions = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_db_id = getUserDbId(req);

  try {
    await retry(
      async () => {
        // TODO - get user's layouts options from MongoDB
        // let layouts_options: LayoutsOption[] = await Mongo.layouts_options
        //   .find({ user_db_id: user_db_id }) //-- SECURITY --//
        //   .toArray();
        // console.log(layouts_options) // DEV
        // return res.json(layouts_options)
        return res.status(200).send(`getLayoutsOptions, ${user_db_id}`); // DEV
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
      .send("error message while trying to get layouts options");
  }
};

//-- ********************* postLayoutsOptions ********************* --//
export const postLayoutsOptions = async (
  req: IRequestWithAuth,
  res: Response
) => {
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
        // TODO - post user's layouts options to MongoDB
        // return res.json(data)
        return res.status(200).send(`postLayoutsOptions, ${user_db_id}`); // DEV
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
      .send("error message while trying to post layouts options");
  }
};

//-- ********************* postLayoutsOptions ********************* --//
export const deleteLayoutsOptions = async (
  req: IRequestWithAuth,
  res: Response
) => {
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
        // TODO - delete one of user's layouts options from MongoDB
        // return res.json(data)
        return res.status(200).send(`deleteLayoutsOptions, ${user_db_id}`); // DEV
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
      .send("error message while trying to post layouts options");
  }
};
