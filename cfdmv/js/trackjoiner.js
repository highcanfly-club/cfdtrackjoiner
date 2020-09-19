/*************************************
    * Demo IGC + FIT + GPX track joiner for CFD MV (French CFD MV)
    * © Ronan LE MEILLAT
    * Totally free and 'As Is' under MIT License
    * IGC Parser is adapted from Tobias Bieniek's project https://github.com/Turbo87/igc-parser (MIT license)
    * FIT Parser is adapted from Dimitrios Kanellopoulos's project https://github.com/jimmykane/fit-parser (MIT license)
    * GPX Parser is adapted from Thibault Taillandier's project https://github.com/Wilkins/gpx-parse (Apache 2.0 license)
*/

    const IGCParser = window.IGCParser;
    const FitParser = window.FitParser;
    const GPXParser = window.GPXParser;
    const nanoDB_name = "cfdmv_db";

    const trackTypes = { FLY:'F', HIKE:'H', MIXED:''};
  


  //basic Iso date creation from IGC file
    var igcDate2ISO8601 = function (igcDate,igcTime){
      var jsDate = igcDate +"T"+igcTime+"Z";
      return jsDate;
    };

  // Insert on IGC track parsed with IGCParser
  // header goes in tracks , gps points in fixes
    var insertIGCTrackInDB = function (igcTrack,hashHex,fileName, trackType, onDBInsertOKCallback){
      var igcDate = igcTrack.date;
      var isoDt_start = new Date(igcTrack.fixes[0].timestamp);
      var unixTs_start = isoDt_start.getTime();
      var isoDt_end = new Date(igcTrack.fixes[igcTrack.fixes.length-1].timestamp);
      var unixTs_end = isoDt_end.getTime();
      nSQL().useDatabase(nanoDB_name);
      nSQL("tracks")
        .query("upsert", [{id:hashHex, dt_start:isoDt_start, ts_start:unixTs_start, dt_end:isoDt_end, ts_end:unixTs_end, nb_fixes:igcTrack.fixes.length, name:fileName, type:trackType}])
        .exec().then(() => {
                              onDBInsertOKCallback();
                            }).catch((error) => {
                              console.log(error.toString());
                            });
      for(var i=0;i<igcTrack.fixes.length;i++){
        if (igcTrack.fixes[i].valid){
          // fill pressureAltitude with gpsAltitude if empty, this is for filling the DB in the preciseAltitude field
          if ( typeof(igcTrack.fixes[i].pressureAltitude) == "undefined" || igcTrack.fixes[i].pressureAltitude == null ) {
            igcTrack.fixes[i].pressureAltitude = igcTrack.fixes[i].gpsAltitude;
          }
                nSQL("fixes")
                          .query("upsert", [{
                                              track_id:hashHex, 
                                              point:{lat:igcTrack.fixes[i].latitude,lon:igcTrack.fixes[i].longitude},
                                              gpsAltitude:igcTrack.fixes[i].gpsAltitude,
                                              preciseAltitude:igcTrack.fixes[i].pressureAltitude,
                                              dt:new Date(igcTrack.fixes[i].timestamp).toISOString(),
                                              type:trackType //WIP use IGC for hike
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
  var insertGPXTrackInDB = function (gpxTrack,hashHex,fileName, trackType, onDBInsertOKCallback){
    var gpxDate = gpxTrack[0].time;
    var isoDt_start = gpxTrack[0].time;
    var unixTs_start = isoDt_start.getTime();
    var isoDt_end = gpxTrack[gpxTrack.length-1].time;
    var unixTs_end = isoDt_end.getTime();
    nSQL().useDatabase(nanoDB_name);
    nSQL("tracks")
      .query("upsert", [{id:hashHex, dt_start:isoDt_start, ts_start:unixTs_start, dt_end:isoDt_end, ts_end:unixTs_end, nb_fixes:gpxTrack.length, name:fileName, type:trackType}])
      .exec().then(() => {
                            onDBInsertOKCallback();
                          }).catch((error) => {
                            console.log(error.toString());
                          });
    for(var i=0;i<gpxTrack.length;i++){

              nSQL("fixes")
                        .query("upsert", [{
                                            track_id:hashHex, 
                                            point:{lat:gpxTrack[i].lat,lon:gpxTrack[i].lon},
                                            gpsAltitude:gpxTrack[i].elevation,
                                            preciseAltitude:gpxTrack[i].elevation,
                                            dt:gpxTrack[i].time.toISOString(),
                                            type:trackType //WIP use IGC for hike
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
    var insertFITTrackInDB = function(fitTrack, hashHex,fileName,trackType, onDBInsertOKCallback){
      var unixTs_start = fitTrack.records[0].timestamp.getTime();
      var unixTs_end = fitTrack.records[fitTrack.records.length-1].timestamp.getTime();
      nSQL().useDatabase(nanoDB_name);
      nSQL("tracks")
        .query("upsert", [{id:hashHex, dt_start:fitTrack.records[0].timestamp, ts_start:unixTs_start, dt_end:fitTrack.records[fitTrack.records.length-1].timestamp, ts_end:unixTs_end, nb_fixes:fitTrack.records.length, name:fileName, type:trackType}])
        .exec().then(() => {
                              onDBInsertOKCallback();
                            }).catch((error) => {
                              console.log(error.toString());
                            });
      for(var i=0; i<fitTrack.records.length; i++){
        var gpsAltitude = (typeof(fitTrack.records[i].enhanced_altitude) != "undefined") ? fitTrack.records[i].enhanced_altitude : fitTrack.records[i].altitude ;
        nSQL("fixes")
                          .query("upsert", [{
                                              track_id:hashHex, 
                                              point:{lat:fitTrack.records[i].position_lat,lon:fitTrack.records[i].position_long},
                                              gpsAltitude:gpsAltitude,
                                              preciseAltitude:fitTrack.records[i].enhanced_altitude,
                                              dt:fitTrack.records[i].timestamp.toISOString(),
                                              type:trackType // WIP use FIT for fly
                                            }])
                          .exec().then(() => {
                                                //OK
                                              }).catch((error) => {
                                                console.log(error.toString());
                                              });        
      }
    };

  // basic path removal (works for windows/unices)
    var getFileName = function (fullPath){
      return fullPath.replace(/^.*[\\\/]/, '');
    };

  // basic file Extension (return file name if there is no extension) // TODO better handling
    var getFileExtension = function (fileName){
      return fileName.split('.').pop().split(/\#|\?/)[0].toUpperCase();
    };

  // CryptoJS  needs word array so this is an optimized conversion
    var arrayBufferToWordArray = function(ab) {
        var i8a = new Uint8Array(ab);
        var a = [];
        for (var i = 0; i < i8a.length; i += 4) {
          a.push(i8a[i] << 24 | i8a[i + 1] << 16 | i8a[i + 2] << 8 | i8a[i + 3]);
        }
        return CryptoJS.lib.WordArray.create(a, i8a.length);
      };

    // Single file reception (with on FileReader), on event:load parse and insert in DB
    var openIGCFileTreatSingle = function(file,trackType, onDBInsertOKCallback){
      var reader = new FileReader();
            reader.addEventListener("load", function (event){
                    var igcFile = event.target;
                    var text = igcFile.result;
                    var fileName = getFileName(file.name);
                    var hash = CryptoJS.SHA256(text);
                    var hashHex = hash.toString(CryptoJS.enc.Hex);
                    console.log("fileName:"+fileName+ "\n" + igcFile.result.substring(0, 200) + "\nLXSB Last 100 chars\n" + igcFile.result.slice(-100));
                    insertIGCTrackInDB(IGCParser.parse(text),hashHex,fileName, trackType, onDBInsertOKCallback);
                    });
            reader.readAsText(file);
    };

  // Basically creates one openIGCFileTreatSingle per file (on multiple selection)
    var openIGCFile = function(event, trackType, onDBInsertOKCallback) {
          var input = event.target;
          var files = input.files;

          for (var i=0;i<files.length;i++){
            var file = files[i];
            openIGCFileTreatSingle(file, trackType, onDBInsertOKCallback);
            }
          
    };

    // Single file reception (with on FileReader), on event:load parse and insert in DB
    var openFITFileTreatSingle = function(file, trackType, onDBInsertOKCallback){
      var fitParser = new FitParser({
                                force: true,
                                speedUnit: 'km/h',
                                lengthUnit: 'm',
                                temperatureUnit: 'celcius',
                                elapsedRecordField: true,
                                mode: 'list',
                              });
      var reader = new FileReader();
            reader.addEventListener("load", function (event){
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
                                      insertFITTrackInDB(data, hashHex,fileName, trackType, onDBInsertOKCallback);
                                    }                             
                           });
                    });
            reader.readAsArrayBuffer(file);     
    }

    // Basically creates one openFITFileTreatSingle per file (on multiple selection)
    var openFITFile = function(event, trackType, onDBInsertOKCallback) {
          var input = event.target;
          var files = input.files;

          for (var i=0;i<files.length;i++){
            var file = files[i];
            openFITFileTreatSingle(file, trackType, onDBInsertOKCallback);
            }
    };

    // Single file reception (with on FileReader), on event:load parse and insert in DB
    var openGPXFileTreatSingle = function(file, trackType, onDBInsertOKCallback){
      var reader = new FileReader();
            reader.addEventListener("load", function (event){
                    var gpxFile = event.target;
                    var gpxText = gpxFile.result;
                    var fileName = getFileName(file.name);
                    var hash = CryptoJS.SHA256(gpxText);
                    var hashHex = hash.toString(CryptoJS.enc.Hex);
                    console.log(fileName);
                    GPXParser.parseGpx(gpxText, function(error, data) {
                                                    var gpxTrack = data.tracks[0].segments[0] ; // TODO Allow multitrack
                                                    insertGPXTrackInDB (gpxTrack,hashHex,fileName, trackType, onDBInsertOKCallback);
                                                    });
                    });
            reader.readAsText(file);     
    }

    //  Single file reception (with on FileReader), on event:load parse and insert in DB
    // Generic version
    var openFileTreatSingle = function(file, trackType, onDBInsertOKCallback){
      var reader = new FileReader();
      var fileName = getFileName(file.name);
      var fileExtension = getFileExtension(fileName);
            reader.addEventListener("load", function (event){
                var trackFile = event.target;
                var fileContent = trackFile.result;
                var hash = (fileExtension == "FIT") ? CryptoJS.SHA256(arrayBufferToWordArray(fileContent)) : CryptoJS.SHA256(fileContent); // FIT format is binay
                var hashHex = hash.toString(CryptoJS.enc.Hex);
                console.log(fileName);
                switch (fileExtension){
                  case "FIT":
                    var fitParser = new FitParser({
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
                                    console.log(error);
                                  } else {
                                    insertFITTrackInDB(data, hashHex,fileName, trackType, onDBInsertOKCallback);
                                  }                             
                    });
                    break;
                  case "IGC":
                    insertIGCTrackInDB(IGCParser.parse(fileContent),hashHex,fileName, trackType, onDBInsertOKCallback);
                    break;
                  case "GPX":
                    GPXParser.parseGpx(fileContent, function(error, data) {
                      var gpxTrack = data.tracks[0].segments[0] ; // TODO Allow multitrack
                      insertGPXTrackInDB (gpxTrack,hashHex,fileName, trackType, onDBInsertOKCallback);
                      });
                    break;
                  default:
                    //TODO don't do nothing !
                }
            });
      if (fileExtension == "FIT"){
        reader.readAsArrayBuffer(file);   // Fit files are binary so should get a byte array
      }else if((fileExtension == "GPX") || (fileExtension == "IGC")){
        reader.readAsText(file);          // GPX and IGC are text files
      }else {
        // TODO don't do nothing !!
      }
    }

    // Basically creates one openGPXFileTreatSingle per file (on multiple selection)
    var openFile = function(event, trackType, onDBInsertOKCallback) {
      var input = event.target;
      var files = input.files;

      for (var i=0;i<files.length;i++){
        var file = files[i];
        openFileTreatSingle(file, trackType, onDBInsertOKCallback);
        }
    };

    // Basically creates one openGPXFileTreatSingle per file (on multiple selection)
    var openGPXFile = function(event, trackType, onDBInsertOKCallback) {
      var input = event.target;
      var files = input.files;

      for (var i=0;i<files.length;i++){
        var file = files[i];
        openGPXFileTreatSingle(file, trackType, onDBInsertOKCallback);
        }
    };
  // drop DB if exists (on some browser even in-memory persists)
  // next creates the 2 tables in memory
    var initDB = function(){
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
                  "id:string": {pk: true},
                  "dt_start:date": {},
                  "ts_start:int":{},
                  "dt_end:date": {},
                  "ts_end:int": {},
                  "nb_fixes:number": {},
                  "name:string": {},
                  "type:string": {}   // F for flight H for hike
              }
          },
          {
              name: "fixes",
              model: {
                  "id:uuid": {pk: true, ai: true},
                  "track_id:string": {},
                  "point:geo": {},
                  "preciseAltitude:number": {},                  
                  "gpsAltitude:number": {},
                  "dt:date": {},
                  "type:string": {}   // F for flight H for hike
              }
          }
      ],
      version: 3, // current schema/database version
      onVersionUpdate: (prevVersion) => { // migrate versions
                      return new Promise((res, rej) => {
                          switch(prevVersion) {
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

    var getDBTracksRowsAsPromise = function(){
        return nSQL("tracks").query("select").orderBy(["ts_start ASC"]).exec();
    }

    var getDBFixesRowsAsPromise = function(){
      return nSQL("fixes").query("select").orderBy(["dt ASC"]).exec();
    }

   //simple IGC Date formater
   // date is a javascript Date() object
   var igcDateFormater = function(date){
    var dateTimeFormat = new Intl.DateTimeFormat('en', { timeZone:'UTC', year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit',hourCycle: 'h24', minute: '2-digit', second: '2-digit' }) 
    var [{ value: month },,{ value: day },,{ value: year }] = dateTimeFormat .formatToParts(date ) 
    return `${day}${month}${year}`;
   };

   var igcTimeFormater = function(date){
    var dateTimeFormat = new Intl.DateTimeFormat('en', { timeZone:'UTC', hour: '2-digit',hourCycle: 'h24', minute: '2-digit', second: '2-digit' }) 
    var [{ value: hour },,{ value: minute },,{ value: second }] = dateTimeFormat .formatToParts(date ) 
    return `${hour}${minute}${second}`;
   }

   var igcLatFormater = function(decimalLat){
    var hemisphere = (decimalLat >= 0) ? 'N' : 'S';
    var degrees = (Math.floor(Math.abs(decimalLat))).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false});
    var minutes = (Math.round((Math.abs(decimalLat) - degrees)*60000)).toLocaleString('en-US', {minimumIntegerDigits: 5, useGrouping:false});
    return `${degrees}${minutes}${hemisphere}`;
   };

   var igcLonFormater = function(decimalLon){
    var eastern = (decimalLon >= 0) ? 'E' : 'W';
    var degrees = (Math.floor(Math.abs(decimalLon))).toLocaleString('en-US', {minimumIntegerDigits: 3, useGrouping:false});
    var minutes = (Math.round((Math.abs(decimalLon) - degrees)*60000)).toLocaleString('en-US', {minimumIntegerDigits: 5, useGrouping:false});
    return `${degrees}${minutes}${eastern}`;
   };

   var igcAltitudeFormater = function(altitude){
    if (altitude >= 0){
        return `${(Math.round(altitude)).toLocaleString('en-US', {minimumIntegerDigits: 5, useGrouping:false})}`;
    }else{
        return `-${(Math.ceil(Math.abs(altitude))).toLocaleString('en-US', {minimumIntegerDigits: 4, useGrouping:false})}`;
    }
   };

   //minimal headers for a valid IGC File
   // date is a javascript Date() object
   var igcHeaders = function(date){
    return `AXCF034 French CFDMV pre-alpha track fusion\r\nHFDTE${igcDateFormater(date)}\r\nHFPLTPILOTINCHARGE:CFDMV\r\nHFCM2CREW2:NIL\r\nHFGTYGLIDERTYPE:TO-BE-FILLED\r\nHFGIDGLIDERID:\r\nHFDTMGPSDATUM:WGS84\r\nHFRFWFIRMWAREVERSION:0\r\nHFRHWHARDWAREVERSION:\r\nHFFTYFRTYPE:TrackJoiner\r\nHFGPSRECEIVER:NIL\r\nHFPRSPRESSALTSENSOR:\r\n`;
   };

   var igcTypeCommentFormater = function(type,isStart){
       var longType = (type == 'H') ? 'HIKE' : 'FLY';
       var longIsStart = isStart ? 'START' : 'END';
       return `LPLT${longType}${longIsStart}\r\n`;
   }
   //minial IGC record formater
   var igcBRecordFormater = function(row){
    var dt = new Date(row.dt);
    var igc_lat = igcLatFormater(row.point.lat);
    var igc_lon = igcLonFormater(row.point.lon);
    var igc_pressureAltitude = igcAltitudeFormater( isNaN(row.preciseAltitude) ? 0 : row.preciseAltitude);
    var igc_gpsAltitude = igcAltitudeFormater(isNaN(row.gpsAltitude) ? 0 : row.gpsAltitude);
    return `B${igcTimeFormater(dt)}${igc_lat}${igc_lon}A${igc_pressureAltitude}${igc_gpsAltitude}\r\n`;
   }

   //simple IGC file producer (input is a rows of points object)
   var igcProducer = function(rows){
    var szReturn = igcHeaders(new Date(rows[0].dt));
    var lastType = '';
    
    for (var i=0; i<rows.length;i++){
      if(i==0){
        lastType = rows[i].type;
        szReturn += igcTypeCommentFormater (rows[i].type,true);
      }
      if  (lastType != rows[i].type){
        szReturn += igcTypeCommentFormater (lastType,false);
        lastType = rows[i].type;
        szReturn += igcTypeCommentFormater (rows[i].type,true);
      }
      szReturn += igcBRecordFormater(rows[i]);
    }
    szReturn += igcTypeCommentFormater (rows[rows.length-1].type,false);
    return szReturn;
   }

   //detect if there is an overlap in the rows of tracks 
   var isAnOverlapDetected = function(rows){
     for (var i=1; i<rows.length;i++){
      if (rows[i - 1].ts_end > rows[i].ts_start) {
        return true;
      }
     }
     return false;
   }