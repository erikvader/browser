const path = require('path');
const fs = require('fs');
const {app} = require('electron');

const dbfile = "db.json";
const xdgData = app.getPath('userData');
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

function saveDB(d) {
  if (!fs.existsSync(dbpath)) {
    fs.mkdirSync(xdgData, {recursive: true});
  }
  fs.writeFileSync(dbpath, JSON.stringify(d));
}

function backupDB() {
  if (fs.existsSync(dbpath)) {
    fs.copyFileSync(dbpath, dbpath + ".bak");
  }
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

module.exports = {backupDB, readDB, saveDB, magnetTopic};
