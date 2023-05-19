//-- Imports --//
import express from "express";
import * as ctrl from "../controllers/errorControllers.js";

//-- Express router --//
const router = express.Router();

//-- Routes --//
router.get("/", ctrl.backend400Error);
router.get("/400", ctrl.backend400Error);
router.get("/401", ctrl.backend401Error);
router.get("/403", ctrl.backend403Error);
router.get("/404", ctrl.backend404Error);
router.get("/408", ctrl.backend408Error);
router.get("/418", ctrl.backend418Error);
router.get("/500", ctrl.backend500Error);

//-- Export --//
export default router;
