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

window.hasSeen = function(t) {
  return ipcRenderer.sendSync("hasSeen", t.magnet, t.url, t.engine);
}

window.addSeen = function(t) {
  // TODO: run async??
  ipcRenderer.sendSync("addSeen", t.magnet, t.url, t.engine);
}

window.removeSeen = function(t) {
  ipcRenderer.sendSync("removeSeen", t.magnet, t.url, t.engine);
}

window.hasSeenFile = function(filename) {
  return ipcRenderer.sendSync("hasSeenFile", filename);
}

window.rebuildIndex = async function() {
  await ipcRenderer.invoke("rebuildIndex");
}

window.delugeDownload = async function(magnet, dir) {
  await ipcRenderer.invoke("delugeDownload", magnet, dir);
}
