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

//-- ********************* tradeSummaryByTradeUUID ********************* --//
export const tradeSummaryByTradeUUID = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_db_id = getUserDbId(req);
  let { trade_uuid } = req.params;

  if (!trade_uuid || trade_uuid === "null") {
    return res.status(400).send("Missing 'trade_uuid' param");
  }

  try {
    await retry(
      async () => {
        const rows = await knex
          .with("trade", (querybuilder: any) => {
            querybuilder
              .select(
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
              .andWhere("user_db_id", user_db_id); //-- SECURITY --//
          })
          .select(
            "trade_uuid",
            "trade_date",
            "symbol",
            "side",
            knex.raw("MIN(execution_time) AS first_execution_time"),
            knex.raw("MAX(execution_time) AS last_execution_time"),
            knex.raw("SUM(quantity) AS quantity"),
            knex.raw("SUM(quantity * price) AS quantity_times_price"),
            knex.raw("SUM(net_proceeds) AS net_proceeds")
          )
          .from("trade")
          .groupBy("trade_uuid", "trade_date", "symbol", "side");

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
