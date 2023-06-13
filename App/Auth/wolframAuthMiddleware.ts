import { Response, NextFunction } from "express";
import { IRequestWithAuth } from "../../Types/index.js";

export const wolframAuthMiddleware = async (
  req: IRequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  let payload = req?.auth?.payload;
  let invoke_wolfram_all: boolean = false;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  if (payload && payload.permissions) {
    invoke_wolfram_all = payload.permissions.includes("invoke:wolfram-all");
  }

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (invoke_wolfram_all) {
    res.append("CHRT-JWT-permission-invoke-wolfram-all", "verified");
    next();
  } else {
    return res
      .status(401)
      .send(
        "Your account is missing the following permissions: “invoke:wolfram-all”"
      );
  }
};
