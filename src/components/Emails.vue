<template>
  <form action="" class="pure-form pure-form-stacked">
    <select v-model="selectedZone">
      <option value="">Select a zone...</option>
      <option v-for="zone in zones" :key="zone">{{ zone }}</option>
    </select>

    <label v-for="area in zoneAreas" :for="area.name" :key="area.id">
      <input type="checkbox" :id="area.id" v-model="showArea[area.id]" />
      {{ area.name }}
    </label>

    <h2>Area Emails</h2>
    <ul>
      <li v-for="email in emails" :key="email">
        {{ email }}
      </li>
    </ul>

    <h2>Names</h2>
    <div>
      {{ names.join(",") }}
    </div>
  </form>
</template>

<script>
import Vue from "vue";
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
    emails() {
      return this.selectedAreas.map((area) => area.email);
    },
    names() {
      return this.selectedAreas
        .map((area) => area.missionaries.map(this.missionaryToName))
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
    this.mission = (await abAPIGet("/mission/24723")).mission;
  },
};
</script>