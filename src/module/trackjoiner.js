/*************************************
    * Demo IGC + FIT + GPX track joiner for CFD MV (French CFD MV)
    * © Ronan LE MEILLAT
    * Totally free and 'As Is' under MIT License
    * IGC Parser is adapted from Tobias Bieniek's project https://github.com/Turbo87/igc-parser (MIT license)
    * FIT Parser is adapted from Dimitrios Kanellopoulos's project https://github.com/jimmykane/fit-parser (MIT license)
    * GPX Parser is adapted from Thibault Taillandier's project https://github.com/Wilkins/gpx-parse (Apache 2.0 license)
*/
/* eslint-disable */

const IGCParser = window.IGCParser;
const FitParser = window.FitParser;
const GPXParser = window.GPXParser;
const nanoDB_name = "cfdmv_db";
const _DEFAULT_GLIDER_TYPE = "UNKOWN";
const IGC_GLIDER_TYPE = "TO-BE-FILLED";
const FIT_DEFAULT_GLIDER_TYPE = "FIT-GLIDER";
var igc_glider_type = IGC_GLIDER_TYPE;

const trackTypes = { FLY: 'F', HIKE: 'H', MIXED: '' };

//still no XOR in EMEA JavaScript
var ansiXOR = function (a, b) {
  return (a || b) && !(a && b);
}

//basic Iso date creation from IGC file
var igcDate2ISO8601 = function (igcDate, igcTime) {
  var jsDate = igcDate + "T" + igcTime + "Z";
  return jsDate;
};

// Insert on IGC track parsed with IGCParser
// header goes in tracks , gps points in fixes
var insertIGCTrackInDB = function (igcTrack, hashHex, fileName, trackType, onDBInsertOKCallback) {
  var igcDate = igcTrack.date;
  igc_glider_type = ((typeof (igcTrack.gliderType) != "undefined") && (igcTrack.gliderType.length > 0)) ? igcTrack.gliderType : IGC_GLIDER_TYPE;
  var isoDt_start = new Date(igcTrack.fixes[0].timestamp);
  var unixTs_start = isoDt_start.getTime();
  var isoDt_end = new Date(igcTrack.fixes[igcTrack.fixes.length - 1].timestamp);
  var unixTs_end = isoDt_end.getTime();
  nSQL().useDatabase(nanoDB_name);
  nSQL("tracks")
    .query("upsert", [{ id: hashHex, dt_start: isoDt_start, ts_start: unixTs_start, dt_end: isoDt_end, ts_end: unixTs_end, nb_fixes: igcTrack.fixes.length, name: fileName, type: trackType, gliderType: igc_glider_type }])
    .exec().then(() => {
      onDBInsertOKCallback();
    }).catch((error) => {
      console.log(error.toString());
    });
  for (var i = 0; i < igcTrack.fixes.length; i++) {
    if (igcTrack.fixes[i].valid) {
      // fill pressureAltitude with gpsAltitude if empty, this is for filling the DB in the preciseAltitude field
      if (typeof (igcTrack.fixes[i].pressureAltitude) == "undefined" || igcTrack.fixes[i].pressureAltitude == null) {
        igcTrack.fixes[i].pressureAltitude = igcTrack.fixes[i].gpsAltitude;
      }
      nSQL("fixes")
        .query("upsert", [{
          track_id: hashHex,
          point: { lat: igcTrack.fixes[i].latitude, lon: igcTrack.fixes[i].longitude },
          gpsAltitude: igcTrack.fixes[i].gpsAltitude,
          preciseAltitude: igcTrack.fixes[i].pressureAltitude,
          dt: new Date(igcTrack.fixes[i].timestamp).toISOString(),
          ts: igcTrack.fixes[i].timestamp,
          type: trackType //WIP use IGC for hike
        }])
        .exec().then(() => {
          //OK
        }).catch((error) => {
          console.log(error.toString());
        });
    }
  }

};

