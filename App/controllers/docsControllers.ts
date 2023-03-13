import { apiSpec } from "../../index.js";
import path from "path";

//-- Types --//
import { Request, Response } from "express";

const docsPage = "foo";

//-- Fetch Data --//
export const redocPage = async (req: Request, res: Response) => {
  try {
    // from here, send the static file from the vite app?

    res.setHeader("Content-Type", "application/json"); // DEV
    res.send(apiSpec); // DEV
  } catch (e) {
    console.log(e);
    res.status(500).send("Error returning docs page");
  }
};
