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
            component: () => import("@/views/MainPage.vue"),
            name: "main-page",
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
  