// Insert on GPX track parsed with GPXParser (data.tracks[0].segments[0])
// header goes in tracks , gps points in fixes
var insertGPXTrackInDB = function (gpxTrack, hashHex, fileName, trackType, onDBInsertOKCallback) {
  var gpxDate = gpxTrack[0].time;
  var isoDt_start = gpxTrack[0].time;
  var unixTs_start = isoDt_start.getTime();
  var isoDt_end = gpxTrack[gpxTrack.length - 1].time;
  var unixTs_end = isoDt_end.getTime();
  nSQL().useDatabase(nanoDB_name);
  nSQL("tracks")
    .query("upsert", [{ id: hashHex, dt_start: isoDt_start, ts_start: unixTs_start, dt_end: isoDt_end, ts_end: unixTs_end, nb_fixes: gpxTrack.length, name: fileName, type: trackType, gliderType: "" }])
    .exec().then(() => {
      onDBInsertOKCallback();
    }).catch((error) => {
      console.log(error.toString());
    });
  for (var i = 0; i < gpxTrack.length; i++) {

    nSQL("fixes")
      .query("upsert", [{
        track_id: hashHex,
        point: { lat: gpxTrack[i].lat, lon: gpxTrack[i].lon },
        gpsAltitude: gpxTrack[i].elevation,
        preciseAltitude: gpxTrack[i].elevation,
        dt: gpxTrack[i].time.toISOString(),
        ts: gpxTrack[i].time.getTime(),
        type: trackType //WIP use IGC for hike
      }])
      .exec().then(() => {
        //OK
      }).catch((error) => {
        console.log(error.toString());
      });


  }
};

// Insert on FIT track parsed with FITParser
// header goes in tracks , gps points in fixes
// TO BE CHECKED :
// the only altitude my Fenix 6 gives is "enhanced_altitude" not sure all watches have this field
// TO DO : find a basic watch without barometer for seing wich altitude it gives
var insertFITTrackInDB = function (fitTrack, hashHex, fileName, trackType, onDBInsertOKCallback) {
  var unixTs_start = fitTrack.records[0].timestamp.getTime();
  var unixTs_end = fitTrack.records[fitTrack.records.length - 1].timestamp.getTime();
  nSQL().useDatabase(nanoDB_name);
  nSQL("tracks")
    .query("upsert", [{ id: hashHex, dt_start: fitTrack.records[0].timestamp, ts_start: unixTs_start, dt_end: fitTrack.records[fitTrack.records.length - 1].timestamp, ts_end: unixTs_end, nb_fixes: fitTrack.records.length, name: fileName, type: trackType, gliderType: FIT_DEFAULT_GLIDER_TYPE }])
    .exec().then(() => {
      onDBInsertOKCallback();
    }).catch((error) => {
      console.log(error.toString());
    });
  for (var i = 0; i < fitTrack.records.length; i++) {
    var gpsAltitude = (typeof (fitTrack.records[i].enhanced_altitude) != "undefined") ? fitTrack.records[i].enhanced_altitude : fitTrack.records[i].altitude;
    nSQL("fixes")
      .query("upsert", [{
        track_id: hashHex,
        point: { lat: fitTrack.records[i].position_lat, lon: fitTrack.records[i].position_long },
        gpsAltitude: gpsAltitude,
        preciseAltitude: fitTrack.records[i].enhanced_altitude,
        dt: fitTrack.records[i].timestamp.toISOString(),
        ts: fitTrack.records[i].timestamp.getTime(),
        type: trackType // WIP use FIT for fly
      }])
      .exec().then(() => {
        //OK
      }).catch((error) => {
        console.log(error.toString());
      });
  }
};

// basic path removal (works for windows/unices)
var getFileName = function (fullPath) {
  return fullPath.replace(/^.*[\\\/]/, '');
};

// basic file Extension (return file name if there is no extension) // TODO better handling
var getFileExtension = function (fileName) {
  return fileName.split('.').pop().split(/\#|\?/)[0].toUpperCase();
};

// CryptoJS  needs word array so this is an optimized conversion
var arrayBufferToWordArray = function (ab) {
  var i8a = new Uint8Array(ab);
  var a = [];
  for (var i = 0; i < i8a.length; i += 4) {
    a.push(i8a[i] << 24 | i8a[i + 1] << 16 | i8a[i + 2] << 8 | i8a[i + 3]);
  }
  return CryptoJS.lib.WordArray.create(a, i8a.length);
};

// Single file reception (with on FileReader), on event:load parse and insert in DB
var openIGCFileTreatSingle = function (file, trackType, onDBInsertOKCallback) {
  var reader = new FileReader();
  reader.addEventListener("load", function (event) {
    var igcFile = event.target;
    var text = igcFile.result;
    var fileName = getFileName(file.name);
    var hash = CryptoJS.SHA256(text);
    var hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log("fileName:" + fileName + "\n" + igcFile.result.substring(0, 200) + "\nLXSB Last 100 chars\n" + igcFile.result.slice(-100));
    insertIGCTrackInDB(IGCParser.parse(text), hashHex, fileName, trackType, onDBInsertOKCallback);
  });
  reader.readAsText(file);
};

// Basically creates one openIGCFileTreatSingle per file (on multiple selection)
var openIGCFile = function (event, trackType, onDBInsertOKCallback) {
  var input = event.target;
  var files = input.files;

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    openIGCFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }

};

