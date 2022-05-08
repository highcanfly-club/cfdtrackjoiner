/*************************************
 * Demo IGC + FIT + GPX track joiner for CFD MV (French CFD MV)
 * © Ronan LE MEILLAT
 * Totally free and 'As Is' under MIT License
 * IGC Parser is adapted from Tobias Bieniek's project https://github.com/Turbo87/igc-parser (MIT license)
 * FIT Parser is adapted from Dimitrios Kanellopoulos's project https://github.com/jimmykane/fit-parser (MIT license)
 * GPX Parser is adapted from Lucas Trebouet's project https://github.com/Luuka/GPXParser.js (MIT license)
 */
/* eslint-disable */
import { nSQL } from "@nano-sql/core";
import CryptoJS from "crypto-js"; //tsc/trasnspileModule needs {compilerOptions: { esModuleInterop: true}}
import IGCParser from "igc-parser"; //tsc/trasnspileModule needs {compilerOptions: { esModuleInterop: true}}
import { FitParser, FitData } from "fit-parser";
import gpxParser from "gpxparser"; //tsc/trasnspileModule needs {compilerOptions: { esModuleInterop: true}}
import { Track as GpxParserTrack } from "gpxparser";

const nanoDB_name = "cfdmv_db";
const _DEFAULT_GLIDER_TYPE = "UNKOWN";
const IGC_GLIDER_TYPE = "TO-BE-FILLED";
const FIT_DEFAULT_GLIDER_TYPE = "FIT-GLIDER";
let igc_glider_type = IGC_GLIDER_TYPE;

enum trackTypes {
  FLY = "F",
  HIKE = "H",
  MIXED = "",
}

enum fileTypes {
  FIT = "FIT",
  GPX = "GPX",
  IGC = "IGC",
}

export interface Track {
  id: string;
  dt_start: Date;
  ts_start: number;
  dt_end: Date;
  ts_end: number;
  nb_fixes: number;
  name: string;
  type: trackTypes; // F for flight H for hike
  gliderType: string; //or empty string if unknown
}

export interface Fix {
  id?: string;
  track_id: string;
  point: { lat: number; lon: number };
  preciseAltitude?: number;
  gpsAltitude: number;
  dt: Date;
  ts: number;
  type: trackTypes;
}

/**
 * still no XOR in EMEA JavaScript
 * @param a
 * @param b
 * @returns ANSI XOR
 */
let ansiXOR = function (a: boolean, b: boolean): boolean {
  return (a || b) && !(a && b);
};

/**
 *
 * @param igcDate
 * @param igcTime
 * @returns basic Iso date creation from IGC file
 */
let igcDate2ISO8601 = function (igcDate: string, igcTime: string): string {
  let jsDate = igcDate + "T" + igcTime + "Z";
  return jsDate;
};

/**
 * Insert on IGC track parsed with IGCParser goes in tracks , gps points in fixes
 * @param {*} igcTrack
 * @param {string} hashHex
 * @param {string} fileName
 * @param {trackTypes} trackType
 * @param {Function} onDBInsertOKCallback
 */
let insertIGCTrackInDB = function (
  igcTrack: IGCParser.IGCFile,
  hashHex: string,
  fileName: string,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  insertIGCTrackInDBAsPromise(igcTrack, hashHex, fileName, trackType).then(
    () => {
      onDBInsertOKCallback();
    }
  );
};
/**
 * Insert on IGC track parsed with IGCParser goes in tracks , gps points in fixes
 * @param hashHex
 * @param fileName
 * @param trackType
 * @returns An array of Promise resolving as type [Track[],...Fix[][]
 * so first element is Track[] followers are Fix[]
 */
let insertIGCTrackInDBAsPromise = function (
  igcTrack: IGCParser.IGCFile,
  hashHex: string,
  fileName: string,
  trackType: trackTypes
): Promise<[Track[], ...Fix[][]]> {
  let igcDate = igcTrack.date;
  igc_glider_type =
    typeof igcTrack.gliderType != "undefined" && igcTrack.gliderType.length > 0
      ? igcTrack.gliderType
      : IGC_GLIDER_TYPE;
  let isoDt_start = new Date(igcTrack.fixes[0].timestamp);
  let unixTs_start = isoDt_start.getTime();
  let isoDt_end = new Date(igcTrack.fixes[igcTrack.fixes.length - 1].timestamp);
  let unixTs_end = isoDt_end.getTime();
  nSQL().useDatabase(nanoDB_name);
  let trackPromise = <Promise<Track[]>>nSQL("tracks")
    .query("upsert", [
      {
        id: hashHex,
        dt_start: isoDt_start,
        ts_start: unixTs_start,
        dt_end: isoDt_end,
        ts_end: unixTs_end,
        nb_fixes: igcTrack.fixes.length,
        name: fileName,
        type: trackType,
        gliderType: igc_glider_type,
      },
    ])
    .exec()
    .catch((error: Error) => {
      console.log(error.toString());
    });
  let fixInserted: Promise<Fix[]>[] = [];
  for (let i = 0; i < igcTrack.fixes.length; i++) {
    if (igcTrack.fixes[i].valid) {
      // fill pressureAltitude with gpsAltitude if empty, this is for filling the DB in the preciseAltitude field
      if (
        typeof igcTrack.fixes[i].pressureAltitude == "undefined" ||
        igcTrack.fixes[i].pressureAltitude == null
      ) {
        igcTrack.fixes[i].pressureAltitude = igcTrack.fixes[i].gpsAltitude;
      }
      fixInserted.push(
        <Promise<Fix[]>>nSQL("fixes")
          .query("upsert", [
            {
              track_id: hashHex,
              point: {
                lat: igcTrack.fixes[i].latitude,
                lon: igcTrack.fixes[i].longitude,
              },
              gpsAltitude: igcTrack.fixes[i].gpsAltitude,
              preciseAltitude: igcTrack.fixes[i].pressureAltitude,
              dt: new Date(igcTrack.fixes[i].timestamp).toISOString(),
              ts: igcTrack.fixes[i].timestamp,
              type: trackType, //WIP use IGC for hike
            },
          ])
          .exec()
          .catch((error: Error) => {
            console.log(error.toString());
          })
      );
    }
  }
  // Promise.all(fixInserted).then(() => {
  //   console.log("igc inserted");
  // });
  return Promise.all([trackPromise, ...fixInserted]);
};

