//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/journalControllers.js";

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//

//-- Dashboard --//
router.get("/dashboard/pl_last_45_calendar_days", ctrl.plLast45CalendarDays);

//-- Days --//
router.get("/trade_uuids_by_date/:date", ctrl.tradeUUIDsByDate);

//-- Trades --//
router.get(
  "/trade_summary_by_trade_uuid/:trade_uuid",
  ctrl.tradeSummaryByTradeUUID
);

//-- Txns --//
router.get("/txns_by_trade_uuid/:trade_uuid", ctrl.txnsByTradeUUID);

//-- ********** Export ********** --//
export default router;
