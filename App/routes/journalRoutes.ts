//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/Journal/journalControllers.js";

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//

/**
 * @swagger
 * /dashboard/pl_last_45_calendar_days:
 *   get:
 *     summary: Get profit & loss data for market days in the past 45 calendar days.
 *     tags:
 *       - Dashboard
 *     security:
 *       - BearerAuth: []
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of trading dates and profits.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DateAndProfitRow'
 * components:
 *   schemas:
 *     DateAndProfitRow:
 *       type: object
 *       properties:
 *         date:
 *           type: string
 *           description: The trading date.
 *         profit:
 *           type: number
 *           description: The net profit for the trading date.
 *       required:
 *         - date
 *         - profit
 */
router.get("/dashboard/pl_last_45_calendar_days", ctrl.plLast45CalendarDays);

//-- Trades --//
/**
 * @swagger
 * /trade_uuids_by_date/{date}:
 *   get:
 *     summary: Get unique trade UUIDs for a specific date.
 *     tags:
 *       - Trades
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: date
 *         in: path
 *         description: The date for which to retrieve trade UUIDs.
 *         required: true
 *         schema:
 *           type: string
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of unique trade UUIDs for the specified date.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   trade_uuid:
 *                     type: string
 *                     description: The unique identifier for the trade.
 *                 required:
 *                   - trade_uuid
 *       400:
 *         description: Missing 'date' parameter.
 *       500:
 *         description: Error during Knex query.
 */
router.get("/trade_uuids_by_date/:date", ctrl.tradeUUIDsByDate);

/**
 * @swagger
 * /trade_summary_by_trade_uuid/{trade_uuid}:
 *   get:
 *     summary: Get trade summary by trade UUID
 *     tags:
 *       - Trades
 *     parameters:
 *       - in: path
 *         name: trade_uuid
 *         required: true
 *         description: Trade UUID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trade_uuid:
 *                   type: string
 *                 trade_date:
 *                   type: string
 *                 symbol:
 *                   type: string
 *                 side:
 *                   type: string
 *                 first_execution_time:
 *                   type: string
 *                 last_execution_time:
 *                   type: string
 *                 quantity:
 *                   type: number
 *                 quantity_times_price:
 *                   type: number
 *                 net_proceeds:
 *                   type: number
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get(
  "/trade_summary_by_trade_uuid/:trade_uuid",
  ctrl.tradeSummaryByTradeUUID
);

//-- Txns --//
/**
 * @swagger
 * /txns_by_trade_uuid/{trade_uuid}:
 *   get:
 *     summary: Get transactions by trade UUID
 *     tags:
 *       - Transactions
 *     parameters:
 *       - in: path
 *         name: trade_uuid
 *         required: true
 *         description: Trade UUID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   uuid:
 *                     type: string
 *                   brokerage:
 *                     type: string
 *                   filename:
 *                     type: string
 *                   import_timestamp:
 *                     type: string
 *                   import_uuid:
 *                     type: string
 *                   trade_uuid:
 *                     type: string
 *                   trade_date:
 *                     type: string
 *                   symbol:
 *                     type: string
 *                   side:
 *                     type: string
 *                   quantity:
 *                     type: number
 *                   price:
 *                     type: number
 *                   execution_time:
 *                     type: string
 *                   net_proceeds:
 *                     type: number
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get("/txns_by_trade_uuid/:trade_uuid", ctrl.txnsByTradeUUID);

//-- ********** Export ********** --//
export default router;
