import getUserDbId from "../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

//-- Error --//
export const backend418Error = async (req: IRequestWithAuth, res: Response) => {
  res.status(418).send("418 error");
};

//-- 500 Error --//
export const backend500Error = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);

  try {
    throw new Error();
  } catch (e) {
    res.status(500).send("hello, this is a test backend 500 error");
  }
};
