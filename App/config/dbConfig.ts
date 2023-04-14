//-- Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});

export const getDatabaseConfigFromSecretsManager = async () => {
  let db_host, db_port, db_dbname, db_username, db_password;

  try {
    console.log("fetching rds-postgres config from AWS Secrets Manager");
    let getSecretValueResponse = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId:
          "/chrt/journal/prod/rds-postgres/user_app_server_read_write/credentials",
        VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
      })
    );

    //-- Parse string into JSON, store values into variables --//
    if (getSecretValueResponse.SecretString) {
      let SecretStringJSON = JSON.parse(getSecretValueResponse.SecretString);
      db_host = SecretStringJSON.host;
      db_port = SecretStringJSON.port;
      db_dbname = SecretStringJSON.dbname;
      db_username = SecretStringJSON.username;
      db_password = SecretStringJSON.password;
    } else {
      throw new Error("rds-postgres SecretString is empty");
    }
  } catch (err) {
    console.log(err);
  }
  return { db_host, db_port, db_dbname, db_username, db_password };
};

export const getDocDBDatabaseConfigFromSecretsManager = async () => {
  let docDB_host, docDB_port, docDB_dbname, docDB_username, docDB_password;

  try {
    console.log("fetching docdb-mongodb config from AWS Secrets Manager");
    let getSecretValueResponse = await secretsManager_client.send(
      new GetSecretValueCommand({
        SecretId: "/chrt/prod/docdb/user_chrtDocDB", // TODO - instead of using admin role, use a limited-permisssions server role
        VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
      })
    );

    //-- Parse string into JSON, store values into variables --//
    if (getSecretValueResponse.SecretString) {
      let SecretStringJSON = JSON.parse(getSecretValueResponse.SecretString);
      docDB_host = SecretStringJSON.host;
      docDB_port = SecretStringJSON.port;
      docDB_dbname = SecretStringJSON.dbname;
      docDB_username = SecretStringJSON.username;
      docDB_password = SecretStringJSON.password;
    } else {
      throw new Error("docdb-mongodb SecretString is empty");
    }
  } catch (err) {
    console.log(err);
  }
  return {
    docDB_host,
    docDB_port,
    docDB_dbname,
    docDB_username,
    docDB_password,
  };
};
