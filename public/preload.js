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
window.hasSeen = async function(t) {
  return await ipcRenderer.invoke("hasSeen", t.magnet, t.url, t.engine);
}

window.addSeen = function(t) {
  ipcRenderer.send("addSeen", t.magnet, t.url, t.engine);
}

// TODO: remove asSeen
