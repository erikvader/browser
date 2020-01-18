const {ipcRenderer, remote, shell} = require('electron');

window.remote = {
  getCurrentWindow: remote.getCurrentWindow,
  Menu: remote.Menu,
  openExternal: shell.openExternal
};

window.nfetch = require("node-fetch");
window.getGlobal = remote.getGlobal;

// TODO: remove
window.fs = require("fs");

// TODO: catch if magnet doesn't exist
window.hasSeen = function(t) {
  return ipcRenderer.sendSync("hasSeen", t.magnet, t.url, t.engine);
}

window.addSeen = function(t) {
  // TODO: run async??
  ipcRenderer.sendSync("addSeen", t.magnet, t.url, t.engine);
}

// TODO: add a remove asSeen

window.hasSeenFile = function(filename) {
  return ipcRenderer.sendSync("hasSeenFile", filename);
}
