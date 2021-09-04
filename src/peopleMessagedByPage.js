function statusChangeCallback(response) {
  if (response.status === "connected") {
    //  peopleMessagedByPage()
  }
}

function checkLoginState() {
  FB.getLoginStatus(function (response) {
    statusChangeCallback(response);
  });
}

window.fbAsyncInit = function () {
  FB.init({
    appId: "2870459646568696",
    cookie: true,
    xfbml: true,
    version: "v11.0"
  });

  FB.getLoginStatus(statusChangeCallback);
};

function get(url) {
  return new Promise((resolve) => FB.api(url, resolve));
}

/** PEOPLE MESSAGED BY PAGE */
function getTokens() {
  return get("/me/accounts?fields=access_token,name&limit=100").then(
    ({ data }) => data
  );
}

function processPage(url, names) {
  return get(url).then(({ data, paging }) => {
    data.forEach((conversation) =>
      names.push(conversation.participants.data[0].name)
    );

    if (paging && paging.next) {
      console.info("Getting next page");
      return processPage(paging.next, names);
    }
  });
}

function getPeopleForPage(accessToken) {
  const folders = ["page_done", "inbox", "other", "spam", "pending"];

  const names = [];

  return Promise.all(
    folders.map((folder) => {
      const url = `/me/conversations/?limit=499&fields=participants&folder=${folder}&access_token=${accessToken}`;
      return processPage(url, names);
    })
  ).then(() => names);
}

async function peopleMessagedByPage() {
  const tokens = await getTokens();

  const result = {};
  return Promise.all(
    tokens.map(({ access_token, name }) => {
      console.log(`Fetching ${name}...`);
      return getPeopleForPage(access_token).then(
        (data) => (result[name] = data)
      );
    })
  );
}