/**
 * Insert on GPX track parsed with GPXParser (data.tracks[0].segments[0])
 * header goes in tracks , gps points in fixes
 * @param gpxTrack
 * @param hashHex
 * @param fileName
 * @param trackType
 * @param onDBInsertOKCallback
 */
let insertGPXTrackInDB = function (
  gpxTrack: GpxParserTrack,
  hashHex: string,
  fileName: string,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  insertGPXTrackInDBAsPromise(gpxTrack, hashHex, fileName, trackType).then(
    (value) => {
      onDBInsertOKCallback();
    }
  );
};
/**
 * Insert on GPX track parsed with GPXParser (data.tracks[0].segments[0])
 * header goes in tracks , gps points in fixes
 * @param gpxTrack
 * @param hashHex
 * @param fileName
 * @param trackType
 * @returns An array of Promise resolving as type [Track[],...Fix[][]
 * so first element is Track[] followers are Fix[]
 */
let insertGPXTrackInDBAsPromise = function (
  gpxTrack: GpxParserTrack,
  hashHex: string,
  fileName: string,
  trackType: trackTypes
): Promise<[Track[], ...Fix[][]]> {
  let gpxDate = gpxTrack.points[0].time;
  let isoDt_start = gpxTrack.points[0].time;
  let unixTs_start = isoDt_start.getTime();
  let isoDt_end = gpxTrack.points[gpxTrack.points.length - 1].time;
  let unixTs_end = isoDt_end.getTime();
  nSQL().useDatabase(nanoDB_name);
  let trackPromise = <Promise<Track[]>>nSQL("tracks")
    .query("upsert", [
      {
        id: hashHex,
        dt_start: isoDt_start,
        ts_start: unixTs_start,
        dt_end: isoDt_end,
        ts_end: unixTs_end,
        nb_fixes: gpxTrack.points.length,
        name: fileName,
        type: trackType,
        gliderType: "",
      },
    ])
    .exec()
    .catch((error: Error) => {
      console.log(error.toString());
    });
  let fixInserted: Promise<Fix[]>[] = [];
  for (let i = 0; i < gpxTrack.points.length; i++) {
    fixInserted.push(
      <Promise<Fix[]>>nSQL("fixes")
        .query("upsert", [
          {
            track_id: hashHex,
            point: { lat: gpxTrack.points[i].lat, lon: gpxTrack.points[i].lon },
            gpsAltitude: gpxTrack.points[i].ele,
            preciseAltitude: gpxTrack.points[i].ele, //no precise altitude on GPX
            dt: gpxTrack.points[i].time.toISOString(),
            ts: gpxTrack.points[i].time.getTime(),
            type: trackType, //WIP use IGC for hike
          },
        ])
        .exec()
        .catch((error: Error) => {
          console.log(error.toString());
        })
    );
  }
  return Promise.all([trackPromise, ...fixInserted]);
};

/**
 * Insert on FIT track parsed with FITParser
 * header goes in tracks , gps points in fixes
 * TO BE CHECKED :
 * the only altitude my Fenix 6 gives is "enhanced_altitude" not sure all watches have this field
 * TO DO : find a basic watch without barometer for seing wich altitude it gives
 * @param fitTrack
 * @param hashHex
 * @param fileName
 * @param trackType
 * @param onDBInsertOKCallback
 */
let insertFITTrackInDB = function (
  fitTrack: FitData,
  hashHex: string,
  fileName: string,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  insertFITTrackInDBAsPromise(fitTrack, hashHex, fileName, trackType).then(
    (value) => {
      onDBInsertOKCallback();
    }
  );
};

/**
 * Insert on FIT track parsed with FITParser
 * header goes in tracks , gps points in fixes
 * TO BE CHECKED :
 * the only altitude my Fenix 6 gives is "enhanced_altitude" not sure all watches have this field
 * TO DO : find a basic watch without barometer for seing wich altitude it gives
 * @param fitTrack
 * @param hashHex
 * @param fileName
 * @param trackType
 */
let insertFITTrackInDBAsPromise = function (
  fitTrack: FitData,
  hashHex: string,
  fileName: string,
  trackType: trackTypes
): Promise<[Track[], ...Fix[][]]> {
  let unixTs_start = fitTrack.records[0].timestamp.getTime();
  let unixTs_end =
    fitTrack.records[fitTrack.records.length - 1].timestamp.getTime();
  nSQL().useDatabase(nanoDB_name);
  let trackPromise = <Promise<Track[]>>nSQL("tracks")
    .query("upsert", [
      {
        id: hashHex,
        dt_start: fitTrack.records[0].timestamp,
        ts_start: unixTs_start,
        dt_end: fitTrack.records[fitTrack.records.length - 1].timestamp,
        ts_end: unixTs_end,
        nb_fixes: fitTrack.records.length,
        name: fileName,
        type: trackType,
        gliderType: FIT_DEFAULT_GLIDER_TYPE,
      },
    ])
    .exec()
    .catch((error: Error) => {
      console.log(error.toString());
    });
  let fixInserted: Promise<Fix[]>[] = [];
  for (let i = 0; i < fitTrack.records.length; i++) {
    let gpsAltitude =
      typeof fitTrack.records[i].enhanced_altitude != "undefined"
        ? fitTrack.records[i].enhanced_altitude
        : fitTrack.records[i].altitude;
    fixInserted.push(
      <Promise<Fix[]>>nSQL("fixes")
        .query("upsert", [
          {
            track_id: hashHex,
            point: {
              lat: fitTrack.records[i].position_lat,
              lon: fitTrack.records[i].position_long,
            },
            gpsAltitude: gpsAltitude,
            preciseAltitude: fitTrack.records[i].enhanced_altitude,
            dt: fitTrack.records[i].timestamp.toISOString(),
            ts: fitTrack.records[i].timestamp.getTime(),
            type: trackType, // WIP use FIT for fly
          },
        ])
        .exec()
        .catch((error: Error) => {
          console.log(error.toString());
        })
    );
  }
  return Promise.all([trackPromise, ...fixInserted]);
};

/**
 * basic path removal (works for windows/unices)
 * @param fullPath
 * @returns
 */
const getFileName = function (fullPath: string): string {
  return fullPath.replace(/^.*[\\\/]/, "");
};

/**
 * basic file Extension (return file name if there is no extension) // TODO better handling
 * @param {string} fileName
 * @returns
 */
