//-- pg client --//
import { pgClient } from "../index.js";

//-- Fetch Sales --//
export const fetchSales = async (req, res, next) => {
  //-- Define fetchSales --//
  const fetchSales = async () => {
    //-- Query database --//
    let salesData;

    try {
      const res = await pgClient.query("SELECT * FROM sales LIMIT 10;");
      salesData = res.rows;
    } catch (err) {
      console.log(err);
      res.status(500).send("Error fetching data");
    }

    return salesData;
  };

  //-- Call fetchSales --//
  let rows = await fetchSales();
  res.json(rows);
};

// export const someHandler = async (req, res, next) => {};
