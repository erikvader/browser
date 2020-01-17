const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const {app} = require('electron');
const os = require('os');

const dbfile = "db.json";
const xdgData = app.getPath('userData');
const dbpath = path.join(xdgData, dbfile);
const initData = {
  seen: [],
  files: {}
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

function getDelugeDirs() {
  const coreconf = os.homedir() + "/.config/deluge/core.conf";
  if (fs.existsSync(coreconf)) {
    const content = fs.readFileSync(coreconf, "UTF-8");
    let stack = ['}'];
    let actualJson = null;
    if (content[0] !== '{') {
      console.error("deluge core.conf not formatted as expected, didn't start with a '{'");
      return [];
    }
    for (let i = 1; i < content.length; i++) {
      const c = content[i];
      if (c === '{') {
        stack.push('}')
      } else if (stack[stack.length - 1] === c) {
        stack.pop();
        if (stack.length === 0) {
          actualJson = content.substring(i+1);
          break;
        }
      }
    }
    if (actualJson === null || stack.length !== 0) {
      console.error("something weird happened in the parsing of core.conf");
      return [];
    }
    return JSON.parse(actualJson)["download_location_paths_list"];
  }
  return [];
}

async function findFilesIn(dirs) {
  let queue = dirs.slice();
  let lookup = {};

  while (queue.length > 0) {
    const dir = queue.pop();
    let dirContents;
    try {
      dirContents = await fsp.readdir(dir);
    } catch(err) {
      if (err.errno === -2) {
        console.warn("No such file or directory '%s'", dir);
        continue;
      } else {
        throw err;
      }
    }

    for (const name of dirContents) {
      const fullpath = path.join(dir, name);
      const stat = await fsp.stat(fullpath);

      if (stat.isDirectory()) {
        queue.push(fullpath);
      } else if (stat.isFile()) {
        if (name in lookup) {
          lookup[name].push(fullpath);
        } else {
          lookup[name] = [fullpath];
        }
      }
    }
  }
  return lookup;
}

module.exports = {backupDB, readDB, saveDB, magnetTopic, getDelugeDirs, findFilesIn};
