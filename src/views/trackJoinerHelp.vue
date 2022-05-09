<template>
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
            class="
              absolute
              bg-gray-500 bg-opacity-75
              transition-opacity
            "
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
                  class="
                    absolute
                    bottom-2
                    left-2
                    -ml-8
                    pt-4
                    pr-2
                    flex
                    sm:-ml-10 sm:pr-4
                  "
                >
                  <button
                    type="button"
                    class="
                      rounded-md
                      text-gray-300
                      hover:text-blue-200
                      focus:outline-none focus:ring-2 focus:ring-white
                    "
                    @click="slideOpen = false"
                  >
                    <span class="sr-only">Fermer l'aide</span>
                    <i class="text-3xl fas fa-rectangle-xmark"></i>
                  </button>
                </div>
              </TransitionChild>
              <div
                class="
                  h-full
                  flex flex-col
                  py-6
                  bg-white
                  shadow-xl
                  overflow-y-scroll
                "
              >
                <div class="px-4 sm:px-6">
                  <DialogTitle class="text-lg font-medium text-gray-900">
                    Aide
                  </DialogTitle>
                </div>
                <div class="mt-6 relative flex-1 px-4 sm:px-6 text-sm">
                  <div>
                    <span
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
                      >Vols</span
                    ><br />
                    Ce bouton permet de choisir votre ou vos vols.<br />Les
                    formats acceptés sont FIT, GPX ou IGC.<br /><br />
                    <span
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
                      >Marches</span
                    ><br />
                    Ce bouton permet de choisir votre ou vos randonnées.<br />Les
                    formats acceptés sont FIT, GPX ou IGC.<br /><br />
                    <span
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
                      >Joindre</span
                    ><br />
                    Ce bouton permet d'assembler vos traces.<br />Si tout se
                    passe normalement toutes les lignes seront actives et au
                    bout de quelques instants il sera possible de télécharger
                    votre trace combinée.<br /><br />
                    <span
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
                      ><i class="fas fa-download"></i>&nbsp;Télécharger</span
                    ><br />
                    Ce bouton apparaît après avoir appuyé sur [Joindre].<br />Il
                    vous permet le téléchargement.<br /><br />
                    <span
                      class="
                        px-2
                        inline-flex
                        text-xs
                        leading-5
                        font-semibold
                        rounded-full
                        bg-red-100
                        ml-1
                        text-green-800
                      "
                      >Chevauchement</span
                    ><br />
                    Si ce bouton apparaît, cela signifie que 2 traces se
                    superposent au moins partiellement. Essayez de cliquer.
                    Avec un peu de chance le système essaiera de l'intégrer
                    automatiquement dans la précédente.<br /><br />
                    <span
                      class="
                        text-right text-xs
                        font-medium
                        text-gray-500
                        uppercase
                      "
                      >[Voir le Hash]</span
                    ><br />Dans la barre de titre sert à afficher l'identifiant
                    unique de la trace.<br /><br />
                    <span
                      class="flex flex-nowrap
                        text-right text-sm
                        font-bold
                        text-blue-700
                        uppercase
                      "
                      ><img class="w-6"
                        :src="require('../assets/GPX.svg')"
                    />&nbsp;<img class="w-6"
                        :src="require('../assets/IGC.svg')"
                    />&nbsp;<i
                        class="fas fa-download"
                      ></i></span
                    ><br />Dans le tableau servent à générer puis télécharger la
                    trace concernée au format IGC ou GPX.<br /><br />
                  </div>

                  <div class="absolute inset-0 px-4 sm:px-6">
                    <div class="h-full" aria-hidden="true" />
                  </div>

                  <!-- /End replace -->
                </div>
                <div
                  class="
                    absolute
                    bottom-0
                    pl-1
                    pb-1
                    text-xs text-blue-500
                    hover:text-blue-900
                  "
                >
                  <a href="https://www.highcanfly.club"
                    >© High Can Fly parapente
                    <span class="text-slate-300" v-html="commit_date"
                  /></a>
                </div>
              </div>
            </div>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
  <div
    class="
      flex
      absolute
      w-10
      h-10
      bottom-2
      right-2
      bg-blue-200
      text-white
      place-items-center
      justify-center
      cursor-pointer
      rounded
    "
    @click="slideOpen = true"
  >
    <i class="center fas fa-question"></i>
  </div>
</template>
<script lang="ts">
import { defineComponent, ref,Ref } from "vue";
import {
  Dialog,
  DialogOverlay,
  DialogTitle,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import Commit from "../../commit.json";

import { RouteLocation } from "vue-router";

export default defineComponent({
  data() {
    const slideOpen:Ref<boolean> = ref(
      (this.$route as RouteLocation).params.help ? true : false
    );
    return {
      slideOpen,
      commit_date: Commit.cfdtrackjoiner,
    };
  },
  components: {
    Dialog,
    DialogOverlay,
    DialogTitle,
    TransitionChild,
    TransitionRoot,
  },
});
</script>
