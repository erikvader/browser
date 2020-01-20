// Modules to control application life and create native browser window
const {shell, app, BrowserWindow} = require('electron')
const path = require('path')
const isDev = require('electron-is-dev')
const {ipcMain} = require('electron');
const dbjs = require('./db');

let db = dbjs.readDB();
let magnets = new Set(db.seen.map(mue => dbjs.magnetTopic(mue.magnet)));
let urls = new Set(db.seen.map(mue => mue.engine + ":" + mue.url));

global.delugeDirs = dbjs.getDelugeDirs();

let isFindingLocalFiles = false;
async function findAllLocalFiles() {
  if (isFindingLocalFiles) return;
  isFindingLocalFiles = true;
  try {
    db.files = await dbjs.findFilesIn(global.delugeDirs);
  } catch (err) {
    console.error(err);
  } finally {
    isFindingLocalFiles = false;
  }
}

if (Object.entries(db.files).length === 0) {
  findAllLocalFiles();
}

ipcMain.on("addSeen", (event, magnet, url, engine) => {
  if (typeof magnet !== "string" || typeof url !== "string" || typeof engine !== "string") {
    throw new Error(`can't addSeen on ${magnet}, ${url}, ${engine}`);
  }
  // TODO: checka så att den inte redan finns?
  db.seen.push({magnet, url, engine});
  magnets.add(dbjs.magnetTopic(magnet));
  urls.add(engine + ":" + url);
  event.returnValue = null;
});

ipcMain.on("removeSeen", (event, magnet, url, engine) => {
  const ind = db.seen.findIndex(s => s.magnet === magnet && s.url === url && s.engine === engine);
  if (ind >= 0) {
    db.seen.splice(ind, 1);
    magnets.delete(dbjs.magnetTopic(magnet));
    urls.delete(engine + ":" + url);
  }
  event.returnValue = null;
});

ipcMain.on("hasSeen", (event, magnet, url, engine) => {
  let res = {magnet: false, url: false};
  if (magnet !== null) {
    res.magnet = magnets.has(dbjs.magnetTopic(magnet));
  }
  if (url !== null) {
    res.url = urls.has(engine + ":" + url);
  }
  event.returnValue = res;
});

ipcMain.handle("rebuildIndex", async (event) => {
  await findAllLocalFiles();
});

ipcMain.on("hasSeenFile", (event, filename) => {
  if (filename in db.files) {
    event.returnValue = db.files[filename];
  } else {
    event.returnValue = [];
  }
});

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
      // nodeIntegration: true
    }
  })

  // mainWindow.removeMenu()

  // and load the index.html of the app.
  // mainWindow.loadFile('index.html')
  mainWindow.loadURL(isDev ?
                     'http://localhost:3000/' :
                     `file://${path.join(__dirname, "index.html")}`
                    )

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  let webContents = mainWindow.webContents;
  const handleRedirect = function(event, url){
    event.preventDefault();
    shell.openExternal(url);
  };
  webContents.on('new-window', handleRedirect);
  // webContents.on('will-navigate', handleRedirect);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin')
  dbjs.backupDB();
  dbjs.saveDB(db);
  app.quit();
})

// app.on('activate', function () {
//   // On macOS it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (mainWindow === null) createWindow()
// })

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
