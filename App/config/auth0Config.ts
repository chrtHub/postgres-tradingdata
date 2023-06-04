import { ManagementClient } from "auth0";

const auth0ManagementClient = new ManagementClient({
  token: "{YOUR_API_V2_TOKEN}",
  domain: "{YOUR_ACCOUNT}.auth0.com",
});

// set telemetry: false (how?)
// with all requests, can provide a X-Correlation-ID as HTTP header for tracking purposes, up to 64 chars

export default auth0ManagementClient;
