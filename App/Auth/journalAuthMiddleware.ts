import { Response, NextFunction } from "express";
import { IRequestWithAuth } from "../../index.d";

export const journalAuthMiddleware = async (
  req: IRequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  let payload = req?.auth?.payload;
  let read_journal: boolean = false;
  let write_journal: boolean = false;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  if (payload && payload.permissions) {
    read_journal = payload.permissions.includes("read:journal");
    write_journal = payload.permissions.includes("write:journal");
  }

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (read_journal && write_journal) {
    res.append("X-JWT-permission-read_journal", "verified");
    res.append("X-JWT-permission-write_journal", "verified");
    next();
  } else {
    return res.status(401).json({
      error:
        "JWT received and valid, but did not find 'read:journal' && 'write:journal' permissions",
    });
  }
};
