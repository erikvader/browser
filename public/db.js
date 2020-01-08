const path = require('path');
const os = require('os');
const fs = require('fs');
const url = require('url');

const dbfile = "db.json";
const xdgData = path.join(os.homedir(), ".local", "share", "torrentbrowser");
const dbpath = path.join(xdgData, dbfile);
const initData = {
  seen: []
};

function readDB() {
  let json;
  if (!fs.existsSync(dbpath)) {
    json = initData;
  } else {
    json = JSON.parse(fs.readFileSync(dbpath));
  }
  return json;
}

// destroys d
function saveDB(d) {
  if (!fs.existsSync(dbpath)) {
    fs.mkdirSync(xdgData, {recursive: true});
  }
  fs.writeFileSync(dbpath, JSON.stringify(d));
}

// TODO: kan tydligen finnas flera xt.1, xt.2 etc.
function magnetTopic(magnet) {
  const u = new URL(magnet);
  const t = u.searchParams.get("xt");
  if (t === null) {
    throw new Error(`magnet ${magnet} didn't have a topic`);
  }
  return t;
}

module.exports = {readDB, saveDB, magnetTopic};
