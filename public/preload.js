const fs = require("fs");
const os = require("os");
const {ipcRenderer, remote, shell} = require('electron');

window.remote = {
  getCurrentWindow: remote.getCurrentWindow,
  Menu: remote.Menu,
  openExternal: shell.openExternal
};

window.delugeDirs = function() {
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
}();

window.nfetch = require("node-fetch");

// TODO: remove
window.fs = require("fs");

// TODO: catch if magnet doesn't exist
window.hasSeen = async function(t) {
  return await ipcRenderer.invoke("hasSeen", t.magnet, t.url, t.engine);
}

window.addSeen = function(t) {
  ipcRenderer.send("addSeen", t.magnet, t.url, t.engine);
}

// TODO: remove asSeen