// Single file reception (with on FileReader), on event:load parse and insert in DB
var openFITFileTreatSingle = function (file, trackType, onDBInsertOKCallback) {
  var fitParser = new FitParser({
    force: true,
    speedUnit: 'km/h',
    lengthUnit: 'm',
    temperatureUnit: 'celcius',
    elapsedRecordField: true,
    mode: 'list',
  });
  var reader = new FileReader();
  reader.addEventListener("load", function (event) {
    var fitFile = event.target;
    var blob = fitFile.result;
    var fileName = getFileName(file.name);
    var hash = CryptoJS.SHA256(arrayBufferToWordArray(blob));
    var hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log(fileName);
    fitParser.parse(blob, function (error, data) {
      // Handle result of parse method
      if (error) {
        console.log(error);
      } else {
        insertFITTrackInDB(data, hashHex, fileName, trackType, onDBInsertOKCallback);
      }
    });
  });
  reader.readAsArrayBuffer(file);
}

// Basically creates one openFITFileTreatSingle per file (on multiple selection)
var openFITFile = function (event, trackType, onDBInsertOKCallback) {
  var input = event.target;
  var files = input.files;

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    openFITFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};

// Single file reception (with on FileReader), on event:load parse and insert in DB
var openGPXFileTreatSingle = function (file, trackType, onDBInsertOKCallback) {
  var reader = new FileReader();
  reader.addEventListener("load", function (event) {
    var gpxFile = event.target;
    var gpxText = gpxFile.result;
    var fileName = getFileName(file.name);
    var hash = CryptoJS.SHA256(gpxText);
    var hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log(fileName);
    GPXParser.parseGpx(gpxText, function (error, data) {
      var gpxTrack = data.tracks[0].segments[0]; // TODO Allow multitrack
      insertGPXTrackInDB(gpxTrack, hashHex, fileName, trackType, onDBInsertOKCallback);
    });
  });
  reader.readAsText(file);
}

//  Single file reception (with on FileReader), on event:load parse and insert in DB
// Generic version
var openFileTreatSingle = function (file, trackType, onDBInsertOKCallback) {
  var reader = new FileReader();
  var fileName = getFileName(file.name);
  var fileExtension = getFileExtension(fileName);
  reader.addEventListener("load", function (event) {
    var trackFile = event.target;
    var fileContent = trackFile.result;
    var hash = (fileExtension == "FIT") ? CryptoJS.SHA256(arrayBufferToWordArray(fileContent)) : CryptoJS.SHA256(fileContent); // FIT format is binay
    var hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log(fileName);
    switch (fileExtension) {
      case "FIT":
        var fitParser = new window.FitParser({
          force: true,
          speedUnit: 'km/h',
          lengthUnit: 'm',
          temperatureUnit: 'celcius',
          elapsedRecordField: true,
          mode: 'list',
        });
        fitParser.parse(fileContent, function (error, data) {
          // Handle result of parse method
          if (error) {
            alert("Une erreur s'est produite : FITParser "+error.message);
            console.log(error);
          } else {
            insertFITTrackInDB(data, hashHex, fileName, trackType, onDBInsertOKCallback);
          }
        });
        break;
      case "IGC":
        insertIGCTrackInDB(window.IGCParser.parse(fileContent), hashHex, fileName, trackType, onDBInsertOKCallback);
        break;
      case "GPX":
        window.GPXParser.parseGpx(fileContent, function (error, data) {
          if (data != null) {
            var gpxTrack = data.tracks[0].segments[0]; // TODO Allow multitrack
            insertGPXTrackInDB(gpxTrack, hashHex, fileName, trackType, onDBInsertOKCallback);
          } else {
            alert("Une erreur s'est produite : GPXParser "+error.message);
            console.log ("GPXParser "+error.message);
            console.log (error);
          }
        });
        break;
      default:
      //TODO don't do nothing !
    }
  });
  if (fileExtension == "FIT") {
    reader.readAsArrayBuffer(file);   // Fit files are binary so should get a byte array
  } else if ((fileExtension == "GPX") || (fileExtension == "IGC")) {
    reader.readAsText(file);          // GPX and IGC are text files
  } else {
    // TODO don't do nothing !!
  }
}

// Basically creates one openGPXFileTreatSingle per file (on multiple selection)
var openFile = function (event, trackType, onDBInsertOKCallback) {
  var input = event.target;
  var files = input.files;

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    openFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};

