<template>
  <div v-if="state.isLoading" class="loading">
    <div class="
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
      ">
      <div class="
          loader
          ease-linear
          rounded-full
          border-4 border-t-4 border-gray-200
          h-12
          w-12
          mb-4
        "></div>
      <h2 class="text-center text-white text-xl font-semibold">
        Assemblage...
      </h2>
      <p class="w-1/3 text-center text-white">Nous analysons les données…</p>
      <Transition appear name="appears3s"
        enter-active-class="transition-opacity duration-[3s] ease-[cubic-bezier(1,0,1,-0.5)]"
        enter-from-class="opacity-0" leave-to-class="opacity-0">
        <p class="w-1/3 text-center text-white">Soyez patients…</p>
      </Transition>
      <Transition appear name="appears6s"
        enter-active-class="transition-opacity duration-[6s] ease-[cubic-bezier(1,0,1,-0.5)]"
        enter-from-class="opacity-0" leave-to-class="opacity-0">
        <p class="w-1/3 text-center text-white">Ça avance…</p>
      </Transition>
      <Transition appear name="appears9s"
        enter-active-class="transition-opacity duration-[9s] ease-[cubic-bezier(1,0,1,-0.5)]"
        enter-from-class="opacity-0" leave-to-class="opacity-0">
        <p class="w-1/3 text-center text-white">C'est bientôt prêt…</p>
      </Transition>
    </div>
  </div>
  <div>
    <div class="flex flex-col">
      <div class="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div class="
              shadow
              overflow-hidden
              border-b border-gray-200
              sm:rounded-lg
            ">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    ">
                    Section
                  </th>
                  <th scope="col" class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    ">
                    Heure
                  </th>
                  <th scope="col" class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    ">
                    État
                  </th>
                  <th scope="col" class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    ">
                    Points
                  </th>
                  <th scope="col" class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    ">
                    Fichier
                  </th>
                  <th @click="isHashVisible = !isHashVisible" scope="col" class="
                      px-6
                      py-3
                      text-left text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    ">
                    {{ isHashVisible ? "Masquer le hash" : "&nbsp;" }}
                  </th>
                  <th @click="isHashVisible = !isHashVisible" scope="col" class="
                      relative
                      px-6
                      py-3
                      text-right text-xs
                      font-medium
                      text-gray-500
                      uppercase
                      tracking-wider
                    ">
                    {{ isHashVisible ? "&nbsp;" : "Voir le hash" }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="(row, index) in state.rows" :key="row.id" @click="clickLine(row.id)" ref="track"
                  :class="state.selected_row === row.id ? 'bg-blue-50' : 'bg-white'">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <i :class="
                          row.type == trackTypes.FLY
                            ? 'fas fa-plane-departure'
                            : 'fas fa-hiking'
                        " />
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
                    <span class="
                        px-2
                        inline-flex
                        text-xs
                        leading-5
                        font-semibold
                        rounded-full
                        text-green-800
                      " :class="
                        isOverlapped(row, state.overlapped_rows)
                          ? 'bg-red-100 cursor-pointer'
                          : 'bg-green-100'
                      " @click="resolveOverlap(row)">
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
                  <td class="
                      px-6
                      py-4
                      whitespace-nowrap
                      text-right text-sm
                      font-medium
                    ">
                    <span class="
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
                        :src="igcImg" />&nbsp;
                      <img
                        @click.once="
                          clickDownload(row.id, $event, fileTypes.GPX)
                        "
                        class="w-6"
                        :src="gpxImg"
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
      <button type="button" class="
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
        " @click="clickButton($refs.fileFly as HTMLElement)" :disabled="state.isLoading">
        <svg v-if="state.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        Vols
      </button>
      <input type="file" accept=".igc,.fit,.gpx" multiple ref="fileFly" style="display: none"
        @change="clickFile($event, trackTypes.FLY)" />
      <button type="button" class="
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
        " @click="clickButton($refs.fileHike as HTMLElement)" :disabled="state.isLoading">
        <svg v-if="state.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        Marches
      </button>
      <input type="file" accept=".igc,.fit,.gpx" multiple ref="fileHike" style="display: none"
        @change="clickFile($event, trackTypes.HIKE)" />
      <button @click="clickJoin" class="
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
        " :disabled="state.isLoading || state.overlapped_rows.length > 0" :class="
          state.overlapped_rows.length
            ? 'bg-slate-200 hover:bg-slate-200 stat'
            : ''
        ">
        <svg v-if="state.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        Joindre
      </button>
      <a v-if="state.downloadLink.length" class="
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
        " :disabled="state.isLoading || state.overlapped_rows.length" download="trackjoiner.igc" title="télécharger"
        :href="state.downloadLink">
        <svg v-if="state.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
          </path>
        </svg>
        <i class="fas fa-download"></i>&nbsp;Télécharger
      </a>
    </div>
    <div class="flex-col divide-y divide-dashed" v-if="state.toolbox && (state.fixErroneusDTPicker !== null)">
      <div>
        <p class="text-sm text-gray-700">&nbsp;</p>
      </div>
      <div class="flex items-center">
        <p class="text-sm text-gray-700">Correction de l'enregistrement de départ</p>
        <div class="w-96">
          <datepicker locale="fr" inputClassName="text-sm text-gray-900" v-model="state.fixErroneusDTPicker" enableSeconds
            autoApply :clearable="false" />
        </div><br />
        <button v-if="state.selected_row_original_date != state.fixErroneusDTPicker" @click="clickfixErroneusDT" class="
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
        " :disabled="state.isLoading || state.overlapped_rows.length > 0" :class="
          state.overlapped_rows.length
            ? 'bg-slate-200 hover:bg-slate-200 stat'
            : ''
        ">
          <svg v-if="state.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          Corriger
        </button>
      </div>
      <div class="flex items-center">
        <p class="text-sm text-gray-700">Division de l'enregistrement</p>
        <div class="w-96">
          <datepicker locale="fr" inputClassName="text-sm text-gray-900" v-model="state.splitDTPicker" enableSeconds
            :min-date="state.splitDTPicker_start" :max-date="state.splitDTPicker_end" autoApply :clearable="false"
            @update:modelValue="state.splitDTPicker_changed = true" />
        </div>
        <br />
        <button
          v-if="state.splitDTPicker_changed && state.splitDTPicker != null && state.splitDTPicker > state.splitDTPicker_start && state.splitDTPicker < state.splitDTPicker_end"
          @click="clickSplit" class="
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
        " :disabled="state.isLoading || state.overlapped_rows.length > 0" :class="
          state.overlapped_rows.length
            ? 'bg-slate-200 hover:bg-slate-200 stat'
            : ''
        ">
          <svg v-if="state.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          Diviser
        </button>
      </div>
      <div class="flex items-center">
        <p class="text-sm text-gray-700">Changement de type</p>
        <select @change="state.changedType = true" v-model="state.selected_row_type">
          <option v-for="type in trackTypes" :key="type" :selected="type === state.selected_row_type">{{ type }}
          </option>
        </select>
        <button v-if="state.changedType" @click="clickChangeType" class="
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
        " :disabled="state.isLoading || state.overlapped_rows.length > 0" :class="
          state.overlapped_rows.length
            ? 'bg-slate-200 hover:bg-slate-200 stat'
            : ''
        ">
          <svg v-if="state.isLoading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
            </path>
          </svg>
          Changer le type
        </button>
      </div>
    </div>
  </div>
  <track-joiner-help />
</template>
<script lang="ts">
import '@vuepic/vue-datepicker/dist/main.css'
import { reactive, ref, defineComponent } from "vue";
import {
  initDB,
  changePartOfTrackType,
  changeTrackType,
  fixErroneousDT,
  getDBTracksRowsAsPromise,
  getTrackASIgcString,
  getTrackASGpxString,
  getDBTrackTypeAsPromise,
  getDBTrackDTEndAsPromise,
  getDBTrackDTStartAsPromise,
  getOverlappedRowsID,
  integrateInPreviousTrack,
  fileTypes,
  openFileAsPromise,
  showDB,

} from "@/trackjoiner/trackjoiner";
import { Track, trackTypes } from "@/trackjoiner/trackjoiner";
import TrackJoinerHelp from "@/views/TrackJoinerHelp.vue";
import Commit from "§/commit.json";
import gpxImg from "@/assets/GPX.svg"
import igcImg from "@/assets/IGC.svg"
import Datepicker from '@vuepic/vue-datepicker'

interface ReactiveData {
  rows: Track[];
  overlapped_rows: string[];
  isLoading: boolean;
  downloadLink: string;
  toolbox: boolean;
  selected_row: string;
  selected_row_original_date: Date;
  fixErroneusDTPicker: Date;
  splitDTPicker_start: Date;
  splitDTPicker: Date;
  splitDTPicker_end: Date;
  splitDTPicker_changed: boolean;
  changedType: boolean;
  selected_row_type: trackTypes;
}
export default defineComponent({
  setup() {
    const state = reactive<ReactiveData>({
      rows: [] as Track[],
      overlapped_rows: [] as string[],
      isLoading: false,
      downloadLink: "",
      toolbox: false,
      selected_row: "",
      selected_row_original_date: null as Date,
      fixErroneusDTPicker: null as Date,
      splitDTPicker_start: null as Date,
      splitDTPicker: null as Date,
      splitDTPicker_end: null as Date,
      splitDTPicker_changed: false,
      changedType: false,
      selected_row_type: trackTypes.MIXED,
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
      gpxImg,
      igcImg
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
    clickChangeType() {
      if ((this.state as ReactiveData).changedType) {
        changeTrackType((this.state as ReactiveData).selected_row, (this.state as ReactiveData).selected_row_type)
          .then(() => {
            this.updateRows();
          });
      }
    },
    clickSplit() {
      if (this.state.selected_row !== "" && this.state.splitDTPicker != null && this.state.splitDTPicker > this.state.splitDTPicker_start && this.state.splitDTPicker < this.state.splitDTPicker_end) {
        changePartOfTrackType((this.state as ReactiveData).selected_row,
          this.state.splitDTPicker_start,
          this.state.splitDTPicker,
          trackTypes.FLY).then(() => {
            this.updateRows();
          })
      }
    },
    clickfixErroneusDT() {
      if (this.state.selected_row !== "" && this.state.fixErroneusDTPicker !== null) {
        (this.state as ReactiveData).isLoading = true;
        fixErroneousDT((this.state as ReactiveData).selected_row,
          (this.state as ReactiveData).fixErroneusDTPicker)
          .then(() => {
            this.updateRows();
          });
      }
    },
    updateRows() {
      getDBTracksRowsAsPromise().then((rows) => {
        (this.state as ReactiveData).rows = rows;
        (this.state as ReactiveData).isLoading = false;
      });
    },
    clickLine(id: string) {
      (this.state as ReactiveData).selected_row = id;
      if (window.location.hash) {
        if (window.location.hash === "#toolbox") {
          (this.state as ReactiveData).toolbox = true;
          (this.state as ReactiveData).changedType = false;
          (this.state as ReactiveData).splitDTPicker_changed = false;
          getDBTrackTypeAsPromise(id).then(value => {
            (this.state as ReactiveData).selected_row_type = value;
          });
          getDBTrackDTStartAsPromise(id).then(value => {
            (this.state as ReactiveData).fixErroneusDTPicker = value;
            (this.state as ReactiveData).selected_row_original_date = value;
            (this.state as ReactiveData).splitDTPicker_start = value;
            getDBTrackDTEndAsPromise(id).then(value => {
              (this.state as ReactiveData).splitDTPicker_end = value;
              (this.state as ReactiveData).splitDTPicker = new Date(((this.state as ReactiveData).splitDTPicker_end.getTime() + (this.state as ReactiveData).splitDTPicker_start.getTime()) / 2);
            })
          })
        }
      }

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
      const a = document.createElement("a");
      const iLink = document.createElement("i");
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
      if ((this.state as ReactiveData).overlapped_rows.length > 0) {
        (this.state as ReactiveData).isLoading = true;
        integrateInPreviousTrack(row.id).then(() => {
          this.updateRows();
          (this.state as ReactiveData).overlapped_rows = [];
        });
      }
    },
    showDB() {
      showDB();
    },
    clickButton(target: HTMLElement) {
      target.click();
    },
  },
  mounted() {
    if (window.location.hash) {
      if (window.location.hash === "#toolbox") {
        (this.state as ReactiveData).toolbox = true;
      }
    }
    (this.state as ReactiveData).isLoading = true;
    initDB();
    (this.state as ReactiveData).isLoading = false;
  },
  components: {
    TrackJoinerHelp,
    Datepicker,
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
<style lang="scss">
$dp__font_size: 0.875rem;

.dp__input {
  @extend .dp__input;
  border-width: 0px;
}
</style>