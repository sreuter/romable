'use strict';

const url = require('url');
const path = require('path');
const helper = require('./helper');
const pug = require('electron-pug')({pretty: true}, {});
const {app, protocol, dialog, BrowserWindow} = require('electron');

let win;

function createWindow () {

  var directory = dialog.showOpenDialog({
    message: 'Select ROMs Folder',
    title: 'Select ROMs Folder',
    buttonLabel: 'Scan',
    properties: ['openDirectory']
  });

  if(! directory) return;

  helper.getDirectoryList(directory[0], (err, directoryList) => {
    helper.expandDirectoryList(directoryList, (err, expandedDirectoryList) => {
      if(err) {
        dialog.showErrorBox('Scan failed', 'An unknown error occured while scanning directory.');
        console.error(err);
      } else {
        global.sharedData = {
          directoryList: directoryList
        };
        win = new BrowserWindow({width: 800, height: 600});
        win.loadURL(url.format({
          pathname: path.join(__dirname, './views/index.pug'),
          protocol: 'file:',
          slashes: true
        }));
        win.webContents.openDevTools();
          win.on('closed', () => {
          win = null;
        });
      }
    });
  });
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});