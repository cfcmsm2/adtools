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
import { FB } from "../FB";

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

async function getInsights(
  token,
  category,
  time = "days_28",
  datePreset = "yesterday"
) {
  try {
    const result = await FB.get(
      `/me/insights/${category}/${time}?access_token=${token}&date_preset=${datePreset}`
    );
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

function unique(array) {
  return Array.from(new Set(array));
}

function toPercent(number) {
  return Math.round(number * 10000) / 100 + "%";
}

const columns = [
  {
    name: "Lifetime Local Page Likes",
    async getData({ token }) {
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
    async getData({ token, timePeriod }) {
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
  //   async getData({token, timePeriod}) {
  //     return FB.get(
  //       `/me/insights/page_content_activity_by_city_unique/${timePeriod}?access_token=${token}`
  //     ).then((data) => {
  //       if (!data.data[0]) {
  //         return "< 100";
  //       }
  //       return accumulateLocal(data.data[0].values[0].value);
  //     });
  //   },
  // },
  {
    name: "Average Seconds Viewed",
    postMetrics: ["post_video_avg_time_watched"],
    async getData({ posts }) {
      if (!posts.length) return "No posts";
      const viewTime = posts
        .map(
          (post) =>
            post.insights.data.find(
              (insight) => insight.name === "post_video_avg_time_watched"
            ).values[0].value
        )
        .filter((viewTime) => viewTime > 0);

      if (!viewTime.length) return "No videos";

      return Math.round(sum(viewTime) / viewTime.length) / 1000;
    },
  },
  {
    name: "Comments Responded To",
    postFields: ["comments.limit(500)", "created_time"],
    async getData({ token, posts, pageId }) {
      if (!posts.length) return "No posts";

      const postComments = posts
        .map((post) => (post.comments ? post.comments.data : []))
        .flat();

      if (!postComments.length) return "No comments";

      const postCommentReplies = (
        await Promise.all(
          postComments.map((comment) =>
            FB.get(
              `/${comment.id}/comments?access_token=${token}`
            ).then((res) =>
              res.data.filter(
                (comment) => comment.from && comment.from.id === pageId
              )
            )
          )
        )
      ).flat();

      return toPercent(postCommentReplies.length / postComments.length);
    },
  },
  {
    name: "Engagement Rate",
    postMetrics: ["post_engaged_users", "post_impressions_organic_unique"],
    async getData({ posts }) {
      if (!posts.length) return "No posts";

      let totalEngagement = sum(
        posts.map(
          (post) =>
            post.insights.data.find(
              (insight) => insight.name === "post_engaged_users"
            ).values[0].value
        )
      );
      let totalReach = sum(
        posts.map(
          (post) =>
            post.insights.data.find(
              (insight) => insight.name === "post_impressions_organic_unique"
            ).values[0].value
        )
      );

      if (!totalReach) return "N/A";
      return toPercent(totalEngagement / totalReach);
    },
  },
  {
    name: "Followers Reached",
    postMetrics: ["post_impressions_fan_unique"],
    async getData({ token, posts }) {
      if (!posts.length) return "No posts";

      const totalFanReach = sum(
        posts.map(
          (post) =>
            post.insights.data.find(
              (insight) => insight.name === "post_impressions_fan_unique"
            ).values[0].value
        )
      );
      const averageFanReach = totalFanReach / posts.length;

      const likes = await getInsights(token, "page_fans", "");

      return toPercent(averageFanReach / likes);
    },
  },
];

export default {
  data() {
    return {
      pageData: {},
      loggedIn: false,
      period: "days_28",
    };
  },
  computed: {
    columnNames() {
      return columns.map((column) => column.name);
    },
  },
  async mounted() {
    this.loggedIn = await FB.isLoggedIn();
  },
  watch: {
    period() {
      this.loadData();
    },
    loggedIn() {
      if (this.loggedIn) {
        this.loadData();
      }
    },
  },
  methods: {
    logIn: FB.logIn,
    async loadData() {
      let postFields = unique(
        columns
          .reduce((fields, column) => fields.concat(column.postFields), [])
          .filter((field) => field)
          .concat("created_time")
      ).join(",");
      let postMetrics = unique(
        columns
          .reduce((fields, column) => fields.concat(column.postMetrics), [])
          .filter((field) => field)
      ).join(",");

      const { data } = await FB.get(
        "/me/accounts?fields=access_token,name,id&limit=100"
      );

      await Promise.all(
        data.map(async ({ access_token, name, id }) => {
          if (!PAGE_IDS.includes(id)) {
            return Promise.resolve();
          }

          const posts = (
            await FB.get(
              `/me/feed?access_token=${access_token}&limit=30&fields=${postFields},insights.metric(${postMetrics})`
            )
          ).data.filter(
            (post) => new Date(post.created_time) > daysAgo(this.period)
          );

          Vue.set(this.pageData, name, {});
          return Promise.all(
            columns.map((column) => {
              return column
                .getData({
                  token: access_token,
                  timePeriod: this.period,
                  posts,
                  pageId: id,
                })
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