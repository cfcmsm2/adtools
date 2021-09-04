<template>
  <form action="" class="pure-form pure-form-stacked">
    <input
      type="file"
      accept=".json"
      multiple
      id="file-selector"
      @change="onFileUpdate"
    />
    <textarea placeholder="Output" v-model="output"></textarea>
  </form>
</template>

<script>
import Papa from "papaparse";
import { linkNameLookup } from "../assets/data.js";

async function readJSON(file) {
  const text = await new Response(file).text();
  return JSON.parse(text);
}

export default {
  data: function () {
    return {
      output: "",
    };
  },
  methods: {
    async onFileUpdate(event) {
      const fileList = Array.from(event.target.files);

      const contents = await Promise.all(fileList.map(readJSON));

      // CLEAN
      contents.forEach((part) => {
        Object.entries(part).forEach(([post, people]) => {
          if (people.length === 0) {
            delete part[post];
          }

          people.forEach((person) => {
            if (!person.href.includes("facebook")) {
              person.href = "https://facebook.com" + person.href;
            }
          });
        });
      });

      let merged = Object.assign({}, ...contents);

      let allPeople = [];
      Object.entries(merged).forEach(([post, people]) => {
        people.forEach((person) => {
          allPeople.push([
            person.name,
            person.href,
            post,
            linkNameLookup[post],
          ]);
        });
      });

      allPeople.sort((a, b) => {
        var nameA = a[0].toUpperCase();
        var nameB = b[0].toUpperCase();

        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      let result = Papa.unparse(allPeople, { header: false, delimiter: "\t" });
      this.output = result;
    },
  },
};
</script>