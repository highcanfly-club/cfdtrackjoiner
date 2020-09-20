# CFDTrackJoiner
Technology demonstrator for joining GPX, FIT and IGC files for the new french "CFD Marche et Vol"

# Limitations
This is a pre-alpha version sort of a technology demonstrator.

Today it is only tested with FIT files coming from a Garmin® Fēnix 6x Pro, Garmin® Fēnix 5s or Garmin® Fēnix 3 and IGC files coming from SkyBean® SkyDrop variometer and GPX exported from Strava®.

Currently if an interval overlap another the join is not processed.

# License
  Provided "as is" under MIT license.
  
     * IGC Parser is adapted from Tobias Bieniek's project https://github.com/Turbo87/igc-parser (MIT license)
     * FIT Parser is adapted from Dimitrios Kanellopoulos's project https://github.com/jimmykane/fit-parser (MIT license)
     * GPX Parser is adapted from Thibault Taillandier's project https://github.com/Wilkins/gpx-parse (Apache 2.0 license)
# Test
https://eltorio.github.io/CFDTrackJoiner/cfdmv/

# Sample usage

  * First you must include the required JavaScript libraries (jQuery, CryptoJS and NanoSQL) you can host them on your website or link them directly from some cdn:
    ```html
    <script src='https://code.jquery.com/jquery-3.5.1.min.js'></script>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js'></script>
    <script src='https://cdn.jsdelivr.net/npm/@nano-sql/core@2.3.7/dist/nano-sql.min.js'></script>
    ```
  * you also need this local sources:
    ```html
    <script src='js/igc-parser.js'></script>
    <script src='js/fit-parser.js'></script>
    <script src='js/gpx-parser.js'></script>    
    <script src='js/trackjoiner.js'></script>
    ```

  * Second place the two buttons for flies and for hikes and the button for the result:
    ```html
    <input id="filesFly" type='file' accept='.igc,.fit,.gpx' onchange='openFile(event, trackTypes.FLY, insertDBCallback)' multiple disabled/> 
    <input id="filesHike" type='file' accept='.igc,.fit,.gpx' onchange='openFile(event,trackTypes.HIKE, insertDBCallback)' multiple disabled/>
    <input id="joinBtn" type='button' onclick='getDBasIGCString()' value="Join" disabled/>
    ```

    The openFile function will be the entry point of the process insertDBCallback is the call back function called when parsing and DB insert are finished.
    In a minimal void process an empty function will be sufficient but something more complex will be probably necessary.
    For example in the provided index.hml page the call back is used for filling an html table with the current content of the DB and enabling a button for retrieving the result
    ```javascript
    var insertDBCallback = function(){
      showHTMLTable("#parsedTable");      // Look at index.html for seeing showHTMLTable
      $('#joinBtn').removeAttr('disabled');
    };
    ```

  * Third init
    In the provided example the initialization is very simple
    ```javascript
      initDB();                                   // Needed for preparing the database
     $(window).on('load', function() {            // Be sure to wait for all the libraries to be loaded before allowing parsing
        $('#filesFly').removeAttr('disabled');    // now the load event was fired so the buttons can be enabled
        $('#filesHike').removeAttr('disabled');
     });
    ```

  * Finally get the result
    ```javascript
    var getDBasIGCString = function(){
      getDBTracksRowsAsPromise().then((rows) => {
                      var igcString = igcProducer(rows);
                      // the IGC file is now in igcString variable
                      // use it as you want
                      // a more complex example is in index.html
                    }).catch((error) => {
                      console.log(error.toString());
                    });   
     };
    ```