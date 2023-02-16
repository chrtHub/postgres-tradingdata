//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/journalFilesControllers.js";

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//
router.get("/list_files", ctrl.listFiles);
router.get("/get_file/:brokerage/:filename", ctrl.getFile);
router.delete("/delete_file/:brokerage/:filename", ctrl.deleteFile);
router.put("/delete_file/:brokerage/:filename", ctrl.putFile);

//-- ********** Export ********** --//
export default router;
