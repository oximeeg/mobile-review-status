const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");
const fs = require("fs").promises;
const path = require("path");
const process = require("process");

const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
// https://developers.google.com/gmail/api/quickstart/nodejs#authorize_credentials_for_a_desktop_application
// https://github.com/googleapis/google-api-nodejs-client/issues/2322
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

async function loadSavedCredentialsIfExist() {
  startLog(arguments.callee.name);

  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  startLog(arguments.callee.name);

  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  startLog(arguments.callee.name);

  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function searchMessages(auth) {
  startLog(arguments.callee.name);

  const gmail = google.gmail({ version: "v1", auth });

  // https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
  const res = await gmail.users.messages.list({
    userId: "me",
    maxResults: "3",
    q: "from:noreply-play-developer-console@google.com",
  });

  res.data.messages.forEach(async (message) => {
    // https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get
    const res = await gmail.users.messages.get({
      id: message.id,
      userId: "me",
    });
    console.log(res.data.snippet);
    console.log("-----");
  });
}

const startLog = (name) => {
  console.log(name);
};

authorize().then(searchMessages);
