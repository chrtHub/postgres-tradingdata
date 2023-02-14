//-- AWS client(s) --//

//-- knex client --//
import { knex } from "../../index.js";

//-- Utility Functions --//
import getUserDbId from "../Util/getUserDbId.js";

//-- NPM Functions --//

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
