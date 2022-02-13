/*************************************
    * Demo IGC + FIT + GPX track joiner for CFD MV (French CFD MV)
    * © Ronan LE MEILLAT
    * Totally free and 'As Is' under MIT License
**************************************/
var fs = require('fs');
var UglifyJS = require('uglify-js');
function md(dir) {
  fs.mkdirSync(dir, { recursive: true }, (err) => {
    if (err) throw err;
  });
}

function copyFilterMinify(fin, fout, fminify, regex, replacement) {
  fs.readFile(fin, 'utf8', function (err, data) {
    if (err) {
      return console.log(err);
    }
    var result = data.replace(regex, replacement);

    fs.writeFile(fout, result, 'utf8', function (err) {
      if (err) return console.log(err);
      else {
        console.log(fin + " filtered");
        minify(fout, fminify);
      }
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
function babelize(fin,fout){
  let babel = require("@babel/core");
  let t = babel.transformFileSync(fin,{presets: ["@babel/preset-env"]});
  fs.writeFileSync(fout,t.code);
}

function browserifyFile(fin, fbabelized, fout,fminified) {
  let browserify = require('browserify');
  let babel = require("@babel/core");
  let t = babel.transformFileSync(fin,{presets: ["@babel/preset-env"]});
  fs.writeFileSync(fbabelized,t.code);
  let b = browserify();
  b.add(fbabelized);
  b.bundle().pipe(fs.createWriteStream(fout,{autoClose: true}).on('close',()=>{minify(fout,fminified)}));

}

function callbackErr(err) {
  if (err) throw err;
  console.log('File copied');
}

md('./dist');
md('./dist/css');
md('./dist/js');
copyFilterMinify('./src/trackjoiner/trackjoiner.js', './dist/js/trackjoiner-dev.js', './dist/js/trackjoiner.js', /export.*/g, '//removed export');
babelize('./src/trackjoiner/fit-parser/dist/fit-parser.js','./src/trackjoiner/fit-parser/dist/fit-parser-babelized.js');
browserifyFile('./src/trackjoiner/fit-parser-legacy.js','./src/trackjoiner/fit-parser-legacy-babelized.js', './dist/js/fit-parser-dev.js', './dist/js/fit-parser.js');
browserifyFile('./src/trackjoiner/gpx-parser-legacy.js','./src/trackjoiner/gpx-parse-legacy-babelized.js', './dist/js/gpx-parser-dev.js', './dist/js/gpx-parser.js');
browserifyFile('./src/trackjoiner/igc-parser-legacy.js','./src/trackjoiner/igc-parser-legacy-babelized.js', './dist/js/igc-parser-dev.js', './dist/js/igc-parser.js');
fs.copyFile('./public/css/blue.css', './dist/css/blue.css', callbackErr);
fs.copyFile('./public/legacy.html', './dist/legacy.html', callbackErr);


