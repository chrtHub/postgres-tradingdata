//-- AWS client(s) --//

//-- knex client --//
import { knex } from "../index";
import axios from "axios";
import retry from "async-retry";

//-- NPM Functions --//

//-- Utility Functions --//
// import getUserDbId from "../utils/getUserDbId";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../index.d";

//-- ********************* Some Controller ********************* --//
export const some_Function = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);
  let { foo } = req.params; // for route like 'some_route/:foo'

  if (!foo) {
    return res.status(400).send("Missing foo param");
  }

  try {
    await retry(
      async () => {
        // axios or mongo call
        // return res.json(data)
      },
      {
        retries: 1,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
    return res.status(500).send("error message while trying to beep boop");
  }
};
