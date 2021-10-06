export const FB = {
  loggedIn: false,

  init() {
    return new Promise((resolve) => {
      const FBScript = document.createElement("script");
      FBScript.src = "https://connect.facebook.net/en_US/sdk.js";
      document.body.prepend(FBScript);

      window.fbAsyncInit = () => {
        window.FB.init({
          appId: "2870459646568696",
          xfbml: true,
          version: "v12.0",
          status: true
        });

        window.FB.Event.subscribe(
          "auth.statusChange",
          this.statusChangeCallback.bind(this)
        );
        resolve();
      };
    });
  },

  statusChangeCallback(response) {
    if (response.status === "connected") {
      this.loggedIn = true;
    } else {
      this.loggedIn = false;
    }
  },

  async login() {
    await new Promise(window.FB.getLoginStatus);
    if (!this.loggedIn) {
      await new Promise(window.FB.login);
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
