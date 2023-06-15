<script setup>
import Recommendation from './Recommendation.vue';
</script>

<template>
  <div class="input-group mb-3" v-if="!loading">
    <input type="text" class="form-control" v-model="zipcode" placeholder="Please enter your ZIP code" minlength="5" maxlength="5" required>
    <button class="btn btn-primary" type="button" @click="fetchRecommendations()">Let's go</button>
  </div>

  <pulse-loader :loading="loading"></pulse-loader>

  <div class="container text-center">
    <div class="row align-items-center">
      <div class="col" v-for="item in recommendations">
        <Recommendation :text=item />
      </div>
    </div>
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
