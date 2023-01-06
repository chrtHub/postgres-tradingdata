//-- knex client --//
import { knex } from "../index.js";

//-- *********** Txns *********** --//
//-- ***** ***** ***** ***** ***** --//
//-- txns by trade_uuid --//
export const txnsByTradeUUID = async (req, res) => {
  let { trade_uuid } = req.params;

  try {
    const rows = await knex
      .select("*")
      .from("tradingdata01")
      .where("trade_uuid", trade_uuid)
      .orderBy("trade_date", "desc")
      .orderBy("execution_time", "desc");
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

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
export const tradeSummaryBySymbolAndDate = async (req, res) => {
  let { symbol, date } = req.params;

  // perhaps get pre-computed summary data from a view or an index?
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

//-- *********** Examples *********** --//
//-- ***** ***** ***** ***** ***** --//
//-- Fetch Sales --//
export const fetchSales = async (req, res) => {
  try {
    const rows = await knex("sales").select().limit(10);
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Error fetching data" });
  }
};

//-- Profit or Loss for a particular day --//
export const fetchFirstQuery = async (req, res) => {
  try {
    //-- this query is just a draft --//
    const rows = await knex
      .select("side", "trade_date", knex.raw("SUM(net_proceeds)"))
      .from("tradingdata01")
      .where("symbol", "BTBT")
      .andWhere("trade_date", ">=", "2021-08-04")
      .andWhere("trade_date", "<=", "2021-08-04")
      .groupBy("side", "trade_date")
      .orderBy("trade_date", "desc")
      .orderBy("side");
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};

export const fetchSecondQuery = async (req, res) => {
  let { symbol, date } = req.params;

  try {
    //-- this query is just a draft --//
    const rows = await knex
      .select("side", "trade_date", knex.raw("SUM(net_proceeds)"))
      .from("tradingdata01")
      .where("symbol", symbol)
      .andWhere("trade_date", ">=", date)
      .andWhere("trade_date", "<=", date)
      .groupBy("side", "trade_date")
      .orderBy("trade_date", "desc")
      .orderBy("side");
    res.json(rows);
  } catch (err) {
    console.log(err);
  }
};
