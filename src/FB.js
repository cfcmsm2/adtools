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
          version: "v12.0"
        });

        this.refreshLoginStatus().then(resolve);
      };
    });
  },

  refreshLoginStatus() {
    return new Promise((resolve) => {
      window.FB.getLoginStatus((response) => {
        if (response.status === "connected") {
          this.loggedIn = true;
          resolve(true);
        } else {
          this.loggedIn = false;
          resolve(false);
        }
      });
    });
  },

  async login() {
    await this.refreshLoginStatus();
    if (!this.loggedIn) {
      await new Promise(window.FB.login);
    }
    return this.refreshLoginStatus();
  },

  _request() {
    return new Promise((resolve, reject) => {
      return window.FB.api(...arguments, (response) => {
        if (!response || response.error) {
          if (response && response.error.type === "OAuthException") {
            this.refreshLoginStatus();
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
