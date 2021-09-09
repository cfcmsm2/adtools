<template>
  <div>
    <h2>Page Local Engagement Data</h2>
    <pre>
      {{ JSON.stringify(window.FB, null, 2) }}
    </pre>
    <div v-if="!loggedIn">
      <button class="pure-button" @click="logIn">Log in</button>
    </div>
    <table v-else class="pure-table pure-table-bordered pure-table-striped">
      <thead>
        <tr>
          <td>Page</td>
          <td>Lifetime Local Page Likes</td>
          <td>28 Day Local Reach</td>
          <td>28 Day Local People Talking About This</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[page, likes] in Object.entries(localLikes)" :key="page">
          <td>{{ page }}</td>
          <td>{{ likes }}</td>
          <td>{{ localReach[page] }}</td>
          <td>{{ localEngagement[page] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import Vue from "vue";

const FB = window.FB;

function get(url) {
  return new Promise((resolve) => FB.api(url, resolve));
}

const isLocal = (place) => /WY|NE|CO/.test(place);

function accumulateNonLocal(data) {
  return Object.entries(data)
    .filter((place) => !isLocal(place[0]))
    .reduce((a, b) => a + b[1], 0);
}

function accumulateLocal(data) {
  return Object.entries(data)
    .filter((place) => isLocal(place[0]))
    .reduce((a, b) => a + b[1], 0);
}

async function getNonlocalReach(token) {
  const reachDetails = (
    await get(
      `/me/insights/page_impressions_by_city_unique/days_28?date_preset=yesterday&access_token=${token}`
    )
  ).data[0].values[0].value;

  return accumulateNonLocal(reachDetails);
}

function getOrganicReach(token) {
  return get(
    `/me/insights/page_impressions_organic_unique/days_28?date_preset=yesterday&access_token=${token}`
  ).then((data) => data.data[0].values[0].value);
}

async function getLikes(token) {
  const reachDetails = (
    await get(
      `/me/insights/page_fans_city?date_preset=yesterday&access_token=${token}`
    )
  ).data[0].values[0].value;

  return accumulateLocal(reachDetails);
}

function getLocalEngagement(token) {
  return get(
    `/me/insights/page_content_activity_by_city_unique/days_28?date_preset=yesterday&access_token=${token}`
  ).then((data) => {
    if (!data.data[0]) {
      return "< 100";
    }
    return accumulateLocal(data.data[0].values[0].value);
  });
}

export default {
  data() {
    return {
      localReach: {},
      localLikes: {},
      localEngagement: {},
      loggedIn: false,
    };
  },
  mounted() {
    // var uri = encodeURI(window.location.href);
    // FB.getLoginStatus((response) => {
    //   if (response.status === "connected") {
    //     this.loggedIn = true;
    //     this.loadData();
    //   } else {
    //     this.loggedIn = false;
    //     // FB.login();
    //     // window.location = encodeURI("https://www.facebook.com/dialog/oauth?client_id=2870459646568696&redirect_uri=" + uri + "&response_type=token");
    //   }
    // });
  },
  methods: {
    logIn() {
      FB.login();

      FB.getLoginStatus((response) => {
        console.log(response);
        if (response.status === "connected") {
          this.loggedIn = true;
          this.loadData();
        }
      });
    },
    loadData() {
      const organicReach = {};
      const nonLocalReach = {};
      // const localLikes = {};

      get("/me/accounts?fields=access_token,name&limit=100")
        .then(({ data }) => {
          return Promise.all(
            data.map(({ access_token, name }) => {
              return Promise.all([
                getOrganicReach(access_token).then(
                  (reach) => (organicReach[name] = reach)
                ),
                getNonlocalReach(access_token).then(
                  (reach) => (nonLocalReach[name] = reach)
                ),
                getLikes(access_token).then((likes) =>
                  Vue.set(this.localLikes, name, likes)
                ),
                getLocalEngagement(access_token).then((engagement) =>
                  Vue.set(this.localEngagement, name, engagement)
                ),
              ]);
            })
          );
        })
        .then(() => {
          Object.entries(organicReach).forEach(([page, pageReach]) => {
            Vue.set(this.localReach, page, pageReach - nonLocalReach[page]);
          });
        });
    },
  },
};
</script>