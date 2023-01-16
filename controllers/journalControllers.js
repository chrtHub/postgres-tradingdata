//-- knex client --//
import { knex } from "../index.js";

//-- ********************* Days ********************* --//
export const tradeUUIDsByDate = async (req, res) => {
  let { date } = req.params;
  let cognito_sub = req.cognito_sub;

  console.log("tradeUUIDsByDate, user: " + cognito_sub); // DEV

  try {
    let rows = await knex("tradingdata01")
      .select("trade_uuid")
      .distinct()
      .where("trade_date", date)
      .andWhere("cognito_sub", cognito_sub); // Is this good??

    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

//-- ********************* Trades ********************* --//
//-- Trade summary by trade_uuid --//
export const tradeSummaryByTradeUUID = async (req, res) => {
  let { trade_uuid } = req.params;
  let cognito_sub = req.cognito_sub;

  console.log("tradeSummaryByTradeUUID, user: " + cognito_sub); // DEV

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
          .where("trade_uuid", trade_uuid)
          .andWhere("cognito_sub", cognito_sub); // Is this good??
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

//-- ********************* Txns ********************* --//
//-- txns by trade_uuid --//
export const txnsByTradeUUID = async (req, res) => {
  let { trade_uuid } = req.params;
  let cognito_sub = req.cognito_sub;

  console.log("txnsByTradeUUID, user: " + cognito_sub); // DEV
  try {
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
      .from("tradingdata01")
      .where("trade_uuid", trade_uuid)
      .andWhere("cognito_sub", cognito_sub) // Is this good??
      .orderBy("execution_time", "asc");
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};
