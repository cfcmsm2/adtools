import { FB } from "./FB";

/** PEOPLE MESSAGED BY PAGE */
function getTokens() {
  return FB.get("/me/accounts?fields=access_token,id,name&limit=100").then(
    ({ data }) => data
  );
}

async function processPage(url, people) {
  const { data, paging } = await FB.get(url);

  data.forEach((conversation) =>
    people.push({
      ...conversation.participants.data[0],
      link: "https://www.facebook.com/" + conversation.link
    })
  );

  if (paging && paging.next) {
    return processPage(paging.next, people);
  }
}

async function getPeopleForPage(accessToken) {
  const folders = ["page_done", "inbox", "other", "spam", "pending"];

  const people = [];

  await Promise.all(
    folders.map((folder) => {
      const url = `/me/conversations/?limit=499&fields=participants,link&folder=${folder}&access_token=${accessToken}`;
      return processPage(url, people);
    })
  );

  return people;
}

let cache = null;
export async function peopleMessagedByPage() {
  if (!cache) {
    const tokens = await getTokens();

    cache = (
      await Promise.all(
        tokens.map(async ({ access_token, name, id }) => {
          const people = await getPeopleForPage(access_token);
          return people.map((person) => ({
            name: person.name,
            psid: person.id,
            link: person.link,
            page: name,
            pageId: id
          }));
        })
      )
    ).flat();
  }
  console.log(cache);

  return cache;
}
