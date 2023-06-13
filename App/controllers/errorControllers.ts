//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../Types/index.js";

//-- 400 Error --//
export const backend400Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (err) {
    res.status(400).send("hello, this is a test backend 400 error");
  }
};

//-- 401 Error --//
export const backend401Error = async (req: IRequestWithAuth, res: Response) => {
  res.status(200).send("errorAuthMiddleware was expected to fail but did not");
};

//-- 403 Error --//
export const backend403Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (err) {
    res.status(403).send("hello, this is a test backend 403 error");
  }
};

//-- 418 Error --//
export const backend418Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (err) {
    res.status(418).send("hello, this is a test backend 418 error");
  }
};

//-- 500 Error --//
export const backend500Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (err) {
    res.status(500).send("hello, this is a test backend 500 error");
  }
};
