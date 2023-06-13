//-- Clients --//
import { knex } from "../../../../index.js";
import retry from "async-retry";

//-- TypeScript --//

//-- NPM Functions --//

//-- Utility Functions --//
import getUserDbId from "../../../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../..//Types/index.js";

//-- Data --//

//-- ********************* tradeUUIDsByDate ********************* --//
export const tradeUUIDsByDate = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_db_id = getUserDbId(req);
  let { date } = req.params;

  if (!date || date === "null") {
    return res.status(400).send("Missing 'date' param");
  }

  try {
    await retry(
      async () => {
        let rows: any = await knex("tradingdata02")
          .select("trade_uuid")
          .distinct()
          .where("trade_date", date)
          .andWhere("user_db_id", user_db_id); //-- SECURITY --//

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
