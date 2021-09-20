export const FB = {
  init() {
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
  },

  isLoggedIn() {
    return new Promise((resolve) => {
      window.FB.getLoginStatus((response) => {
        if (response.status === "connected") {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  },

  logIn() {
    return new Promise((resolve) => window.FB.logIn(resolve));
  },

  get(url) {
    return new Promise((resolve) => window.FB.api(url, resolve));
  }
};
