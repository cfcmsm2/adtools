import Vue from "vue";
import VueRouter from "vue-router";
import "purecss/build/pure-min.css";

import App from "./App.vue";
import Sheets from "./components/Sheets";
import Stats from "./components/Stats";
import Vibes from "./components/Vibes";
import Emails from "./components/Emails";

Vue.use(VueRouter);
Vue.config.productionTip = false;

window.fbAsyncInit = function () {
  window.FB.init({
    appId: "2870459646568696",
    xfbml: true,
    version: "v11.0"
  });
};

document.title = "Facebook Tools";
const appRoot = document.createElement("div");
document.body.appendChild(appRoot);

new Vue({
  render: (h) => h(App),
  router: new VueRouter({
    routes: [
      { path: "/sheets", component: Sheets },
      { path: "/emails", component: Emails },
      { path: "/stats", component: Stats },
      { path: "/vibes", component: Vibes }
    ]
  })
}).$mount(appRoot);
