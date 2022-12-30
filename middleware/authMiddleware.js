import { CognitoJwtVerifier } from "aws-jwt-verify";

const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: "us-east-1_nGMFSXaES",
  tokenUse: "id",
  clientId: "7j7co4p1u35vbf31ahl09ihfut",
  customJwtCheck: async ({ header, payload, jwk }) => {
    if (!(parseInt(payload["custom:journalSubscription"]) > 1662008400)) {
      throw new Error(
        `valid data subscription required, but was not found in id token`
      );
    }
  },
});

export const authMiddleware = async (req, res, next) => {
  const id_token = req.headers.authorization;

  //-- DEVELOPMENT - SKIP AUTH IF DESIRED --//
  if (process.env.NODE_ENV === "development") {
    return next();
  }

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
