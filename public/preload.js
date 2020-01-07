window.nfetch = require("node-fetch");

// TODO: remove
window.fs = require("fs");

const {ipcRenderer} = require('electron');

window.hasSeen = async function(arg) {
  return await ipcRenderer.invoke("hasSeen", arg);
}

window.addSeen = function(arg) {
  ipcRenderer.send("addSeen", arg);
}
