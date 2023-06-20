//-- Clients --//
import { knex } from "../../../../index.js";
import retry from "async-retry";

//-- TypeScript --//
import getTradingDatesAndProfitsArray from "../Util/getTradingDatesAndProfitsArray.js";

//-- NPM Functions --//
import { format } from "date-fns";

//-- Utility Functions --//
import getUserDbId from "../../../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../../..//Types/index.js";
import { IDateAndProfitRow } from "../Types/journal_types.js";

//-- Data --//

//-- ********************* plLast45CalendarDays ********************* --//
export const plLast45CalendarDays = async (
  req: IRequestWithAuth,
  res: Response
) => {
  let user_db_id = getUserDbId(req);

  try {
    await retry(
      async () => {
        let rows: any = await knex("tradingdata02")
          .select("trade_date", knex.raw("SUM(net_proceeds) as profit"))
          .whereRaw("trade_date >= NOW() - INTERVAL '45 days'")
          .andWhere("user_db_id", user_db_id) //-- SECURITY --//
          .groupBy("trade_date")
          .orderBy("trade_date");

        //-- Get array of actual Market Days from the past 45 calendar days --//
        const datesAndProfits: IDateAndProfitRow[] =
          getTradingDatesAndProfitsArray(45);

        //-- Write data from Postgres into the datesAndProfits --//
        rows.forEach((row: any) => {
          //-- format date --//
          const date = format(new Date(row.trade_date), "yyyy-MM-dd");
          //-- Get each date's index in the datesAndProfits --//
          const index = datesAndProfits.findIndex((item) => item.date === date);
          //-- Write the date's profit into the datesAndProfits --//
          if (index !== -1) {
            // datesAndProfits[index].profit = row.profit.toString()
            datesAndProfits[index].profit = row.profit;
          }
        });
        return res.json(datesAndProfits);
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
