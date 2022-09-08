/*************************************
 * Demo IGC + FIT + GPX track joiner for CFD MV (French CFD MV)
 * © Ronan LE MEILLAT
 * Totally free and 'As Is' under MIT License
 * IGC Parser is adapted from Tobias Bieniek's project https://github.com/Turbo87/igc-parser (MIT license)
 * FIT Parser is adapted from Dimitrios Kanellopoulos's project https://github.com/jimmykane/fit-parser (MIT license)
 * GPX Parser is adapted from Lucas Trebouet's project https://github.com/Luuka/GPXParser.js (MIT license)
 */
import Dexie from "dexie";
import CryptoJS from "crypto-js"; //tsc/trasnspileModule needs {compilerOptions: { esModuleInterop: true}}
import {IGCParser} from "./igc-parser"; //tsc/trasnspileModule needs {compilerOptions: { esModuleInterop: true}}
import { FitParser } from "./fit-parser/fit-parser";
import type { FitData } from "./fit-parser/fit-parser";
import gpxParser from "gpxparser"; //tsc/trasnspileModule needs {compilerOptions: { esModuleInterop: true}}
import type { Track as GpxParserTrack } from "gpxparser";

const DB_SCHEMA_VERSION = 1;
const nanoDB_name = "cfdmv_db";
const _DEFAULT_GLIDER_TYPE = "UNKOWN";
const IGC_GLIDER_TYPE = "TO-BE-FILLED";
const FIT_DEFAULT_GLIDER_TYPE = "FIT-GLIDER";
let igc_glider_type = IGC_GLIDER_TYPE;
let myTrackjoinerDB = null as TrackjoinerDB;

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

/**
 * 
 */
export interface Fix {
  id?: number;
  track_id: string;
  point: { lat: number; lon: number };
  preciseAltitude?: number;
  gpsAltitude: number;
  dt: Date;
  ts: number;
  type: trackTypes;
}

class TrackjoinerDB extends Dexie {
  fixes!: Dexie.Table<Fix, number>;
  tracks!: Dexie.Table<Track, string>;
  constructor() {
    super(nanoDB_name);
    this.version(DB_SCHEMA_VERSION).stores({
      fixes: '++id,track_id,ts',
      tracks: 'id,ts_start,gliderType',
    });
  }
}
/**
 * still no XOR in EMEA JavaScript
 * @param a
 * @param b
 * @returns ANSI XOR
 */
const ansiXOR = function (a: boolean, b: boolean): boolean {
  return (a || b) && !(a && b);
};

/**
 *
 * @param igcDate
 * @param igcTime
 * @returns basic Iso date creation from IGC file
 */
const igcDate2ISO8601 = function (igcDate: string, igcTime: string): string {
  const jsDate = igcDate + "T" + igcTime + "Z";
  return jsDate;
};

/**
 * Insert on IGC track parsed with IGCParser goes in tracks , gps points in fixes
 * @internal
 * @param igcTrack 
 * @param hashHex 
 * @param fileName 
 * @param trackType 
 * @param onDBInsertOKCallback 
 */
const insertIGCTrackInDB = function (
  igcTrack: IGCParser.IGCFile,
  hashHex: string,
  fileName: string,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  insertIGCTrackInDBAsPromise(igcTrack, hashHex, fileName, trackType).then(
    () => {
      onDBInsertOKCallback();
    }
  );
};
/**
 * Insert on IGC track parsed with IGCParser goes in tracks , gps points in fixes
 * @internal
 * @param hashHex
 * @param fileName
 * @param trackType
 * @returns An array of Promise resolving as type [Track[],...Fix[][]
 * so first element is Track[] followers are Fix[]
 */
