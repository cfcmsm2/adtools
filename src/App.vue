<template>
  <main id="app">
    <div class="pure-menu pure-menu-horizontal">
      <ul class="pure-menu-list">
        <router-link to="/sheets" v-slot="{ href, navigate, isActive }" custom>
          <li :class="['pure-menu-item', isActive && 'pure-menu-selected']">
            <a class="pure-menu-link" :href="href" @click="navigate">Sheets</a>
          </li>
        </router-link>
        <router-link to="/vibes" v-slot="{ href, navigate, isActive }" custom>
          <li :class="['pure-menu-item', isActive && 'pure-menu-selected']">
            <a class="pure-menu-link" :href="href" @click="navigate">Vibes</a>
          </li>
        </router-link>
        <router-link to="/emails" v-slot="{ href, navigate, isActive }" custom>
          <li :class="['pure-menu-item', isActive && 'pure-menu-selected']">
            <a class="pure-menu-link" :href="href" @click="navigate">Emails</a>
          </li>
        </router-link>
        <router-link to="/stats" v-slot="{ href, navigate, isActive }" custom>
          <li :class="['pure-menu-item', isActive && 'pure-menu-selected']">
            <a class="pure-menu-link" :href="href" @click="navigate">Stats</a>
          </li>
        </router-link>
      </ul>
    </div>

    <router-view></router-view>
  </main>
</template>

<script>
export default {
  name: "App",
};
</script>

<style scoped>
.pure-menu-item {
  height: auto;
}
</style>