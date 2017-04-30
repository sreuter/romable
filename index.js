'non strict';

const pug = require('pug');
const pathUtil = require('path');
const express = require('express');
const serveStatic = require('serve-static')
const async = require('async');
const filewalker = require('filewalker');
const Zip7 = require('node-7z');

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
  async.eachOf(directoryList, (stat, path, cb) => {
    if(path.match(/\.7z$/)) {
      delete(directoryList[path]);
      expandZip7(path, (err, expandedZip7List) => {
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
  }, cb);
}

const app = express();
app.set('view engine', 'pug');
app.use(serveStatic('data/', {index: false}))

app.get('/', (req, res) => {
  getDirectoryList('/Users/sreuter/Desktop/S', (err, directoryList) => {
    expandDirectoryList(directoryList, (err, expandedDirectoryList) => {
      if(err) {
        console.error(err);
      } else {
        res.render('index', { roms: directoryList});
      }
    });
  });
});

app.listen(8000);