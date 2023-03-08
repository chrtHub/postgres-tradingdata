import { IRequestWithAuth } from "../../index.d";

export default function getUserDbId(req: IRequestWithAuth): string | undefined {
  const payload = req.auth?.payload;
  const user_db_id = payload?.app_metadata?.user_db_id ?? payload?.sub;

  return user_db_id;
}
