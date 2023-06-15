<script setup>
import { getTransitionRawChildren } from 'vue';


defineProps({
  text: String,
})

</script>

<template>
  <div class="card" style="width: 18rem;">
    <div class="card-body">
      <h5 class="card-title">{{ getTitle() }}</h5>
      <p class="card-text">{{ text }}</p>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    getTitle() {
      if (this.text.indexOf(':') > 0 && this.text.indexOf(':') < 30) {
        return this.text.substr(0, this.text.indexOf(":"))
      }
      return ''
    }
  }
}
</script>
