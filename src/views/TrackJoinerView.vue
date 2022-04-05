<template>
  <div>
    <div class="flex flex-col">
      <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div
            class="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg"
          >
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Section
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Heure
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    État
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Points
                  </th>
                  <th
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Fichier
                  </th>
                  <th
                    @click="isHashVisible = !isHashVisible"
                    scope="col"
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {{ isHashVisible ? "Masquer le hash" : "&nbsp;" }}
                  </th>
                  <th
                    @click="isHashVisible = !isHashVisible"
                    scope="col"
                    class="relative px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
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
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
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
                    class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
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
        class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2"
        @click="$refs.fileFly.click()"
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
        class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2"
        @click="$refs.fileHike.click()"
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
        class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2"
        :disabled="state.isLoading || state.overlapped_rows.length"
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
        class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2"
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
  <!-- Aide Slider -->
  <TransitionRoot as="template" :show="slideOpen">
    <Dialog
      as="div"
      class="fixed inset-0 overflow-hidden z-50"
      @close="slideOpen = false"
    >
      <div class="absolute inset-0 overflow-hidden">
        <TransitionChild
          as="template"
          enter="ease-in-out duration-500"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in-out duration-500"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <DialogOverlay
            class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          />
        </TransitionChild>
        <div class="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <TransitionChild
            as="template"
            enter="transform transition ease-in-out duration-500 sm:duration-700"
            enter-from="translate-x-full"
            enter-to="translate-x-0"
            leave="transform transition ease-in-out duration-500 sm:duration-700"
            leave-from="translate-x-0"
            leave-to="translate-x-full"
          >
            <div class="relative w-screen max-w-md">
              <TransitionChild
                as="template"
                enter="ease-in-out duration-500"
                enter-from="opacity-0"
                enter-to="opacity-100"
                leave="ease-in-out duration-500"
                leave-from="opacity-100"
                leave-to="opacity-0"
              >
                <div
                  class="absolute bottom-2 left-2 -ml-8 pt-4 pr-2 flex sm:-ml-10 sm:pr-4"
                >
                  <button
                    type="button"
                    class="rounded-md text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    @click="slideOpen = false"
                  >
                    <span class="sr-only">Fermer l'aide</span>
                    <XIcon class="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>
              <div
                class="h-full flex flex-col py-6 bg-white shadow-xl overflow-y-scroll shadow"
              >
                <div class="px-4 sm:px-6">
                  <DialogTitle class="text-lg font-medium text-gray-900">
                    Aide
                  </DialogTitle>
                </div>
                <div class="mt-6 relative flex-1 px-4 sm:px-6 text-sm">
                  <div>
                    <span
                      class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2"
                      >Vols</span
                    ><br />
                    Ce bouton permet de choisir votre ou vos vols.<br />Les
                    formats acceptés sont FIT, GPX ou IGC.<br /><br />
                    <span
                      class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2"
                      >Marches</span
                    ><br />
                    Ce bouton permet de choisir votre ou vos randonnées.<br />Les
                    formats acceptés sont FIT, GPX ou IGC.<br /><br />
                    <span
                      class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2"
                      >Joindre</span
                    ><br />
                    Ce bouton permet d'assembler vos traces.<br />Si tout se
                    passe normalement toutes les lignes seront actives et au
                    bout de quelques instants il sera possible de télécharger
                    votre trace combinée.<br /><br />
                    <span
                      class="inline-flex items-center font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-700 transition ease-in-out duration-150 py-2 px-4 m-2"
                      ><i class="fas fa-download"></i>&nbsp;Télécharger</span
                    ><br />
                    Ce bouton apparaît après avoir appuyé sur [Joindre].<br />Il
                    vous permet le téléchargement.<br /><br />
                    <span
                      class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 ml-1 text-green-800"
                      >Chevauchement</span
                    ><br />
                    Si ce bouton apparaît, cela signifie que 2 traces se
                    supperposent au moins partiellement. Essayer de cliquer.
                    Avec un peu de chance le système essaiera de l'intégrer
                    automatiquement dans la précédente.<br /><br />
                    <span
                      class="text-right text-xs font-medium text-gray-500 uppercase"
                      >[Voir le Hash]</span
                    ><br />Dans la barre de titre sert à afficher l'identifiant
                    unique de la trace.<br /><br />
                    <span
                      class="text-right text-sm font-medium font-bold text-blue-700 uppercase"
                      ><i class="fas fa-tools"></i>&nbsp;<i
                        class="fas fa-download"
                      ></i></span
                    ><br />Dans le tableau servent à générer puis télécharger la
                    trace concernée au format IGC.<br /><br />
                  </div>

                  <div class="absolute inset-0 px-4 sm:px-6">
                    <div class="h-full" aria-hidden="true" />
                  </div>

                  <!-- /End replace -->
                </div>
                <div
                  class="absolute bottom-0 pl-1 pb-1 text-xs text-blue-500 hover:text-blue-900"
                >
                  <a href="https://www.highcanfly.club"
                    >© High Can Fly parapente <span class="text-slate-300" v-html="commit_date"/></a
                  >
                </div>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
  <div
    class="flex absolute w-10 h-10 bottom-2 right-2 bg-blue-200 text-white place-items-center justify-center cursor-pointer rounded"
    @click="slideOpen = true"
  >
    <i class="center fas fa-question"></i>
  </div>
  <!-- fin aide -->
</template>
<script>
import { ref } from "vue";
import {
  Dialog,
  DialogOverlay,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { XIcon } from "@heroicons/vue/outline";
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
} from "trackjoiner";
import { nSQL } from "@nano-sql/core";

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
  getTrackASIgcString().then((igc_string) => {
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

export default {
  data() {
    const isHashVisible = false;
    const slideOpen = ref(this.$route.params.help ? true : false);
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
      slideOpen,
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
  },
  setup() {
    state.isLoading = true;
    if (nSQL().listDatabases().length)
      nSQL()
        .dropDatabase("cdfmv_db")
        .then(() => {
          initDB();
          state.isLoading = false;
        });
    else {
      initDB();
      state.isLoading = false;
    }
  },
  components: {
    Dialog,
    DialogOverlay,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
    XIcon,
  },
};
</script>