const getFileExtension = function (fileName: string): string {
  return fileName.split(".").pop().split(/\#|\?/)[0].toUpperCase();
};

// CryptoJS  needs word array so this is an optimized conversion
let arrayBufferToWordArray = function (ab) {
  let i8a = new Uint8Array(ab);
  let a = [];
  for (let i = 0; i < i8a.length; i += 4) {
    a.push(
      (i8a[i] << 24) | (i8a[i + 1] << 16) | (i8a[i + 2] << 8) | i8a[i + 3]
    );
  }
  return CryptoJS.lib.WordArray.create(a, i8a.length);
};

/**
 * Single file reception (with on FileReader), on event:load parse and insert in DB
 * @param file
 * @param trackType
 * @param onDBInsertOKCallback
 */
let openIGCFileTreatSingle = function (
  file: File,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  let reader = new FileReader();
  reader.addEventListener("load", function (event) {
    let igcFile = event.target;
    let text = igcFile.result as string;
    let fileName = getFileName(file.name);
    let hash = CryptoJS.SHA256(text);
    let hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log(
      "fileName:" +
        fileName +
        "\n" +
        text.substring(0, 200) +
        "\nLXSB Last 100 chars\n" +
        text.slice(-100)
    );
    insertIGCTrackInDB(
      IGCParser.parse(text),
      hashHex,
      fileName,
      trackType,
      onDBInsertOKCallback
    );
  });
  reader.readAsText(file);
};

/**
 * Basically creates one openIGCFileTreatSingle per file (on multiple selection)
 * @param event
 * @param trackType
 * @param onDBInsertOKCallback
 */
let openIGCFile = function (
  event: Event,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  let input = event.target as HTMLInputElement;
  let files = input.files;

  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    openIGCFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};

/**
 * Single file reception (with on FileReader), on event:load parse and insert in DB
 * @param {*} file
 * @param {*} trackType
 * @param {*} onDBInsertOKCallback
 */
let openFITFileTreatSingle = function (
  file: File,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  let fitParser = new FitParser({
    force: true,
    speedUnit: "km/h",
    lengthUnit: "m",
    temperatureUnit: "celcius",
    elapsedRecordField: true,
    mode: "list",
  });
  let reader = new FileReader();
  reader.addEventListener("load", function (event) {
    let fitFile = event.target;
    let blob = fitFile.result as ArrayBuffer;
    let fileName = getFileName(file.name);
    let hash = CryptoJS.SHA256(arrayBufferToWordArray(blob));
    let hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log(fileName);
    fitParser.parse(blob, function (error: string, data: FitData) {
      // Handle result of parse method
      if (error) {
        console.log(error);
      } else {
        insertFITTrackInDB(
          data,
          hashHex,
          fileName,
          trackType,
          onDBInsertOKCallback
        );
      }
    });
  });
  reader.readAsArrayBuffer(file);
};

/**
 * Basically creates one openFITFileTreatSingle per file (on multiple selection)
 * @param {*} event
 * @param {*} trackType
 * @param {*} onDBInsertOKCallback
 */
let openFITFile = function (
  event: Event,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  let input = <HTMLInputElement>event.target;
  let files = input.files;

  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    openFITFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};

/**
 * Single file reception (with on FileReader), on event:load parse and insert in DB
 * @param {File} file
 * @param {trackTypes} trackType
 * @param {Function} onDBInsertOKCallback
 */
let openGPXFileTreatSingle = function (
  file: File,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  let reader = new FileReader();
  reader.addEventListener("load", function (event) {
    let gpxFile = event.target;
    let gpxText = gpxFile.result as string;
    let fileName = getFileName(file.name);
    let hash = CryptoJS.SHA256(gpxText);
    let hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log(fileName);
    let _gpxParser = new gpxParser();
    _gpxParser.parse(gpxText);
    insertGPXTrackInDB(
      _gpxParser.tracks[0],
      hashHex,
      fileName,
      trackType,
      onDBInsertOKCallback
    );
  });
  reader.readAsText(file);
};

/**
 * Single file reception (with on FileReader), on event:load parse and insert in DB
 * Generic versio
 * @param file
 * @param trackType
 * @param onDBInsertOKCallback
 */
let openFileTreatSingle = function (
  file: File,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  openFileTreatSingleAsPromise(file, trackType).then((value) => {
    onDBInsertOKCallback();
  });
};

/**
 * Single file reception (with on FileReader), on event:load parse and insert in DB
 * Generic versio
 * @param file
 * @param trackType
 * @returns a Promise from openXXXFileAspromise
 */
let openFileTreatSingleAsPromise = function (
  file: File,
  trackType: trackTypes
): Promise<[Track[], ...Fix[][]]> {
  let fileName = getFileName(file.name);
  let fileExtension = getFileExtension(fileName) as fileTypes;
  return new Promise<[Track[], ...Fix[][]]>((resolve, reject) => {
    let reader = new FileReader();
    reader.addEventListener("load", function (event) {
      let trackFile = event.target;
      let fileContent = trackFile.result as string;
      let hash =
        fileExtension == fileTypes.FIT
          ? CryptoJS.SHA256(arrayBufferToWordArray(fileContent))
          : CryptoJS.SHA256(fileContent); // FIT format is binay
      let hashHex = hash.toString(CryptoJS.enc.Hex);
      console.log(fileName);
      switch (fileExtension) {
        case fileTypes.FIT:
          let fitParser = new FitParser({
            force: true,
            speedUnit: "km/h",
            lengthUnit: "m",
            temperatureUnit: "celcius",
            elapsedRecordField: true,
            mode: "list",
          });
          fitParser.parse(fileContent, function (error: string, data: FitData) {
            // Handle result of parse method
            if (error) {
              alert("Une erreur s'est produite : FITParser " + error);
              reject("Une erreur s'est produite : FITParser " + error);
            } else {
              resolve(
                insertFITTrackInDBAsPromise(data, hashHex, fileName, trackType)
              );
            }
          });
          break;
        case fileTypes.IGC:
          resolve(
            insertIGCTrackInDBAsPromise(
              IGCParser.parse(fileContent),
              hashHex,
              fileName,
              trackType
            )
          );
          break;
        case fileTypes.GPX:
          let _gpxParser = new gpxParser();
          _gpxParser.parse(fileContent);

          if (_gpxParser.tracks[0].points.length > 0) {
            resolve(
              insertGPXTrackInDBAsPromise(
                _gpxParser.tracks[0],
                hashHex,
                fileName,
                trackType
              )
            );
          } else {
            alert("Une erreur s'est produite : GPXParser ");
            reject("Error: GPXParser ");
          }
          break;
        default:
          reject("Unknown error");
      }
    });
    if (fileExtension == fileTypes.FIT) {
      reader.readAsArrayBuffer(file); // Fit files are binary so should get a byte array
    } else if (
      fileExtension == fileTypes.GPX ||
      fileExtension == fileTypes.IGC
    ) {
      reader.readAsText(file); // GPX and IGC are text files
    } else {
      // TODO don't do nothing !!
    }
  });
};

/**
 * Basically creates one openGPXFileTreatSingle per file (on multiple selection)
 * @param event
 * @param trackType
 * @param onDBInsertOKCallback
 */
let openFile = function (
  event: Event,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  openFileAsPromise(event, trackType).then((value) => {
    onDBInsertOKCallback();
  });
};

/**
 * Basically creates one openGPXFileTreatSingle per file (on multiple selection)
 * @param event
 * @param trackType
 * @returns an array of Promise containing Promise<[Track[], ...Fix[][]][]>
 * so: Promise<[
 * Track[], ...Fix[][]
 * ][]>
 * in other words an array with each elements (corresponding to each file) containing a Track[] as first element and Fix[] as other elements
 */
let openFileAsPromise = function (
  event: Event,
  trackType: trackTypes
): Promise<[Track[], ...Fix[][]][]> {
  let input = <HTMLInputElement>event.target;
  let files = input.files;
  let promised: Promise<[Track[], ...Fix[][]]>[] = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    promised.push(openFileTreatSingleAsPromise(file, trackType));
  }
  return Promise.all(promised);
};

