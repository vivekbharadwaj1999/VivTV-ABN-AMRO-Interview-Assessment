<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { searchShows } from '../api/tvmaze'
import type { Show } from '../types/show'
import ShowCard from './ShowCard.vue'

const props = defineProps<{ query: string }>()
// The parent passes submitted text, not each input keystroke. Keep the displayed term
// alongside its results so the loading message and heading describe the same search.
const submitted = ref('')
const results = ref<Show[]>([])
const loading = ref(false)
const error = ref('')
let controller: AbortController | undefined

// Closing or clearing search cancels pending work too, so a late response cannot
// bring old results back after the search interface has been dismissed.
function clear() {
  controller?.abort()
  submitted.value = ''
  results.value = []
  error.value = ''
  loading.value = false
}

// Clear the previous results and start a request for the trimmed query. Each call
// keeps its own controller so it can tell whether a newer search has replaced it.
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
    // Fetch may already be resolving when cancellation happens. Check again before
    // writing results so an older search cannot overwrite a newer one.
    if (!request.signal.aborted) results.value = shows
  } catch {
    if (!request.signal.aborted) error.value = 'Search is unavailable. Please try again.'
  } finally {
    // An older request must not turn off the spinner belonging to the newer request.
    if (!request.signal.aborted) loading.value = false
  }
}
onBeforeUnmount(() => controller?.abort())
// Handle an initial query and later submissions. Retry calls search directly because
// passing the same prop value does not trigger this watcher again.
watch(() => props.query, search, { immediate: true })
</script>

<!-- Only submitted searches occupy space above the dashboard. -->
<template>
  <section v-if="submitted" id="search" class="search-section" aria-label="Search results">
    <div aria-live="polite" :aria-busy="loading">
      <!-- No matches appears only after loading finishes, not while results are being
           cleared for a new request. The live region announces status without moving focus. -->
      <p v-if="loading" role="status">Searching for “{{ submitted }}”…</p>
      <div v-else-if="error" role="alert">{{ error }} <button class="section-retry" @click="search">Retry search</button></div>
      <template v-else-if="submitted">
        <h3>Results for “{{ submitted }}”</h3>
        <p v-if="!results.length">No shows found. Try another title.</p>
        <p v-else>{{ results.length }} matches · Best matches first</p>
      </template>
    </div>
    <ul v-if="results.length" class="search-results">
      <!-- Preserve API relevance order and reuse the catalogue card navigation. -->
      <li v-for="show in results" :key="show.id"><ShowCard :show="show" /></li>
    </ul>
  </section>
</template>

<style scoped>
/* Fit as many columns as possible with a 160px minimum card width. Phones use two
   equal columns so results can be scanned vertically without another scrolling row. */
.search-section { padding-block: 2rem 1rem; scroll-margin-top: 1rem; }
.search-results { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 1.25rem; padding: 0; list-style: none; }
li { min-width: 0; }
@media (max-width: 600px) { .search-results { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; } }
</style>
