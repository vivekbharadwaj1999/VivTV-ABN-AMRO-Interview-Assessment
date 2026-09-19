<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { getEpisodes } from '../api/tvmaze'
import type { Episode } from '../types/showDetails'
import { summaryToText } from '../utils/summary'

const props = defineProps<{ showId: number }>()
const episodes = ref<Episode[]>([])
const selectedSeason = ref(1)
const isLoading = ref(true)
const error = ref('')
const failedImages = ref<number[]>([])
const controller = new AbortController()
// Both the selector and visible list derive from the fetched episodes. Changing the
// season filters locally rather than making another request.
const seasons = computed(() => [...new Set(episodes.value.map(episode => episode.season))].sort((a, b) => a - b))
const visibleEpisodes = computed(() => episodes.value.filter(episode => episode.season === selectedSeason.value))

// Fetch all episodes, including specials, and select the first available season.
// Errors and retry stay in this section so the overview and cast remain usable.
async function loadEpisodes() {
  isLoading.value = true
  error.value = ''
  try {
    episodes.value = await getEpisodes(props.showId, controller.signal)
    selectedSeason.value = seasons.value[0] ?? 1
  } catch {
    if (!controller.signal.aborted) error.value = 'Episodes couldn\'t be loaded. Please try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadEpisodes)
onUnmounted(() => controller.abort())
</script>

<!-- Keep the season selector and episode list together within the tab panel. -->
<template>
  <p v-if="isLoading" role="status">Loading episodes…</p>
  <div v-else-if="error" role="alert">
    <p>{{ error }}</p>
    <button class="section-retry" type="button" @click="loadEpisodes">Retry episodes</button>
  </div>
  <p v-else-if="!episodes.length">No episodes have been listed yet.</p>
  <div v-else>
    <div class="episode-heading">
      <h2>Episodes <span>{{ visibleEpisodes.length }}</span></h2>
      <label>Season
        <select v-model="selectedSeason">
          <option v-for="season in seasons" :key="season" :value="season">{{ season === 0 ? 'Specials' : `Season ${season}` }}</option>
        </select>
      </label>
    </div>
    <!-- Missing episode numbers are labelled as specials. Native details keeps each
         synopsis collapsed until requested, so browsing the list does not reveal spoilers. -->
    <ol class="episode-list">
      <li v-for="episode in visibleEpisodes" :key="episode.id" class="episode">
        <div class="episode-image">
          <img v-if="episode.image && !failedImages.includes(episode.id)" :src="episode.image.medium" alt="" loading="lazy" width="320" height="180" @error="failedImages.push(episode.id)" />
          <span v-else>No image available</span>
        </div>
        <div class="episode-copy">
          <div class="episode-title">
            <h3><span>{{ episode.number ?? 'Special' }}</span> {{ episode.name }}</h3>
            <span v-if="episode.runtime !== null" class="runtime">{{ episode.runtime }} min</span>
          </div>
          <p class="airdate">{{ episode.airdate || 'Air date to be announced' }}</p>
          <details v-if="episode.summary">
            <summary>Episode summary</summary>
            <p>{{ summaryToText(episode.summary) }}</p>
          </details>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
/* Episode thumbnails and descriptions stack on smaller screens. */
.episode-heading, .episode-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
}

.episode-heading {
  flex-wrap: wrap;
  margin-bottom: 1rem;
}

h2, h3 { margin: 0; }
h2 { font-size: 1.4rem; }
h2 span, h3 span { color: var(--muted); font-weight: 400; margin-right: 0.5rem; }
h2 span { font-size: 1rem; margin-left: 0.5rem; }
h3 { font-size: 1rem; }
label { display: flex; align-items: center; gap: 0.75rem; color: var(--muted); font-size: 0.875rem; }
select { appearance: none; min-height: 44px; padding: 0.6rem 2.75rem 0.6rem 1rem; border: 1px solid #555; border-radius: 8px; background: #232323 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='%23eeeeee' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 0.9rem center; color: #fff; font: inherit; cursor: pointer; }
.episode-list { padding: 0; margin: 0; list-style: none; }
.episode { display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 1.5rem; padding: 1.5rem 0; border-bottom: 1px solid #ffffff18; }
.episode-image { aspect-ratio: 16 / 9; align-self: start; display: grid; place-items: center; overflow: hidden; background: #252525; border-radius: 6px; color: var(--muted); font-size: 0.8125rem; }
img { width: 100%; height: 100%; object-fit: cover; }
.runtime { white-space: nowrap; font-size: 0.875rem; color: var(--muted); }
.airdate { color: var(--muted); font-size: 0.875rem; }
summary { cursor: pointer; width: fit-content; padding-block: 0.3rem; font-size: 0.875rem; }
details p { color: #ccc; line-height: 1.7; }
summary:hover { color: var(--accent); }
@media (max-width: 600px) {
  .episode { grid-template-columns: 100px minmax(0, 1fr); gap: 0.8rem; }
  .episode-title { flex-direction: column; gap: 0.3rem; }
}
</style>
