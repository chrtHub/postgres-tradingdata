//-- knex client --//
import { knex } from "../index.js";

//-- ********************* Days ********************* --//
export const tradeUUIDsByDate = async (req, res) => {
  let { date } = req.params;

  try {
    let rows = await knex("tradingdata01")
      .select("trade_uuid")
      .distinct()
      .where("trade_date", date);

    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

//-- ********************* Trades ********************* --//
//-- Trade summary by trade_uuid --//
export const tradeSummaryByTradeUUID = async (req, res) => {
  let { trade_uuid } = req.params;

  // DEV
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }

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
          .where("trade_uuid", trade_uuid);
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
      .orderBy("execution_time", "asc");
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};
