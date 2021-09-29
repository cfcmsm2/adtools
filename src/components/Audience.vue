<template>
  <div>
    <h1>Hello World</h1>
    <FBLogin>
      <pre>{{ JSON.stringify(data, null, 2) }}</pre>
    </FBLogin>
  </div>
</template>

<script>
import { peopleMessagedByPage } from "../peopleMessagedByPage";
import FBLogin from "./FBLogin";

export default {
  data() {
    return {
      data: {},
    };
  },
  async mounted() {
    this.data = await peopleMessagedByPage();
  },
  components: { FBLogin },
};
</script>