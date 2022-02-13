import { nSQL } from "@nano-sql/core";

import IGCParser from "./igc-parser";
import {FitParser} from "./fit-parser";
import {parseGpx} from "./gpx-parse";
import {
    nanoDB_name,
    initDB,
    trackTypes,
    openFile,
    getDBTracksRowsAsPromise,
    getDBFixesRowsAsPromise,
    getOverlappedRowsID,
    igcProducer,
    integrateInPreviousTrack,
    getTrackASIgcString,
  } from "./trackjoiner.js";

const GPXParser = {parseGpx: parseGpx};
window.IGCParser = IGCParser;
window.FitParser = FitParser;
window.GPXParser = GPXParser;
window.nSQL = nSQL;

export {nanoDB_name,initDB,getDBTracksRowsAsPromise,getDBFixesRowsAsPromise,getTrackASIgcString,getOverlappedRowsID,igcProducer,integrateInPreviousTrack,trackTypes,openFile, IGCParser, FitParser, GPXParser,nSQL};