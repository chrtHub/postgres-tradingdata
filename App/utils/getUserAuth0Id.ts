import { IRequestWithAuth } from "../../Types/index.js";

export default function getUserAuth0Id(req: IRequestWithAuth): string {
  const payload = req.auth?.payload;
  const user_auth0_id = payload?.sub;

  return user_auth0_id || "";
}
