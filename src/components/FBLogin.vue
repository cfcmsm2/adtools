<template>
  <div>
    <button v-if="!FB.loggedIn" class="pure-button" @click="login()">
      Log in
    </button>

    <slot v-else></slot>
  </div>
</template>

<script>
import { FB } from "../FB";

export default {
  data() {
    return {
      FB,
    };
  },
  async mounted() {
    if (FB.loggedIn) {
      this.$emit("login");
    }
  },
  methods: {
    async login() {
      await FB.login();
      this.$emit("login");
    },
  },
};
</script>
