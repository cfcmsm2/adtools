<template>
  <div>
    <h1>Magic Audience</h1>

    <FBLogin>
      <form class="pure-form pure-form-stacked">
        <textarea
          placeholder="Indie Vibes Data"
          class="pure-input-1"
          v-model="vibes"
        ></textarea>

        <button
          class="pure-button pure-button-primary"
          type="button"
          @click="match()"
        >
          Match
        </button>
      </form>

      <hr />
      <h2>PSID finder</h2>
      <form
        class="pure-form pure-form-stacked"
        @submit.prevent="searchForPeople"
      >
        <input
          type="text"
          placeholder="Page ID"
          class="pure-input-1"
          v-model="search.pageId"
        />
        <input
          type="text"
          placeholder="Name"
          class="pure-input-1"
          v-model="search.name"
        />
        <button class="pure-button">Find Matches</button>
        <pre>{{ search.results }}</pre>
      </form>
    </FBLogin>
  </div>
</template>

<script>
import * as Papa from "papaparse";
import { FB } from "../FB";
import { peopleMessagedByPage } from "../peopleMessagedByPage";
import FBLogin from "./FBLogin";
import { distance } from "fastest-levenshtein";

const clean = (str) =>
  str
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const splitUp = (str) => [...new Set(str.split(/[\s-_()]/).map(clean))];

function isExactlyTheSame(a, b) {
  return clean(a) === clean(b);
}

const isSame = (fuzzy) => (a, b) => {
  const aParts = splitUp(a);
  const bParts = splitUp(b);

  let numSame = 0;
  aParts.forEach((aPart) => {
    if (!aPart.length) return;
    bParts.forEach((bPart) => {
      if (!bPart.length) return;

      if (fuzzy) {
        if (aPart === bPart) {
          numSame++;
        }
      } else {
        if (distance(aPart, bPart) <= 1) {
          numSame++;
        }
      }
    });
  });

  return numSame >= 2;
};

async function getPage(adId) {
  const adInfo = await FB.get(`/${adId}?fields=creative.fields(actor_id)`);
  return adInfo.creative.actor_id;
}

const AUDIENCE_ID = "23848716408360294";

export default {
  data() {
    return {
      vibes: "",
      search: {
        name: "",
        pageId: "",
        results: "",
      },
    };
  },
  methods: {
    async match() {
      const parsedVibes = Papa.parse(this.vibes, {
        header: true,
        delimiter: "\t",
      }).data;

      this.vibes = "Downloading Messages...";

      const messages = await peopleMessagedByPage();

      this.vibes = "Matching and Uploading...";
      const matches = await Promise.all(
        parsedVibes.map(async (abPerson) => {
          if (!abPerson || !abPerson["Name"] || !abPerson["Ad ID(s)"]) {
            return "";
          }

          if (abPerson["pageuid"]) {
            return abPerson["pageuid"];
          }
          const pageId = await getPage(abPerson["Ad ID(s)"].split(",")[0]);

          const messagesForPage = messages.filter(
            (message) => message.pageId === pageId
          );

          const potentialMatches = [
            isExactlyTheSame,
            isSame(false),
            isSame(true),
          ].map((matchingFunction) =>
            messagesForPage.filter((fbPerson) =>
              matchingFunction(abPerson["Name"], fbPerson.name)
            )
          );

          const bestMatch = potentialMatches.find(
            (matchGroup) => matchGroup.length === 1
          );

          if (!bestMatch) {
            console.warn("Failed to match name", abPerson["Name"]);
            console.warn(potentialMatches);
            return "";
          }

          return bestMatch[0].id;
        })
      );

      const matchedMessages = matches
        .map((matchPSID, i) => {
          if (!matchPSID) return null;

          const matchedMessage = messages.find(
            (person) => person.id === matchPSID
          );
          matchedMessage.value = Number(parsedVibes[i]["Points"]);
          return matchedMessage;
        })
        .filter((match) => match);

      const pagesWithMatches = Array.from(
        new Set(matchedMessages.map((match) => match.pageId))
      );
      // https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences/#PAGEUID
      const outputs = pagesWithMatches.map((pageId) => ({
        schema: ["PAGEUID", "LOOKALIKE_VALUE"],
        is_raw: true,
        page_ids: [pageId],
        data: matchedMessages
          .filter((match) => match.pageId === pageId)
          .map((match) => [match.id, match.value]),
      }));

      await Promise.all(
        outputs.map((payload) =>
          FB.post(`/${AUDIENCE_ID}/users`, { payload }).then(console.info)
        )
      );

      this.vibes = matches.join("\n");
    },

    async searchForPeople() {
      this.search.results = "Loading...";
      // TODO: save result
      const messages = await peopleMessagedByPage();
      const results = messages
        .filter((message) =>
          this.search.pageId ? message.pageId === this.search.pageId : true
        )
        .filter((message) =>
          clean(message.name).includes(clean(this.search.name))
        );
      this.search.results = JSON.stringify(results, null, 2);
    },
  },
  components: { FBLogin },
};
</script>