// Basically creates one openGPXFileTreatSingle per file (on multiple selection)
var openGPXFile = function (event, trackType, onDBInsertOKCallback) {
  var input = event.target;
  var files = input.files;

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    openGPXFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};
// drop DB if exists (on some browser even in-memory persists)
// next creates the 2 tables in memory
var initDB = function () {
  // Database creation
  nSQL().dropDatabase(nanoDB_name).then(() => {
    console.log("Database dropped !");
  }).catch((error) => {
    console.log(error.toString());
  })
  nSQL().createDatabase({
    id: nanoDB_name,
    mode: "TEMP", // in Memory
    tables: [
      {
        name: "tracks",
        model: {
          "id:string": { pk: true },
          "dt_start:date": {},
          "ts_start:int": {},
          "dt_end:date": {},
          "ts_end:int": {},
          "nb_fixes:number": {},
          "name:string": {},
          "type:string": {},   // F for flight H for hike
          "gliderType:string": {} //or empty string if unknown
        }
      },
      {
        name: "fixes",
        model: {
          "id:uuid": { pk: true, ai: true },
          "track_id:string": {},
          "point:geo": {},
          "preciseAltitude:number": {},
          "gpsAltitude:number": {},
          "dt:date": {},
          "ts:int": {},
          "type:string": {}   // F for flight H for hike
        }
      }
    ],
    version: 3, // current schema/database version
    onVersionUpdate: (prevVersion) => { // migrate versions
      return new Promise((res, rej) => {
        switch (prevVersion) {
          case 1:
            // migrate v1 to v2
            res(2);
            break;
          case 2:
            // migrate v2 to v3
            res(3);
            break;
        }
      });
    }
  }).then(() => {
    // ready to query!
  }).catch((error) => {
    console.log(error.toString());
  });

  nSQL().useDatabase(nanoDB_name);
};

//add milliseconds to Date object
var addTimestampToDateObject = function (ts, dateObject) {
  var oDate = new Date();
  oDate.setTime(dateObject.getTime() + ts);
  return oDate;
}

//fixErroneusDT given trackID and realDTStart wich is a Date() object
var fixErroneousDT = function (trackId, realDTStart) {
  getDBTrackRowAsPromise(trackId).then(track => {
    var Δt = realDTStart.getTime() - (new Date(track[0].dt_start)).getTime();
    nSQL("tracks").query("upsert", {}).where(["id", "=", trackId]).updateImmutable(
      {
        dt_start: (addTimestampToDateObject(Δt, new Date(track[0].dt_start))).toISOString(),
        ts_start: track[0].ts_start + Δt,
        dt_end: (addTimestampToDateObject(Δt, new Date(track[0].dt_end))).toISOString(),
        ts_end: track[0].ts_end + Δt
      }
    ).exec();
    getDBFixesTrackRowAsPromise(trackId).then(fixes => {
      for (var i = 0; i < fixes.length; i++) {
        nSQL("fixes").query("upsert", {}).where(["id", "=", fixes[i].id]).updateImmutable({
          dt: (addTimestampToDateObject(Δt, new Date(fixes[i].dt)).toISOString())
        }).exec();
      }
    });
  });
}

//insert an array of fixes (probably created with an nSQL query)
//return a Promise with the number of fixes inserted
var insertFixesArrayInDB = function (trackId, fixesArray) {
  return new Promise(function (resolve, reject) {
    let promisedAll = [];
    for (var i = 0; i < fixesArray.length; i++) {
      promisedAll.push(nSQL("fixes").query("upsert", [{
        track_id: trackId,
        point: fixesArray[i].point,
        gpsAltitude: fixesArray[i].gpsAltitude,
        preciseAltitude: fixesArray[i].preciseAltitude,
        dt: fixesArray[i].dt,
        ts: fixesArray[i].ts,
        type: fixesArray[i].type
      }])
        .exec());
    }
    Promise.all(promisedAll).then((value) => resolve(i));
  });
}

//cut track in 2 segments
//return a Promise with an array containing the new trackIds
var splitTrackIn2 = function (trackId, dt_cut) {
  return splitTrackIn3(trackId, dt_cut, dt_cut);
}

