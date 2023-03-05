import { Request, Response, NextFunction } from "express";

export const dataAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { payload } = req.auth;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  let read_data = payload.permissions.includes("read:data");

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (read_data) {
    res.append("X-JWT-permission-read_data", "verified");
    next();
  } else {
    return res.status(401).json({
      error: "JWT received and valid, but did not find 'read:data' permission",
    });
  }
};