/**
 * Basically creates one openGPXFileTreatSingle per file (on multiple selection)
 * @param {*} event
 * @param {*} trackType
 * @param {*} onDBInsertOKCallback
 */
let openGPXFile = function (
  event: Event,
  trackType: trackTypes,
  onDBInsertOKCallback: Function
) {
  let input = <HTMLInputElement>event.target;
  let files = input.files;

  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    openGPXFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};

/**
 * Creates the main nanoSQL database
 */
let createDB = function () {
  nSQL()
    .createDatabase({
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
            "type:string": {}, // F for flight H for hike
            "gliderType:string": {}, //or empty string if unknown
          },
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
            "type:string": {}, // F for flight H for hike
          },
        },
      ],
      version: 3, // current schema/database version
      onVersionUpdate: (prevVersion) => {
        // migrate versions
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
      },
    })
    .then(() => {
      // ready to query!
    })
    .catch((error: Error) => {
      console.log(error.toString());
    });

  nSQL().useDatabase(nanoDB_name);
};

/**
 * drop DB if exists (on some browser even in-memory persists)
 * next creates the DB in memory
 */
let initDB = function () {
  // Database creation
  if (nSQL().listDatabases().includes(nanoDB_name)) {
    nSQL()
      .dropDatabase(nanoDB_name)
      .then(() => {
        console.log("Database dropped !");
        createDB();
      })
      .catch((error: Error) => {
        console.log(error.toString());
      });
  } else {
    createDB();
  }
};

/**
 * add milliseconds to Date object
 * @param {*} ts
 * @param {*} dateObject
 * @returns
 */
let addTimestampToDateObject = function (ts: number, dateObject: Date): Date {
  let oDate = new Date();
  oDate.setTime(dateObject.getTime() + ts);
  return oDate;
};

/**
 * fixErroneusDT given trackID and realDTStart wich is a Date() object
 * @param {string} trackId
 * @param {*} realDTStart
 */
let fixErroneousDT = function (trackId: string, realDTStart: Date) {
  let tracksPromise: Promise<Track[]> = null;
  let fixesPromise: Promise<Fix[]>[] = [];
  getDBTrackRowAsPromise(trackId).then((track) => {
    let Δt = realDTStart.getTime() - new Date(track[0].dt_start).getTime();
    tracksPromise = nSQL("tracks")
      .query("upsert", {})
      .where(["id", "=", trackId])
      .updateImmutable({
        dt_start: addTimestampToDateObject(
          Δt,
          new Date(track[0].dt_start)
        ).toISOString(),
        ts_start: track[0].ts_start + Δt,
        dt_end: addTimestampToDateObject(
          Δt,
          new Date(track[0].dt_end)
        ).toISOString(),
        ts_end: track[0].ts_end + Δt,
      })
      .exec() as Promise<Track[]>;
    getDBFixesTrackRowAsPromise(trackId).then((fixes) => {
      for (let i = 0; i < fixes.length; i++) {
        fixesPromise.push(
          nSQL("fixes")
            .query("upsert", {})
            .where(["id", "=", fixes[i].id])
            .updateImmutable({
              dt: addTimestampToDateObject(
                Δt,
                new Date(fixes[i].dt)
              ).toISOString(),
            })
            .exec() as Promise<Fix[]>
        );
      }
    });
  });
  Promise.all([tracksPromise, ...fixesPromise]);
};

/**
 * insert an array of fixes (probably created with an nSQL query)
 * return a Promise with the number of fixes inserted
 * @param {string} trackId
 * @param {*} fixesArray
 * @returns a number with number of fixes inserted
 */
let insertFixesArrayInDB = function (
  trackId: string,
  fixesArray: Fix[]
): Promise<number> {
  return new Promise(function (resolve, reject) {
    let promisedAll = [];
    for (let i = 0; i < fixesArray.length; i++) {
      promisedAll.push(
        nSQL("fixes")
          .query("upsert", [
            {
              track_id: trackId,
              point: fixesArray[i].point,
              gpsAltitude: fixesArray[i].gpsAltitude,
              preciseAltitude: fixesArray[i].preciseAltitude,
              dt: fixesArray[i].dt,
              ts: fixesArray[i].ts,
              type: fixesArray[i].type,
            },
          ])
          .exec()
      );
    }
    Promise.all(promisedAll).then((value) => resolve(value.length));
  });
};

/**
 * cut track in 2 segments
 * return a Promise with an array containing the new trackIds
 * @param {string} trackId
 * @param {*} dt_cut
 * @returns
 */
