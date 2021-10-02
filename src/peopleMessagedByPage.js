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
    people.push(conversation.participants.data[0])
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
      const url = `/me/conversations/?limit=499&fields=participants&folder=${folder}&access_token=${accessToken}`;
      return processPage(url, people);
    })
  );

  return people;
}

export async function peopleMessagedByPage() {
  const tokens = await getTokens();

  return (
    await Promise.all(
      tokens.map(async ({ access_token, name, id }) => {
        const people = await getPeopleForPage(access_token);
        people.forEach((person) => {
          person.page = name;
          person.pageId = id;
        });
        return people;
      })
    )
  ).flat();

  // const distinct = [];
  // return allMessages.filter((currentMessage) => {
  //   // de-duplicate messages
  //   if (
  //     distinct.find(
  //       (message) =>
  //         message.id === currentMessage.id &&
  //         message.pageId === currentMessage.pageId
  //     )
  //   ) {
  //     return false;
  //   }

  //   distinct.push(currentMessage);
  //   return true;
  // });
}
