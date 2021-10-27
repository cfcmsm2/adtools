<template>
  <div>
    <a
      href="https://areabook.churchofjesuschrist.org/services/mission/24723"
      target="_blank"
      >Full Data</a
    >
    <form action="" class="pure-form pure-form-stacked">
      <select v-model="selectedZone">
        <option value="">Select a zone...</option>
        <option v-for="zone in zones" :key="zone">{{ zone }}</option>
      </select>

      <label v-for="area in zoneAreas" :key="area.id">
        <input type="checkbox" v-model="showArea[area.id]" />
        {{ area.name }}
      </label>
    </form>

    <h2>Area Emails</h2>
    <ul>
      <li v-for="area in selectedAreas" :key="area.id">
        {{ area.email }}
      </li>
    </ul>

    <hr />

    <h2>Names</h2>
    <div><strong>For </strong>{{ missionaryNames.join(",") }}</div>

    <ul>
      <li v-for="fullName in fullNames" :key="fullName">
        {{ fullName }}
      </li>
    </ul>

    <hr />

    <h2>Area Phone Numbers</h2>
    <ul>
      <li v-for="area in selectedAreas" :key="area.id">
        {{ area.areaNumbers && area.areaNumbers.join(", ") }}
      </li>
    </ul>
  </div>
</template>

<script>
import Vue from "vue";
import { MISSION_ID } from "../config";
import { abAPIGet } from "../areaBookApi";

export default {
  data() {
    return {
      mission: null,
      selectedZone: "",
      showArea: {},
    };
  },
  computed: {
    zones() {
      return this.mission ? this.mission.children.map((zone) => zone.name) : [];
    },
    zoneAreas() {
      if (!this.mission || !this.selectedZone) return null;

      let areas = this.mission.children
        .find((zone) => zone.name === this.selectedZone)
        .children.map((district) => district.children)
        .flat();

      // eslint-disable-next-line vue/no-side-effects-in-computed-properties
      this.showArea = {};
      areas.forEach(({ id }) => Vue.set(this.showArea, id, true));

      return areas;
    },
    selectedAreas() {
      if (!this.selectedZone) return [];

      let areaIds = Object.keys(this.showArea).filter(
        (area) => this.showArea[area]
      );

      return areaIds.map((areaId) =>
        this.zoneAreas.find((area) => area.id.toString() === areaId)
      );
    },
    missionaryNames() {
      return this.selectedAreas
        .map((area) => area.missionaries.map(this.missionaryToName))
        .flat();
    },
    fullNames() {
      return this.selectedAreas
        .map((area) =>
          area.missionaries.map(
            (missionary) => missionary.firstName + " " + missionary.lastName
          )
        )
        .flat();
    },
  },
  methods: {
    missionaryToName(missionary) {
      let title = missionary.genderCode === "M" ? "Elder" : "Sister";
      if (missionary.genderCode === "F" && missionary.langId === 2) {
        title = "Hermana"; // This is important
      }

      return `${title} ${missionary.lastName}`;
    },
  },
  async created() {
    this.mission = (await abAPIGet(`/mission/${MISSION_ID}`)).mission;
  },
};
</script>