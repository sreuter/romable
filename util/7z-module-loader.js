const os = require('os');
const Zip7 = require('node-7z');
const Zip715 = require('node-7z-15');
const child = require('child_process');

const output = child.execFileSync('7z').toString();

const versionLine = output.match(/version ([0-9]+\.[0-9]+)/gi);
const versionMatch = versionLine && versionLine[0].match(/([0-9]+\.[0-9]+)/);
const version = versionMatch && parseInt(versionMatch[1], 10);

if (!version) {
  throw new Error('Cannot detect 7z version');
}

let Zip;

if (version > 14) {
  Zip = require('node-7z-15');
} else {
  Zip = require('node-7z');
}

module.exports = Zip;