let splitTrackIn2 = function (
  trackId: string,
  dt_cut: Date
): Promise<string[]> {
  return splitTrackIn3(trackId, dt_cut, dt_cut);
};

/**
 * cut track in 3 segments (or 2 if dt_cut_1==dt_cut_2 )
 * return a Promise with an array containing the new trackIds
 * @param {string} trackId
 * @param {Date} dt_cut_1
 * @param {Date} dt_cut_2
 * @returns
 */
let splitTrackIn3 = function (
  trackId: string,
  dt_cut_1: Date,
  dt_cut_2: Date
): Promise<string[]> {
  return new Promise(function (resolve, reject) {
    let P1FixesInsertedPromise: Promise<number> = null;
    let P2FixesInsertedPromise: Promise<number> = null;
    let P3FixesInsertedPromise: Promise<number> = null;
    let track_p1_id: CryptoJS.lib.WordArray = null;
    let track_p2_id: CryptoJS.lib.WordArray = null;
    let track_p3_id: CryptoJS.lib.WordArray = null;
    getDBTrackRowAsPromise(trackId).then((rows) => {
      let trackRow = rows[0];
      let ts_cut_1 = dt_cut_1.getTime();
      let ts_cut_2 = dt_cut_2.getTime();
      if (trackRow.ts_start < ts_cut_1 && trackRow.ts_end > ts_cut_2) {
        track_p1_id = CryptoJS.SHA256(trackRow.id + "-P1");
        track_p2_id = CryptoJS.SHA256(trackRow.id + "-P2");
        track_p3_id = CryptoJS.SHA256(trackRow.id + "-P3");
        nSQL().useDatabase(nanoDB_name);
        let readGliderTypeIfAny = getDBFirstGliderType();
        let P1_fixes_promise = nSQL("fixes")
          .query("select")
          .where([
            ["track_id", "=", trackRow.id],
            "AND",
            ["ts", "<=", ts_cut_1],
          ])
          .exec() as Promise<Fix[]>;
        let P2_fixes_promise = nSQL("fixes")
          .query("select")
          .where([
            ["track_id", "=", trackRow.id],
            "AND",
            [["ts", ">", ts_cut_1], "AND", ["ts", "<", ts_cut_2]],
          ])
          .exec() as Promise<Fix[]>;
        let P3_fixes_promise = nSQL("fixes")
          .query("select")
          .where([
            ["track_id", "=", trackRow.id],
            "AND",
            ["ts", ">=", ts_cut_2],
          ])
          .exec() as Promise<Fix[]>;
        let fixes_delete_promise = nSQL("fixes")
          .query("delete")
          .where(["track_id", "=", trackId])
          .exec();
        let tracks_delete_promise = nSQL("tracks")
          .query("delete")
          .where(["id", "=", trackId])
          .exec();
        Promise.all([
          P1_fixes_promise,
          P2_fixes_promise,
          P3_fixes_promise,
          readGliderTypeIfAny,
          fixes_delete_promise,
          tracks_delete_promise,
        ]).then((promised) => {
          let P1_fixes = promised[0];
          let P2_fixes = promised[1];
          let P3_fixes = promised[2];
          igc_glider_type = promised[3];
          let splittedId: string[] = [];
          let promisedAll = [];
          if (P1_fixes.length > 0) {
            promisedAll.push(
              nSQL("tracks")
                .query("upsert", [
                  {
                    id: track_p1_id,
                    dt_start: new Date(trackRow.ts_start),
                    ts_start: trackRow.ts_start,
                    dt_end: new Date(ts_cut_1 - 1),
                    ts_end: ts_cut_1 - 1,
                    nb_fixes: P1_fixes.length,
                    name: trackRow.name + "-P1",
                    type: trackRow.type,
                    gliderType:
                      trackRow.type == trackTypes.FLY ? igc_glider_type : "",
                  },
                ])
                .exec()
                .then((value) => {
                  P1FixesInsertedPromise = insertFixesArrayInDB(
                    track_p1_id.toString(CryptoJS.enc.Hex),
                    P1_fixes
                  );
                  splittedId.push(track_p1_id.toString(CryptoJS.enc.Hex));
                })
            );
          }
          if (P2_fixes.length > 0) {
            promisedAll.push(
              nSQL("tracks")
                .query("upsert", [
                  {
                    id: track_p2_id,
                    dt_start: new Date(ts_cut_1),
                    ts_start: ts_cut_1,
                    dt_end: new Date(ts_cut_2),
                    ts_end: ts_cut_2,
                    nb_fixes: P2_fixes.length,
                    name: trackRow.name + "-P2",
                    type: trackRow.type,
                    gliderType:
                      trackRow.type == trackTypes.FLY ? igc_glider_type : "",
                  },
                ])
                .exec()
                .then((value) => {
                  P2FixesInsertedPromise = insertFixesArrayInDB(
                    track_p2_id.toString(CryptoJS.enc.Hex),
                    P2_fixes
                  );
                  splittedId.push(track_p2_id.toString(CryptoJS.enc.Hex));
                })
            );
          }
          if (P3_fixes.length > 0) {
            promisedAll.push(
              nSQL("tracks")
                .query("upsert", [
                  {
                    id: track_p3_id,
                    dt_start: new Date(ts_cut_2 + 1),
                    ts_start: ts_cut_2 + 1,
                    dt_end: new Date(trackRow.ts_end),
                    ts_end: trackRow.ts_end,
                    nb_fixes: P3_fixes.length,
                    name: trackRow.name + "-P3",
                    type: trackRow.type,
                    gliderType:
                      trackRow.type == trackTypes.FLY ? igc_glider_type : "",
                  },
                ])
                .exec()
                .then((value) => {
                  P3FixesInsertedPromise = insertFixesArrayInDB(
                    track_p3_id.toString(CryptoJS.enc.Hex),
                    P3_fixes
                  );
                  splittedId.push(track_p3_id.toString(CryptoJS.enc.Hex));
                })
            );
          }
          Promise.all(promisedAll).then((value) => {
            resolve(splittedId);
          });
        });
      }
    });
  });
};

/**
 * split trackId in 2 or 3 parts P1, P2, P3 (can be only P1 and P2)
 * if ansiXOR((dt_start == trackRow.dt_start) , (dt_end == trackRow.dt_end)) -> only P1 and P2
 * if ((dt_start == trackRow.dt_start) && (dt_end == trackRow.dt_end)) -> change the whole track
 * if ((dt_start > trackRow.dt_start) && (dt_end < trackRow.dt_end)) -> P1, P2, P3
 * return a Promise with value containing an array of the new IDs
 * @param {string} trackId
 * @param {Date} dt_start
 * @param {Date} dt_end
 * @param {string} new_type
 * @returns
 */
