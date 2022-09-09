/*!
=========================================================
* © 2022 Ronan LE MEILLAT for High Can Fly
=========================================================
This website use:
- Vite, Vue3, FontAwesome 6, TailwindCss 3
- And many others
*/
import { createApp } from 'vue'
import App from '@/App.vue'
import { createWebHistory, createRouter, RouteRecordRaw } from "vue-router"
import metaMixin from "@/mixins/MetaMixin"
import '@/index.css'

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
] as RouteRecordRaw[]

const router = createRouter({
    scrollBehavior(to) {
        if (to.hash) {
            return {
                el: to.hash,
            }
        }
    },
    history: createWebHistory(),
    routes,
});

createApp(App).use(router)
    .mixin(metaMixin)
    .mount('#app')
