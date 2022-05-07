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
                    {{ isHashVisible ? "Masquer le hash" : "&nbsp;" }}
                  </th>
                  <th
                    @click="isHashVisible = !isHashVisible"
                    scope="col"
                    class="
                      relative
                      px-6
                      py-3
                      text-right text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    "
                  >
                    {{ isHashVisible ? "&nbsp;" : "Voir le hash" }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(row, index) in state.rows" :key="row.id">
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
                        text-green-800
                      "
                      :class="
                        isOverlapped(row, state.overlapped_rows)
                          ? 'bg-red-100 cursor-pointer'
                          : 'bg-green-100'
                      "
                      @click="resolveOverlap(row)"
                    >
                      {{
                        isOverlapped(row, state.overlapped_rows)
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
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div v-if="isHashVisible">{{ row.id }}</div>
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
                    <span
                      @click.once="clickDownload(row.id, $event)"
                      class="cursor-pointer text-blue-600 hover:text-indigo-900"
                      ><i class="fas fa-tools"></i
                    ></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <div class="flex justify-center">
      <button
        type="button"
        class="
          inline-flex
          items-center
          font-semibold
          leading-6
          text-sm
          shadow
          rounded-md
          text-white
          bg-blue-500
          hover:bg-blue-700
          transition
          ease-in-out
          duration-150
          py-2
          px-4
          m-2
        "
        @click="clickButton($refs.fileFly)"
        :disabled="state.isLoading"
      >
        <svg
          v-if="state.isLoading"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
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
      <button
        type="button"
        class="
          inline-flex
          items-center
          font-semibold
          leading-6
          text-sm
          shadow
          rounded-md
          text-white
          bg-blue-500
          hover:bg-blue-700
          transition
          ease-in-out
          duration-150
          py-2
          px-4
          m-2
        "
        @click="clickButton($refs.fileHike)"
        :disabled="state.isLoading"
      >
        <svg
          v-if="state.isLoading"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
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
        class="
          inline-flex
          items-center
          font-semibold
          leading-6
          text-sm
          shadow
          rounded-md
          text-white
          bg-blue-500
          hover:bg-blue-700
          transition
          ease-in-out
          duration-150
          py-2
          px-4
          m-2
        "
        :disabled="state.isLoading || (state.overlapped_rows.length > 0)"
        :class="
          state.overlapped_rows.length
            ? 'bg-slate-200 hover:bg-slate-200 stat'
            : ''
        "
      >
        <svg
          v-if="state.isLoading"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        Joindre
      </button>
      <a
        v-if="state.downloadLink.length"
        class="
          inline-flex
          items-center
          font-semibold
          leading-6
          text-sm
          shadow
          rounded-md
          text-white
          bg-blue-500
          hover:bg-blue-700
          transition
          ease-in-out
          duration-150
          py-2
          px-4
          m-2
        "
        :disabled="state.isLoading || state.overlapped_rows.length"
        download="trackjoiner.igc"
        title="télécharger"
        :href="state.downloadLink"
      >
        <svg
          v-if="state.isLoading"
          class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <i class="fas fa-download"></i>&nbsp;Télécharger
      </a>
    </div>

  </div>
  <track-joiner-help />
</template>
<script lang="ts">
import { reactive,defineComponent } from "vue";
import {
  initDB,
  getDBTracksRowsAsPromise,
  getDBFixesRowsAsPromise,
  getTrackASIgcString,
  getOverlappedRowsID,
  igcProducer,
  integrateInPreviousTrack,
  trackTypes,
  openFile,
  showDB,
} from "trackjoiner";
import TrackJoinerHelp from "./trackJoinerHelp.vue";

const state = reactive({
  rows: [],
  overlapped_rows: [],
  isLoading: false,
  downloadLink: "",
});

let insertDBCallback = function () {
  let _reactivestate = state;
  getDBTracksRowsAsPromise().then((rows) => {
    _reactivestate.rows = rows;
    _reactivestate.isLoading = false;
  });
};

let promisedstate = function (promised_rows) {
  let _reactivestate = state;
  var tracks_rows = promised_rows[0];
  var fixes_rows = promised_rows[1];
  _reactivestate.overlapped_rows = getOverlappedRowsID(tracks_rows);
  _reactivestate.isLoading = false;
  if (_reactivestate.overlapped_rows.length == 0) {
    var igcString = igcProducer(fixes_rows);
    _reactivestate.downloadLink =
      "data:octet/stream;charset=utf-8," + encodeURIComponent(igcString);
  } else {
    for (var i = 0; i < _reactivestate.overlapped_rows.length; i++) {
      console.log("#row_" + _reactivestate.overlapped_rows[i] + " OVERLAPPED");
    }
  }
};

let getTrack = function (trackId, target) {
  state.isLoading = true;
  getTrackASIgcString(trackId).then((igc_string) => {
    var a = document.createElement("a");
    var iLink = document.createElement("i");
    iLink.className = "fas fa-download";
    a.appendChild(iLink);
    a.title = "Télécharger";
    a.href =
      "data:octet/stream;charset=utf-8," + encodeURIComponent(igc_string);
    a.download = trackId + ".igc";
    target.parentNode.replaceChild(a, target);
    state.isLoading = false;
  });
};

export default defineComponent({
  data() {
    const isHashVisible = false;
    return {
      commit_date: new Intl.DateTimeFormat("fr-FR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric",
      }).format(new Date(process.env.VUE_APP_GIT_TRACKJOINER_LAST_COMMIT)),
      state,
      trackTypes,
      openFile,
      isHashVisible,
    };
  },
  methods: {
    clickFly(event) {
      state.isLoading = true;
      openFile(event, trackTypes.FLY, insertDBCallback);
    },
    clickHike(event) {
      state.isLoading = true;
      openFile(event, trackTypes.HIKE, insertDBCallback);
    },
    clickJoin() {
      state.isLoading = true;
      var tracksQueryPromise = getDBTracksRowsAsPromise();
      var fixesQueryPromise = getDBFixesRowsAsPromise();
      Promise.all([tracksQueryPromise, fixesQueryPromise])
        .then(promisedstate)
        .catch((error) => {
          console.log(error.toString());
        });
    },
    clickDownload(trackId, event) {
      state.isLoading = true;
      getTrack(trackId, event.target);
    },
    isOverlapped(row, overlapped_rows) {
      for (let i = 0; i < overlapped_rows.length; i++) {
        if (row.id == overlapped_rows[i]) {
          return true;
        }
        return false;
      }
    },
    resolveOverlap(row) {
      state.isLoading = true;
      integrateInPreviousTrack(row.id).then(() => {
        insertDBCallback();
        state.overlapped_rows = [];
      });
    },
    showDB() {
      showDB();
    },
    clickButton(target:HTMLElement){
      target.click();
    }
  },
  mounted() {
    state.isLoading = true;
      initDB();
      state.isLoading = false;
  },
  components: {
    TrackJoinerHelp,
  },
});
</script>