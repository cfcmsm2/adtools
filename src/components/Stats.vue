<template>
  <div>
    <h2>Page Local Engagement Data</h2>
    <div v-if="!loggedIn">
      <button class="pure-button" @click="logIn">Log in</button>
    </div>
    <div v-else>
      <div class="pure-form pure-form-aligned">
        <fieldset>
          <label for="time">Time Period</label>
          <select v-model="period" id="time">
            <option value="day">Last Day</option>
            <option value="week">Last Week</option>
            <option value="days_28">Last 28 Days</option>
          </select>
        </fieldset>
      </div>

      <table class="pure-table pure-table-bordered pure-table-striped">
        <thead>
          <tr>
            <td>Page</td>
            <td v-for="columnName in columnNames" :key="columnName">
              {{ columnName }}
            </td>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="[page, columnData] in Object.entries(pageData)"
            :key="page"
          >
            <td>
              <strong>{{ page }}</strong>
            </td>
            <td v-for="columnName in columnNames" :key="columnName">
              {{ columnData[columnName] }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import Vue from "vue";

const PAGE_IDS = [
  "112076063796073",
  "102540111429955",
  "100190701670078",
  "101166864903191",
  "104996111183539",
  "102792574600844",
  "104575054554957",
  "109859227352531",
  "105874321094615",
  "111660853836193",
  "112969893700175",
];

function get(url) {
  return new Promise((resolve) => window.FB.api(url, resolve));
}

async function getInsights(
  token,
  category,
  time = "days_28",
  datePreset = "yesterday"
) {
  try {
    const result = await get(
      `/me/insights/${category}/${time}?access_token=${token}&date_preset=${datePreset}`
    );
    console.log(result);
    return result.data[0].values[0].value;
  } catch {
    return 0;
  }
}

function daysAgo(timePeriod) {
  let numDays;
  switch (timePeriod) {
    case "day":
      numDays = 1;
      break;
    case "week":
      numDays = 7;
      break;
    case "days_28":
      numDays = 28;
      break;
    default:
      throw new Error("Invalid time period");
  }

  return Date.now() - numDays * 24 * 60 * 60 * 1000;
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

function sum(array) {
  return array.reduce((a, b) => a + b, 0);
}

function toPercent(number) {
  return Math.round(number * 10000) / 100 + "%";
}

// TODO: Improve performance using API to get multiple metrics at once
const columns = [
  {
    name: "Lifetime Local Page Likes",
    async getData(token) {
      const byCity = await getInsights(token, "page_fans_city", "", "");

      const localLikes = accumulateLocal(byCity);
      const allLikesWithCity =
        accumulateLocal(byCity) + accumulateNonLocal(byCity);

      const percentLocal = localLikes / allLikesWithCity;

      const totalLikes = await getInsights(token, "page_fans", "");

      return Math.round(totalLikes * percentLocal);
    },
  },
  {
    name: "Local Reach",
    async getData(token, timePeriod) {
      const byCityReach = await getInsights(
        token,
        "page_impressions_by_city_unique",
        timePeriod
      );
      const nonLocalReach = accumulateNonLocal(byCityReach);
      const organicReach = await getInsights(
        token,
        "page_impressions_organic_unique",
        timePeriod
      );

      // There's no metric specifically for organic reach by city.
      // But our ads are only run locally! Since there's no paid
      // non-local reach, Local Organic Reach = Organic Reach - Non-Local Reach
      return organicReach - nonLocalReach;
    },
  },
  // {
  //   name: "Local People Talking About This",
  //   async getData(token, timePeriod) {
  //     return get(
  //       `/me/insights/page_content_activity_by_city_unique/${timePeriod}?access_token=${token}`
  //     ).then((data) => {
  //       if (!data.data[0]) {
  //         return "< 100";
  //       }
  //       return accumulateLocal(data.data[0].values[0].value);
  //     });
  //   },
  // },
  // {
  //   name: "Minute View",
  //   async getData(token, timePeriod) {
  //     return getInsights(token, "page_video_views_organic", timePeriod);
  //   },
  // },
  // {
  //   name: "Comments Responded To",
  //   metrics: {

  //   },
  //   async getData(token, timePeriod, pageId) {
  //     // TODO: comments limit? post limit? could be missing data

  //     const posts = (
  //       await get(
  //         `/me/feed?access_token=${token}&limit=30&fields=comments.limit(500),created_time`
  //       )
  //     ).data.filter(
  //       (post) => new Date(post.created_time) > daysAgo(timePeriod)
  //     );

  //     const postComments = posts
  //       .map((post) => (post.comments ? post.comments.data : []))
  //       .flat();

  //     const postCommentReplies = (
  //       await Promise.all(
  //         postComments.map((comment) =>
  //           get(`/${comment.id}/comments?access_token=${token}`).then((res) =>
  //             res.data.filter(
  //               (comment) => comment.from && comment.from.id === pageId
  //             )
  //           )
  //         )
  //       )
  //     ).flat();

  //     return toPercent(postCommentReplies.length / postComments.length);
  //   },
  // },
  // {
  //   name: "Engagement Rate",
  //   async getData(token, timePeriod) {
  //     const pagePostData = (
  //       await get(
  //         `/me/feed?fields=insights.metric(post_engaged_users,post_impressions_organic_unique),created_time&access_token=${token}`
  //       )
  //     ).data.filter(
  //       (post) => new Date(post.created_time) > daysAgo(timePeriod)
  //     );

  //     let totalEngagement = pagePostData.reduce(
  //       (total, post) =>
  //         total +
  //         post.insights.data.find(
  //           (insight) => insight.name === "post_engaged_users"
  //         ).values[0].value,
  //       0
  //     );
  //     let totalReach = pagePostData.reduce(
  //       (total, post) =>
  //         total +
  //         post.insights.data.find(
  //           (insight) => insight.name === "post_impressions_organic_unique"
  //         ).values[0].value,
  //       0
  //     );

  //     if (!totalReach) return "N/A";
  //     return toPercent(totalEngagement / totalReach);
  //   },
  // },
  // {
  //   // post_impressions_fan_unique
  //   name: "Followers Reached",
  //   async getData(token, timePeriod) {
  //     const pagePostData = (
  //       await get(
  //         `/me/feed?fields=insights.metric(post_impressions_fan_unique),created_time&access_token=${token}`
  //       )
  //     ).data.filter(
  //       (post) => new Date(post.created_time) > daysAgo(timePeriod)
  //     );

  //     const totalFanReach = pagePostData.reduce(
  //       (total, post) => total + post.insights.data[0].values[0].value,
  //       0
  //     );
  //     const averageFanReach = totalFanReach / pagePostData.length;

  //     const likes = await getInsights(token, "page_fans", "");

  //     return toPercent(averageFanReach / likes);
  //   },
  // },
];

export default {
  data() {
    return {
      pageData: {},
      loggedIn: false,
      period: "days_28",
      data: null,
    };
  },
  computed: {
    columnNames() {
      return columns.map((column) => column.name);
    },
  },
  mounted() {
    window.FB.getLoginStatus(this.authCallback.bind(this));
  },
  watch: {
    period() {
      this.loadData();
    },
  },
  methods: {
    logIn() {
      window.FB.login(this.authCallback.bind(this));
    },
    authCallback(response) {
      this.data = response;
      if (response.status === "connected") {
        this.loggedIn = true;
        this.loadData();
      } else {
        this.loggedIn = false;
      }
    },
    async loadData() {
      const { data } = await get(
        "/me/accounts?fields=access_token,name,id&limit=100"
      );

      await Promise.all(
        data.map(({ access_token, name, id }) => {
          if (!PAGE_IDS.includes(id)) {
            return Promise.resolve();
          }

          Vue.set(this.pageData, name, {});
          return Promise.all(
            columns.map((column) => {
              return column
                .getData(access_token, this.period, id)
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