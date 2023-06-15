<script setup>
</script>

<template>
  
  <div class="card">
    <h1>⛅ Meatballs</h1>
    <h2>Weather based recommendations for entertainment and transportation</h2>

    <input v-if="!loading" type="text" v-model="zipcode" placeholder="ZIP code" minlength="5" maxlength="5" required><br />
    <button v-if="!loading" type="button" @click="fetchRecommendations()">Let's go</button>

    <pulse-loader :loading="loading"></pulse-loader>

    <li v-for="item in recommendations">
      {{ item }}
    </li>
  </div>
</template>

<style scoped>

</style>

<script>
import axios from 'axios'
import PulseLoader from 'vue-spinner/src/PulseLoader.vue'
export default {
  components: {
    PulseLoader
  },
  data() {
    return {
      loading: false,
      zipcode: '',
      recommendations: []
    };
  },
  methods: {
    fetchRecommendations() {
      this.loading = true;
      this.recommendations = [];
      axios
      .get(`https://localhost:7132/Weather/recommendations?zipCode=${this.zipcode}`)
      .then(response => {
        this.loading = false;
        this.recommendations = response.data;
      })
      .catch(error => {
        this.loading = false;
        this.recommendations = ["Something went wrong. Please try again later."];
      })
    }
  }
}
</script>
