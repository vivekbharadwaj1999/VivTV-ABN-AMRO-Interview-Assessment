<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { searchShows } from '../api/tvmaze'
import type { Show } from '../types/show'
import ShowCard from './ShowCard.vue'

const props = defineProps<{ query: string }>()
const submitted = ref('')
const results = ref<Show[]>([])
const loading = ref(false)
const error = ref('')
let controller: AbortController | undefined

// Cancel any pending search before removing its results.
function clear() {
  controller?.abort()
  submitted.value = ''
  results.value = []
  error.value = ''
  loading.value = false
}

// Each submission owns its request so a slow response cannot replace newer results.
async function search() {
  controller?.abort()
  const term = props.query.trim()
  if (!term) { clear(); return }
  const request = new AbortController()
  controller = request
  submitted.value = term
  loading.value = true
  error.value = ''
  results.value = []
  try {
    const shows = await searchShows(term, request.signal)
    if (!request.signal.aborted) results.value = shows
  } catch {
    if (!request.signal.aborted) error.value = 'Search is unavailable. Please try again.'
  } finally {
    if (!request.signal.aborted) loading.value = false
  }
}
onBeforeUnmount(() => controller?.abort())
watch(() => props.query, search, { immediate: true })
</script>

<!-- Only submitted searches occupy space above the dashboard. -->
<template>
  <section v-if="submitted" id="search" class="search-section" aria-label="Search results">
    <div aria-live="polite" :aria-busy="loading">
      <p v-if="loading" role="status">Searching for “{{ submitted }}”…</p>
      <div v-else-if="error" role="alert">{{ error }} <button class="section-retry" @click="search">Retry search</button></div>
      <template v-else-if="submitted">
        <h3>Results for “{{ submitted }}”</h3>
        <p v-if="!results.length">No shows found. Try another title.</p>
        <p v-else>{{ results.length }} matches · Best matches first</p>
      </template>
    </div>
    <ul v-if="results.length" class="search-results">
      <li v-for="show in results" :key="show.id"><ShowCard :show="show" /></li>
    </ul>
  </section>
</template>

<style scoped>
/* Search matches use a wrapping grid rather than the catalogue's horizontal rows. */
.search-section { padding-block: 2rem 1rem; scroll-margin-top: 1rem; }
.search-results { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.25rem; padding: 0; list-style: none; }
li { min-width: 0; }
@media (max-width: 600px) { .search-results { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; } }
</style>
