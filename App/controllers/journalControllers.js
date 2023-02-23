//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import getTradingDatesAndProfitsArray from "../utils/getTradingDatesAndProfitsArray.js";

//-- NPM Functions --//
import { format } from "date-fns";

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

    //-- Get array of actual Market Days from the past 45 calendar days --//
    const datesAndProfits = getTradingDatesAndProfitsArray(45);

    //-- Write data from Postgres into the datesAndProfits --//
    rows.forEach((row) => {
      //-- format date --//
      const date = format(new Date(row.trade_date), "yyyy-MM-dd");
      //-- Get each date's index in the datesAndProfits --//
      const index = datesAndProfits.findIndex((item) => item.date === date);
      //-- Write the date's profit into the datesAndProfits --//
      if (index !== -1) {
        datesAndProfits[index].profit = row.profit;
      }
    });

    res.json(datesAndProfits);
  } catch (e) {
    console.log(e);
    return res.status(500).send("error during knex query");
  }
};

//-- ********************* Days ********************* --//
export const tradeUUIDsByDate = async (req, res) => {
  let user_db_id = getUserDbId(req);
  let { date } = req.params;

  if (!date || date === "null") {
    return res.status(400).send("Missing 'date' param");
  }

  try {
    let rows = await knex("tradingdata02")
      .select("trade_uuid")
      .distinct()
      .where("trade_date", date)
      .andWhere("user_db_id", user_db_id); //-- SECURITY --//

    return res.json(rows);
  } catch (e) {
    console.log(e);
    return res.status(500).send("error during knex query");
  }
};

//-- ********************* Trades ********************* --//
//-- Trade summary by trade_uuid --//
export const tradeSummaryByTradeUUID = async (req, res) => {
  let user_db_id = getUserDbId(req);
  let { trade_uuid } = req.params;

  if (!trade_uuid || trade_uuid === "null") {
    return res.status(400).send("Missing 'trade_uuid' param");
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
  } catch (e) {
    console.log(e);
    return res.status(500).send("error during knex query");
  }
};

//-- ********************* Txns ********************* --//
//-- txns by trade_uuid --//
export const txnsByTradeUUID = async (req, res) => {
  let user_db_id = getUserDbId(req);
  let { trade_uuid } = req.params;

  if (!trade_uuid || trade_uuid === "null") {
    return res.status(400).send("Missing 'trade_uuid' param");
  }

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
  } catch (e) {
    console.log(e);
    return res.status(500).send("error during knex query");
  }
};
