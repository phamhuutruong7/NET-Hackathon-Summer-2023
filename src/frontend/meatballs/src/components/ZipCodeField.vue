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
export default {
  data() {
    return {
      zipcode: '',
      recommendations: ''
    };
  },
  methods: {
    fetchRecommendations() {
      fetch(`/Weather/recommendations?zipCode=${this.zipcode}`)
        .then(response => {
          if (response.ok) {
            return response.text
          } else {
            throw new Error('Could not fetch recommendations')
          }
        }).then(
          response => {
            this.recommendations = response
          }
        )
        .catch(error => {
          this.recommendations = error
        });
    }
  }
}
</script>
