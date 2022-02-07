import { createApp } from 'vue'
import "@/assets/styles/index.css";
import metaMixin from "@/mixins/MetaMixin";
import App from "@/App.vue";

//font awesome
import "@fortawesome/fontawesome-free/css/all.min.css";

import { createWebHistory, createRouter } from "vue-router";

const routes = [
    {
            path: "/",
            component: () => import("@/views/TrackJoinerView.vue"),
            name: "main-page",
    },
    {
        path: "/:help",
        component: () => import("@/views/TrackJoinerView.vue"),
      },
    { path: "/:pathMatch(.*)*", redirect: "/" },
];
const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  const app = createApp(App);
  app.use(router);
  app.mixin(metaMixin);
  app.mount("#app");
  