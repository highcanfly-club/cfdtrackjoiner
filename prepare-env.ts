// vue.config.js
import {gitlogPromise, GitlogOptions} from "gitlog"
import fs from 'fs'

// Option 1: Just use the function, returned commit type has specified fields
const commits = await gitlogPromise({
  repo: ".",
  number: 1,
  fields: ["authorDate"],
} as GitlogOptions);

fs.writeFile('./commit.json', JSON.stringify(
  { cfdtrackjoiner: (new Date(commits[0].authorDate)).toISOString(), 
  }), 
  'utf8', function (err) {
                            if (err) return console.log(err);
                          }
           );
