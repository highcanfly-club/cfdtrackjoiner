// vue.config.js
const gitlog = require("gitlog").default;
const fs = require('fs');

// Option 1: Just use the function, returned commit type has specified fields
const commits = gitlog({
  repo: ".",
  number: 1,
  fields: ["authorDate"],
});

process.env.VUE_APP_GIT_TRACKJOINER_LAST_COMMIT = new Date(commits[0].authorDate);

fs.writeFile('./commit.json', JSON.stringify(
  { cfdtrackjoiner: (new Date(commits[0].authorDate)).toISOString(), 
  }), 
  'utf8', function (err) {
                            if (err) return console.log(err);
                          }
           );

module.exports = {
  pages:{
    index:{
      entry:'src/main.js'
    }
  },
  runtimeCompiler: true,
  configureWebpack: {
    devtool: process.env.CF_PAGES==='1'?false:'eval-source-map',
    resolve: {
      fallback: {
        "fs": false,
        "http": require.resolve("stream-http"),
        "https": require.resolve("https-browserify"),
        "timers": require.resolve("timers-browserify"),
        "stream": require.resolve("stream-browserify")
      }
    }
  },

};
