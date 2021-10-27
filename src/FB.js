import { FB_APP_ID } from "./config.json";

export const FB = {
  loggedIn: false,

  init() {
    return new Promise((resolve) => {
      const FBScript = document.createElement("script");
      FBScript.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.prepend(FBScript);

      window.fbAsyncInit = () => {
        window.FB.Event.subscribe(
          "auth.statusChange",
          this.statusChangeCallback.bind(this)
        );

        window.FB.init({
          appId: FB_APP_ID,
          xfbml: true,
          cookie: false,
          version: "v12.0",
          status: true
        });

        resolve();
      };
    });
  },

  statusChangeCallback(response) {
    console.log(response);
    if (response.status === "connected") {
      this.loggedIn = true;
    } else {
      this.loggedIn = false;
    }
  },

  async login() {
    //   await new Promise((resolve) => window.FB.getLoginStatus(resolve, true));
    if (!this.loggedIn) {
      await new Promise(window.FB.login);

      if (!this.loggedIn) {
        throw new Error("Login failed");
      }
    }
  },

  _request() {
    return new Promise((resolve, reject) => {
      return window.FB.api(...arguments, (response) => {
        if (!response || response.error) {
          if (response && response.error.type === "OAuthException") {
            window.FB.getLoginStatus();
          }

          console.error(arguments);
          console.error(response);
          return reject(response && response.error);
        }

        return resolve(response);
      });
    });
  },

  get(url) {
    return this._request(url, "get");
  },

  post(url, data) {
    return this._request(url, "post", data);
  }
};