let changePartOfTrackType = function (
  trackId: string,
  dt_start: Date,
  dt_end: Date,
  new_type: trackTypes
): Promise<string[]> {
  return new Promise(function (resolve, reject) {
    getDBTrackRowAsPromise(trackId).then((rows) => {
      let trackRow = rows[0];
      let ts_start = dt_start.getTime();
      let ts_end = dt_end.getTime();
      if (ansiXOR(ts_start == trackRow.ts_start, ts_end == trackRow.ts_end)) {
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
        if (ts_start > trackRow.ts_start && ts_end < trackRow.ts_end) {
          splitTrackIn3(trackId, dt_start, dt_end).then((value) => {
            console.log("Done split changed track is: " + value[1]);
            changeTrackType(value[1], new_type).then((retval) => {
              resolve(value);
            });
          });
        } else {
          changeTrackType(trackId, new_type).then((retval) => {
            resolve([trackId]);
          });
        }
      }
    });
  });
};

/**
 * Change track type
 * @param {string} trackId
 * @param {*} new_type
 * @returns
 */
let changeTrackType = function (
  trackId: string,
  new_type: trackTypes
): Promise<trackTypes> {
  return new Promise(function (resolve, reject) {
    let tracksPromise = nSQL("tracks")
      .query("upsert", [{ type: new_type }])
      .where(["id", "=", trackId])
      .exec() as Promise<Track[]>;
    let fixesPromise = nSQL("fixes")
      .query("upsert", [{ type: new_type }])
      .where(["track_id", "=", trackId])
      .exec() as Promise<Fix[]>;
    Promise.all([tracksPromise, fixesPromise]).then(() => resolve(new_type));
  });
};

/**
 * Cut overlapping
 * Insert A in B ,
 * if A is in B
 * extract B1 from B start to A start keeping Fly or Hike flag
 * extract B2 from A end to B end keeping Fly or Hike flag
 * @param {string} track_A_id
 * @param {string} track_B_id
 * @returns  a Promise with filled value with an array containing the 2 new trackId as string
 */
