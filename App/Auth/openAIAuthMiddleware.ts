import { Response, NextFunction } from "express";
import { IRequestWithAuth } from "../../index.d";

export const openAIAuthMiddleware = async (
  req: IRequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  let payload = req?.auth?.payload;
  let chat_llm: boolean = false;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  if (payload && payload.permissions) {
    chat_llm = payload.permissions.includes("chat:llm");
  }

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (chat_llm) {
    res.append("CHRT-JWT-permission-chat-llm", "verified");
    next();
  } else {
    return res.status(401).json({
      error: "JWT received and valid, but did not find 'chat:llm' permission",
    });
  }
};
