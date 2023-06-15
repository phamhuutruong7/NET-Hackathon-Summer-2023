<script setup>
import { ref } from 'vue'

const zipCode = ""
</script>

<template>
  <div class="card">
    <h1>⛅ Meatballs</h1>
    <h3>Weather recommendations</h3>

    <input type="text" id="zipcode" name="zipcode" placeholder="ZIP code" minlength="5" maxlength="5" required>
    <button type="button">Let's go</button>
  </div>
</template>

<style scoped>

</style>
