//-- Clients --//
import { knex } from "../../../../index.js";
import retry from "async-retry";

//-- TypeScript --//

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../../../../App/utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../../Types/index.js";

//-- Data --//

//-- ********************* txnsByTradeUUID ********************* --//
export const txnsByTradeUUID = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);
  let { trade_uuid } = req.params;

  if (!trade_uuid || trade_uuid === "null") {
    return res.status(400).send("Missing 'trade_uuid' param");
  }

  try {
    await retry(
      async () => {
        const rows = await knex
          .select(
            "uuid",
            "brokerage",
            "filename",
            "import_timestamp",
            "import_uuid",
            "trade_uuid",
            "trade_date",
            "side",
            "symbol",
            "quantity",
            "price",
            "execution_time",
            "net_proceeds"
          )
          .from("tradingdata02")
          .where("trade_uuid", trade_uuid)
          .andWhere("user_db_id", user_db_id) //-- SECURITY --//
          .orderBy("execution_time", "asc");
        return res.json(rows);
      },
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send("error during knex query");
  }
};
