//-- ChatGPT example --//

const express = require("express");
const jwt = require("jsonwebtoken");
const app1 = express();

app1.use(express.json());

const secret = "your-secret-key";

app1.get("/private", (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, secret);
    // The request is authenticated if this function is called
    res.send("Welcome to the private route");
  } catch (err) {
    res.sendStatus(401);
  }
});

app1.listen(3000, () => console.log("Listening on port 3000"));

//-- ChatGPT example for Cognito --//

const express = require("express");
const jwt = require("jsonwebtoken");
const app2 = express();

app2.use(express.json());

// const region = "your-region";
// const userPoolId = "your-user-pool-id";
// const appClientId = "your-app-client-id";

app2.get("/private", (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  const decoded = jwt.decode(token, { complete: true });
  if (
    !decoded ||
    !decoded.header ||
    !decoded.header.alg ||
    decoded.header.alg !== "RS256"
  ) {
    return res.sendStatus(401);
  }

  const jwksUrl = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
  const kid = decoded.header.kid;

  request(
    {
      url: jwksUrl,
      json: true,
    },
    (error, response, body) => {
      if (error || response.statusCode !== 200) {
        return res.sendStatus(401);
      }

      const key = body.keys.find((key) => key.kid === kid);
      if (!key) {
        return res.sendStatus(401);
      }

      const options = {
        issuer: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
        audience: appClientId,
      };

      jwt.verify(token, key.x5c[0], options, (err, decoded) => {
        if (err) {
          return res.sendStatus(401);
        }

        // The request is authenticated if this function is called
        res.send("Welcome to the private route");
      });
    }
  );
});

app2.listen(3000, () => console.log("Listening on port 3000"));

//-- Chat GPT example with cookie-session middleware --//
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieSession = require("cookie-session");
const app = express();

app.use(express.json());
app.use(
  cookieSession({
    name: "session",
    keys: ["your-secret-key"],
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

const region = "your-region";
const userPoolId = "your-user-pool-id";
const appClientId = "your-app-client-id";

app.get("/login", (req, res) => {
  const token = req.headers.authorization;
  if (!token) return res.sendStatus(401);

  // Verify the JWT as before...

  // If the JWT is valid, store the authenticated status in a session cookie
  req.session.authenticated = true;
  res.send("Logged in");
});

app.get;