//cut track in 3 segments (or 2 if dt_cut_1==dt_cut_2 )
//return a Promise with an array containing the new trackIds
var splitTrackIn3 = function (trackId, dt_cut_1, dt_cut_2) {
  return new Promise(function (resolve, reject) {
    var P1FixesInsertedPromise = 0;
    var P2FixesInsertedPromise = 0;
    var P3FixesInsertedPromise = 0;
    var track_p1_id = "";
    var track_p2_id = "";
    var track_p3_id = "";
    getDBTrackRowAsPromise(trackId).then(rows => {
      var trackRow = rows[0];
      var ts_cut_1 = dt_cut_1.getTime();
      var ts_cut_2 = dt_cut_2.getTime();
      if ((trackRow.ts_start < ts_cut_1) && (trackRow.ts_end > ts_cut_2)) {
        track_p1_id = CryptoJS.SHA256(trackRow.id + "-P1");
        track_p2_id = CryptoJS.SHA256(trackRow.id + "-P2");
        track_p3_id = CryptoJS.SHA256(trackRow.id + "-P3");
        nSQL().useDatabase(nanoDB_name);
        var readGliderTypeIfAny = getDBFirstGliderType();
        var P1_fixes_promise = nSQL("fixes").query("select").where([["track_id", "=", trackRow.id], "AND", ["ts", "<=", ts_cut_1]]).exec();
        var P2_fixes_promise = nSQL("fixes").query("select").where([["track_id", "=", trackRow.id], "AND", [["ts", ">", ts_cut_1], "AND", ["ts", "<", ts_cut_2]]]).exec();
        var P3_fixes_promise = nSQL("fixes").query("select").where([["track_id", "=", trackRow.id], "AND", ["ts", ">=", ts_cut_2]]).exec();
        var fixes_delete_promise = nSQL("fixes").query("delete").where(["track_id", "=", trackId]).exec();
        var tracks_delete_promise = nSQL("tracks").query("delete").where(["id", "=", trackId]).exec();
        Promise.all([P1_fixes_promise, P2_fixes_promise, P3_fixes_promise, readGliderTypeIfAny, fixes_delete_promise, tracks_delete_promise]).then(promised => {
          var P1_fixes = promised[0];
          var P2_fixes = promised[1];
          var P3_fixes = promised[2];
          igc_glider_type = promised[3];
          let splittedId = [];
          let promisedAll = [];
          if (P1_fixes.length > 0) {
            promisedAll.push(nSQL("tracks").query("upsert", [{
              id: track_p1_id,
              dt_start: new Date(trackRow.ts_start),
              ts_start: trackRow.ts_start,
              dt_end: new Date(ts_cut_1 - 1),
              ts_end: ts_cut_1 - 1,
              nb_fixes: P1_fixes.length,
              name: trackRow.name + "-P1",
              type: trackRow.type,
              gliderType: (trackRow.type == trackTypes.FLY) ? igc_glider_type : ""
            }])
              .exec().then((value) => {
                P1FixesInsertedPromise = insertFixesArrayInDB(track_p1_id, P1_fixes);
                splittedId.push(track_p1_id.toString(CryptoJS.enc.Hex));
              }));

          }
          if (P2_fixes.length > 0) {
            promisedAll.push(nSQL("tracks").query("upsert", [{
              id: track_p2_id,
              dt_start: new Date(ts_cut_1),
              ts_start: ts_cut_1,
              dt_end: new Date(ts_cut_2),
              ts_end: ts_cut_2,
              nb_fixes: P2_fixes.length,
              name: trackRow.name + "-P2",
              type: trackRow.type,
              gliderType: (trackRow.type == trackTypes.FLY) ? igc_glider_type : ""
            }])
              .exec().then((value) => {
                P2FixesInsertedPromise = insertFixesArrayInDB(track_p2_id, P2_fixes);
                splittedId.push(track_p2_id.toString(CryptoJS.enc.Hex));
              }));
          }
          if (P3_fixes.length > 0) {
            promisedAll.push(nSQL("tracks").query("upsert", [{
              id: track_p3_id,
              dt_start: new Date(ts_cut_2 + 1),
              ts_start: ts_cut_2 + 1,
              dt_end: new Date(trackRow.ts_end),
              ts_end: trackRow.ts_end,
              nb_fixes: P3_fixes.length,
              name: trackRow.name + "-P3",
              type: trackRow.type,
              gliderType: (trackRow.type == trackTypes.FLY) ? igc_glider_type : ""
            }])
              .exec().then((value) => {
                P3FixesInsertedPromise = insertFixesArrayInDB(track_p3_id, P3_fixes);
                splittedId.push(track_p3_id.toString(CryptoJS.enc.Hex));
              }));
          }
          Promise.all(promisedAll).then((value) => {
            resolve(splittedId);
          });
        });
      }
    });
  });
}

