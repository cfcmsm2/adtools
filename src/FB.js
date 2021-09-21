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
          version: "v11.0"
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
    await new Promise(window.FB.login);
    return this.refreshLoginStatus();
  },

  get(url) {
    return new Promise((resolve) => window.FB.api(url, resolve));
  }
};
