import browserify from "browserify";
import commonShakeify from "common-shakeify";
import esmify from "esmify";
import babelify from "babelify";
import UglifyJS from "uglify-js";
import gitlog from "gitlog";
import fs from "fs";
import ts from "typescript";

const STANDALONE = "./src/trackjoiner/standalone.js";
const TRACKJOINER_TS = "src/trackjoiner/trackjoiner.ts";
const TRACKJOINER = "./src/trackjoiner/trackjoiner.js";
const DEV_BUNDLE = "./dist/js/trackjoiner-bundle.js";
const LEGACY_TRACKJOINER = (process.env.CF_PAGES === "1") ? "./dist/js/trackjoiner-dev.js" : "./dist/js/trackjoiner.js";
const MIN_BUNDLE = (process.env.CF_PAGES === "1") ? "./dist/js/trackjoiner.js" : "./dist/js/trackjoiner-min.js";

const NOMORENEEDED = "n'est plus utilisé vous pouvez le supprimer de vos scripts";
const IGC_FILE = "./dist/js/igc-parser.js";
const GPX_FILE = "./dist/js/gpx-parser.js";
const FIT_FILE = "./dist/js/fit-parser.js";
const IGC_TS = "./src/trackjoiner/igc-parser/index.ts";
const IGC_JS = "./src/trackjoiner/igc-parser/index.js";
const GPX_TS = "./src/trackjoiner/gpx-parser/index.ts";
const GPX_JS = "./src/trackjoiner/gpx-parser/index.js";

function mdSync(dir) {
    fs.mkdirSync(dir, { recursive: true }, (err) => {
        if (err) throw err;
    });
}

function callbackErr(err) {
    if (err) throw err;
    console.log('File copied');
}

function minify(fin, fout) {
    return new Promise((resolve, reject) => {
        fs.readFile(fin, 'utf8', (err, data) => {
            if (err) {
                reject(console.log(err));
                return;
            }
            var result = UglifyJS.minify(data);
            if (result.code !== undefined) {
                fs.writeFile(fout, result.code, function (err) {
                    if (err) {
                        reject(console.log(err));
                    } else {
                        resolve(result);
                    }
                });
            } else {
                console.log(result.error);
                reject(result.error);
            }
        });
    })
}

function compileTypeScript(fin, fout) {
    return new Promise((resolve, reject) => {
        fs.readFile(fin, 'utf8', function (err, data) {
            if (err) {
                reject(console.log(err));
            }
            let result = ts.transpileModule(data, { compilerOptions: { esModuleInterop: true} }).outputText;
            fs.writeFile(fout, result, 'utf8', function (err) {
                if (err) reject(console.log(err));
                else {
                    resolve(result);
                }
            });
        });
    })
}

const commits = gitlog.default({
    repo: ".",
    number: 1,
    fields: ["authorDate"],
});

mdSync('./dist');
mdSync('./dist/css');
mdSync('./dist/js');
fs.copyFile('./public/css/blue.css', './dist/css/blue.css', callbackErr);
fs.copyFile('./public/legacy.html', './dist/legacy.html', callbackErr);
fs.copyFile('./public/legacy2.html', './dist/legacy2.html', callbackErr);

console.log(`compiling ${TRACKJOINER} and create bundle ${DEV_BUNDLE}`);
Promise.all([
    compileTypeScript(TRACKJOINER_TS, TRACKJOINER),
    compileTypeScript(IGC_TS, IGC_JS),
    compileTypeScript(GPX_TS, GPX_JS)
]).then(() => {
    browserify({ standalone: "Trackjoiner" })
        .add(TRACKJOINER)
        // .plugin(tsify, { noImplicitAny: false, debug: true, target: "es6" })
        .plugin(esmify)
        .plugin(commonShakeify)
        .transform(babelify, { presets: ["@babel/preset-env"], extensions: ['.jsx', '.js', '.tsx', '.ts'] })
        .bundle()
        .pipe(fs.createWriteStream(DEV_BUNDLE, { autoClose: true }))
        .on('error', function (error) { console.error(error.toString()); })
        .on('close', () => {
            let bundle = fs.readFileSync(DEV_BUNDLE, { encoding: 'utf8', flag: 'r' });
            let standalone = fs.readFileSync(STANDALONE, { encoding: 'utf8', flag: 'r' });
            let trackjoiner = `${bundle}\n${standalone}\nconsole.log("Trackjoiner v:${(new Date(commits[0].authorDate)).toISOString()} ©Ronan Le Meillat, see https://github.com/eltorio/cfdtrackjoiner")`;
            fs.writeFileSync(LEGACY_TRACKJOINER, trackjoiner);
            console.log(`Minify bundle to ${MIN_BUNDLE}`);
            minify(LEGACY_TRACKJOINER, MIN_BUNDLE).then(() => {
                console.log("removed temp files");
                fs.rmSync(DEV_BUNDLE);
                fs.rmSync(IGC_JS);
                fs.rmSync(GPX_JS);
                fs.rmSync(TRACKJOINER);
                console.log("Add messages telling that old scripts are not needed anymore")
                fs.writeFileSync(IGC_FILE, `console.log("${IGC_FILE} ${NOMORENEEDED}");`);
                fs.writeFileSync(GPX_FILE, `console.log("${GPX_FILE} ${NOMORENEEDED}");`);
                fs.writeFileSync(FIT_FILE, `console.log("${FIT_FILE} ${NOMORENEEDED}");`);
            });
        });
})