const insertIGCTrackInDBAsPromise = function (
  igcTrack: IGCParser.IGCFile,
  hashHex: string,
  fileName: string,
  trackType: trackTypes
): Promise<[string, ...number[]]> {
  igc_glider_type =
    typeof igcTrack.gliderType != "undefined" && igcTrack.gliderType.length > 0
      ? igcTrack.gliderType
      : IGC_GLIDER_TYPE;
  const isoDt_start = new Date(igcTrack.fixes[0].timestamp);
  const unixTs_start = isoDt_start.getTime();
  const isoDt_end = new Date(igcTrack.fixes[igcTrack.fixes.length - 1].timestamp);
  const unixTs_end = isoDt_end.getTime();

  const trackPromise = myTrackjoinerDB.tracks.add({
    id: hashHex,
    dt_start: isoDt_start,
    ts_start: unixTs_start,
    dt_end: isoDt_end,
    ts_end: unixTs_end,
    nb_fixes: igcTrack.fixes.length,
    name: fileName,
    type: trackType,
    gliderType: igc_glider_type,
  }) as Promise<string>;

  const fixes: Fix[] = [];
  let bulkFixInsert = null as Promise<number>;
  for (let i = 0; i < igcTrack.fixes.length; i++) {
    //loop faster than .map
    if (igcTrack.fixes[i].valid) {
      // fill pressureAltitude with gpsAltitude if empty, this is for filling the DB in the preciseAltitude field
      if (
        typeof igcTrack.fixes[i].pressureAltitude == "undefined" ||
        igcTrack.fixes[i].pressureAltitude == null
      ) {
        igcTrack.fixes[i].pressureAltitude = igcTrack.fixes[i].gpsAltitude;
      }
      fixes.push({
        track_id: hashHex,
        point: {
          lat: igcTrack.fixes[i].latitude,
          lon: igcTrack.fixes[i].longitude,
        },
        gpsAltitude: igcTrack.fixes[i].gpsAltitude,
        preciseAltitude: igcTrack.fixes[i].pressureAltitude,
        dt: new Date(igcTrack.fixes[i].timestamp),
        ts: igcTrack.fixes[i].timestamp,
        type: trackType, //WIP use IGC for hike
      })
    }
  }
  if (fixes.length){
    bulkFixInsert = myTrackjoinerDB.fixes.bulkAdd(fixes);
  }
  // Promise.all(fixInserted).then(() => {
  //   console.log("igc inserted");
  // });
  return Promise.all([trackPromise, bulkFixInsert]);
};

/**
 * Insert on GPX track parsed with GPXParser (data.tracks[0].segments[0])
 * header goes in tracks , gps points in fixes
 * @internal
 * @param gpxTrack
 * @param hashHex
 * @param fileName
 * @param trackType
 * @param onDBInsertOKCallback
 */
const insertGPXTrackInDB = function (
  gpxTrack: GpxParserTrack,
  hashHex: string,
  fileName: string,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  insertGPXTrackInDBAsPromise(gpxTrack, hashHex, fileName, trackType).then(
    () => {
      onDBInsertOKCallback();
    }
  );
};
/**
 * Insert on GPX track parsed with GPXParser (data.tracks[0].segments[0])
 * header goes in tracks , gps points in fixes
 * @internal
 * @param gpxTrack
 * @param hashHex
 * @param fileName
 * @param trackType
 * @returns An array of Promise resolving as type [Track[],...Fix[][]
 * so first element is Track[] followers are Fix[]
 */
const insertGPXTrackInDBAsPromise = function (
  gpxTrack: GpxParserTrack,
  hashHex: string,
  fileName: string,
  trackType: trackTypes
): Promise<[string, ...number[]]> {
  const isoDt_start = gpxTrack.points[0].time;
  const unixTs_start = isoDt_start.getTime();
  const isoDt_end = gpxTrack.points[gpxTrack.points.length - 1].time;
  const unixTs_end = isoDt_end.getTime();
  const trackPromise = myTrackjoinerDB.tracks.add({
    id: hashHex,
    dt_start: isoDt_start,
    ts_start: unixTs_start,
    dt_end: isoDt_end,
    ts_end: unixTs_end,
    nb_fixes: gpxTrack.points.length,
    name: fileName,
    type: trackType,
    gliderType: "",
  }) as Promise<string>;

  const fixes: Fix[] = [];
  let bulkFixInsert = null as Promise<number>;
  for (let i = 0; i < gpxTrack.points.length; i++) {
    fixes.push({
      track_id: hashHex,
      point: { lat: gpxTrack.points[i].lat, lon: gpxTrack.points[i].lon },
      gpsAltitude: gpxTrack.points[i].ele,
      preciseAltitude: gpxTrack.points[i].ele, //no precise altitude on GPX
      dt: gpxTrack.points[i].time,
      ts: gpxTrack.points[i].time.getTime(),
      type: trackType, //WIP use IGC for hike
    });
  }
  if (fixes.length){
    bulkFixInsert = myTrackjoinerDB.fixes.bulkAdd(fixes);
  }
  return Promise.all([trackPromise, bulkFixInsert]);
};

/**
 * Insert on FIT track parsed with FITParser
 * header goes in tracks , gps points in fixes
 * TO BE CHECKED :
 * the only altitude my Fenix 6 gives is "enhanced_altitude" not sure all watches have this field
 * TO DO : find a basic watch without barometer for seing wich altitude it gives
 * @internal
 * @param fitTrack
 * @param hashHex
 * @param fileName
 * @param trackType
 * @param onDBInsertOKCallback
 */
