<script setup>
</script>

<template>
  <div class="card">
    <h1>⛅ Meatballs</h1>
    <h2>Weather based recommendations for entertainment and transportation</h2>

    <input type="text" v-model="zipcode" placeholder="ZIP code" minlength="5" maxlength="5" required><br />
    <button type="button" @click="printZipCode()">Let's go</button>
  </div>
</template>

<style scoped>

</style>

<script>
export default {
  data() {
    return {
      zipcode: ''
    };
  },
  methods: {
    printZipCode() {
      console.log(this.zipcode);
      // You can do whatever you want with the value here
    }
  }
}
</script>
