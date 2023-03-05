import { Request } from "express";

export default function getUserDbId(req: Express.Request) {
  const payload = req.auth?.payload;
  const user_db_id = payload?.app_metadata?.user_db_id ?? payload?.sub;

  return user_db_id;
}
