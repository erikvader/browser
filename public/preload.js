window.nfetch = require("node-fetch");

// TODO: remove
window.fs = require("fs");

const {ipcRenderer} = require('electron');

window.hasSeen = async function(t) {
  return await ipcRenderer.invoke("hasSeen", t.magnet, t.url, t.engine);
}

window.addSeen = function(t) {
  ipcRenderer.send("addSeen", t.magnet, t.url, t.engine);
}
