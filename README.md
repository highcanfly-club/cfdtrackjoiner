# CFDTrackJoiner
Technology demonstrator for joining FIT and IGC files for the new french "CFD Marche et Vol"

# Limitations
This is a pre-alpha version sort of a technology demonstrator.

Today it is only tested with FIT files coming from a Garmin Fenix 6X and IGC files coming from SkyBean SkyDrop variometer.

Note also that no validation are made, ie: different tracks should not overlap themselve, FIT files are only for hike sections and IGC files are only for fly sections.

# License
  Provided "as is" under MIT license.
  
     * IGC Parser is adapted from NPM package igc-parser https://www.npmjs.com/package/igc-parser (MIT license)
     * FIT Parser is adapted from NPM package fit-file-parser https://www.npmjs.com/package/fit-file-parser (MIT license)
# Test
https://eltorio.github.io/CFDTrackJoiner/cfdmv/
