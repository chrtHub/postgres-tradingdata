//-- Express router --//
import express from "express";
const router = express.Router();

//-- Layouts Controllers --//
import {
  getLayoutsOptions,
  postLayoutsOptions,
} from "../controllers/Journal/Layouts/layoutsOptions.js";

//-- Trades And Txns Controllers --//
import { tradeUUIDsByDate } from "../controllers/Journal/TradesAndTxns/tradeUUIDsByDate.js";
import { tradeSummaryByTradeUUID } from "../controllers/Journal/TradesAndTxns/tradeSummaryByTradeUUID.js";
import { txnsByTradeUUID } from "../controllers/Journal/TradesAndTxns/txnsByTradeUUID.js";

//-- Charts Controllers --//
import { plLast45CalendarDays } from "../controllers/Journal/Charts/pl45CalendarDays.js";

//-- Stats Controllers --//
import { statsAllTime } from "../controllers/Journal/Stats/statsAllTime.js";

//-- ********** Routes ********** --//

//-- Layouts --//
router.get("/layouts_options", getLayoutsOptions);
router.post("/layouts_options", postLayoutsOptions);

//-- Trades and Txns --//
router.get("/trade_uuids_by_date/:date", tradeUUIDsByDate);
router.get("/trade_summary_by_trade_uuid/:trade_uuid", tradeSummaryByTradeUUID);
router.get("/txns_by_trade_uuid/:trade_uuid", txnsByTradeUUID);

//-- Charts --//
router.get("/pl_last_45_calendar_days", plLast45CalendarDays);

//-- Stats --//
router.get("/stats/all_time", statsAllTime);

//-- ********** Export ********** --//
export default router;
