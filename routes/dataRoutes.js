//-- Imports --//
import express from "express";
import * as ctrl from "../controllers/dataControllers.js";

//-- Express router --//
const router = express.Router();

//-- Routes --//
router.get("/", ctrl.fetchData);

//-- Reference --//
// router.post()
// router.delete()

//-- Export --//
export default router;
