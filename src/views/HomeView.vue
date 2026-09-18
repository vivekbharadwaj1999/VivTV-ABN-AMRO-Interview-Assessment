<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import { getShows } from '../api/tvmaze'
import GenreRow from '../components/GenreRow.vue'
import ShowSearch from '../components/ShowSearch.vue'
import type { Show } from '../types/show'
import { groupShowsByGenre } from '../utils/groupShows'
import { pickFeatured, topRated } from '../utils/discovery'
import { recentShows } from '../utils/recentShows'
import { firstSummarySentence } from '../utils/summary'

const shows = ref<Show[]>([])
defineProps<{ searchTerm?: string }>()
const emit = defineEmits<{ 'genres-loaded': [genres: string[]] }>()
const isLoading = ref(true)
const error = ref('')
const featuredImageFailed = ref(false)
const genreGroups = computed(() => groupShowsByGenre(shows.value))

const topPicks = computed(() => topRated(shows.value))
const featuredShow = ref<Show | null>(null)
const featuredDescription = computed(() => firstSummarySentence(featuredShow.value?.summary))

// Choose the banner once per catalogue load, not on every reactive update.
async function loadShows() {
  isLoading.value = true
  error.value = ''
  featuredImageFailed.value = false

  try {
    shows.value = await getShows()
    let previousId: number | null = null
    try { previousId = Number(localStorage.getItem('tv-explorer-last-featured')) } catch { /* Storage is optional. */ }
    featuredShow.value = pickFeatured(topPicks.value, previousId)
    try {
      if (featuredShow.value) localStorage.setItem('tv-explorer-last-featured', String(featuredShow.value.id))
    } catch { /* The banner still works without storage. */ }
    emit('genres-loaded', groupShowsByGenre(shows.value).map(group => group.genre))
  } catch {
    error.value = 'We couldn’t load the shows. Check your connection and try again.'
  } finally {
    isLoading.value = false
  }
}

onMounted(loadShows)
</script>

<!-- Discovery rows remain mounted underneath the nested show modal. -->
<template>
  <ShowSearch :query="searchTerm || ''" />
  <section v-if="featuredShow && !error" class="featured" :class="{ 'has-poster': featuredShow.image && !featuredImageFailed }" aria-labelledby="featured-title">
    <img
      v-if="featuredShow.image && !featuredImageFailed"
      class="featured-backdrop"
      :src="featuredShow.image?.original"
      alt=""
      aria-hidden="true"
    />
    <div class="featured-copy">
      <p class="eyebrow"><span class="feature-marker" aria-hidden="true"></span> TONIGHT’S INSPIRATION</p>
      <h1 id="featured-title">{{ featuredShow.name }}</h1>
      <p class="featured-meta">
        <span v-if="featuredShow.rating.average !== null" class="featured-rating">★ {{ featuredShow.rating.average.toFixed(1) }} / 10</span>
        <span v-if="featuredShow.premiered">{{ featuredShow.premiered.slice(0, 4) }}</span>
      </p>
      <p class="featured-genres">{{ featuredShow.genres.join(' · ') }}</p>
      <p v-if="featuredDescription" class="featured-description">{{ featuredDescription }}</p>
      <RouterLink class="browse-link" :to="{ name: 'show', params: { id: featuredShow.id } }">More details</RouterLink>
    </div>
    <img
      v-if="featuredShow.image && !featuredImageFailed"
      class="featured-poster"
      :src="featuredShow.image?.original"
      :alt="featuredShow.name + ' poster'"
      width="210"
      height="295"
      fetchpriority="high"
      @error="featuredImageFailed = true"
    />
  </section>

  <section id="genres" class="collection" aria-label="Show collections" :aria-busy="isLoading">
    <p v-if="isLoading" class="status-panel" role="status">Loading your next watch…</p>
    <div v-else-if="error" class="status-panel" role="alert">
      <p>{{ error }}</p>
      <button class="retry-button" type="button" @click="loadShows">Try again</button>
    </div>
    <p v-else-if="!genreGroups.length" class="status-panel" role="status">No shows to explore right now. Please check back later.</p>
    <template v-else>
      <GenreRow v-if="recentShows.length" genre="Previously watched" :shows="recentShows" hide-count />
      <GenreRow v-if="topPicks.length" genre="Top picks for you" :shows="topPicks" ranked hide-count />
      <GenreRow v-for="group in genreGroups" :key="group.genre" :genre="group.genre" :shows="group.shows" />
    </template>
  </section>
  <RouterView />
