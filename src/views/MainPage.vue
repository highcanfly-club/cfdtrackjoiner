<template>
  <div>
    <div class="flex flex-col">
      <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div
            class="
              shadow
              overflow-hidden
              border-b border-gray-200
              sm:rounded-lg
            "
          >
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    "
                  >
                    Section
                  </th>
                  <th
                    scope="col"
                    class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    "
                  >
                    Heure
                  </th>
                  <th
                    scope="col"
                    class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    "
                  >
                    État
                  </th>
                  <th
                    scope="col"
                    class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    "
                  >
                    Points
                  </th>
                  <th
                    scope="col"
                    class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    "
                  >
                    Fichier
                  </th>
                  <th
                    @click="isHashVisible = !isHashVisible"
                    scope="col"
                    class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    "
                  >
                    {{isHashVisible ? 'Masquer le hash':'Voir le hash'}}
                  </th>
                  <th scope="col" class="relative px-6 py-3">
                    <span class="sr-only">Edit</span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(row, index) in dbRows.rows" :key="row.id">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <i
                          :class="
                            row.type == 'F'
                              ? 'fas fa-plane-departure'
                              : 'fas fa-hiking'
                          "
                        />
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">
                          {{ index + 1 }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                      {{
                        new Intl.DateTimeFormat("fr-FR", {
                          year: "2-digit",
                          month: "short",
                          day: "2-digit",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                        }).format(new Date(row.dt_start))
                      }}
                    </div>
                    <div class="text-sm text-gray-500">
                      {{
                        new Intl.DateTimeFormat("fr-FR", {
                          year: "2-digit",
                          month: "short",
                          day: "2-digit",
                          hour: "numeric",
                          minute: "numeric",
                          second: "numeric",
                        }).format(new Date(row.dt_end))
                      }}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="
                        px-2
                        inline-flex
                        text-xs
                        leading-5
                        font-semibold
                        rounded-full
                        bg-green-100
                        text-green-800
                      "
                      :class="
                        isOverlapped(row, dbRows.overlapped_rows)
                          ? 'bg-red-100'
                          : 'bg-green-100'
                      "
                      @click="resolveOverlap(row)"
                    >
                      {{
                        isOverlapped(row, dbRows.overlapped_rows)
                          ? "Chevauchement"
                          : "Valide"
                      }}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ row.nb_fixes }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ row.name }}
                  </td>
                  <td v-if="isHashVisible" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ row.id }}
                  </td>
                  <td
                    class="
                      px-6
                      py-4
                      whitespace-nowrap
                      text-right text-sm
                      font-medium
                    "
                  >
                    <span @click.once="clickDownload(row.id,$event)" class="cursor-pointer text-blue-600 hover:text-indigo-900"
                      ><i class="fas fa-tools"></i></span
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-center">
            <button type="button" class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500
        hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2" 
        @click="$refs.fileFly.click()" :disabled="dbRows.isLoading">
      <svg v-if="dbRows.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
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
        <button type="button" class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500
        hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2" 
        @click="$refs.fileHike.click()" :disabled="dbRows.isLoading">
      <svg v-if="dbRows.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
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
      class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500
        hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2" 
        :disabled="dbRows.isLoading || dbRows.overlapped_rows.length"
        :class="dbRows.overlapped_rows.length?'bg-slate-200 hover:bg-slate-200':''"
    >
          <svg v-if="dbRows.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Joindre
    </button>
    <a
      v-if="dbRows.downloadLink.length"
      class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500
        hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2" 
        :disabled="(dbRows.isLoading || dbRows.overlapped_rows.length)"
        download="trackjoiner.igc"
        title="télécharger"
        :href="dbRows.downloadLink"
    >
          <svg v-if="dbRows.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <i class="fas fa-download"></i>&nbsp;Télécharger
    </a>
    </div>
  </div>
</template>
<script>
import { reactive } from "vue";
import {
  initDB,
  trackTypes,
  openFile,
  getDBTracksRowsAsPromise,
  getDBFixesRowsAsPromise,
  getOverlappedRowsID,
  igcProducer,
  integrateInPreviousTrack,
  getTrackASIgcString,
} from "@/module/trackjoiner.js";

const dbRows = reactive({ rows: [], overlapped_rows: [], isLoading: false, downloadLink: '' });

let insertDBCallback =function () {
  let _reactiveDbRows = dbRows;
  getDBTracksRowsAsPromise().then((rows) => {
    _reactiveDbRows.rows = rows;
    _reactiveDbRows.isLoading = false;
  });
}

let promisedDBRows = function (promised_rows) {
  let _reactiveDbRows = dbRows;
  var tracks_rows = promised_rows[0];
  var fixes_rows = promised_rows[1];
  _reactiveDbRows.overlapped_rows = getOverlappedRowsID(tracks_rows);
  _reactiveDbRows.isLoading = false;
  if (_reactiveDbRows.overlapped_rows.length == 0) {
    var igcString = igcProducer(fixes_rows);
    _reactiveDbRows.downloadLink = "data:octet/stream;charset=utf-8,"+encodeURIComponent(igcString);
  } else {
    for (var i = 0; i < _reactiveDbRows.overlapped_rows.length; i++) {
      console.log("#row_" + _reactiveDbRows.overlapped_rows[i] + " OVERLAPPED");
    }
  }
};

let getTrack = function(trackId, target){
      dbRows.isLoading = true;
      getTrackASIgcString().then((igc_string)=>{
        var a = document.createElement('a');
      var iLink = document.createElement('i');
      iLink.className = 'fas fa-download'; 
      a.appendChild(iLink);
      a.title = "Télécharger";
      a.href =  "data:octet/stream;charset=utf-8,"+encodeURIComponent(igc_string);
      a.download = trackId+'.igc';
      target.parentNode.replaceChild(a,target);
         dbRows.isLoading = false;
      });
    }
export default {
  data() {
    const isHashVisible = false;
    return {
      dbRows,
      trackTypes,
      openFile,
      isHashVisible,
    };
  },
  methods: {
    clickFly(event) {
      dbRows.isLoading = true;
      openFile(event, trackTypes.FLY, insertDBCallback);
    },
    clickHike(event) {
      dbRows.isLoading = true;
      openFile(event, trackTypes.HIKE, insertDBCallback);
    },
    clickJoin(event) {//eslint-disable-line
    dbRows.isLoading = true;
      var tracksQueryPromise = getDBTracksRowsAsPromise(); //eslint-disable-line
      var fixesQueryPromise = getDBFixesRowsAsPromise(); //eslint-disable-line
      Promise.all([tracksQueryPromise, fixesQueryPromise])
        .then(promisedDBRows)
        .catch((error) => {
          console.log(error.toString());
        });
    },
    clickDownload(trackId,event){
      dbRows.isLoading = true;
      getTrack(trackId,event.target);
    },
    isOverlapped(row, overlapped_rows) {
      for (let i = 0; i < overlapped_rows.length; i++) {
        if (row.id == overlapped_rows[i]) {
          return true;
        }
        return false;
      }
    },
    resolveOverlap(row){
      console.log('integrate:'+row.id);
        integrateInPreviousTrack(row.id);
    }
  },
  setup() {
    initDB();
  },
  components: {},
};
</script>
