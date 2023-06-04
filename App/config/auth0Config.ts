import retry from "async-retry";

//-- Secrets Manager --//
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsManager_client = new SecretsManagerClient({
  region: "us-east-1",
});

//-- Auth0 client secret --//
export const getAuth0ClientSecretFromSecretsManager = async () => {
  let SecretStringJSON = {
    client_secret: "",
  };

  try {
    await retry(
      async () => {
        console.log(
          "AWS Secrets Manager - fetching Auth0 config for application: Express Server"
        );
        let getSecretValueResponse = await secretsManager_client.send(
          new GetSecretValueCommand({
            SecretId: "chrt/auth0/application/express_server",
            VersionStage: "AWSCURRENT", //-- defaults to AWSCURRENT if unspecified --//
          })
        );

        //-- Parse string into JSON --//
        if (getSecretValueResponse.SecretString) {
          SecretStringJSON = JSON.parse(getSecretValueResponse.SecretString);
        } else {
          throw new Error("Auth0 SecretString is empty");
        }
      },
      {
        retries: 2,
        minTimeout: 1000,
        factor: 2,
      }
    );
  } catch (err) {
    console.log(err);
  }

  const { client_secret } = SecretStringJSON;
  return client_secret;
};
