import Vue from "vue";
import VueRouter from "vue-router";
import "purecss/build/pure-min.css";

import { FB } from "./FB";

import App from "./App.vue";
import Sheets from "./components/Sheets";
import AdStats from "./components/AdStats";
import Stats from "./components/Stats";
import Vibes from "./components/Vibes";
import Emails from "./components/Emails";

Vue.use(VueRouter);
Vue.config.productionTip = false;

document.title = "Facebook Tools";
const appRoot = document.createElement("div");
document.body.appendChild(appRoot);

FB.init().then(() => {
  new Vue({
    render: (h) => h(App),
    router: new VueRouter({
      routes: [
        { path: "/sheets", component: Sheets },
        { path: "/emails", component: Emails },
        { path: "/stats", component: Stats },
        { path: "/adstats", component: AdStats },
        { path: "/vibes", component: Vibes }
      ]
    })
  }).$mount(appRoot);
});
