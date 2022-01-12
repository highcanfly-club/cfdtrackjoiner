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
md('./build/js');
md('./build/css');
minify('./cfdmv/js/trackjoiner.js','./build/js/trackjoiner.js');
minify('./cfdmv/js/fit-parser.js','./build/js/fit-parser.js');
minify('./cfdmv/js/igc-parser.js','./build/js/igc-parser.js');
minify('./cfdmv/js/gpx-parser.js','./build/js/gpx-parser.js');
fs.copyFile('./cfdmv/index.html','./build/index.html',callbackErr);
fs.copyFile('./cfdmv/css/blue.css','./build/css/blue.css',callbackErr);
fs.copyFile('./cfdmv/js/trackjoiner.js','./build/js/trackjoiner-dev.js',callbackErr);
fs.copyFile('./cfdmv/js/fit-parser.js','./build/js/fit-parser-dev.js',callbackErr);
fs.copyFile('./cfdmv/js/igc-parser.js','./build/js/igc-parser-dev.js',callbackErr);
fs.copyFile('./cfdmv/js/gpx-parser.js','./build/js/gpx-parser-dev.js',callbackErr);
