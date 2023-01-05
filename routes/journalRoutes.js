//-- Imports --//
import express from "express";
import * as ctrl from "../controllers/journalControllers.js";

//-- Express router --//
const router = express.Router();

//-- Routes --//
router.get("/sales", ctrl.fetchSales);
router.get("/first_query", ctrl.fetchFirstQuery);
router.get("/:symbol/:date", ctrl.fetchSecondQuery);

//-- Export --//
export default router;
