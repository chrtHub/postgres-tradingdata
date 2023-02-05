export const journalAuthMiddleware = async (req, res, next) => {
  let { payload } = req.auth;

  //-- Check for necessary permissions to access route(s) guarded by this middleware --//
  let read_journal = payload.permissions.includes("read:journal");
  let write_journal = payload.permissions.includes("write:journal");

  //-- Only proceed via 'next()' if necessary permissions are present, otherwise send 401 --//
  if (read_journal && write_journal) {
    res.append("X-JWT-permission-read_journal", "verified");
    res.append("X-JWT-permission-write_journal", "verified");
    next();
  } else {
    return res.status(401).json({
      error: "JWT received and valid, but no 'read:journal' permission round",
    });
  }
};
