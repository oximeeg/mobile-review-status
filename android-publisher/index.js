const { google } = require("googleapis");
const androidpublisher = google.androidpublisher("v3");
const path = require("path");

const SCOPES = ["https://www.googleapis.com/auth/androidpublisher"];
// https://docs.fastlane.tools/actions/supply/#setup
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

const packageName = "";

async function auth() {
  startLog(arguments.callee.name);

  // https://github.com/googleapis/google-api-nodejs-client#service-account-credentials
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: SCOPES,
  });

  const authClient = await auth.getClient();
  google.options({ auth: authClient });
}

async function insert() {
  startLog(arguments.callee.name);

  const res = await androidpublisher.edits.insert({
    packageName,
  });

  endLog(res);

  return res.data.id;
}

async function tracksList(editId) {
  startLog(arguments.callee.name);

  // https://developers.google.com/android-publisher/api-ref/rest/v3/edits.tracks/list
  const res = await androidpublisher.edits.tracks.list({
    editId,
    packageName,
  });

  endLog(res);
}

async function abortEdit(editId) {
  startLog(arguments.callee.name);

  const res = await androidpublisher.edits.delete({
    editId,
    packageName,
  });

  endLog(res);
}

const startLog = (name) => {
  console.log(name);
};

const endLog = (res) => {
  console.log(JSON.stringify(res.data, null, 2));
  console.log(`-----`);
};

async function main() {
  await auth();
  // https://developers.google.com/android-publisher/edits#workflow
  const editId = await insert();
  await tracksList(editId);
  await abortEdit(editId);
}

main();
