//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express from "express";
import * as ctrl from "../controllers/journalFilesControllers.js";
import multer from "multer";

//-- With multer, memoryStorage() stores buffer in memory for lifetime of a 'req', then buffer gets garbage collected --//
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }); //-- Middlware functions --//

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//
router.get("/list_files", ctrl.listFiles);
router.get("/get_file/:brokerage/:filename", ctrl.getFile);
router.delete("/delete_file/:brokerage/:filename", ctrl.deleteFile);
router.put(
  "/put_file/:brokerage/:filename",
  upload.single("file"), //-- Multer middleware --//
  ctrl.putFile
);

//-- ********** Export ********** --//
export default router;
