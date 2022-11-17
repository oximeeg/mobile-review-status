const fs = require("fs");
const https = require("https");
const jwt = require("jsonwebtoken");

// https://developer.apple.com/documentation/appstoreconnectapi/creating_api_keys_for_app_store_connect_api
const credentials = require("./credentials.json");

const TOKEN_FILE_PATH = "token.txt";

function saveToken(token) {
  startLog(arguments.callee.name);

  fs.writeFileSync(TOKEN_FILE_PATH, token);
}

function loadSavedTokenIfExist() {
  startLog(arguments.callee.name);

  if (!fs.existsSync(TOKEN_FILE_PATH)) {
    return null;
  }
  return fs.readFileSync(TOKEN_FILE_PATH, "utf8");
}

function generatingToken() {
  startLog(arguments.callee.name);

  // https://developer.apple.com/documentation/appstoreconnectapi/generating_tokens_for_api_requests
  const exp = Math.floor(Date.now() / 1000) + 60 * 20; // 20min
  const token = jwt.sign(
    {
      iss: credentials.iss,
      exp: exp,
      aud: "appstoreconnect-v1",
    },
    credentials.key,
    {
      algorithm: "ES256",
      header: { kid: credentials.kid },
    }
  );

  saveToken(token);

  return token;
}

function authorize() {
  startLog(arguments.callee.name);

  const token = loadSavedTokenIfExist();
  if (token) {
    return token;
  }

  return generatingToken();
}

function parseData(d, retry) {
  startLog(arguments.callee.name);

  const jsonData = JSON.parse(d);
  if (jsonData.errors) {
    // https://developer.apple.com/documentation/appstoreconnectapi/errorresponse/errors
    const e = jsonData.errors[0];
    console.log(`${e.status} ${e.code}\n${e.title}\n${e.detail}`);
    if (e.code === "NOT_AUTHORIZED") {
      console.log(`\nRegenerating Tokens and retry.\n`);
      if (retry) {
        saveToken("");
        reviewSubmissions(false);
      }
    }
    return;
  }

  const data = jsonData.data[0];
  const status = {
    id: data.id,
    submittedDate: data.attributes.submittedDate,
    state: data.attributes.state,
  };
  console.log(JSON.stringify(status));
}

function reviewSubmissions(retry) {
  startLog(arguments.callee.name);

  const token = authorize();

  // https://developer.apple.com/documentation/appstoreconnectapi/get_v1_reviewsubmissions
  const options = {
    hostname: "api.appstoreconnect.apple.com",
    path: `/v1/reviewSubmissions?filter[app]=${credentials.app}&limit=1`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const callback = (res) => {
    res.on("data", (d) => parseData(d, retry));
  };

  https
    .get(options, callback)
    .on("error", (e) => console.error(`problem with request: ${e.message}`));
}

const startLog = (name) => {
  console.log(name);
};

reviewSubmissions(true);
