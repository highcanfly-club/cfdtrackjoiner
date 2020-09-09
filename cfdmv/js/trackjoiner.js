    /*************************************
     * Demo IGC + FIT track joiner for CFD MV (French CFD MV)
     * © Ronan LE MEILLAT
     * Totally free and 'As Is' under MIT License
     * IGC Parser is adapted from NPM package igc-parser https://www.npmjs.com/package/igc-parser (MIT license)
     * FIT Parser is adapted from NPM package fit-file-parser https://www.npmjs.com/package/fit-file-parser (MIT license)
     */

    const IGCParser = window.IGCParser;
    const FitParser = window.FitParser;
    const nanoDB_name = "cfdmv_db";
  


  //basic Iso date creation from IGC file
    var igcDate2ISO8601 = function (igcDate,igcTime){
      var jsDate = igcDate +"T"+igcTime+"Z";
      return jsDate;
    };

  // Insert on IGC track parsed with IGCParser
  // header goes in tracks , gps points in fixes
    var insertIGCTrackInDB = function (igcTrack,hashHex,fileName,onDBInsertOKCallback){
      var igcDate = igcTrack.date;
      var isoDt_start = new Date(igcTrack.fixes[0].timestamp);
      var isoDt_end = new Date(igcTrack.fixes[igcTrack.fixes.length-1].timestamp);
      nSQL().useDatabase(nanoDB_name);
      nSQL("tracks")
        .query("upsert", [{id:hashHex, dt_start:isoDt_start, dt_end:isoDt_end,nb_fixes:igcTrack.fixes.length, name:fileName}])
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
                                              type:'F' //TODO use IGC for hike
                                            }])
                          .exec().then(() => {
                                                //OK
                                              }).catch((error) => {
                                                console.log(error.toString());
                                              });
            }
        }

    };

  // Insert on FIT track parsed with FITParser
  // header goes in tracks , gps points in fixes
  // TO BE CHECKED :
  // the only altitude my Fenix 6 gives is "enhanced_altitude" not sure all watches have this field
  // TO DO : find a basic watch without barometer for seing wich altitude it gives
    var insertFITTrackInDB = function(fitTrack, hashHex,fileName,onDBInsertOKCallback){
      nSQL().useDatabase(nanoDB_name);
      nSQL("tracks")
        .query("upsert", [{id:hashHex, dt_start:fitTrack.records[0].timestamp, dt_end:fitTrack.records[fitTrack.records.length-1].timestamp,nb_fixes:fitTrack.records.length, name:fileName}])
        .exec().then(() => {
                              onDBInsertOKCallback();
                            }).catch((error) => {
                              console.log(error.toString());
                            });
      for(var i=0; i<fitTrack.records.length; i++){
        nSQL("fixes")
                          .query("upsert", [{
                                              track_id:hashHex, 
                                              point:{lat:fitTrack.records[i].position_lat,lon:fitTrack.records[i].position_long},
                                              gpsAltitude:fitTrack.records[i].enhanced_altitude,
                                              preciseAltitude:fitTrack.records[i].enhanced_altitude,
                                              dt:fitTrack.records[i].timestamp.toISOString(),
                                              type:'H' // TODO use FIT for fly
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
    var openIGCFileTreatSingle = function(file,onDBInsertOKCallback){
      var reader = new FileReader();
            reader.addEventListener("load", function (event){
                    var igcFile = event.target;
                    var text = igcFile.result;
                    var fileName = getFileName(file.name);
                    var hash = CryptoJS.SHA256(text);
                    var hashHex = hash.toString(CryptoJS.enc.Hex);
                    console.log("fileName:"+fileName+ "\n" + igcFile.result.substring(0, 200) + "\nLXSB Last 100 chars\n" + igcFile.result.slice(-100));
                    insertIGCTrackInDB(IGCParser.parse(text),hashHex,fileName,onDBInsertOKCallback);
                    });
            reader.readAsText(file);
    };

  // Basically creates one openIGCFileTreatSingle per file (on multiple selection)
    var openIGCFile = function(event,onDBInsertOKCallback) {
          var input = event.target;
          var files = input.files;

          for (var i=0;i<files.length;i++){
            var file = files[i];
            openIGCFileTreatSingle(file,onDBInsertOKCallback);
            }
          
    };

    // Single file reception (with on FileReader), on event:load parse and insert in DB
    var openFITFileTreatSingle = function(file,onDBInsertOKCallback){
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
                                      insertFITTrackInDB(data, hashHex,fileName,onDBInsertOKCallback);
                                    }                             
                           });
                    });
            reader.readAsArrayBuffer(file);     
    }

    // Basically creates one openFITFileTreatSingle per file (on multiple selection)
    var openFITFile = function(event,onDBInsertOKCallback) {
          var input = event.target;
          var files = input.files;

          for (var i=0;i<files.length;i++){
            var file = files[i];
            openFITFileTreatSingle(file,onDBInsertOKCallback);
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
                  "dt_end:date": {},
                  "nb_fixes:number": {},
                  "name:string": {}
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

   //simple IGC Date formater
   // date is a javascript Date() object
   var igcDateFormater = function(date){
    var dateTimeFormat = new Intl.DateTimeFormat('en', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
    var [{ value: month },,{ value: day },,{ value: year }] = dateTimeFormat .formatToParts(date ) 
    return `${day}${month}${year}`;
   };

   var igcTimeFormater = function(date){
    var dateTimeFormat = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
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
