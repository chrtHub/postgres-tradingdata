import { Response, NextFunction } from "express";
import { IRequestWithAuth } from "../../index.d";

export const journalAuthMiddleware = async (
  req: IRequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  let payload = req?.auth?.payload;
  let write_journal: boolean = false;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  if (payload && payload.permissions) {
    write_journal = payload.permissions.includes("write:journal");
  }

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (write_journal) {
    res.append("CHRT-JWT-permission-write_journal", "verified");
    next();
  } else {
    return res
      .status(401)
      .send(
        "Your account is missing one/both of the following permissions: 'read:journal' and 'write:journal'"
      );
  }
};
