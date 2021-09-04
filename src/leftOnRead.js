function get(url) {
  return fetch(url).then((res) => res.json());
}

function processConvos(convos) {
  return convos
    .filter((convo) => convo.can_reply)
    .map((convo) => ({
      name: convo.participants.data[0].name,
      id: convo.id
    }));
}

function processPage(url, convos) {
  return get(url).then(({ data, paging }) => {
    convos.push(...processConvos(data));

    if (paging && paging.next) {
      console.info("Getting next page");
      return processPage(paging.next, convos);
    }
  });
}

function getConvos(accessToken) {
  const convos = [];

  const url = `https://graph.facebook.com/v10.0/me/conversations/?limit=499&fields=participants,can_reply&folder=inbox&access_token=${accessToken}`;
  return processPage(url, convos).then(() => convos);
}

function leftOnRead(messageId, page) {
  return get(
    `https://graph.facebook.com/v10.0/${messageId}/messages?fields=from&limit=5499&access_token=${page.access_token}`
  ).then(({ data }) => data[0].from.name !== page.name);
}

const pages = [];

Promise.all(
  pages.map((page) =>
    getConvos(page.access_token)
      .then((people) =>
        Promise.all(
          people.map((person) => {
            return leftOnRead(person.id, page).then((isLOR) => ({
              ...person,
              lor: isLOR
            }));
          })
        )
      )
      .then((peeps) =>
        console.log(
          page.name,
          peeps.filter((person) => person.lor)
        )
      )
  )
);
