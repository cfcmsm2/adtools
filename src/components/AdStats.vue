<template>
  <div>
    <h1>Ad Stats</h1>
    <button
      class="pure-button pure-button-primary"
      @click="downloadData"
      :disabled="loading"
    >
      {{ !loading ? "Download" : "Loading..." }}
    </button>
    <pre v-if="adInfo">{{ JSON.stringify(adInfo, null, 2) }}</pre>
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

  if (targeting.interests) {
    return "INTEREST"; // TODO
  }

  return "BROAD";
}
function results(insightsData) {
  const objective = insightsData.objective;
  const action = (actionType) =>
    insightsData.actions.find((action) =>
      Number(action.action_type === actionType)
    ).value;

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

const isSpanish = (targeting) => !!targeting.locales;

export default {
  data() {
    return {
      loading: false,
      adInfo: null,
    };
  },
  methods: {
    async downloadData() {
      this.loading = true;

      const data = (
        await FB.get(
          "/act_439329213748764/ads?fields=creative.fields(title,body,image_hash,effective_object_story_id),name,adset.fields(targeting,promoted_object),insights.fields(ad_id,reach,impressions,actions,spend,objective).date_preset(maximum)&limit=1000"
        )
      ).data;
      console.log(data);
      const adInfo = data.map((ad) => {
        const adInfo = {
          "Ad ID": ad.id,
          "Post Permalink": genPermalink(ad),
          Objective: ad.insights && ad.insights.data[0].objective,
          "Page ID":
            ad.adset.promoted_object && ad.adset.promoted_object.page_id,
          Page:
            ad.adset.promoted_object &&
            ID_TO_PAGE[ad.adset.promoted_object.page_id],
          "Audience Type": audienceType(ad.adset.targeting),
          "Ad Name": ad.name,
          "Ad Category": adCategory(ad.name),
          "Image Hash": ad.creative && ad.creative.image_hash,
          "Spanish?": isSpanish(ad.adset.targeting),
          Reach: ad.insights && Number(ad.insights.data[0].reach),
          Frequency:
            ad.insights &&
            (
              Number(ad.insights.data[0].impressions) /
              Number(ad.insights.data[0].reach)
            ).toFixed(2),
          "Amount Spent": ad.insights && Number(ad.insights.data[0].spend),
          Results: ad.insights && results(ad.insights.data[0]),
        };

        try {
          adInfo.Engagement = Number(
            ad.insights.data[0].actions.find(
              (action) => action.action_type === "post_engagement"
            ).value
          );
        } catch (e) {
          adInfo.Engagement = 0;
        }
        return adInfo;
      });

      this.adInfo = adInfo;

      const csvAdInfo = Papa.unparse(adInfo, { header: true });
      fileDownload(csvAdInfo, "ad_info.csv");

      this.loading = false;
    },
  },
};
</script>