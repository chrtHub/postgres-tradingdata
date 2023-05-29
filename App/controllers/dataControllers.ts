//-- knex client --//
// import { knex } from "../../index";
import getUserDbId from "../utils/getUserDbId.js";

//-- Types --//
import { Response } from "express";
import { IRequestWithAuth } from "../../index.d";

//-- Fetch Data --//
export const fetchData = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);

  try {
    let rows = { foo: "bar", user_db_id: user_db_id };
    res.json(rows);
  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching data");
  }
};

// export const someHandler = async (req, res) => {};
