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
        const qry_total_trades = await knex("tradingdata02")
          .countDistinct("trade_uuid as total_trades")
          .where("user_db_id", user_db_id);
        const total_trades = qry_total_trades[0].total_trades;

        const qry_total_symbols = await knex("tradingdata02")
          .countDistinct("symbol as symbols")
          .where("user_db_id", user_db_id);
        const total_symbols = qry_total_symbols[0].symbols;

        const qry_total_types = await knex("tradingdata02")
          .countDistinct("trade_type as total_types")
          .where("user_db_id", user_db_id);
        const total_types = qry_total_types[0].total_types;

        return res.status(200).json({
          total_trades: total_trades,
          total_symbols: total_symbols,
          total_types: total_types,
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
    return res.status(500).send("error message while trying to beep boop");
  }
};
