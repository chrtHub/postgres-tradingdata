//-- user_db_id utility function --//
import getUserDbId from "../Util/getUserDbId.js";

//-- knex client --//
import { knex } from "../../index.js";

//-- AWS client(s) --//

//-- ********************* Dashboard ********************* --//
export const plLast45CalendarDays = async (req, res) => {
  let user_db_id = getUserDbId(req);

  try {
    let rows = await knex("tradingdata02")
      .select("trade_date", knex.raw("SUM(net_proceeds) as profit"))
      .whereRaw("trade_date >= NOW() - INTERVAL '45 days'")
      .andWhere("user_db_id", user_db_id) //-- SECURITY --//
      .groupBy("trade_date")
      .orderBy("trade_date");

    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

//-- ********************* Days ********************* --//
export const tradeUUIDsByDate = async (req, res) => {
  let user_db_id = getUserDbId(req);
  let { date } = req.params;

  try {
    let rows = await knex("tradingdata02")
      .select("trade_uuid")
      .distinct()
      .where("trade_date", date)
      .andWhere("user_db_id", user_db_id); //-- SECURITY --//

    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

//-- ********************* Trades ********************* --//
//-- Trade summary by trade_uuid --//
export const tradeSummaryByTradeUUID = async (req, res) => {
  let user_db_id = getUserDbId(req);
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

    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

//-- ********************* Txns ********************* --//
//-- txns by trade_uuid --//
export const txnsByTradeUUID = async (req, res) => {
  let user_db_id = getUserDbId(req);
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
      .from("tradingdata02")
      .where("trade_uuid", trade_uuid)
      .andWhere("user_db_id", user_db_id) //-- SECURITY --//
      .orderBy("execution_time", "asc");
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};
