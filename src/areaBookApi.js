export function abAPIGet(url) {
  const headers = new Headers({
    "Time-Zone": Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  return fetch("https://areabook.churchofjesuschrist.org/services" + url, {
    headers
  })
    .then((res) => res.json())
    .catch(console.error);
}

export function personInfo(personId) {
  return abAPIGet(`/people/${personId}`);
}

export function lessonInfo(lessonId) {
  return abAPIGet(`/progress/teaching/${lessonId}`);
}

export function getProgress(personId) {
  return abAPIGet(`/progress/timeline/${personId}`);
}
