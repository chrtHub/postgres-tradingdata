//-- AWS client(s) --//
import { S3Client } from "@aws-sdk/client-s3";
import {
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

//-- knex client --//
import { knex } from "../../index.js";

//-- Utility Functions --//
import getUserDbId from "../utils/getUserDbId.js";
import orderBy from "lodash/orderBy.js";
import { v4 as uuidv4 } from "uuid";

//-- NPM Functions --//
import { IRequestWithAuth } from "../../index.d";
import { Response } from "express";

//-- Other --//
const s3_client = new S3Client({
  region: "us-east-1",
});

//-- ********************* Put File ********************* --//
export const putFile = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);
  let { brokerage, filename } = req.params;
  let file = req.file; //-- Actual data from file --//

  let bucket = "chrt-user-trading-data-files";

  //-- Generate a uuid and add it in front of the filename --//
  let file_uuid = uuidv4();
  let key = `${user_db_id}/${brokerage}/${file_uuid}_${filename}`;

  if (!file) {
    return res.status(400).send("No file received");
  }
  if (!file.buffer) {
    return res.status(400).send("No file data (buffer) received");
  }

  try {
    await s3_client.send(
      new PutObjectCommand({
        Body: file.buffer,
        Bucket: bucket,
        Key: key,
      })
    );

    return res.status(200).send("File uploaded to S3");
    //----//
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error putting file to S3");
  }
};

//-- ********************* List Files ********************* --//
export const listFiles = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);

  try {
    let response = await s3_client.send(
      new ListObjectsV2Command({
        Bucket: "chrt-user-trading-data-files",
        Prefix: `${user_db_id}`,
      })
    );

    //-- Build files list array --//
    interface IFileInList {
      id?: string;
      file_uuid?: string;
      filename?: string;
      brokerage?: string;
      last_modified?: Date | undefined;
      size_mb?: string;
    }
    let filesList: IFileInList[] = [];

    response.Contents?.forEach((x) => {
      if (x.Key && x.Size) {
        const [user_db_id, brokerage = "", file_uuid_plus_filename = ""] =
          x.Key.split("/");
        let [file_uuid, filename] = file_uuid_plus_filename.split("_");

        //-- Only include filename and brokerage that aren't "" (those are for the S3 "folders") --//
        if (filename?.length > 0 && brokerage?.length > 0) {
          let file = {
            id: file_uuid,
            file_uuid: file_uuid,
            filename: filename,
            brokerage: brokerage,
            last_modified: x.LastModified,
            size_mb: (x.Size / 1000000).toFixed(1), //-- display with 1 decimal place --//
          };

          filesList.push(file);
        }
      }
    });

    //-- Order files list by last_modified_iso8601 --//
    let sortedFilesList = orderBy(
      filesList, //-- array --//
      "last_modified", //-- column to order by--//
      "desc" //-- asc or desc --//
    );

    return res.send(sortedFilesList);
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error while building files list");
  }
};

//-- ********************* Get File ********************* --//
export const getFile = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);
  let { brokerage, file_uuid_plus_filename } = req.params;
  let [file_uuid, filename] = file_uuid_plus_filename.split("_");

  let bucket = "chrt-user-trading-data-files";
  let key = `${user_db_id}/${brokerage}/${file_uuid_plus_filename}`;

  try {
    let response = await s3_client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    //-- Set headers --//
    res.setHeader("Content-Type", response.ContentType || "");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    //-- Transform to string and send to user --//
    if (response?.Body) {
      let fileBody = await response.Body.transformToString();
      return res.send(fileBody);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error downloading file from S3");
  }
};

//-- ********************* Delete File ********************* --//
export const deleteFile = async (req: IRequestWithAuth, res: Response) => {
  let user_db_id = getUserDbId(req);
  let { brokerage, file_uuid_plus_filename } = req.params;

  //-- Use file_uuid to delete rows in Postgres --//
  let [file_uuid, filename] = file_uuid_plus_filename.split("_");

  //-- Use bucket and key to delete S3 object --//
  let bucket = "chrt-user-trading-data-files";
  let key = `${user_db_id}/${brokerage}/${file_uuid_plus_filename}`;

  try {
    //-- Delete data from Postgres --//
    await knex("tradingdata02").where({ file_uuid: file_uuid }).del();

    //-- Delete file from S3 --//
    await s3_client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));

    return res
      .status(200)
      .send("File data deleted from Postgres and file deleted from S3");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Error deleting file from Postgres & S3");
  }
};
