function refreshLoginStatus() {
  return new Promise((resolve) => {
    window.FB.getLoginStatus((response) => {
      if (response.status === "connected") {
        FB.loggedIn = true;
        resolve(true);
      } else {
        FB.loggedIn = false;
        resolve(false);
      }
    });
  });
}

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

        refreshLoginStatus().then(resolve);
      };
    });
  },

  async login() {
    await new Promise(window.FB.login);
    return refreshLoginStatus();
  },

  get(url) {
    return new Promise((resolve, reject) => {
      return window.FB.api(url, (response) => {
        if (!response || response.error) {
          if (response && response.error.type === "OAuthException") {
            refreshLoginStatus();
          }

          console.error(response);
          return reject(response && response.error);
        }

        return resolve(response);
      });
    });
  }
};
