<template>
  <div>
    <form class="pure-form pure-form-stacked">
      <textarea
        placeholder="Indie Vibes"
        class="pure-input-1"
        ref="input"
        v-model="input"
      ></textarea>

      <button
        class="pure-button pure-button-primary"
        type="button"
        @click="updateProgress()"
      >
        Update
      </button>
      <a
        class="pure-button green-button"
        href="https://docs.google.com/spreadsheets/d/1JHXD2H3NJTg9pj5k6nWFSApdVj3-oZ-0VaEh6o9LNxI/edit#gid=2089927917"
        target="_blank"
      >
        Ad Info
      </a>
    </form>
    <pre v-if="errors && errors.length">
    {{ JSON.stringify(errors, null, 2) }}
  </pre
    >
  </div>
</template>

<script>
import { getPeopleProgress } from "../updater";

export default {
  data() {
    return {
      input: "",
      errors: null,
    };
  },
  methods: {
    async updateProgress() {
      const inputData = this.input;
      this.input = "Loading...";
      this.errors = null;

      const { people, errors } = await getPeopleProgress(inputData);
      this.input = people;
      this.errors = errors;

      this.$refs.input.focus();
      this.$refs.input.select();
    },
  },
};
</script>

<style scoped>
.green-button {
  background-color: #00D800;
  color: white;
  margin-left: 10px;
}
</style>