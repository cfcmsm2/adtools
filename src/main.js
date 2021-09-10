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

// TODO: move outside main.js
function initFacebook() {
  return new Promise((resolve) => {
    const FBScript = document.createElement("script");
    FBScript.src = "https://connect.facebook.net/en_US/sdk.js";
    document.body.prepend(FBScript);

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "2870459646568696",
        xfbml: true,
        version: "v11.0"
      });

      resolve();
    };
  });
}

document.title = "Facebook Tools";
const appRoot = document.createElement("div");
document.body.appendChild(appRoot);

initFacebook().then(() => {
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
});
