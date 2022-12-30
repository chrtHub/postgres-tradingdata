//-- pg client --//
import { pgClient } from "../index.js";

//-- Fetch Data --//
export const fetchData = async (req, res, next) => {
  //-- Define fetchData --//
  const fetchData = async () => {
    //-- Query database --//
    let employeesData;

    try {
      const res = await pgClient.query("SELECT * FROM employees LIMIT 10;");
      employeesData = res.rows;
    } catch (err) {
      console.log(err);
      res.status(500).send("Error fetching data");
    }

    return employeesData;
  };

  //-- Call fetchData --//
  let rows = await fetchData();
  res.json(rows);
};

// export const someHandler = async (req, res, next) => {};