//split trackId in 2 or 3 parts P1, P2, P3 (can be only P1 and P2)
//if ansiXOR((dt_start == trackRow.dt_start) , (dt_end == trackRow.dt_end)) -> only P1 and P2
//if ((dt_start == trackRow.dt_start) && (dt_end == trackRow.dt_end)) -> change the whole track
//if ((dt_start > trackRow.dt_start) && (dt_end < trackRow.dt_end)) -> P1, P2, P3
//return a Promise with value containing an array of the new IDs
var changePartOfTrackType = function (trackId, dt_start, dt_end, new_type) {
  return new Promise(function (resolve, reject) {
    getDBTrackRowAsPromise(trackId).then(rows => {
      var trackRow = rows[0];
      var ts_start = dt_start.getTime();
      var ts_end = dt_end.getTime();
      if (ansiXOR((ts_start == trackRow.ts_start), (ts_end == trackRow.ts_end))) {
        if (ts_start == trackRow.ts_start) {
          splitTrackIn2(trackId, dt_end).then((value) => {
            console.log("Done split changed track is: " + value[0]);
            changeTrackType(value[0], new_type).then((retval) => {
              resolve(value);
            });
          });
        } else {
          splitTrackIn2(trackId, dt_start).then((value) => {
            console.log("Done split changed track is: " + value[1]);
            changeTrackType(value[1], new_type).then((retval) => {
              resolve(value);
            });

          });
        }
      } else {
        if ((ts_start > trackRow.ts_start) && (ts_end < trackRow.ts_end)) {
          splitTrackIn3(trackId, dt_start, dt_end).then((value) => {
            console.log("Done split changed track is: " + value[1]);
            changeTrackType(value[1], new_type).then((retval) => {
              resolve(value);
            });
          });
        } else {
          changeTrackType(trackId, new_type).then((retval) => {
            resolve(value);
          });
        }
      }
    });
  });
}


// Change track type
var changeTrackType = function (trackId, new_type) {
  return new Promise(function (resolve, reject) {
    let tracksPromise = nSQL("tracks").query("upsert", [{ type: new_type }]).where(["id", "=", trackId]).exec();
    let fixesPromise = nSQL("fixes").query("upsert", [{ type: new_type }]).where(["track_id", "=", trackId]).exec();
    Promise.all([tracksPromise, fixesPromise]).then(resolve(new_type));
  });
}

//Cut overlapping
// Insert A in B , 
// if A is in B
// extract B1 from B start to A start keeping Fly or Hike flag
// extract B2 from A end to B end keeping Fly or Hike flag
// return a Promise with filled value with an array containing the 2 new trackId as string
var cutOverlapping = function (track_A_id, track_B_id) {
  return new Promise(function (resolve, reject) {
    var A_promise = getDBTrackRowAsPromise(track_A_id);
    var B_promise = getDBTrackRowAsPromise(track_B_id);

    Promise.all([A_promise, B_promise]).then(promisedDBRows => {
      var track_A_row = promisedDBRows[0][0];
      var track_B_row = promisedDBRows[1][0];
      if ((typeof (track_A_row) != "undefined") && (typeof (track_B_row) != "undefined")) {
        if ((track_A_row.ts_end <= track_B_row.ts_end) && (track_A_row.ts_start >= track_B_row.ts_start)) {
          //so A is in B
          console.log(track_A_id + " is in " + track_B_id);
          var track_B1_id = CryptoJS.SHA256(track_B_row.id + "-B1");
          var track_B2_id = CryptoJS.SHA256(track_B_row.id + "-B2");
          let splittedId = [track_B1_id.toString(CryptoJS.enc.Hex), track_B2_id.toString(CryptoJS.enc.Hex)];
          nSQL().useDatabase(nanoDB_name);
          var B1_fixes_promise = nSQL("fixes").query("select").where([["track_id", "=", track_B_row.id], "AND", ["ts", "<", track_A_row.ts_start]]).exec();
          var B2_fixes_promise = nSQL("fixes").query("select").where([["track_id", "=", track_B_row.id], "AND", ["ts", ">", track_A_row.ts_end]]).exec();
          igc_glider_type = getDBFirstGliderType();
          Promise.all([B1_fixes_promise, B2_fixes_promise, igc_glider_type]).then(promisedDB_BRows => {
            let B1_fixes = promisedDB_BRows[0];
            let B2_fixes = promisedDB_BRows[1];
            let gliderType = promisedDB_BRows[3];
            var insertTrackB1 = nSQL("tracks").query("upsert", [{
              id: track_B1_id,
              dt_start: new Date(track_B_row.ts_start),
              ts_start: track_B_row.ts_start,
              dt_end: new Date(track_A_row.ts_start - 1),
              ts_end: track_A_row.ts_start - 1,
              nb_fixes: B1_fixes.length,
              name: track_B_row.name + "-B1",
              type: track_B_row.type,
              gliderType: (track_B_row.type == trackTypes.FLY) ? gliderType : ""
            }])
              .exec();
            var insertTrackB2 = nSQL("tracks").query("upsert", [{
              id: track_B2_id,
              dt_start: new Date(track_A_row.ts_end + 1),
              ts_start: track_A_row.ts_end + 1,
              dt_end: new Date(track_B_row.ts_end),
              ts_end: track_B_row.ts_end,
              nb_fixes: B2_fixes.length,
              name: track_B_row.name + "-B2",
              type: track_B_row.type,
              gliderType: (track_B_row.type == trackTypes.FLY) ? gliderType : ""
            }])
              .exec();
            var nbB1FixesInserted = insertFixesArrayInDB(track_B1_id, B1_fixes);

            var nbB2FixesInserted = insertFixesArrayInDB(track_B2_id, B2_fixes);

            var fixesDelete = nSQL("fixes").query("delete").where(["track_id", "=", track_B_row.id]).exec();
            var tracksDelete = nSQL("tracks").query("delete").where(["id", "=", track_B_row.id]).exec();
            Promise.all([insertTrackB1, insertTrackB2, nbB1FixesInserted, nbB2FixesInserted, fixesDelete, tracksDelete]).then((value) => {
              resolve(splittedId);
            })
          });
        } else {
          console.log(track_A_id + " is not in " + track_B_id);
          reject(track_A_id + " is not in " + track_B_id);
        }
      } else {
        reject("Track A or B unknown");
      }

    });
  });
}

