/*************************************
    * Demo IGC + FIT + GPX track joiner for CFD MV (French CFD MV)
    * © Ronan LE MEILLAT
    * Totally free and 'As Is' under MIT License
**************************************/

const ts = require("typescript");
const babel = require("@babel/core");
const fs = require('fs');
const UglifyJS = require('uglify-js');

function compileTypeScript(fin, fout) {
  return new Promise((resolve, reject) => {
    fs.readFile(fin, 'utf8', function (err, data) {
      if (err) {
        reject(console.log(err));
      }
      let result = ts.transpileModule(data, {}).outputText;
      fs.writeFile(fout, result, 'utf8', function (err) {
        if (err) reject(console.log(err));
        else {
          resolve(result);
        }
      });
    });
  })
}

function mdSync(dir) {
  fs.mkdirSync(dir, { recursive: true }, (err) => {
    if (err) throw err;
  });
}

function copyFilterMinify(fin, fout, fminify, regex, replacement) {
  return new Promise((resolve, reject) => {
    fs.readFile(fin, 'utf8', function (err, data) {
      if (err) {
        reject(console.log(err));
      }
      var result = data.replace(regex, replacement);

      fs.writeFile(fout, result, 'utf8', function (err) {
        if (err) reject(console.log(err));
        else {
          console.log(fin + " filtered");
          resolve(minify(fout, fminify));
        }
      });
    });
  })
}

function minify(fin, fout) {
  return new Promise((resolve, reject) => {
    fs.readFile(fin, 'utf8', (err, data) => {
      if (err) {
        reject(console.log(err));
        return;
      }
      var result = UglifyJS.minify(data);
      fs.writeFile(fout, result.code, function (err) {
        if (err) {
          reject(console.log(err));
        } else {
          resolve(result);
        }
      });
    });
  })
}

function babelize(fin, fout) {
  let t = babel.transformFileSync(fin, { presets: ["@babel/preset-env"] });
  fs.writeFileSync(fout, t.code);
}

function browserifyFile(fin, fbabelized, fout, fminified) {
  return new Promise((resolve) => {
    let browserify = require('browserify');
    let babel = require("@babel/core");
    let t = babel.transformFileSync(fin, { presets: ["@babel/preset-env"] });
    fs.writeFileSync(fbabelized, t.code);
    let b = browserify();
    b.add(fbabelized);
    b.bundle().pipe(fs.createWriteStream(fout, { autoClose: true }).on('close', () => {
      resolve(minify(fout, fminified));
    }));
  })

}

function callbackErr(err) {
  if (err) throw err;
  console.log('File copied');
}

mdSync('./dist');
mdSync('./dist/css');
mdSync('./dist/js');
fs.copyFile('./public/css/blue.css', './dist/css/blue.css', callbackErr);
fs.copyFile('./public/legacy.html', './dist/legacy.html', callbackErr);

babelize('./src/trackjoiner/fit-parser/dist/fit-parser.js', './src/trackjoiner/fit-parser/dist/fit-parser-babelized.js');
copyFilterMinify('./src/trackjoiner/trackjoiner.js', './dist/js/trackjoiner-dev.js', './dist/js/trackjoiner.js', /export.*/g, '//removed export');

compileTypeScript('./src/trackjoiner/igc-parser/index.ts', './src/trackjoiner/igc-parser/index.js')
  .then(() => {
    console.log('transpiled igc from typescript to javascript');
    browserifyFile('./src/trackjoiner/igc-parser-legacy.js', './src/trackjoiner/igc-parser-legacy-babelized.js', './dist/js/igc-parser-dev.js', './dist/js/igc-parser.js')
      .then(() => {
        console.log('browserified igc to ./dist/js/igc-parser.js');
        fs.rmSync('./src/trackjoiner/igc-parser/index.js');
        console.log('deleted ./src/trackjoiner/igc-parser/index.js');
      });
  });
  
browserifyFile('./src/trackjoiner/fit-parser-legacy.js', './src/trackjoiner/fit-parser-legacy-babelized.js', './dist/js/fit-parser-dev.js', './dist/js/fit-parser.js')
  .then(() => {
    console.log('browserified fit to ./dist/js/fit-parser.js');
  });

browserifyFile('./src/trackjoiner/gpx-parser-legacy.js', './src/trackjoiner/gpx-parse-legacy-babelized.js', './dist/js/gpx-parser-dev.js', './dist/js/gpx-parser.js')
.then(() => { 
  console.log('browserified gpx to ./dist/js/gpx-parser.js');
 });


