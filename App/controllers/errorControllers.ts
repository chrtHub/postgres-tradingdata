import getUserDbId from "../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

//-- 400 Error --//
export const backend400Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (e) {
    res.status(400).send("hello, this is a test backend 400 error");
    // res
    //   .status(400)
    //   .json({ message: "hello, this is a test backend 400 error" });
  }
};

//-- 401 Error --//
export const backend401Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (e) {
    res.status(401).send("hello, this is a test backend 401 error");
  }
};

//-- 403 Error --//
export const backend403Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (e) {
    res.status(403).send("hello, this is a test backend 403 error");
  }
};

//-- 404 Error --//
export const backend404Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (e) {
    res.status(404).send("hello, this is a test backend 404 error");
  }
};

//-- 408 Error --//
export const backend408Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (e) {
    res.status(408).send("hello, this is a test backend 408 error");
  }
};

//-- 418 Error --//
export const backend418Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (e) {
    res.status(418).send("hello, this is a test backend 418 error");
  }
};

//-- 500 Error --//
export const backend500Error = async (req: IRequestWithAuth, res: Response) => {
  try {
    throw new Error();
  } catch (e) {
    res.status(500).send("hello, this is a test backend 500 error");
  }
};