//return all fixes for one track as Promise given it id
var getDBFixesTrackRowAsPromise = function (trackId) {
  return nSQL("fixes").query("select").where(["track_id", "=", trackId]).exec();
}

//return single track as Promise given it id
var getDBTrackRowAsPromise = function (trackId) {
  return nSQL("tracks").query("select").where(["id", "=", trackId]).exec();
}

//return first gliderType if any
var getDBFirstGliderType = function () {
  return new Promise(function (resolve, reject) {
    nSQL("tracks").query("select", ["gliderType"]).where([["gliderType.length", ">", 0], "AND", ["gliderType", "!=", IGC_GLIDER_TYPE]]).exec().then((rows) => {
      if ( (typeof (rows[0]) != "undefined") && ((typeof (rows[0].gliderType) != "undefined") && (rows[0].gliderType != IGC_GLIDER_TYPE))) {
        resolve(rows[0].gliderType);
      } else {
        resolve(_DEFAULT_GLIDER_TYPE);
      }
    });
  });
}

var getDBTrackDTStartAsPromise = function (trackId) {
  return getDBTrackRowAsPromise(trackId).then((rows) => { return rows[0]["dt_start"]; });
}

//return all tracks as Promise
var getDBTracksRowsAsPromise = function () {
  return nSQL("tracks").query("select").orderBy(["ts_start ASC"]).exec();
}

var getDBFixesRowsAsPromise = function (trackId) {
  if (typeof (trackId) == "undefined") {
    return nSQL("fixes").query("select").orderBy(["dt ASC"]).exec();
  } else {
    return nSQL("fixes").query("select").where(["track_id", "=", trackId]).orderBy(["dt ASC"]).exec();
  }

}

//simple IGC Date formater
// date is a javascript Date() object
var igcDateFormater = function (date) {
  var dateTimeFormat = new Intl.DateTimeFormat('en', { timeZone: 'UTC', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h24', minute: '2-digit', second: '2-digit' })
  var [{ value: month }, , { value: day }, , { value: year }] = dateTimeFormat.formatToParts(date)
  return `${day}${month}${year}`;
};

var igcTimeFormater = function (date) {
  var dateTimeFormat = new Intl.DateTimeFormat('en', { timeZone: 'UTC', hour: '2-digit', hourCycle: 'h24', minute: '2-digit', second: '2-digit' })
  var [{ value: hour }, , { value: minute }, , { value: second }] = dateTimeFormat.formatToParts(date)
  if ((hour == 24) || (hour == '24')) {
    hour = '00';
  }
  return `${hour}${minute}${second}`;
}

var igcLatFormater = function (decimalLat) {
  var hemisphere = (decimalLat >= 0) ? 'N' : 'S';
  var degrees = (Math.floor(Math.abs(decimalLat))).toLocaleString('en-US', { minimumIntegerDigits: 2, useGrouping: false });
  var minutes = (Math.round((Math.abs(decimalLat) - degrees) * 60000)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false });
  return `${degrees}${minutes}${hemisphere}`;
};

var igcLonFormater = function (decimalLon) {
  var eastern = (decimalLon >= 0) ? 'E' : 'W';
  var degrees = (Math.floor(Math.abs(decimalLon))).toLocaleString('en-US', { minimumIntegerDigits: 3, useGrouping: false });
  var minutes = (Math.round((Math.abs(decimalLon) - degrees) * 60000)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false });
  return `${degrees}${minutes}${eastern}`;
};

