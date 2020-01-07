const path = require('path');
const os = require('os');
const fs = require('fs');

const dbfile = "db.json";
const xdgData = path.join(os.homedir(), ".local", "share", "torrentbrowser");
const dbpath = path.join(xdgData, dbfile);
const initData = {
  seen: []
};

function readDB() {
  let raw;
  if (!fs.existsSync(dbpath)) {
    raw = initData;
  } else {
    raw = fs.readFileSync(dbpath);
  }
  let json = JSON.parse(raw);
  json.seen = new Set(json.seen);
  return json;
}

// destroys d
function saveDB(d) {
  if (!fs.existsSync(dbpath)) {
    fs.mkdirSync(xdgData, {recursive: true});
  }
  d.seen = Array.from(d.seen.keys());
  fs.writeFileSync(dbpath, JSON.stringify(d));
}

module.exports = {readDB, saveDB};
