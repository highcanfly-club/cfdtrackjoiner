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

function copyFilter(fin, fout, regex, replacement){
fs.readFile(fin, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(regex, replacement);

  fs.writeFile(fout, result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
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

md('./dist');
md('./dist/js');

copyFilter('./src/module/trackjoiner.js','./dist/js/trackjoiner-dev.js',/export.*/g,'//removed export')
minify('./dist/js/trackjoiner-dev.js','./dist/js/trackjoiner.js');
minify('./src/module/fit-parser.js','./dist/js/fit-parser.js');
minify('./src/module/igc-parser.js','./dist/js/igc-parser.js');
minify('./src/module/gpx-parser.js','./dist/js/gpx-parser.js');
fs.copyFile('./public/css/blue.css','./dist/css/blue.css',callbackErr);
fs.copyFile('./public/legacy.html','./dist/legacy.html',callbackErr);
fs.copyFile('./src/module/fit-parser.js','./dist/js/fit-parser-dev.js',callbackErr);
fs.copyFile('./src/module/igc-parser.js','./dist/js/igc-parser-dev.js',callbackErr);
fs.copyFile('./src/module/gpx-parser.js','./dist/js/gpx-parser-dev.js',callbackErr);
