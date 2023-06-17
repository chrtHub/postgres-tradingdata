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

//-- Data --//

//-- ********************* Controller ********************* --//
export const statsAllTime = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);

  try {
    await retry(
      async () => {
        const result = await knex("tradingdata02").count(
          "trade_uuid as total_trades"
        );
        const totalTrades = result[0].total_trades;
        return res.status(200).json({ totalTrades: totalTrades });
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
