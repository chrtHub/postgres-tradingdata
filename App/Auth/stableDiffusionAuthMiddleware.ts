import { Response, NextFunction } from "express";
import { IRequestWithAuth } from "../../index.d";

export const stableDiffusionAuthMiddleware = async (
  req: IRequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  let payload = req?.auth?.payload;
  let chat_llm: boolean = false;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  if (payload && payload.permissions) {
    chat_llm = payload.permissions.includes("generate:diffusion-image");
  }

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (chat_llm) {
    res.append("CHRT-JWT-permission-generate:diffusion-image", "verified");
    next();
  } else {
    return res
      .status(401)
      .send(
        "Your account is missing the following permissions: “generate:diffusion-image”"
      );
  }
};
