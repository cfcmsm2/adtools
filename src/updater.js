import { abAPIGet, personInfo, lessonInfo, getProgress } from "./areaBookApi";
import * as Papa from "papaparse";

const NAME = "Name";
const ABP_LINK = "ABP Link";
const FIRST_LESSON = "First Lesson";
const PERCENT_PRINCIPLES_TAUGHT = "% Principles";
const CHURCH = "Attended Church";
const CHURCH_TIMES = "Times Attended";
const ON_DATE = "Put On Date?";
const BAPTIZED = "Baptized";
const DROPPED = "Dropped";

const NUM_PRINCIPLES = 44;

let _cache = null;
async function getPrinciplesAndCommitments() {
  if (_cache) return _cache;

  let principles = await abAPIGet("/progress/principles").then((principles) =>
    principles
      .map((item) => item.principles)
      .flat()
      .map((principle) => principle.id)
  );
  let commitments = await abAPIGet(
    "/progress/commitments"
  ).then((commitments) => commitments.map((commitment) => commitment.id));

  _cache = { principles, commitments };
  return _cache;
}

async function isNewPerson(timeline, personId) {
  const teachingEventIds = timeline
    .filter(
      (event) =>
        event.timelineItemType === "TEACHING" && event.eventStatus === true
    )
    .map((event) => event.eventGuid);

  const teachingEvents = await Promise.all(teachingEventIds.map(lessonInfo));
  teachingEvents.reverse(); // order chronologically first to last

  let principle = false;
  let commitment = false;
  const { principles, commitments } = await getPrinciplesAndCommitments();

  const npEvent = teachingEvents.find((teachingEvent) => {
    const eventPerson = teachingEvent.personEvents.find(
      (person) => person.personId === personId
    );

    if (!eventPerson) {
      console.error("No event person!!");
      return false;
    }

    const personEventItems = eventPerson.personEventItems.map(
      (item) => item.teachingItemId
    );

    principle =
      principle ||
      personEventItems.find((itemId) => principles.includes(itemId));
    commitment =
      commitment ||
      personEventItems.find((itemId) => commitments.includes(itemId));

    return principle && commitment;
  });

  if (npEvent) {
    return formatDate(npEvent.endDate);
  }

  return "";
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US");
}

async function getInfo(oldPerson) {
  let personId = oldPerson[ABP_LINK].split("/")[4].trim();
  let dropped = false;

  const { person } = await personInfo(personId);

  oldPerson[NAME] = `${person.firstName || ""} ${person.lastName || ""}`;

  if (person.principleSummary) {
    // if they've been taught principles
    oldPerson[PERCENT_PRINCIPLES_TAUGHT] = Math.floor(
      (person.principleSummary.length / NUM_PRINCIPLES) * 100
    );
  } else {
    oldPerson[PERCENT_PRINCIPLES_TAUGHT] = 0;
  }
  oldPerson[ON_DATE] = person.scheduledBaptism ? "On Date" : oldPerson[ON_DATE];
  oldPerson[BAPTIZED] = person.baptismDate
    ? formatDate(person.baptismDate)
    : "";
  dropped = person.status > 10 || ""; // https://areabook.churchofjesuschrist.org/services/config?lang=eng

  const progress = await getProgress(personId);

  let sacInfo = progress.filter(
    (item) => item.timelineItemType === "SACRAMENT"
  );
  if (sacInfo.length) {
    oldPerson[CHURCH] = formatDate(sacInfo[sacInfo.length - 1].itemDate);
  } else {
    oldPerson[CHURCH] = "";
  }

  if (dropped) {
    oldPerson[DROPPED] = formatDate(
      progress.find((item) => item.timelineItemType === "STOPPED_TEACHING")
        .itemDate
    );
  }

  oldPerson[CHURCH_TIMES] = sacInfo.length;

  let npDate;
  if (!oldPerson[FIRST_LESSON]) {
    npDate = await isNewPerson(progress, personId);
  } else {
    npDate = oldPerson[FIRST_LESSON];
  }

  oldPerson[FIRST_LESSON] = npDate;

  return oldPerson;
}

/**
 * @function getPeopleProgress - Update data on people from an "Indie Vibes" spreadsheet
 *
 * @param {String} allPeople
 *
 * @typedef {Object} getInfoResult
 * @property {Array<Object>} errors
 * @property {String} people
 *
 * @returns {Promise<getInfoResult>} updatedPeople - Copy/pasteable updated people data
 */
export function getPeopleProgress(allPeople) {
  const papaConfig = {
    header: true,
    delimiter: "\t"
  };
  const parsedPeople = Papa.parse(allPeople, papaConfig).data;

  const errors = [];
  return Promise.all(
    parsedPeople.map((person) =>
      getInfo(person).catch((err) => {
        errors.push({ link: person[ABP_LINK], error: err.toString() });
        return person;
      })
    )
  ).then((updatedPeople) => {
    return {
      people: Papa.unparse(updatedPeople, papaConfig),
      errors
    };
  });
}
