const spawn = require('cross-spawn');
const os = require('os');
const path = require('path');

const extract = (archive, dest, files) => {
  files = files || [];

  return new Promise((resolve, reject) => {
    const res = {
      cmd: '7z',
      args: [
        'e',
        archive,
        '-o' + dest,
        '-y' // assume Yes on all queries; answer yes if asked to overwrite
      ],
      options: { stdio: 'pipe' }
    };

    if (files.length > 0) {
      res.args.push(...files);
      res.args.push('-r');
    }

    const run = spawn(res.cmd, res.args, res.options);

    run.on('close', function (code) {
      if (code === 0) {
        return resolve(files.map(file => path.join(dest, file)));
      }
      return reject(code);
    });
  });
}

const list = (file) => {
  return new Promise((resolve, reject) => {
    const res = {
      cmd: '7z',
      args: [
        'l',
        '-slt',
        file
      ],
      options: { stdio: 'pipe' }
    };

    let buffer = '';
    const run = spawn(res.cmd, res.args, res.options);
    run.stdout.on('data', function (data) {
      return buffer = buffer + data.toString();
    });
    run.on('close', function (code) {
      if (code === 0) {
        return resolve(fn(buffer));
      }
      return reject(code);
    });
  });
}

const fn = (buffer) => {
  const EOL = os.EOL;
  const blocks = [];

  let tmp = null;
  let file = null;

  buffer.split(EOL).forEach(line => {
    if (line.substr(0, 4) === 'Path') {
      tmp = {};
    }
    if (tmp) {
      if (line.substr(0, 4) === 'Path') {
        tmp.name = line.substr(7);
      } else if (line.substr(0, 4) === 'Size') {
        tmp.size = parseInt(line.substr(7), 10) || 'Unknown';
      }
    }
    if (line === '') {
      if (tmp) {
        blocks.push(tmp);
      }
      tmp = null;
    }
  });

  return blocks.filter(item => {
    return !item.name.match(/7z$/);
  });
}

module.exports = {
  list: list,
  extract: extract
};