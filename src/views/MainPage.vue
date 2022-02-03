<template>
  <div>
    <track-table :rows="$data.dbRows.rows" :overlapped_rows="$data.dbRows.overlapped_rows"/>
    <button
      @click="$refs.fileFly.click()"
      class="
        bg-blue-500
        hover:bg-blue-700
        text-white
        font-bold
        py-2
        px-4
        rounded
      "
    >
      Vols
    </button>
    <input
      type="file"
      accept=".igc,.fit,.gpx"
      multiple
      ref="fileFly"
      style="display: none"
      @change="clickFly"
    />
    <button
      @click="$refs.fileHike.click()"
      class="
        bg-blue-500
        hover:bg-blue-700
        text-white
        font-bold
        py-2
        px-4
        rounded
      "
    >
      Marches
    </button>
    <input
      type="file"
      accept=".igc,.fit,.gpx"
      multiple
      ref="fileHike"
      style="display: none"
      @change="clickHike"
    />
    <button
      @click="clickJoin"
      class="
        bg-blue-500
        hover:bg-blue-700
        text-white
        font-bold
        py-2
        px-4
        rounded
      "
    >
      Joindre
    </button>
  </div>
</template>
<script>
import { reactive } from 'vue';
import {
  initDB,
  trackTypes,
  openFile,
  getDBTracksRowsAsPromise,
  getDBFixesRowsAsPromise,
  getOverlappedRowsID,
  igcProducer
} from "@/module/trackjoiner.js";
import TrackTable from "@/components/TrackTable.vue";

const dbRows = reactive({rows:[], overlapped_rows:[]});

function insertDBCallback() {
  let _reactiveDbRows = dbRows;
  getDBTracksRowsAsPromise().then((rows) => {
    _reactiveDbRows.rows = rows;
    console.log(rows);
  });
}

var promisedDBRows = function (promised_rows) {
  let _reactiveDbRows = dbRows;
  var tracks_rows = promised_rows[0];
  var fixes_rows = promised_rows[1];
          _reactiveDbRows.overlapped_rows = getOverlappedRowsID(tracks_rows);
          if(_reactiveDbRows.overlapped_rows.length == 0){
            var igcString = igcProducer(fixes_rows);
            console.log(igcString);

          }else{
            for (var i=0; i<_reactiveDbRows.overlapped_rows.length;i++){
              console.log("#row_"+_reactiveDbRows.overlapped_rows[i]+" OVERLAPPED");
            }
          }
};



export default {
  data() {
    return {
      dbRows,
      trackTypes,
      openFile,
    };
  },
  methods: {
    clickFly(event) {
      openFile(event, trackTypes.FLY, insertDBCallback);
    },
    clickHike(event) {
      openFile(event, trackTypes.HIKE, insertDBCallback);
    },
    clickJoin(event) {    //eslint-disable-line
      var tracksQueryPromise = getDBTracksRowsAsPromise(); //eslint-disable-line
      var fixesQueryPromise = getDBFixesRowsAsPromise(); //eslint-disable-line
            Promise.all([tracksQueryPromise,fixesQueryPromise]).then(promisedDBRows).catch((error) => {
                      console.log(error.toString());
                    });   
    },
  },
  setup(){
    initDB();
  },
  components: {
    TrackTable,
  },
};
</script>
