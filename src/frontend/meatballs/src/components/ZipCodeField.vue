<script setup>
</script>

<template>
  <div class="card">
    <h1>⛅ Meatballs</h1>
    <h2>Weather based recommendations for entertainment and transportation</h2>

    <input type="text" v-model="zipcode" placeholder="ZIP code" minlength="5" maxlength="5" required><br />
    <button type="button" @click="fetchRecommendations()">Let's go</button>

    <div>{{ recommendations }}</div>
  </div>
</template>

<style scoped>

</style>

<script>
import axios from 'axios'
export default {
  data() {
    return {
      zipcode: '',
      recommendations: ''
    };
  },
  methods: {
    fetchRecommendations() {
      axios
      .get(`https://localhost:7132/Weather/recommendations?zipCode=${this.zipcode}`)
      .then(response => {
        this.recommendations = response.data
      })
      .catch(error => {
        this.recommendations = "Something went wrong. Please try again later-";
      })
    }
  }
}
</script>
