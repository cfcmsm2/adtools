<template>
  <div>
    <h1>Ad Stats</h1>
    <FBLogin>
      <button
        class="pure-button pure-button-primary"
        @click="downloadData"
        :disabled="loading"
      >
        {{ !loading ? "Download" : "Loading..." }}
      </button>
      <pre v-if="adInfo">{{ JSON.stringify(adInfo, null, 2) }}</pre>
    </FBLogin>
  </div>
</template>

<script>
import Papa from "papaparse";
import fileDownload from "js-file-download";

import { FB } from "../FB";
import FBLogin from "./FBLogin";
import { ID_TO_PAGE, AD_ACCOUNTS } from "../config.json";

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

function wait(seconds) {
  return new Promise((resolve) => setTimeout(seconds * 1000, resolve));
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
  return "Other";
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

      this.adInfo = [];
      for (const accountId of AD_ACCOUNTS) {
        const { data } = await FB.get(
          `/${accountId}/ads?fields=name,` +
            "creative.fields(id,title,effective_object_story_id,image_hash,asset_feed_spec,video_id,actor_id)," +
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
            "Creative ID":
              ad.creative.image_hash ||
              (ad.creative.asset_feed_spec &&
                ad.creative.asset_feed_spec.images &&
                ad.creative.asset_feed_spec.images[0].hash) ||
              ad.creative.video_id ||
              ad.creative.id,
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

        wait(10); // FB rate limits us when we get too much data too quickly
      }

      const csvAdInfo = Papa.unparse(this.adInfo, { header: true });
      fileDownload(csvAdInfo, `ad_info_${dateToday()}.csv`);

      this.loading = false;
    },
  },
  components: { FBLogin },
};
</script>