var igcAltitudeFormater = function (altitude) {
  if (altitude >= 0) {
    return `${(Math.round(altitude)).toLocaleString('en-US', { minimumIntegerDigits: 5, useGrouping: false })}`;
  } else {
    return `-${(Math.ceil(Math.abs(altitude))).toLocaleString('en-US', { minimumIntegerDigits: 4, useGrouping: false })}`;
  }
};

//Return a Promise with a string containing the IGC file of a trackId
var getTrackASIgcString = function (trackId) {
  return new Promise(function (resolve, reject) {
    getDBFixesRowsAsPromise(trackId).then((value) => {
      let igc_string = igcProducer(value);
      resolve(igc_string);
    });
  });

}

//minimal headers for a valid IGC File
// date is a javascript Date() object
var igcHeaders = function (date) {
  return `AXCF034 French CFDMV pre-alpha track fusion\r\nHFDTE${igcDateFormater(date)}\r\nHFPLTPILOTINCHARGE:CFDMV\r\nHFCM2CREW2:NIL\r\nHFGTYGLIDERTYPE:${igc_glider_type}\r\nHFGIDGLIDERID:\r\nHFDTMGPSDATUM:WGS84\r\nHFRFWFIRMWAREVERSION:0\r\nHFRHWHARDWAREVERSION:\r\nHFFTYFRTYPE:TrackJoiner\r\nHFGPSRECEIVER:NIL\r\nHFPRSPRESSALTSENSOR:\r\n`;
};

var igcTypeCommentFormater = function (type, isStart) {
  var longType = (type == 'H') ? 'HIKE' : 'FLY';
  var longIsStart = isStart ? 'START' : 'END';
  return `LPLT${longType}${longIsStart}\r\n`;
}
//minimal IGC record formater
var igcBRecordFormater = function (row) {
  var dt = new Date(row.dt);
  if (isNaN(row.point.lat) || isNaN(row.point.lon)) {
    return '';
  }
  var igc_lat = igcLatFormater(row.point.lat);
  var igc_lon = igcLonFormater(row.point.lon);
  var igc_pressureAltitude = igcAltitudeFormater(isNaN(row.preciseAltitude) ? 0 : row.preciseAltitude);
  var igc_gpsAltitude = igcAltitudeFormater(isNaN(row.gpsAltitude) ? 0 : row.gpsAltitude);
  return `B${igcTimeFormater(dt)}${igc_lat}${igc_lon}A${igc_pressureAltitude}${igc_gpsAltitude}\r\n`;
}

//simple IGC file producer (input is a rows of points object)
var igcProducer = function (rows) {
  var szReturn = igcHeaders(new Date(rows[0].dt));
  var lastType = '';

  for (var i = 0; i < rows.length; i++) {
    if (i == 0) {
      lastType = rows[i].type;
      szReturn += igcTypeCommentFormater(rows[i].type, true);
    }
    if (lastType != rows[i].type) {
      szReturn += igcTypeCommentFormater(lastType, false);
      lastType = rows[i].type;
      szReturn += igcTypeCommentFormater(rows[i].type, true);
    }
    szReturn += igcBRecordFormater(rows[i]);
  }
  szReturn += igcTypeCommentFormater(rows[rows.length - 1].type, false);
  return szReturn;
}

//detect if there is an overlap in the rows of tracks 
var isAnOverlapDetected = function (rows) {
  for (var i = 1; i < rows.length; i++) {
    if (rows[i - 1].ts_end > rows[i].ts_start) {
      return true;
    }
  }
  return false;
}

//get an array of the overlapped rows id
var getOverlappedRowsID = function (rows) {
  var retArray = [];
  for (var i = 1; i < rows.length; i++) {
    if (rows[i - 1].ts_end > rows[i].ts_start) {
      retArray.push(rows[i].id);
    }
  }
  return retArray;
}

//integrate a row in its predecessor
//all checks are done in cutOverlapping
//return the cutOverlapping Promise or reject
var integrateInPreviousTrack = function (trackId) {
  return new Promise(function (resolve, reject) {
    getDBTracksRowsAsPromise().then(promisedRows => {
      var previousRowId = '';
      for (var i = 1; i < promisedRows.length; i++) {
        if (promisedRows[i].id == trackId) {
          previousRowId = promisedRows[i - 1].id;
          break;
        }
      }
      if (previousRowId != '') {
        resolve(cutOverlapping(trackId, previousRowId));
      } else {
        reject("Unknown trackId or no previous row or selected row is not in the previous one");
      }
    });
  });
}


export {nanoDB_name,initDB,getDBTracksRowsAsPromise,getDBFixesRowsAsPromise,getTrackASIgcString,getOverlappedRowsID,igcProducer,integrateInPreviousTrack,trackTypes,openFile};