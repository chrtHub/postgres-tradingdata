export const dataAuthMiddleware = async (req, res, next) => {
  let { payload } = req.auth;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  let read_data = payload.permissions.includes("read:data");

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (read_data) {
    res.append("X-JWT-permission-read_data", "verified");
    next();
  } else {
    return res.status(401).json({
      error: "JWT received and valid, but no 'read:data' permission round",
    });
  }
};
