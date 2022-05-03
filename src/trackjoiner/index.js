import { nSQL } from "@nano-sql/core";
import CryptoJS from "crypto-js";
import IGCParser from "./igc-parser";
import { FitParser } from "./fit-parser";
import gpxParser from "gpxparser";

import {
  changePartOfTrackType, changeTrackType, initDB, fixErroneousDT, getDBTracksRowsAsPromise, getDBFixesRowsAsPromise, getTrackASIgcString, getOverlappedRowsID, igcProducer, integrateInPreviousTrack, nanoDB_name, showDB, splitTrackIn2, splitTrackIn3, trackTypes, openFile }
 from "./trackjoiner";

window.GPXParser = gpxParser;
window.IGCParser = IGCParser;
window.FitParser = FitParser;
window.nSQL = nSQL;
window.CryptoJS = CryptoJS;

export { changePartOfTrackType, changeTrackType, initDB, fixErroneousDT, getDBTracksRowsAsPromise, getDBFixesRowsAsPromise, getTrackASIgcString, getOverlappedRowsID, igcProducer, integrateInPreviousTrack, nanoDB_name, showDB, splitTrackIn2, splitTrackIn3, trackTypes, openFile };
