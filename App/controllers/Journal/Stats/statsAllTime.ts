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
import { StatsAllTime } from "../Types/journal_types.js";

//-- Data --//

//-- ********************* Controller ********************* --//
export const statsAllTime = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);

  try {
    await retry(
      async () => {
        const qry_total_trades = await knex("tradingdata02")
          .countDistinct("trade_uuid as count")
          .where("user_db_id", user_db_id); //-- SECURITY --//
        const total_trades = qry_total_trades[0]?.count || 0;

        const qry_total_symbols = await knex("tradingdata02")
          .where("user_db_id", user_db_id) //-- SECURITY --//
          .countDistinct("symbol as count");
        const total_symbols = qry_total_symbols[0]?.count || 0;

        const qry_winning_trades = await knex("tradingdata02")
          .where("user_db_id", user_db_id) //-- SECURITY --//
          .groupBy("trade_uuid")
          .havingRaw("SUM(net_proceeds) > 0")
          .countDistinct("trade_uuid as trade");
        const winning_trades = qry_winning_trades?.length || 0;

        const qry_losing_trades = await knex("tradingdata02")
          .where("user_db_id", user_db_id) //-- SECURITY --//
          .groupBy("trade_uuid")
          .havingRaw("SUM(net_proceeds) < 0")
          .countDistinct("trade_uuid as trade");
        const losing_trades = qry_losing_trades?.length || 0;

        const qry_breakeven_trades = await knex("tradingdata02")
          .where("user_db_id", user_db_id) //-- SECURITY --//
          .groupBy("trade_uuid")
          .havingRaw("SUM(net_proceeds) = 0")
          .countDistinct("trade_uuid as trade");
        const breakeven_trades = qry_breakeven_trades?.length || 0;

        const qry_total_fees = await knex("tradingdata02")
          .where("user_db_id", user_db_id) //-- SECURITY --//
          .sum("fees as fees");
        const total_fees = qry_total_fees[0].fees;

        //----//
        interface Trade {
          trade_uuid: string;
          total_net_proceeds: number;
        }
        const qry_sum_winning_trades = await knex("tradingdata02")
          .select(
            "trade_uuid",
            knex.raw("SUM(net_proceeds) as total_net_proceeds")
          )
          .where("user_db_id", user_db_id) //-- SECURITY --//
          .groupBy("trade_uuid")
          .having(knex.raw("SUM(net_proceeds) > 0"));
        const winList = qry_sum_winning_trades.map(
          (trade: Trade) => trade.total_net_proceeds
        );
        const sum_winning_trades = winList.reduce(
          (acc: number, val: string) => acc + parseFloat(val),
          0
        );

        const qry_sum_losing_trades = await knex("tradingdata02")
          .select(
            "trade_uuid",
            knex.raw("SUM(net_proceeds) as total_net_proceeds")
          )
          .where("user_db_id", user_db_id) //-- SECURITY --//
          .groupBy("trade_uuid")
          .having(knex.raw("SUM(net_proceeds) < 0"));
        const loseList = qry_sum_losing_trades.map(
          (trade: Trade) => trade.total_net_proceeds
        );
        const sum_losing_trades = loseList.reduce(
          (acc: number, val: string) => acc + parseFloat(val),
          0
        );

        //----//
        const result = await knex("tradingdata02")
          .select(knex.raw("SUM(net_proceeds) AS overall_net_proceeds"))
          .where("user_db_id", user_db_id); //-- SECURITY --//
        const total_net_proceeds = result[0].overall_net_proceeds;

        const x: StatsAllTime = {
          total_trades: total_trades,
          total_symbols: total_symbols,
          breakeven_trades: breakeven_trades,
          winning_trades: winning_trades,
          losing_trades: losing_trades,
          total_fees: total_fees,
          sum_winning_trades: sum_winning_trades,
          sum_losing_trades: sum_losing_trades,
          total_net_proceeds: total_net_proceeds,
        };
        return res.status(200).json(x);
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
