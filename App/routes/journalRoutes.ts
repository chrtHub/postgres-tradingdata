//-- Express router --//
import express from "express";
const router = express.Router();

//-- Trades And Txns Controllers --//
import { tradeUUIDsByDate } from "../controllers/Journal/TradesAndTxns/tradeUUIDsByDate.js";
import { tradeSummaryByTradeUUID } from "../controllers/Journal/TradesAndTxns/tradeSummaryByTradeUUID.js";
import { txnsByTradeUUID } from "../controllers/Journal/TradesAndTxns/txnsByTradeUUID.js";

//-- Charts Controllers --//
import { plLast45CalendarDays } from "../controllers/Journal/Charts/pl45CalendarDays.js";

//-- ********** Routes ********** --//

//-- Trades and Txns --//
router.get("/trade_uuids_by_date/:date", tradeUUIDsByDate);
router.get("/trade_summary_by_trade_uuid/:trade_uuid", tradeSummaryByTradeUUID);
router.get("/txns_by_trade_uuid/:trade_uuid", txnsByTradeUUID);

//-- Charts --//
router.get("/dashboard/pl_last_45_calendar_days", plLast45CalendarDays);

//-- ********** Export ********** --//
export default router;
