<template>
  <div>
    <h1>Ad Stats</h1>
    <div v-if="!FB.loggedIn">
      <button class="pure-button" @click="FB.login()">Log in</button>
    </div>
    <div v-else>
      <button
        class="pure-button pure-button-primary"
        @click="downloadData"
        :disabled="loading"
      >
        {{ !loading ? "Download" : "Loading..." }}
      </button>
      <pre v-if="adInfo">{{ JSON.stringify(adInfo, null, 2) }}</pre>
    </div>
  </div>
</template>

<script>
import Papa from "papaparse";
import fileDownload from "js-file-download";

import { FB } from "../FB";

const ID_TO_PAGE = {
  112076063796073: "Fremont",
  102540111429955: "Casper",
  107872380889014: "Casper",
  100190701670078: "Laramie",
  100458364981973: "Laramie",
  113200947185275: "Missionwide Spanish",
  101166864903191: "Cheyenne",
  101514254866318: "Missionwide Spanish",
  113019807035447: "Cheyenne",
  109027220775473: "Cheyenne",
  104996111183539: "Nebraska",
  102792574600844: "Fort Collins",
  101018424899828: "Missionwide Spanish",
  100609861621544: "Windsor",
  104575054554957: "Greeley",
  109859227352531: "Missionwide Spanish",
  105874321094615: "Windsor",
  107846814223337: "Greeley",
  102503358098611: "Greeley",
  100789378273176: "Missionwide Spanish",
  111660853836193: "Loveland",
  113096237026249: "Missionwide Spanish",
  112969893700175: "Longmont",
  100310588322372: "Missionwide Spanish",
  103031824713313: "RIP",
  100179225000921: "RIP",
  100376911653405: "RIP",
  102461418107610: "RIP",
};

const genPermalink = (ad) =>
  `https://business.facebook.com/${ad.creative.effective_object_story_id}?dco_ad_id=${ad.id}`;

function audienceType(targeting) {
  if (
    targeting.custom_audiences &&
    targeting.custom_audiences.find((audience) =>
      audience.name.includes("Lookalike")
    )
  ) {
    return "LOOKALIKE";
  }

  if (
    targeting.interests ||
    targeting.behaviors ||
    (targeting.flexible_spec &&
      targeting.flexible_spec.find((spec) => spec.interests))
  ) {
    return "INTEREST";
  }

  return "BROAD";
}

function dateToday() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

const getAction = (actions) => (actionType) => {
  if (!actions) return 0;
  return actions.find((action) => Number(action.action_type === actionType))
    .value;
};
function results(insightsData) {
  const objective = insightsData.objective;
  const action = getAction(insightsData.actions);

  try {
    switch (objective) {
      case "MESSAGES":
        return action("onsite_conversion.messaging_conversation_started_7d");
      case "REACH":
        return Number(insightsData.reach);
      case "PAGE_LIKES":
        return action("page_engagement");
      case "POST_ENGAGEMENT":
        return action("post_engagement");
      case "EVENT_RESPONSES":
        return action("rsvp");
      case "LEAD_GENERATION":
        return action("lead"); // TODO: Verify This
      default:
        return "Uh oh";
    }
  } catch (e) {
    return 0;
  }
}

// TODO: Make this not disgusting
function adCategory(adName) {
  if (adName.includes("Daily Bible")) return "Daily Bible";
  if (adName.includes("Service")) return "Service";
  if (adName.includes("Bibl")) return "Free Bible";
  if (adName.includes("Chapel Tour")) return "Chapel Tour";
  if (adName.includes("Church")) return "Church";
  if (adName.includes("MWM")) return "Meet with Missionaries";
  if (adName.includes("Meet")) return "Meet with Missionaries";
  if (adName.includes("Restart")) return "Meet with Missionaries";
  if (adName.includes("English")) return "English";
  if (adName.includes("Baptism")) return "Baptism";
  if (adName.includes("Prayer")) return "Prayer";
  if (adName.includes("Famil")) return "Families";
  if (adName.includes("BoM")) return "Book of Mormon";
  if (adName.includes("Event")) return "Event";
  return "Other"; // Or adName??
}

const isSpanish = (targeting) =>
  Boolean(
    targeting.locales &&
      targeting.locales.find((locale) => locale === 23 || locale === 7)
  );

export default {
  data() {
    return {
      loading: false,
      adInfo: [],
      FB,
    };
  },
  methods: {
    async downloadData() {
      this.loading = true;

      const AD_ACCOUNTS = [
        "act_439329213748764", // Current
        "act_1313624522157797", // Old
        "act_596528517690671", // WY
      ];

      this.adInfo = [];
      for (const accountId of AD_ACCOUNTS) {
        const { data } = await FB.get(
          `/${accountId}/ads?fields=name,` +
            "creative.fields(id,title,effective_object_story_id,actor_id)," +
            "campaign.fields(objective)," +
            "adset.fields(targeting)," +
            "insights.fields(ad_id,reach,impressions,actions,spend,objective).date_preset(maximum)" +
            '&filtering=[{field:"ad.impressions",operator:"GREATER_THAN",value:0}]&limit=1000'
        );
        console.log(data);

        const accountAds = data.map((ad) => {
          return {
            "Ad ID": ad.id,
            "Post Permalink": genPermalink(ad),
            Objective: ad.campaign.objective,
            "Page ID": ad.creative.actor_id,
            Page: ID_TO_PAGE[ad.creative.actor_id],
            "Audience Type": audienceType(ad.adset.targeting),
            "Ad Name": ad.name,
            "Ad Category": adCategory(ad.name),
            "Creative ID": ad.creative.id,
            "Spanish?": isSpanish(ad.adset.targeting).toString().toUpperCase(),
            Reach: Number(ad.insights.data[0].reach),
            Frequency: (
              Number(ad.insights.data[0].impressions) /
              Number(ad.insights.data[0].reach)
            ).toFixed(2),
            "Amount Spent": Number(ad.insights.data[0].spend),
            Results: results(ad.insights.data[0]),
            Engagement: getAction(ad.insights.data[0].actions)(
              "post_engagement"
            ),
          };
        });

        this.adInfo.push(...accountAds);
      }

      const csvAdInfo = Papa.unparse(this.adInfo, { header: true });
      fileDownload(csvAdInfo, `ad_info_${dateToday()}.csv`);

      this.loading = false;
    },
  },
};
</script>