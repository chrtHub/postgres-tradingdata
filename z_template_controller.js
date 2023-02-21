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
  let { foo } = req.params; // for route like 'some_route/:foo'

  try {
    // TODO
    // if (!someNecessaryCondition) {
    // res.status(400).send("Error - did not meet some necessary condition")
    // }
    // let data = fetchData()
    // return res.send(data)
  } catch (error) {
    console.log(error);
    return res.status(500).send("error message while trying to beep boop");
  }
};
