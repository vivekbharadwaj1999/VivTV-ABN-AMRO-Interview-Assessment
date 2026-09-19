<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { getCast } from '../api/tvmaze'
import type { CastMember } from '../types/showDetails'

const props = defineProps<{ showId: number }>()
const cast = ref<CastMember[]>([])
const isLoading = ref(true)
const error = ref('')
const failedImages = ref<number[]>([])
const controller = new AbortController()

// Fetch main cast independently of the overview. Failure gives this section its own
// retry action, while cancellation on unmount is ignored instead of shown as an error.
async function loadCast() {
  isLoading.value = true
  error.value = ''
  try {
    cast.value = await getCast(props.showId, controller.signal)
  } catch {
    if (!controller.signal.aborted) error.value = 'Cast couldn’t be loaded. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadCast)
onUnmounted(() => controller.abort())
</script>

<!-- Show request states before rendering cast portraits. -->
<template>
  <p v-if="isLoading" role="status">Loading cast…</p>
  <div v-else-if="error" role="alert">
    <p>{{ error }}</p>
    <button class="section-retry" type="button" @click="loadCast">Retry cast</button>
  </div>
  <p v-else-if="!cast.length">No cast information is available yet.</p>
  <div v-else>
    <h2>Main cast</h2>
    <!-- Actor and character IDs distinguish multiple roles played by one person.
         Failed photos are tracked by actor ID so their other entries share the fallback. -->
    <ul class="cast-grid">
      <li v-for="member in cast" :key="`${member.person.id}-${member.character.id}`">
        <div class="cast-photo">
          <img v-if="member.person.image && !failedImages.includes(member.person.id)" :src="member.person.image.medium" alt="" loading="lazy" width="210" height="295" @error="failedImages.push(member.person.id)" />
          <span v-else>Photo unavailable</span>
        </div>
        <h3>{{ member.person.name }}</h3>
        <p>{{ member.character.name }}</p>
      </li>
    </ul>
  </div>
</template>

<style scoped>
/* The cast grid adjusts to the available width without fixed column counts. */
h2 { margin: 0 0 1.5rem; font-size: 1.4rem; }
.cast-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 1.75rem 1.25rem; padding: 0; list-style: none; }
.cast-photo { display: grid; place-items: center; aspect-ratio: 210 / 295; overflow: hidden; border-radius: 6px; background: #252525; color: var(--muted); font-size: 0.8125rem; }
img { width: 100%; height: 100%; object-fit: cover; }
h3 { margin: 0.75rem 0 0.25rem; font-size: 0.95rem; }
p { margin: 0; color: var(--muted); font-size: 0.875rem; }
@media (max-width: 400px) {
  .cast-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
