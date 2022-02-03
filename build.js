/*************************************
    * Demo IGC + FIT + GPX track joiner for CFD MV (French CFD MV)
    * © Ronan LE MEILLAT
    * Totally free and 'As Is' under MIT License
**************************************/

var fs = require('fs')
var UglifyJS = require('uglify-js');

function md(dir) {
  fs.mkdirSync(dir, { recursive: true }, (err) => {
    if (err) throw err;
  });
}

function minify(fin, fout) {
  fs.readFile(fin, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return;
    }
    var result = UglifyJS.minify(data);
    fs.writeFile(fout, result.code, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("File " + fout + " was successfully saved.");
      }
    });
  });
}

function callbackErr(err) {
  if (err) throw err;
  console.log('File copied');
}

md('./build');
md('./dist/js');
md('./dist/css');
minify('./cfdmv/js/trackjoiner.js','./dist/js/trackjoiner.js');
minify('./cfdmv/js/fit-parser.js','./dist/js/fit-parser.js');
minify('./cfdmv/js/igc-parser.js','./dist/js/igc-parser.js');
minify('./cfdmv/js/gpx-parser.js','./dist/js/gpx-parser.js');
fs.copyFile('./cfdmv/index.html','./dist/index.html',callbackErr);
fs.copyFile('./cfdmv/css/blue.css','./dist/css/blue.css',callbackErr);
fs.copyFile('./cfdmv/js/trackjoiner.js','./dist/js/trackjoiner-dev.js',callbackErr);
fs.copyFile('./cfdmv/js/fit-parser.js','./dist/js/fit-parser-dev.js',callbackErr);
fs.copyFile('./cfdmv/js/igc-parser.js','./dist/js/igc-parser-dev.js',callbackErr);
fs.copyFile('./cfdmv/js/gpx-parser.js','./dist/js/gpx-parser-dev.js',callbackErr);