</template>

<style scoped>
/* Component layout and responsive states. */
.featured {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(170px, 30%);
  align-items: center;
  gap: 2rem;
  min-height: 360px;
  margin-top: 1.5rem;
  padding: clamp(1.5rem, 4vw, 4rem);
  border: 1px solid #ffffff12;
  border-radius: 12px;
  background: #201b1b;
}

.featured::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: linear-gradient(90deg, #121212fa 0%, #121212de 45%, #12121240 100%);
}

.featured-backdrop {
  position: absolute;
  inset: 0;
  z-index: -2;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 30%;
  filter: blur(18px);
  opacity: 0.55;
}

.featured-copy {
  max-width: 680px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.feature-marker {
  width: 3px;
  height: 1rem;
  background: var(--accent);
}

h1 {
  margin: 1rem 0;
  font-size: clamp(2.25rem, 5vw, 4.75rem);
  line-height: 1.05;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.featured-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.875rem;
  font-weight: 700;
}

.featured-rating {
  color: #ffd479;
}

.featured-genres {
  color: #ededed;
  font-size: 0.875rem;
}

.featured-description {
  color: #ccc;
  font-size: 1rem;
}

.browse-link, .retry-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  min-height: 44px;
  padding: 0.7rem 1.25rem;
  border: 0;
  border-radius: 5px;
  background: #f5f5f1;
  color: #141414;
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
}

.browse-link {
  margin-top: 0.5rem;
}

.browse-link:hover, .retry-button:hover {
  background: #d8d8d8;
}

.featured-poster {
  justify-self: center;
  width: auto;
  max-width: 100%;
  height: clamp(250px, 26vw, 350px);
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 12px 35px #0008;
}

.collection {
  padding-top: 2rem;
  scroll-margin-top: 1rem;
}

.status-panel {
  margin: 2rem 0;
  padding: 2rem;
  border: 1px solid #ffffff20;
  border-radius: 8px;
  background: #202020;
  color: #ddd;
}

.status-panel p {
  margin-top: 0;
}

@media (max-width: 600px) {
  .featured {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.8rem;
    min-height: 280px;
    margin-top: 1rem;
    padding: 1.25rem;
  }

  /* Keep the poster beside the heading, leaving the description the full row. */
  .featured.has-poster {
    grid-template-columns: minmax(0, 1fr) 110px;
  }

  .featured-copy {
    display: contents;
  }

  .featured-poster {
    grid-column: 2;
    grid-row: 2 / 5;
    align-self: start;
    width: 110px;
    height: auto;
  }

  h1 {
    grid-column: 1;
    grid-row: 2;
    margin: 0;
    font-size: clamp(1.8rem, 7.5vw, 2.7rem);
    overflow-wrap: anywhere;
  }

  .eyebrow {
    grid-column: 1 / -1;
    grid-row: 1;
    font-size: 0.75rem;
    letter-spacing: 0.04em;
  }

  .featured-description {
    grid-column: 1 / -1;
    grid-row: 5;
    margin: 1.2rem 0 0;
    display: block;
    font-size: 0.9375rem;
  }

  .featured-meta {
    grid-column: 1;
    grid-row: 3;
    margin: 0;
    gap: 0.4rem 0.75rem;
  }

  .featured-genres {
    grid-column: 1;
    grid-row: 4;
    margin: 0;
  }

  .browse-link {
    grid-column: 1 / -1;
    grid-row: 6;
    justify-self: start;
    padding-inline: 0.9rem;
    gap: 0.7rem;
    font-size: 0.875rem;
  }

  .collection {
    padding-top: 1.5rem;
  }
}

@media (orientation: landscape) and (max-height: 550px) {
  .featured {
    min-height: 220px;
    padding-block: 1.25rem;
    margin-top: 1rem;
  }

  .featured-poster {
    height: 190px;
    width: auto;
  }

  h1 {
    font-size: 2.25rem;
  }

  .featured-description {
    display: block;
  }
}
</style>
