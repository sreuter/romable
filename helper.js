'use strict';

const async = require('async');
const filewalker = require('filewalker');
const SevenZip = require('./SevenZip.js');
const pathUtil = require('path');

const ignoreList = ['.DS_Store'];

const getDirectoryList = (dir, cb) => {
  let directoryList = {};
  filewalker(dir)
  .on('dir', (path) => {
    //console.log('dir:  %s', path);
  })
  .on('file', (path, stat, absolutePath) => {
    if(! ignoreList.indexOf(path)) return;
    directoryList[absolutePath] = {
      size: stat.size,
      name: pathUtil.basename(absolutePath),
      source: 'file'
    }
  })
  .on('error', (err) => {
    cb(err);
  })
  .on('done', () => {
    cb(null, directoryList);
    //console.log('%d dirs, %d files, %d bytes', this.dirs, this.files, this.bytes);
  })
  .walk();
}

const expandZip7 = (path, cb) => {
  let expandedZip7List = {};
  SevenZip.list(path)
  .then((data) => {
    console.log(data);
    data.forEach((file, index) => {
      let fullPath = [path, file.name].join(';;;;;');
      expandedZip7List[fullPath] = {
        size: file.size,
        name: file.name,
        source: '7z'
      };
    });

    cb(null, expandedZip7List);
  })
  .catch((err) => {
    cb(err);
  });
}

const expandDirectoryList = (directoryList, cb) => {
  async.eachOfLimit(directoryList, 8, (stat, path, cb) => {
    // Make things work with large folders / call stacks
    setTimeout(function() {
      if(path.match(/\.7z$/)) {
        console.log('Expanding ' + path);
        delete(directoryList[path]);
        expandZip7(path, (err, expandedZip7List) => {
          console.log(expandedZip7List)
          for(let entry in expandedZip7List) {
            directoryList[entry] = expandedZip7List[entry];
          }
          cb();
        });
      } else {
        cb();
      }
    }, 0 );
  }, cb);
}

module.exports = {
  getDirectoryList: getDirectoryList,
  expandDirectoryList: expandDirectoryList
}