const insertFITTrackInDB = function (
  fitTrack: FitData,
  hashHex: string,
  fileName: string,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  insertFITTrackInDBAsPromise(fitTrack, hashHex, fileName, trackType).then(
    () => {
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
 * @internal
 * @param fitTrack
 * @param hashHex
 * @param fileName
 * @param trackType
 */
const insertFITTrackInDBAsPromise = function (
  fitTrack: FitData,
  hashHex: string,
  fileName: string,
  trackType: trackTypes
): Promise<[string, ...number[]]> {
  const unixTs_start = fitTrack.records[0].timestamp.getTime();
  const unixTs_end =
    fitTrack.records[fitTrack.records.length - 1].timestamp.getTime();
  const trackPromise = myTrackjoinerDB.tracks.add({
    id: hashHex,
    dt_start: fitTrack.records[0].timestamp,
    ts_start: unixTs_start,
    dt_end: fitTrack.records[fitTrack.records.length - 1].timestamp,
    ts_end: unixTs_end,
    nb_fixes: fitTrack.records.length,
    name: fileName,
    type: trackType,
    gliderType: FIT_DEFAULT_GLIDER_TYPE,
  }) as Promise<string>;

  const fixes: Fix[] = [];
  let bulkFixInsert = null as Promise<number>;
  for (let i = 0; i < fitTrack.records.length; i++) {
    const gpsAltitude =
      typeof fitTrack.records[i].enhanced_altitude != "undefined"
        ? fitTrack.records[i].enhanced_altitude
        : fitTrack.records[i].altitude;
      fixes.push({
        track_id: hashHex,
        point: {
          lat: fitTrack.records[i].position_lat,
          lon: fitTrack.records[i].position_long,
        },
        gpsAltitude: gpsAltitude,
        preciseAltitude: fitTrack.records[i].enhanced_altitude,
        dt: fitTrack.records[i].timestamp,
        ts: fitTrack.records[i].timestamp.getTime(),
        type: trackType, // WIP use FIT for fly
      });
  }
  if (fixes.length){
    bulkFixInsert = myTrackjoinerDB.fixes.bulkAdd(fixes);
  }
  return Promise.all([trackPromise, bulkFixInsert]);
};

/**
 * 
 * @param fullPath
 * @returns basic path removal (works for windows/unices)
 */
const getFileName = function (fullPath: string): string {
  return fullPath.replace(/^.*[\\/]/, "");
};

/**
 * @param fileName
 * @returns basic file Extension (return file name if there is no extension) // TODO better handling
 */
const getFileExtension = function (fileName: string): string {
  return fileName.split(".").pop().split(/#|\?/)[0].toUpperCase();
};

/**
 * CryptoJS  needs word array so this is an optimized conversion
 * @param ab Input ArrayBuffer
 * @returns the converted word array
 */
const arrayBufferToWordArray = function (ab: ArrayBuffer): CryptoJS.lib.WordArray {
  const i8a = new Uint8Array(ab);
  const a = [];
  for (let i = 0; i < i8a.length; i += 4) {
    a.push(
      (i8a[i] << 24) | (i8a[i + 1] << 16) | (i8a[i + 2] << 8) | i8a[i + 3]
    );
  }
  return CryptoJS.lib.WordArray.create(a, i8a.length);
};

/**
 * Single file reception (with on FileReader), on event:load parse and insert in DB
 * @internal
 * @param file
 * @param trackType
 * @param onDBInsertOKCallback
 */
const openIGCFileTreatSingle = function (
  file: File,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  const reader = new FileReader();
  reader.addEventListener("load", function (event) {
    const igcFile = event.target;
    const text = igcFile.result as string;
    const fileName = getFileName(file.name);
    const hash = CryptoJS.SHA256(text);
    const hashHex = hash.toString(CryptoJS.enc.Hex);
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
 * prefer openFile
 * @param event
 * @param trackType
 * @param onDBInsertOKCallback
 */
const openIGCFile = function (
  event: Event,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    openIGCFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};

/**
 * Single file reception (with on FileReader), on event:load parse and insert in DB
 * @internal
 * @param {*} file
 * @param {*} trackType
 * @param {*} onDBInsertOKCallback
 */
const openFITFileTreatSingle = function (
  file: File,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  const fitParser = new FitParser({
    force: true,
    speedUnit: "km/h",
    lengthUnit: "m",
    temperatureUnit: "celcius",
    elapsedRecordField: true,
    mode: "list",
  });
  const reader = new FileReader();
  reader.addEventListener("load", function (event) {
    const fitFile = event.target;
    const blob = fitFile.result as ArrayBuffer;
    const fileName = getFileName(file.name);
    const hash = CryptoJS.SHA256(arrayBufferToWordArray(blob));
    const hashHex = hash.toString(CryptoJS.enc.Hex);
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
 * prefer openFile
 * @param {*} event
 * @param {*} trackType
 * @param {*} onDBInsertOKCallback
 */
const openFITFile = function (
  event: Event,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  const input = <HTMLInputElement>event.target;
  const files = input.files;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    openFITFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};

/**
 * Single file reception (with on FileReader), on event:load parse and insert in DB
 * @internal
 * @param {File} file
 * @param {trackTypes} trackType
 * @param {Function} onDBInsertOKCallback
 */
const openGPXFileTreatSingle = function (
  file: File,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  const reader = new FileReader();
  reader.addEventListener("load", function (event) {
    const gpxFile = event.target;
    const gpxText = gpxFile.result as string;
    const fileName = getFileName(file.name);
    const hash = CryptoJS.SHA256(gpxText);
    const hashHex = hash.toString(CryptoJS.enc.Hex);
    console.log(fileName);
    const _gpxParser = new gpxParser();
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
const openFileTreatSingle = function (
  file: File,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  openFileTreatSingleAsPromise(file, trackType).then(() => {
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
const openFileTreatSingleAsPromise = function (
  file: File,
  trackType: trackTypes
): Promise<[string, ...number[]]> {
  const fileName = getFileName(file.name);
  const fileExtension = getFileExtension(fileName) as fileTypes;
  return new Promise<[string, ...number[]]>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", function (event) {
      const trackFile = event.target;
      const fileContent = trackFile.result as string;
      const hash =
        fileExtension == fileTypes.FIT
          ? CryptoJS.SHA256(arrayBufferToWordArray(trackFile.result as ArrayBuffer))
          : CryptoJS.SHA256(trackFile.result as string); // FIT format is binay
      const hashHex = hash.toString(CryptoJS.enc.Hex);
      console.log(fileName);
      switch (fileExtension) {
        case fileTypes.FIT:
          {
            const fitParser = new FitParser({
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
          }
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
          {
            const _gpxParser = new gpxParser();
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
          }
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
const openFile = function (
  event: Event,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  openFileAsPromise(event, trackType).then(() => {
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
const openFileAsPromise = function (
  event: Event,
  trackType: trackTypes
): Promise<[string, ...number[]][]> {
  const input = <HTMLInputElement>event.target;
  const files = input.files;
  const promised: Promise<[string, ...number[]]>[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    promised.push(openFileTreatSingleAsPromise(file, trackType));
  }
  return Promise.all(promised);
};

/**
 * Basically creates one openGPXFileTreatSingle per file (on multiple selection)
 * prefer openFile
 * @param {*} event
 * @param {*} trackType
 * @param {*} onDBInsertOKCallback
 */
const openGPXFile = function (
  event: Event,
  trackType: trackTypes,
  onDBInsertOKCallback: () => void
) {
  const input = <HTMLInputElement>event.target;
  const files = input.files;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    openGPXFileTreatSingle(file, trackType, onDBInsertOKCallback);
  }
};

/**
 * Creates the main Dexie database
 * prefer using initDB()
 */
const createDB = function () {
  myTrackjoinerDB = new TrackjoinerDB();
  myTrackjoinerDB.open();
};

/**
 * drop DB if exists (on some browser even in-memory persists)
 * next creates the DB in memory
 */
const initDB = function () {
  // Database creation
  Dexie.exists(nanoDB_name).then((exists) => {
    if (exists) {
      Dexie.delete(nanoDB_name).then(() => {
        console.log("Database dropped !");
        createDB();
      })
        .catch((error: Error) => {
          console.log(error.toString());
        });
    } else {
      createDB();
    }
  })
};

/**
 * add milliseconds to Date object
 * @param {*} ts
 * @param {*} dateObject
 * @returns a new Date = oldDate + ts in ms
 */
const addTimestampToDateObject = function (ts: number, dateObject: Date): Date {
  const oDate = new Date();
  oDate.setTime(dateObject.getTime() + ts);
  return oDate;
};

/**
 * fixErroneusDT given trackID and realDTStart wich is a Date() object
 * @param {string} trackId
 * @param {*} realDTStart
 */
const fixErroneousDT = function (trackId: string, realDTStart: Date) {
  let tracksPromise: Promise<number> = null;
  const fixesPromise: Promise<number>[] = [];
  getDBTrackRowAsPromise(trackId).then((track) => {
    const Δt = realDTStart.getTime() - new Date(track[0].dt_start).getTime();
    tracksPromise = myTrackjoinerDB.tracks.update(trackId, {
      dt_start: addTimestampToDateObject(
        Δt,
        new Date(track[0].dt_start)
      ),
      ts_start: track[0].ts_start + Δt,
      dt_end: addTimestampToDateObject(
        Δt,
        new Date(track[0].dt_end)
      ),
      ts_end: track[0].ts_end + Δt,
    });

    getDBFixesTrackRowAsPromise(trackId).then((fixes) => {
      for (let i = 0; i < fixes.length; i++) {
        fixesPromise.push(
          myTrackjoinerDB.fixes.update(fixes[i], {
            dt: addTimestampToDateObject(
              Δt,
              new Date(fixes[i].dt)
            )
          })
        );
      }
    });
  });
  Promise.all([tracksPromise, ...fixesPromise]);
};

/**
 * insert an array of fixes (probably created with an nSQL query)
 * return a Promise with the number of fixes inserted
 * @internal
 * @param {string} trackId
 * @param {*} fixesArray
 * @returns a number with number of fixes inserted
 */
const insertFixesArrayInDB = function (
  trackId: string,
  fixesArray: Fix[]
): Promise<number> {
  return new Promise(function (resolve) {
    const promisedAll = [];
    for (let i = 0; i < fixesArray.length; i++) {
      promisedAll.push(
        myTrackjoinerDB.fixes.add({
          track_id: trackId,
          point: fixesArray[i].point,
          gpsAltitude: fixesArray[i].gpsAltitude,
          preciseAltitude: fixesArray[i].preciseAltitude,
          dt: fixesArray[i].dt,
          ts: fixesArray[i].ts,
          type: fixesArray[i].type,
        })
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
const splitTrackIn2 = function (
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
const splitTrackIn3 = function (
  trackId: string,
  dt_cut_1: Date,
  dt_cut_2: Date
): Promise<string[]> {
  return new Promise(function (resolve) {
    let P1FixesInsertedPromise: Promise<number> = null;
    let P2FixesInsertedPromise: Promise<number> = null;
    let P3FixesInsertedPromise: Promise<number> = null;
    let track_p1_id: CryptoJS.lib.WordArray = null;
    let track_p2_id: CryptoJS.lib.WordArray = null;
    let track_p3_id: CryptoJS.lib.WordArray = null;
    getDBTrackRowAsPromise(trackId).then((rows) => {
      const trackRow = rows[0];
      const ts_cut_1 = dt_cut_1.getTime();
      const ts_cut_2 = dt_cut_2.getTime();
      if (trackRow.ts_start < ts_cut_1 && trackRow.ts_end > ts_cut_2) {
        track_p1_id = CryptoJS.SHA256(trackRow.id + "-P1");
        track_p2_id = CryptoJS.SHA256(trackRow.id + "-P2");
        track_p3_id = CryptoJS.SHA256(trackRow.id + "-P3");
        const readGliderTypeIfAny = getDBFirstGliderType();
        const P1_fixes_promise = myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(trackRow.id).and((fix) => { return fix.ts < ts_cut_1 }).toArray();
        const P2_fixes_promise = myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(trackRow.id).and((fix) => { return (fix.ts > ts_cut_1) && (fix.ts < ts_cut_2) }).toArray();
        const P3_fixes_promise = myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(trackRow.id).and((fix) => { return fix.ts > ts_cut_2 }).toArray();
        const fixes_delete_promise = myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(trackId).delete();
        const tracks_delete_promise = myTrackjoinerDB.tracks.delete(trackId);

        Promise.all([
          P1_fixes_promise,
          P2_fixes_promise,
          P3_fixes_promise,
          readGliderTypeIfAny,
          fixes_delete_promise,
          tracks_delete_promise,
        ]).then((promised) => {
          const P1_fixes = promised[0];
          const P2_fixes = promised[1];
          const P3_fixes = promised[2];
          igc_glider_type = promised[3];
          const splittedId: string[] = [];
          const promisedAll = [];
          if (P1_fixes.length > 0) {
            promisedAll.push(
              myTrackjoinerDB.tracks.add({
                id: track_p1_id.toString(CryptoJS.enc.Hex),
                dt_start: new Date(trackRow.ts_start),
                ts_start: trackRow.ts_start,
                dt_end: new Date(ts_cut_1 - 1),
                ts_end: ts_cut_1 - 1,
                nb_fixes: P1_fixes.length,
                name: trackRow.name + "-P1",
                type: trackRow.type,
                gliderType:
                  trackRow.type == trackTypes.FLY ? igc_glider_type : "",
              }).then(() => {
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
              myTrackjoinerDB.tracks.add({
                id: track_p2_id.toString(CryptoJS.enc.Hex),
                dt_start: new Date(ts_cut_1),
                ts_start: ts_cut_1,
                dt_end: new Date(ts_cut_2),
                ts_end: ts_cut_2,
                nb_fixes: P2_fixes.length,
                name: trackRow.name + "-P2",
                type: trackRow.type,
                gliderType:
                  trackRow.type == trackTypes.FLY ? igc_glider_type : "",
              }).then(() => {
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
              myTrackjoinerDB.tracks.add({
                id: track_p3_id.toString(CryptoJS.enc.Hex),
                dt_start: new Date(ts_cut_2 + 1),
                ts_start: ts_cut_2 + 1,
                dt_end: new Date(trackRow.ts_end),
                ts_end: trackRow.ts_end,
                nb_fixes: P3_fixes.length,
                name: trackRow.name + "-P3",
                type: trackRow.type,
                gliderType:
                  trackRow.type == trackTypes.FLY ? igc_glider_type : "",
              }).then(() => {
                P3FixesInsertedPromise = insertFixesArrayInDB(
                  track_p3_id.toString(CryptoJS.enc.Hex),
                  P3_fixes
                );
                splittedId.push(track_p3_id.toString(CryptoJS.enc.Hex));
              })
            );
          }
          Promise.all([P1FixesInsertedPromise, P2FixesInsertedPromise, P3FixesInsertedPromise, ...promisedAll]).then(() => {
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
const changePartOfTrackType = function (
  trackId: string,
  dt_start: Date,
  dt_end: Date,
  new_type: trackTypes
): Promise<string[]> {
  return new Promise(function (resolve) {
    getDBTrackRowAsPromise(trackId).then((rows) => {
      const trackRow = rows[0];
      const ts_start = dt_start.getTime();
      const ts_end = dt_end.getTime();
      if (ansiXOR(ts_start == trackRow.ts_start, ts_end == trackRow.ts_end)) {
        if (ts_start == trackRow.ts_start) {
          splitTrackIn2(trackId, dt_end).then((value) => {
            console.log("Done split changed track is: " + value[0]);
            changeTrackType(value[0], new_type).then(() => {
              resolve(value);
            });
          });
        } else {
          splitTrackIn2(trackId, dt_start).then((value) => {
            console.log("Done split changed track is: " + value[1]);
            changeTrackType(value[1], new_type).then(() => {
              resolve(value);
            });
          });
        }
      } else {
        if (ts_start > trackRow.ts_start && ts_end < trackRow.ts_end) {
          splitTrackIn3(trackId, dt_start, dt_end).then((value) => {
            console.log("Done split changed track is: " + value[1]);
            changeTrackType(value[1], new_type).then(() => {
              resolve(value);
            });
          });
        } else {
          changeTrackType(trackId, new_type).then(() => {
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
const changeTrackType = function (
  trackId: string,
  new_type: trackTypes
): Promise<trackTypes> {
  return new Promise(function (resolve) {
    const tracksPromise = myTrackjoinerDB.tracks.update(trackId,
      { type: new_type }
    );
    const fixesPromise = myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(trackId).modify({ type: new_type });
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
const cutOverlapping = function (
  track_A_id: string,
  track_B_id: string
): Promise<string[]> {
  return new Promise(function (resolve, reject) {
    const A_promise = getDBTrackRowAsPromise(track_A_id);
    const B_promise = getDBTrackRowAsPromise(track_B_id);

    Promise.all([A_promise, B_promise]).then((promisedDBRows) => {
      const track_A_row = promisedDBRows[0][0];
      const track_B_row = promisedDBRows[1][0];
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
          const track_B1_id = CryptoJS.SHA256(track_B_row.id + "-B1");
          const track_B2_id = CryptoJS.SHA256(track_B_row.id + "-B2");
          const splittedId = [
            track_B1_id.toString(CryptoJS.enc.Hex),
            track_B2_id.toString(CryptoJS.enc.Hex),
          ];
          const B1_fixes_promise = myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(track_B_row.id).and((fix: Fix) => { return fix.ts < track_A_row.ts_start }).toArray();
          const B2_fixes_promise = myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(track_B_row.id).and((fix: Fix) => { return fix.ts > track_A_row.ts_end }).toArray();
          const igc_glider_type_promise = getDBFirstGliderType();
          Promise.all([
            B1_fixes_promise,
            B2_fixes_promise,
            igc_glider_type_promise,
          ]).then((promisedDB_BRows) => {
            const B1_fixes = promisedDB_BRows[0];
            const B2_fixes = promisedDB_BRows[1];
            const gliderType = promisedDB_BRows[2];
            const insertTrackB1 = myTrackjoinerDB.tracks.add({
              id: track_B1_id.toString(CryptoJS.enc.Hex),
              dt_start: new Date(track_B_row.ts_start),
              ts_start: track_B_row.ts_start,
              dt_end: new Date(track_A_row.ts_start - 1),
              ts_end: track_A_row.ts_start - 1,
              nb_fixes: B1_fixes.length,
              name: track_B_row.name + "-B1",
              type: track_B_row.type,
              gliderType:
                track_B_row.type == trackTypes.FLY ? gliderType : "",
            })
            const insertTrackB2 = myTrackjoinerDB.tracks.add({
              id: track_B2_id.toString(CryptoJS.enc.Hex),
              dt_start: new Date(track_A_row.ts_end + 1),
              ts_start: track_A_row.ts_end + 1,
              dt_end: new Date(track_B_row.ts_end),
              ts_end: track_B_row.ts_end,
              nb_fixes: B2_fixes.length,
              name: track_B_row.name + "-B2",
              type: track_B_row.type,
              gliderType:
                track_B_row.type == trackTypes.FLY ? gliderType : "",
            })

            const nbB1FixesInserted = insertFixesArrayInDB(
              track_B1_id.toString(CryptoJS.enc.Hex),
              B1_fixes
            );

            const nbB2FixesInserted = insertFixesArrayInDB(
              track_B2_id.toString(CryptoJS.enc.Hex),
              B2_fixes
            );

            const fixesDelete = myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(track_B_row.id).delete();
            const tracksDelete = myTrackjoinerDB.tracks.delete(track_B_row.id);

            Promise.all([
              insertTrackB1,
              insertTrackB2,
              nbB1FixesInserted,
              nbB2FixesInserted,
              fixesDelete,
              tracksDelete,
            ]).then(
              (
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
const getDBFixesTrackRowAsPromise = function (trackId: string): Promise<Fix[]> {
  return myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(trackId).toArray() as Promise<Fix[]>;
};

/**
 *
 * @param {string} trackId
 * @returns single track as Promise given it id
 */
const getDBTrackRowAsPromise = function (trackId: string): Promise<Track[]> {
  return myTrackjoinerDB.tracks.where('id').equalsIgnoreCase(trackId).toArray() as Promise<Track[]>;
};

/**
 *
 * @returns first gliderType if any
 */
const getDBFirstGliderType = function (): Promise<string> {
  return new Promise<string>(function (resolve) {
    myTrackjoinerDB.tracks.where('gliderType')
      .noneOf([IGC_GLIDER_TYPE,''])
      .toArray().then((tracks: Track[]) => {
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
const getDBTrackDTStartAsPromise = function (trackId: string): Promise<Date> {
  return getDBTrackRowAsPromise(trackId).then((rows) => {
    return rows[0]["dt_start"];
  });
};

/**
 *
 * @returns return all tracks as Promise
 */
const getDBTracksRowsAsPromise = function (): Promise<Track[]> {
  return myTrackjoinerDB.tracks.orderBy('ts_start').toArray() as Promise<Track[]>;
};

/**
 *
 * @param trackId
 * @returns all points in a Promise
 */
const getDBFixesRowsAsPromise = function (trackId?: string): Promise<Fix[]> {
  if (typeof trackId == "undefined") {
    return myTrackjoinerDB.fixes.orderBy('ts').toArray() as Promise<Fix[]>;
  } else {
    return myTrackjoinerDB.fixes.where('track_id').equalsIgnoreCase(trackId).sortBy('ts') as Promise<Fix[]>;
  }
};

/**
 *
 * @param {Date} date
 * @returns a date in IGC format
 */
const igcDateFormater = function (date: Date): string {
  const dateTimeFormat = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h24",
    minute: "2-digit",
    second: "2-digit",
  });
  const [{ value: month }, , { value: day }, , { value: year }] =
    dateTimeFormat.formatToParts(date);
  return `${day}${month}${year}`;
};

/**
 *
 * @param {*} date
 * @returns a date in IGC format
 */
const igcTimeFormater = function (date: Date): string {
  const dateTimeFormat = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    hour: "2-digit",
    hourCycle: "h24",
    minute: "2-digit",
    second: "2-digit",
  });
  const [{ value: hour }, , { value: minute }, , { value: second }] =
    dateTimeFormat.formatToParts(date);
  return `${hour == "24" ? "00" : hour}${minute}${second}`;
};

/**
 *
 * @param {number} decimalLat
 * @returns a latitude in IGC format
 */
const igcLatFormater = function (decimalLat: number): string {
  const hemisphere = decimalLat >= 0 ? "N" : "S";
  const degrees = Math.floor(Math.abs(decimalLat)).toLocaleString("en-US", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const minutes = Math.round(
    (Math.abs(decimalLat) - Math.floor(Math.abs(decimalLat))) * 60000
  ).toLocaleString("en-US", { minimumIntegerDigits: 5, useGrouping: false });
  return `${degrees}${minutes}${hemisphere}`;
};

/**
 *
 * @param {number} decimalLon
 * @returns a longitude in IGC format
 */
const igcLonFormater = function (decimalLon: number): string {
  const eastern = decimalLon >= 0 ? "E" : "W";
  const degrees = Math.floor(Math.abs(decimalLon)).toLocaleString("en-US", {
    minimumIntegerDigits: 3,
    useGrouping: false,
  });
  const minutes = Math.round(
    (Math.abs(decimalLon) - Math.floor(Math.abs(decimalLon))) * 60000
  ).toLocaleString("en-US", { minimumIntegerDigits: 5, useGrouping: false });
  return `${degrees}${minutes}${eastern}`;
};

/**
 *
 * @param {number} altitude
 * @returns an altitude converted to IGC format
 */
const igcAltitudeFormater = function (altitude: number): string {
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
const getTrackASIgcString = function (trackId?: string): Promise<string> {
  return new Promise(function (resolve) {
    getDBFixesRowsAsPromise(trackId).then((value) => {
      const igc_string = igcProducer(value);
      resolve(igc_string);
    });
  });
};

/**
 * Create a GPX file with an array of fixes
 * @param fixes 
 * @returns a valid GPX file as a string
 */
const gpxProducer = function (fixes: Fix[]): string {
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
const getTrackASGpxString = function (trackId?: string): Promise<string> {
  return new Promise(function (resolve) {
    getDBFixesRowsAsPromise(trackId).then((value) => {
      const gpx_string = gpxProducer(value);
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
const igcHeaders = function (date: Date): string {
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
const igcTypeCommentFormater = function (
  type: trackTypes,
  isStart: boolean
): string {
  const longType = type == "H" ? "HIKE" : "FLY";
  const longIsStart = isStart ? "START" : "END";
  return `LPLT${longType}${longIsStart}\r\n`;
};

/**
 *
 * @param {*} row
 * @returns minimal IGC record formater
 */
const igcBRecordFormater = function (row: Fix): string {
  const dt = new Date(row.dt);
  if (isNaN(row.point.lat) || isNaN(row.point.lon)) {
    return "";
  }
  const igc_lat = igcLatFormater(row.point.lat);
  const igc_lon = igcLonFormater(row.point.lon);
  const igc_pressureAltitude = igcAltitudeFormater(
    isNaN(row.preciseAltitude) ? 0 : row.preciseAltitude
  );
  const igc_gpsAltitude = igcAltitudeFormater(
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
const igcProducer = function (rows: Fix[]): string {
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
const isAnOverlapDetected = function (tracks: Track[]): boolean {
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
const getOverlappedRowsID = function (tracks: Track[]): string[] {
  const retArray: string[] = [];
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
const integrateInPreviousTrack = function (trackId: string): Promise<string[]> {
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
const showDB = function (): void {
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
  addTimestampToDateObject,
  ansiXOR,
  arrayBufferToWordArray,
  changePartOfTrackType,
  changeTrackType,
  createDB,
  cutOverlapping,
  fileTypes,
  fixErroneousDT,
  getDBFirstGliderType,
  getDBFixesRowsAsPromise,
  getDBTrackDTStartAsPromise,
  getDBTracksRowsAsPromise,
  getFileExtension,
  getFileName,
  getOverlappedRowsID,
  getTrackASGpxString,
  getTrackASIgcString,
  gpxProducer,
  igcAltitudeFormater,
  igcBRecordFormater,
  igcDate2ISO8601,
  igcDateFormater,
  igcHeaders,
  igcLatFormater,
  igcLonFormater,
  igcProducer,
  igcTimeFormater,
  igcTypeCommentFormater,
  initDB,
  insertFITTrackInDB,
  insertFITTrackInDBAsPromise,
  insertFixesArrayInDB,
  insertGPXTrackInDB,
  insertGPXTrackInDBAsPromise,
  insertIGCTrackInDB,
  insertIGCTrackInDBAsPromise,
  integrateInPreviousTrack,
  isAnOverlapDetected,
  myTrackjoinerDB,
  nanoDB_name,
  openFITFile,
  openFITFileTreatSingle,
  openFile,
  openFileAsPromise,
  openFileTreatSingle,
  openFileTreatSingleAsPromise,
  openGPXFile,
  openGPXFileTreatSingle,
  openIGCFile,
  openIGCFileTreatSingle,
  showDB,
  splitTrackIn2,
  splitTrackIn3,
  trackTypes,
  TrackjoinerDB,
};
