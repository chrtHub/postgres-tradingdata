//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/journalControllers.js";

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//

//-- Txns --//
// router.get("/txns_by_trade_uuid/:trade_uuid", ctrl.txnsByTradeUUID);
router.get("/txns_by_symbol_and_date/:symbol/:date", ctrl.txnsBySymbolAndDate);

//-- Trades --//
router.get(
  "/trade_summary_by_trade_uuid/:trade_uuid",
  ctrl.tradeSummaryByTradeUUID
);
// router.get(
//   "/trade_summary_by_symbol_and_date/:symbol/:date",
//   ctrl.tradeSummaryBySymbolAndDate
// );

//-- ********** Export ********** --//
export default router;
