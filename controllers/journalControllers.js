//-- knex client --//
import { knex } from "../index.js";

//-- *********** Txns *********** --//
//-- ***** ***** ***** ***** ***** --//
//-- txns by trade_uuid --//
// TODO

//-- txns by symbol and date --//
export const txnsBySymbolAndDate = async (req, res) => {
  let { symbol, date } = req.params;

  try {
    const rows = await knex
      .select("*")
      .from("tradingdata01")
      .where("symbol", symbol)
      .andWhere("trade_date", date)
      .orderBy("trade_date", "desc")
      .orderBy("execution_time", "desc");
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

//-- *********** Trades *********** --//
//-- ***** ***** ***** ***** ***** --//
//-- Trade summary by trade_uuid --//
export const tradeSummaryByTradeUUID = async (req, res) => {
  let { trade_uuid } = req.params;

  try {
    const rows = await knex
      .with("trade", (querybuilder) => {
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
          .from("tradingdata01")
          .where("trade_uuid", `${trade_uuid}`);
        // .where('cognito_sub', 'some_cognito_sub')
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

    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

export const tradeSummaryBySymbolAndDate = async (req, res) => {
  let { symbol, date } = req.params;
  // TODO
};
