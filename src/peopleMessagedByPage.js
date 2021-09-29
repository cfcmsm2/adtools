/**
 * Area Book Lookalike Audience:
 *
 * Get conversations
 * Map Area Book name to FB person name
 *
 */

import { FB } from "./FB";

/** PEOPLE MESSAGED BY PAGE */
function getTokens() {
  return FB.get("/me/accounts?fields=access_token,name&limit=100").then(
    ({ data }) => data
  );
}

function processPage(url, names) {
  return FB.get(url).then(({ data, paging }) => {
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

export async function peopleMessagedByPage() {
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
