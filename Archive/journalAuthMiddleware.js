import { CognitoJwtVerifier } from "aws-jwt-verify";
import jwtDecode from "jwt-decode";

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

export const journalAuthMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  //-- Make resilient to "Bearer <token>" or "<token>" --//
  let count = 0;
  let id_token;
  if (authHeader) {
    //-- Split header to check for 'Bearer: token_value' syntax --//
    const authHeaderSplit = authHeader.split(" ");
    count = authHeaderSplit.length;

    //-- Assign id_token value --//
    if (count == 1) {
      id_token = authHeaderSplit[0];
    }
    if (count == 2) {
      id_token = authHeaderSplit[1];
    }
  } else {
    id_token = null;
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
      //-- Set a header to indicate that the JWT was verified --//
      res.append("X-JWT-Verified", true);

      //-- Decode JWT and add cognito_sub to the request --//
      let idTokenDecoded = jwtDecode(id_token);
      req.cognito_sub = idTokenDecoded.sub;

      return next();
    }
  } catch (err) {
    //-- If not verified, return error --//
    return res
      .status(401)
      .json({ error: "JWT received but verification failed" });
  }
};
