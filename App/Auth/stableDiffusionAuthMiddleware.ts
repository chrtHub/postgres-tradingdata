import { Response, NextFunction } from "express";
import { IRequestWithAuth } from "../../Types/index.js";

export const stableDiffusionAuthMiddleware = async (
  req: IRequestWithAuth,
  res: Response,
  next: NextFunction
) => {
  let payload = req?.auth?.payload;
  let generate_diffusion_image: boolean = false;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  if (payload && payload.permissions) {
    generate_diffusion_image = payload.permissions.includes(
      "generate:diffusion-image"
    );
  }

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (generate_diffusion_image) {
    res.append("CHRT-JWT-permission-generate-diffusion-image", "verified");
    next();
  } else {
    return res
      .status(401)
      .send(
        "Your account is missing the following permissions: “generate:diffusion-image”"
      );
  }
};