let cutOverlapping = function (
  track_A_id: string,
  track_B_id: string
): Promise<string[]> {
  return new Promise(function (resolve, reject) {
    let A_promise = getDBTrackRowAsPromise(track_A_id);
    let B_promise = getDBTrackRowAsPromise(track_B_id);

    Promise.all([A_promise, B_promise]).then((promisedDBRows) => {
      let track_A_row = promisedDBRows[0][0];
      let track_B_row = promisedDBRows[1][0];
      if (
        typeof track_A_row != "undefined" &&
        typeof track_B_row != "undefined"
      ) {
        if (
          track_A_row.ts_end <= track_B_row.ts_end &&
          track_A_row.ts_start >= track_B_row.ts_start
        ) {
          //so A is in B
          console.log(track_A_id + " is in " + track_B_id);
          let track_B1_id = CryptoJS.SHA256(track_B_row.id + "-B1");
          let track_B2_id = CryptoJS.SHA256(track_B_row.id + "-B2");
          let splittedId = [
            track_B1_id.toString(CryptoJS.enc.Hex),
            track_B2_id.toString(CryptoJS.enc.Hex),
          ];
          nSQL().useDatabase(nanoDB_name);
          let B1_fixes_promise = nSQL("fixes")
            .query("select")
            .where([
              ["track_id", "=", track_B_row.id],
              "AND",
              ["ts", "<", track_A_row.ts_start],
            ])
            .exec() as Promise<Fix[]>;
          let B2_fixes_promise = nSQL("fixes")
            .query("select")
            .where([
              ["track_id", "=", track_B_row.id],
              "AND",
              ["ts", ">", track_A_row.ts_end],
            ])
            .exec() as Promise<Fix[]>;
          let igc_glider_type_promise = getDBFirstGliderType();
          Promise.all([
            B1_fixes_promise,
            B2_fixes_promise,
            igc_glider_type_promise,
          ]).then((promisedDB_BRows) => {
            let B1_fixes = promisedDB_BRows[0];
            let B2_fixes = promisedDB_BRows[1];
            let gliderType = promisedDB_BRows[2];
            let insertTrackB1 = nSQL("tracks")
              .query("upsert", [
                {
                  id: track_B1_id,
                  dt_start: new Date(track_B_row.ts_start),
                  ts_start: track_B_row.ts_start,
                  dt_end: new Date(track_A_row.ts_start - 1),
                  ts_end: track_A_row.ts_start - 1,
                  nb_fixes: B1_fixes.length,
                  name: track_B_row.name + "-B1",
                  type: track_B_row.type,
                  gliderType:
                    track_B_row.type == trackTypes.FLY ? gliderType : "",
                },
              ])
              .exec() as Promise<Track[]>;
            let insertTrackB2 = nSQL("tracks")
              .query("upsert", [
                {
                  id: track_B2_id,
                  dt_start: new Date(track_A_row.ts_end + 1),
                  ts_start: track_A_row.ts_end + 1,
                  dt_end: new Date(track_B_row.ts_end),
                  ts_end: track_B_row.ts_end,
                  nb_fixes: B2_fixes.length,
                  name: track_B_row.name + "-B2",
                  type: track_B_row.type,
                  gliderType:
                    track_B_row.type == trackTypes.FLY ? gliderType : "",
                },
              ])
              .exec() as Promise<Track[]>;
            let nbB1FixesInserted = insertFixesArrayInDB(
              track_B1_id.toString(CryptoJS.enc.Hex),
              B1_fixes
            );

            let nbB2FixesInserted = insertFixesArrayInDB(
              track_B2_id.toString(CryptoJS.enc.Hex),
              B2_fixes
            );

            let fixesDelete = nSQL("fixes")
              .query("delete")
              .where(["track_id", "=", track_B_row.id])
              .exec() as Promise<Fix[]>;
            let tracksDelete = nSQL("tracks")
              .query("delete")
              .where(["id", "=", track_B_row.id])
              .exec() as Promise<Track[]>;
            Promise.all([
              insertTrackB1,
              insertTrackB2,
              nbB1FixesInserted,
              nbB2FixesInserted,
              fixesDelete,
              tracksDelete,
            ]).then(
              (
                value: [
                  insertTrackB1: Track[],
                  insertTrackB2: Track[],
                  nbB1FixesInserted: number,
                  nbB2FixesInserted: number,
                  fixesDelete: Fix[],
                  tracksDelete: Track[]
                ]
              ) => {
                resolve(splittedId);
              }
            );
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
};

/**
 *
 * @param {string} trackId
 * @returns all fixes for one track as Promise given it id
 */
let getDBFixesTrackRowAsPromise = function (trackId: string): Promise<Fix[]> {
  return nSQL("fixes")
    .query("select")
    .where(["track_id", "=", trackId])
    .exec() as Promise<Fix[]>;
};

/**
 *
 * @param {string} trackId
 * @returns single track as Promise given it id
 */
let getDBTrackRowAsPromise = function (trackId: string): Promise<Track[]> {
  return nSQL("tracks")
    .query("select")
    .where(["id", "=", trackId])
    .exec() as Promise<Track[]>;
};

/**
 *
 * @returns first gliderType if any
 */
let getDBFirstGliderType = function (): Promise<string> {
  return new Promise<string>(function (resolve, reject) {
    let promiseSelect = nSQL("tracks")
      .query("select", ["gliderType"])
      .where([
        ["gliderType.length", ">", 0],
        "AND",
        ["gliderType", "!=", IGC_GLIDER_TYPE],
      ])
      .exec() as Promise<Track[]>;

    promiseSelect.then((tracks: Track[]) => {
      if (
        typeof tracks[0] != "undefined" &&
        typeof tracks[0].gliderType != "undefined" &&
        tracks[0].gliderType != IGC_GLIDER_TYPE
      ) {
        resolve(tracks[0].gliderType);
      } else {
        resolve(_DEFAULT_GLIDER_TYPE);
      }
    });
  });
};

/**
 *
 * @param {string} trackId
 * @returns A promise with the first date
 */
let getDBTrackDTStartAsPromise = function (trackId: string): Promise<Date> {
  return getDBTrackRowAsPromise(trackId).then((rows) => {
    return rows[0]["dt_start"];
  });
};

/**
 *
 * @returns return all tracks as Promise
 */
let getDBTracksRowsAsPromise = function (): Promise<Track[]> {
  return nSQL("tracks")
    .query("select")
    .orderBy(["ts_start ASC"])
    .exec() as Promise<Track[]>;
};

/**
 *
 * @param {string} trackId
 * @returns all points in a Promise
 */
let getDBFixesRowsAsPromise = function (trackId?: string): Promise<Fix[]> {
  if (typeof trackId == "undefined") {
    return nSQL("fixes").query("select").orderBy(["dt ASC"]).exec() as Promise<
      Fix[]
    >;
  } else {
    return nSQL("fixes")
      .query("select")
      .where(["track_id", "=", trackId])
      .orderBy(["dt ASC"])
      .exec() as Promise<Fix[]>;
  }
};

/**
 *
 * @param {Date} date
 * @returns a date in IGC format
 */
let igcDateFormater = function (date: Date): string {
  let dateTimeFormat = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h24",
    minute: "2-digit",
    second: "2-digit",
  });
  let [{ value: month }, , { value: day }, , { value: year }] =
    dateTimeFormat.formatToParts(date);
  return `${day}${month}${year}`;
};

/**
 *
 * @param {*} date
 * @returns a date in IGC format
 */
let igcTimeFormater = function (date: Date): string {
  let dateTimeFormat = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    hour: "2-digit",
    hourCycle: "h24",
    minute: "2-digit",
    second: "2-digit",
  });
  let [{ value: hour }, , { value: minute }, , { value: second }] =
    dateTimeFormat.formatToParts(date);
  if (Number(hour) == 24 || hour == "24") {
    hour = "00";
  }
  return `${hour}${minute}${second}`;
};

/**
 *
 * @param {number} decimalLat
 * @returns a latitude in IGC format
 */
let igcLatFormater = function (decimalLat: number): string {
  let hemisphere = decimalLat >= 0 ? "N" : "S";
  let degrees = Math.floor(Math.abs(decimalLat)).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  let minutes = Math.round(
    (Math.abs(decimalLat) - Math.floor(Math.abs(decimalLat))) * 60000
  ).toLocaleString("en-US", { minimumIntegerDigits: 5, useGrouping: false });
  return `${degrees}${minutes}${hemisphere}`;
};

/**
 *
 * @param {number} decimalLon
 * @returns a longitude in IGC format
 */
let igcLonFormater = function (decimalLon: number): string {
  let eastern = decimalLon >= 0 ? "E" : "W";
  let degrees = Math.floor(Math.abs(decimalLon)).toLocaleString("en-US", {
    minimumIntegerDigits: 3,
    useGrouping: false,
  });
  let minutes = Math.round(
    (Math.abs(decimalLon) - Math.floor(Math.abs(decimalLon))) * 60000
  ).toLocaleString("en-US", { minimumIntegerDigits: 5, useGrouping: false });
  return `${degrees}${minutes}${eastern}`;
};

/**
 *
 * @param {number} altitude
 * @returns an altitude converted to IGC format
 */
let igcAltitudeFormater = function (altitude: number): string {
  if (altitude >= 0) {
    return `${Math.round(altitude).toLocaleString("en-US", {
      minimumIntegerDigits: 5,
      useGrouping: false,
    })}`;
  } else {
    return `-${Math.ceil(Math.abs(altitude)).toLocaleString("en-US", {
      minimumIntegerDigits: 4,
      useGrouping: false,
    })}`;
  }
};

/**
 * 
 * @param trackId 
 * @returns a Promise with a string containing the IGC file of a trackId
 */
let getTrackASIgcString = function (trackId?: string): Promise<string> {
  return new Promise(function (resolve) {
    getDBFixesRowsAsPromise(trackId).then((value) => {
      let igc_string = igcProducer(value);
      resolve(igc_string);
    });
  });
};

/**
 * Create a GPX file with an array of fixes
 * @param fixes 
 * @returns a valid GPX file as a string
 */
let gpxProducer = function (fixes: Fix[]): string {
  let result =
    '<?xml version="1.0" encoding="UTF-8"?>\n<gpx xmlns="http://www.topografix.com/GPX/1/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="CFDTrackjoiner">';
  result += `<metadata/><trk><name></name><desc></desc><trkseg>`;
  result += fixes.reduce((accum, curr) => {
    let segmentTag = "";
    if (curr.point.lat !== undefined && curr.point.lon !== undefined) {
      segmentTag += `<trkpt lat="${curr.point.lat}" lon="${curr.point.lon}">`;
      segmentTag +=
        curr.gpsAltitude !== undefined ? `<ele>${curr.gpsAltitude}</ele>` : "";
      segmentTag +=
        curr.dt !== undefined
          ? `<time>${new Date(curr.dt).toISOString()}</time>`
          : "";
      segmentTag += `</trkpt>`;
    }
    return (accum += segmentTag);
  }, "");
  result += "</trkseg></trk></gpx>";
  return result;
};

/**
 * 
 * @param trackId 
 * @returns a Promise with a string containing the GPX file of a trackId
 */
let getTrackASGpxString = function (trackId?: string): Promise<string> {
  return new Promise(function (resolve) {
    getDBFixesRowsAsPromise(trackId).then((value) => {
      let gpx_string = gpxProducer(value);
      resolve(gpx_string);
    });
  });
};

/**
 * minimal headers for a valid IGC File
 * date is a javascript Date() object
 * @param {*} date
 * @returns minimal headers for a valid IGC File
 */
let igcHeaders = function (date: Date): string {
  return `AXCF034 French CFDMV pre-alpha track fusion\r\nHFDTE${igcDateFormater(
    date
  )}\r\nHFPLTPILOTINCHARGE:CFDMV\r\nHFCM2CREW2:NIL\r\nHFGTYGLIDERTYPE:${igc_glider_type}\r\nHFGIDGLIDERID:\r\nHFDTMGPSDATUM:WGS84\r\nHFRFWFIRMWAREVERSION:0\r\nHFRHWHARDWAREVERSION:\r\nHFFTYFRTYPE:TrackJoiner\r\nHFGPSRECEIVER:NIL\r\nHFPRSPRESSALTSENSOR:\r\n`;
};

/**
 *
 * @param {trackTypes} type
 * @param {boolean} isStart
 * @returns {string} an IGC comment
 */
let igcTypeCommentFormater = function (
  type: trackTypes,
  isStart: boolean
): string {
  let longType = type == "H" ? "HIKE" : "FLY";
  let longIsStart = isStart ? "START" : "END";
  return `LPLT${longType}${longIsStart}\r\n`;
};

/**
 *
 * @param {*} row
 * @returns minimal IGC record formater
 */
let igcBRecordFormater = function (row: Fix): string {
  let dt = new Date(row.dt);
  if (isNaN(row.point.lat) || isNaN(row.point.lon)) {
    return "";
  }
  let igc_lat = igcLatFormater(row.point.lat);
  let igc_lon = igcLonFormater(row.point.lon);
  let igc_pressureAltitude = igcAltitudeFormater(
    isNaN(row.preciseAltitude) ? 0 : row.preciseAltitude
  );
  let igc_gpsAltitude = igcAltitudeFormater(
    isNaN(row.gpsAltitude) ? 0 : row.gpsAltitude
  );
  return `B${igcTimeFormater(
    dt
  )}${igc_lat}${igc_lon}A${igc_pressureAltitude}${igc_gpsAltitude}\r\n`;
};

/**
 * simple IGC file producer (input is a rows of points object)
 * @param {*} rows
 * @returns
 */
let igcProducer = function (rows: Fix[]): string {
  let szReturn = "";
  if (rows.length) {
    szReturn += igcHeaders(new Date(rows[0].dt));
    let lastType: trackTypes = null;
    for (let i = 0; i < rows.length; i++) {
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
  }
  return szReturn;
};

/**
 * detect if there is an overlap in the rows of tracks
 * @param {*} tracks
 * @returns true if there is an overlap
 */
let isAnOverlapDetected = function (tracks: Track[]): boolean {
  for (let i = 1; i < tracks.length; i++) {
    if (tracks[i - 1].ts_end > tracks[i].ts_start) {
      return true;
    }
  }
  return false;
};

/**
 *
 * @param {*} tracks
 * @returns get an array of the overlapped rows id
 */
let getOverlappedRowsID = function (tracks: Track[]): string[] {
  let retArray: string[] = [];
  for (let i = 1; i < tracks.length; i++) {
    if (tracks[i - 1].ts_end > tracks[i].ts_start) {
      retArray.push(tracks[i].id);
    }
  }
  return retArray;
};

/**
 * integrate a row in its predecessor
 * all checks are done in cutOverlapping
 * return the cutOverlapping Promise or reject
 * @param {string} trackId
 * @returns
 */
let integrateInPreviousTrack = function (trackId: string): Promise<string[]> {
  return new Promise(function (resolve, reject) {
    getDBTracksRowsAsPromise().then((promisedRows) => {
      let previousRowId = "";
      for (let i = 1; i < promisedRows.length; i++) {
        if (promisedRows[i].id == trackId) {
          previousRowId = promisedRows[i - 1].id;
          break;
        }
      }
      if (previousRowId != "") {
        resolve(cutOverlapping(trackId, previousRowId));
      } else {
        reject(
          "Unknown trackId or no previous row or selected row is not in the previous one"
        );
      }
    });
  });
};

/**
 * showDB the DB in console
 */
let showDB = function (): void {
  getDBTracksRowsAsPromise()
    .then((rows) => {
      // selected rows
      console.log(rows);
    })
    .catch((error: Error) => {
      console.log(error.toString());
    });
  getDBFixesRowsAsPromise()
    .then((rows) => {
      // selected rows
      console.log(rows);
    })
    .catch((error: Error) => {
      console.log(error.toString());
    });
};

export {
  changePartOfTrackType,
  changeTrackType,
  initDB,
  fixErroneousDT,
  getDBTracksRowsAsPromise,
  getDBFixesRowsAsPromise,
  getTrackASIgcString,
  getTrackASGpxString,
  getOverlappedRowsID,
  igcProducer,
  gpxProducer,
  integrateInPreviousTrack,
  nanoDB_name,
  showDB,
  splitTrackIn2,
  splitTrackIn3,
  trackTypes,
  fileTypes,
  openFile,
  openFileAsPromise,
  openFileTreatSingle,
  openFileTreatSingleAsPromise,
};
