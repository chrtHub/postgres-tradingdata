//-- user_db_id utility function --//
import getUserDbId from "../Util/getUserDbId.js";

//-- knex client --//
import { knex } from "../../index.js";

//-- AWS client(s) --//

//-- ********************* Some Controller ********************* --//
import getUserDbId from "../Util/getUserDbId.js";

export const some_Function = async (req, res) => {
  let user_db_id = getUserDbId(req);

  try {
    // TODO
  } catch (err) {
    console.log(err);
  }
};
