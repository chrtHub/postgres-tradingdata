import { Response, NextFunction } from "express";
import { IRequestWithAuth } from "../../index.d";

export const errorAuthMiddleware = async (
  req: IRequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  let payload = req?.auth?.payload;

  return res
    .status(401)
    .send(
      "Hello, this is an errorAuthMiddleware test error (JWT was received and valid)"
    );
};
