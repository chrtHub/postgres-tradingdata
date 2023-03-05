//-- ********** Imports ********** --//
//-- ***** ***** ***** ***** ***** --//
import express, { Request } from "express";
import * as ctrl from "../controllers/journalFilesControllers.js";
import multer from "multer";

//-- With multer, memoryStorage() stores buffer in memory for lifetime of a 'req', then buffer gets garbage collected --//
const storage = multer.memoryStorage();

//-- Multer fileFilter --//
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: Function
) => {
  if (file.mimetype === "text/csv") {
    callback(null, true);
  } else {
    const error = new Error(
      `File type ${file.mimetype} not supported - .csv only`
    ) as any;
    error.status = 415; //-- 415: Unsupported Media Type --//
    callback(error, false);
  }
};

//-- Multer middlware functions --//
const upload = multer({
  storage: storage,
  fileFilter: fileFilter, //-- filter for .csv only --//
  limits: { files: 1, fileSize: 10 * 1024 * 1024 }, //-- 1 file, 10 MB max --//
});

//-- Express router --//
const router = express.Router();

//-- ********** Routes ********** --//
//-- ***** ***** ***** ***** ***** --//
router.put(
  "/put_file/:brokerage/:filename",
  upload.single("file"), //-- Multer middleware --//
  ctrl.putFile
);
router.get("/list_files", ctrl.listFiles);
router.get("/get_file/:brokerage/:file_uuid_plus_filename", ctrl.getFile);
router.delete(
  "/delete_file/:brokerage/:file_uuid_plus_filename",
  ctrl.deleteFile
);

//-- ********** Export ********** --//
export default router;
