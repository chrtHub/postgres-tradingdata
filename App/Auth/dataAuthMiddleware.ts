import { Response, NextFunction } from "express";
import { IRequestWithAuth } from "../../index.d";

export const dataAuthMiddleware = async (
  req: IRequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  let payload = req?.auth?.payload;
  let read_data: boolean = false;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  if (payload && payload.permissions) {
    read_data = payload.permissions.includes("read:data");
  }

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (read_data) {
    res.append("CHRT-JWT-permission-read_data", "verified");
    next();
  } else {
    return res
      .status(401)
      .send("Your account is missing the following permissions: 'read:data'");
  }
};
