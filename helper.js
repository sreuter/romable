'use strict';

const async = require('async');
const filewalker = require('filewalker');
const Zip7 = require('node-7z');
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
      name: pathUtil.basename(absolutePath)
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
  const zip7 = new Zip7();
  zip7.test(path)
  .progress((files) => {
    for(let zip7Path in files) {
      let fullPath = pathUtil.join(path, files[zip7Path]);
      expandedZip7List[fullPath] = {};
    }
  })
  .then(() => {
    cb(null, expandedZip7List);
  })
  .catch((err) => {
    cb(err);
  })
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
            directoryList[entry] = {
              size: 'expanded',
              name: pathUtil.basename(entry)
            }
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