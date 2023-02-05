import jwtDecode from "jwt-decode";

export const logDecodedTokenMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  //-- Make resilient to "Bearer <token>" or "<token>" --//
  let count = 0;
  let access_token;
  if (authHeader) {
    //-- Split header to check for 'Bearer: token_value' syntax --//
    const authHeaderSplit = authHeader.split(" ");
    count = authHeaderSplit.length;

    //-- Assign access_token value --//
    if (count == 1) {
      access_token = authHeaderSplit[0];
    }
    if (count == 2) {
      access_token = authHeaderSplit[1];
    }
  } else {
    access_token = null;
  }

  //-- DEVELOPMENT - SKIP AUTH IF DESIRED --//
  // if (process.env.NODE_ENV === "development") {
  //   return next();
  // }

  //-- If no token, return error --//
  if (!access_token) {
    return res
      .status(401)
      .json({ error: "No JWT received in 'authorization' header" });
  }

  //-- Decode JWT and add db_id to the request --//
  let accessTokenDecoded = jwtDecode(access_token);
  req.db_id = access_token?.id || null; // TODO - get user's database id from theaccess token
  console.log(accessTokenDecoded);

  return next();
};
