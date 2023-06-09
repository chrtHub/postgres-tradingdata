//-- AWS client(s) --//

//-- Database Clients --//
import { knex } from "../../../index";
import { Mongo, MongoClient } from "../../../index.js";
import axios from "axios";
import retry from "async-retry";

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../../../App/utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../index.d";

//-- ********************* Some Controller ********************* --//
export const checkClickwrapStatus = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_db_id = getUserDbId(req);

  try {
    await retry(
      async () => {
        let clickwrapUserStatus = await Mongo.clickwrapUserStatus.findOne({
          user_db_id: user_db_id,
        });
        return res.status(200).json(clickwrapUserStatus);
      },
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send("error checking agreements status");
  }
};
