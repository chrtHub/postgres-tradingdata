import { CognitoJwtVerifier } from "aws-jwt-verify";

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: "us-east-1_nGMFSXaES",
  tokenUse: "id",
  clientId: "7j7co4p1u35vbf31ahl09ihfut",
});

export const jwtAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  //-- Make resilient to "Bearer <token>" or "<token>" --//
  const authHeaderSplit = authHeader.split(" ");
  const count = authHeaderSplit.length;

  //-- Assign id_token value --//
  let id_token;
  if (count == 1) {
    id_token = authHeaderSplit[0];
  }
  if (count == 2) {
    id_token = authHeaderSplit[1];
  }

  //-- DEVELOPMENT - SKIP AUTH IF DESIRED --//
  // if (process.env.NODE_ENV === "development") {
  //   return next();
  // }

  //-- If no token, return error --//
  if (!id_token) {
    return res
      .status(401)
      .json({ error: "No JWT received in 'authorization' header" });
  }

  //-- Verify JWT --//
  try {
    let verified = await jwtVerifier.verify(id_token);

    if (verified) {
      return next();
    }
  } catch (err) {
    //-- If not verified, return error --//
    return res
      .status(401)
      .json({ error: "JWT received but verification failed" });
  }
};
