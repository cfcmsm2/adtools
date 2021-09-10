<template>
  <div>
    <h2>Page Local Engagement Data</h2>
    <div v-if="!loggedIn">
      <button class="pure-button" @click="logIn">Log in</button>
    </div>
    <table v-else class="pure-table pure-table-bordered pure-table-striped">
      <thead>
        <tr>
          <td>Page</td>
          <td v-for="columnName in columnNames" :key="columnName">
            {{ columnName }}
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[page, columnData] in Object.entries(pageData)" :key="page">
          <td>{{ page }}</td>
          <td v-for="columnName in columnNames" :key="columnName">
            {{ columnData[columnName] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import Vue from "vue";

function get(url) {
  return new Promise((resolve) => window.FB.api(url, resolve));
}

async function getInsights(token, category, time = "days_28") {
  try {
    const result = await get(
      `/me/insights/${category}/${time}?access_token=${token}&date_preset=yesterday`
    );
    return result.data[0].values[0].value;
  } catch {
    return 0;
  }
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

// TODO: Improve performance using API to get multiple metrics at once
const columns = [
  {
    name: "Lifetime Local Page Likes",
    async getData(token) {
      const byCity = await getInsights(token, "page_fans_city", "");
      return accumulateNonLocal(byCity);
    },
  },
  {
    name: "28 Day Local Reach",
    async getData(token) {
      const byCityReach = await getInsights(
        token,
        "page_impressions_by_city_unique"
      );
      const nonLocalReach = accumulateNonLocal(byCityReach);
      const organicReach = await getInsights(
        token,
        "page_impressions_organic_unique"
      );

      return organicReach - nonLocalReach;
    },
  },
  {
    name: "28 Day Local People Talking About This",
    async getData(token) {
      return get(
        `/me/insights/page_content_activity_by_city_unique/days_28?access_token=${token}`
      ).then((data) => {
        if (!data.data[0]) {
          return "< 100";
        }
        return accumulateLocal(data.data[0].values[0].value);
      });
    },
  },
  {
    name: "Engagement Rate",
    async getData(token) {
      return getInsights(token, "page_post_engagements");
    },
  },
];

export default {
  data() {
    return {
      pageData: {},
      loggedIn: false,
    };
  },
  computed: {
    columnNames() {
      return columns.map((column) => column.name);
    },
  },
  mounted() {
    // var uri = encodeURI(window.location.href);
    window.FB.getLoginStatus((response) => {
      if (response.status === "connected") {
        this.loggedIn = true;
        this.loadData();
      } else {
        this.loggedIn = false;
        // FB.login();
        // window.location = encodeURI("https://www.facebook.com/dialog/oauth?client_id=2870459646568696&redirect_uri=" + uri + "&response_type=token");
      }
    });
  },
  methods: {
    logIn() {
      window.FB.login();

      window.FB.getLoginStatus((response) => {
        if (response.status === "connected") {
          this.loggedIn = true;
          this.loadData();
        }
      });
    },
    async loadData() {
      const { data } = await get(
        "/me/accounts?fields=access_token,name&limit=100"
      );

      await Promise.all(
        data.map(({ access_token, name }) => {
          Vue.set(this.pageData, name, {});
          return Promise.all(
            columns.map((column) => {
              return column
                .getData(access_token)
                .then((result) =>
                  Vue.set(this.pageData[name], column.name, result)
                );
            })
          );
        })
      );
    },
  },
};
</script>