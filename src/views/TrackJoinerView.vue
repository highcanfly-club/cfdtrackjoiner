<template>
  <div v-if="state.isLoading" class="loading">
    <div
      class="
        fixed
        top-0
        left-0
        right-0
        bottom-0
        w-full
        h-screen
        z-50
        overflow-hidden
        bg-gray-700
        opacity-80
        flex flex-col
        items-center
        justify-center
      "
    >
      <div
        class="
          loader
          ease-linear
          rounded-full
          border-4 border-t-4 border-gray-200
          h-12
          w-12
          mb-4
        "
      ></div>
      <h2 class="text-center text-white text-xl font-semibold">
        Assemblage...
      </h2>
      <p class="w-1/3 text-center text-white">Nous analysons les données…</p>
      <Transition
        appear
        name="appears3s"
        enter-active-class="transition-opacity duration-[3s] ease-[cubic-bezier(1,0,1,-0.5)]"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <p class="w-1/3 text-center text-white">Soyez patients…</p>
      </Transition>
      <Transition
        appear
        name="appears6s"
        enter-active-class="transition-opacity duration-[6s] ease-[cubic-bezier(1,0,1,-0.5)]"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <p class="w-1/3 text-center text-white">Ça avance…</p>
      </Transition>
      <Transition
        appear
        name="appears9s"
        enter-active-class="transition-opacity duration-[9s] ease-[cubic-bezier(1,0,1,-0.5)]"
        enter-from-class="opacity-0"
        leave-to-class="opacity-0"
      >
        <p class="w-1/3 text-center text-white">C'est bientôt prêt…</p>
      </Transition>
    </div>
  </div>
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
                            row.type == trackTypes.FLY
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
                      class="
                        flex flex-nowrap
                        cursor-pointer
                        text-blue-600
                        hover:text-indigo-900
                      "
                      ><img
                        @click.once="
                          clickDownload(row.id, $event, fileTypes.IGC)
                        "
                        class="w-6"
                        :src="require('../assets/IGC.svg')" />&nbsp;
                      <img
                        @click.once="
                          clickDownload(row.id, $event, fileTypes.GPX)
                        "
                        class="w-6"
                        :src="require('../assets/GPX.svg')"
                    /></span>
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
        @change="clickFile($event, trackTypes.FLY)"
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
        @change="clickFile($event, trackTypes.HIKE)"
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
        :disabled="state.isLoading || state.overlapped_rows.length > 0"
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
import { reactive, ref, defineComponent } from "vue";
import {
  initDB,
  getDBTracksRowsAsPromise,
  getTrackASIgcString,
  getTrackASGpxString,
  getOverlappedRowsID,
  integrateInPreviousTrack,
  trackTypes,
  fileTypes,
  openFileAsPromise,
  showDB,
  Track,
} from "trackjoiner";
import TrackJoinerHelp from "./trackJoinerHelp.vue";
import Commit from "../../commit.json";

interface ReactiveData {
  rows: Track[];
  overlapped_rows: string[];
  isLoading: boolean;
  downloadLink: string;
}
export default defineComponent({
  setup() {
    const state = reactive<ReactiveData>({
      rows: [] as Track[],
      overlapped_rows: [] as string[],
      isLoading: false,
      downloadLink: "",
    });
    const isHashVisible = ref(false);
    return {
      commit_date: new Intl.DateTimeFormat("fr-FR", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "numeric",
        minute: "numeric",
      }).format(new Date(Commit.cfdtrackjoiner)),
      state,
      fileTypes,
      trackTypes,
      isHashVisible,
    };
  },
  methods: {
    clickFile(event: Event, trackType: trackTypes) {
      (this.state as ReactiveData).isLoading = true;
      setTimeout(() => {
        openFileAsPromise(event, trackType).then(() => {
          this.updateRows();
        });
      });
    },
    updateRows() {
      getDBTracksRowsAsPromise().then((rows) => {
        (this.state as ReactiveData).rows = rows;
        (this.state as ReactiveData).isLoading = false;
      });
    },
    clickJoin() {
      (this.state as ReactiveData).isLoading = true;
      setTimeout(() => {
        getDBTracksRowsAsPromise().then((tracks: Track[]) => {
          (this.state as ReactiveData).overlapped_rows =
            getOverlappedRowsID(tracks);
          if ((this.state as ReactiveData).overlapped_rows.length === 0) {
            getTrackASIgcString().then((igc_result) => {
              (this.state as ReactiveData).downloadLink =
                "data:octet/stream;charset=utf-8," +
                encodeURIComponent(igc_result);
              (this.state as ReactiveData).isLoading = false;
            });
          } else {
            for (
              let i = 0;
              i < (this.state as ReactiveData).overlapped_rows.length;
              i++
            ) {
              console.log(
                "#row_" +
                  (this.state as ReactiveData).overlapped_rows[i] +
                  " OVERLAPPED"
              );
            }
            (this.state as ReactiveData).isLoading = false;
          }
        });
      });
    },
    replaceNodeWithDownloadLink(
      element: HTMLElement,
      fileContent: string,
      filename: string
    ) {
      var a = document.createElement("a");
      var iLink = document.createElement("i");
      iLink.className = "fas fa-download";
      a.appendChild(iLink);
      a.title = "Télécharger";
      a.href =
        "data:octet/stream;charset=utf-8," + encodeURIComponent(fileContent);
      a.download = filename;
      element.parentNode.replaceChild(a, element);
    },
    clickDownload(trackId: string, event: MouseEvent, type: fileTypes) {
      (this.state as ReactiveData).isLoading = true;
      setTimeout(() => {
        switch (type) {
          case fileTypes.IGC:
            getTrackASIgcString(trackId).then((igc_string) => {
              this.replaceNodeWithDownloadLink(
                event.target as HTMLElement,
                igc_string,
                trackId + "." + type
              );
              (this.state as ReactiveData).isLoading = false;
            });
            break;
          case fileTypes.GPX:
            getTrackASGpxString(trackId).then((gpx_string) => {
              this.replaceNodeWithDownloadLink(
                event.target as HTMLElement,
                gpx_string,
                trackId + "." + type
              );
              (this.state as ReactiveData).isLoading = false;
            });
            break;
        }
      });
    },
    isOverlapped(row: Track, overlapped_rows: string[]) {
      for (let i = 0; i < overlapped_rows.length; i++) {
        if (row.id == overlapped_rows[i]) {
          return true;
        }
        return false;
      }
    },
    resolveOverlap(row: Track) {
      (this.state as ReactiveData).isLoading = true;
      integrateInPreviousTrack(row.id).then(() => {
        this.updateRows();
        (this.state as ReactiveData).overlapped_rows = [];
      });
    },
    showDB() {
      showDB();
    },
    clickButton(target: HTMLElement) {
      target.click();
    },
  },
  mounted() {
    (this.state as ReactiveData).isLoading = true;
    initDB();
    (this.state as ReactiveData).isLoading = false;
  },
  components: {
    TrackJoinerHelp,
  },
});
</script>
<style scoped>
.loader {
  border-top-color: #3498db;
  -webkit-animation: spinner 1.5s linear infinite;
  animation: spinner 1.5s linear infinite;
}

@-webkit-keyframes spinner {
  0% {
    -webkit-transform: rotate(0deg);
  }
  100% {
    -webkit-transform: rotate(360deg);
  }
}

@keyframes spinner {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>