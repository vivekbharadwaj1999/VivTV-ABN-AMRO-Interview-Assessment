<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { getShowImages } from '../api/tvmaze'
import type { Show } from '../types/show'

const props = defineProps<{ show: Show }>()
const backdrop = ref('')
const posterFailed = ref(false)
const controller = new AbortController()

onMounted(async () => {
  try {
    const images = await getShowImages(props.show.id, controller.signal)
    const image = images.find(image => image.type === 'background')
      ?? images.find(image => image.type === 'banner')
    backdrop.value = image?.resolutions.original.url ?? ''
  } catch {
    // Artwork is optional; the show poster remains the fallback.
  }
})
onUnmounted(() => controller.abort())
</script>

<!-- Prefer landscape artwork, with a poster fallback when none is available. -->
<template>
  <header class="show-hero" :class="{ 'has-backdrop': backdrop }">
    <img v-if="backdrop" class="backdrop" :src="backdrop" alt="" @error="backdrop = ''" />
    <div class="hero-content">
      <div v-if="!backdrop" class="hero-poster">
        <img v-if="show.image && !posterFailed" :src="show.image.original" :alt="show.name + ' poster'" width="210" height="295" @error="posterFailed = true" />
        <span v-else>Poster unavailable</span>
      </div>
      <div class="hero-copy">
        <p class="eyebrow">VivTV / SERIES</p>
        <h1>{{ show.name }}</h1>
        <div class="hero-meta">
          <span class="rating">★ {{ show.rating.average?.toFixed(1) ?? 'Not rated' }}<span v-if="show.rating.average !== null"> / 10</span></span>
          <span v-if="show.premiered">{{ show.premiered.slice(0, 4) }}</span>
          <span v-if="show.status">{{ show.status }}</span>
          <span v-if="show.network || show.webChannel">{{ show.network?.name || show.webChannel?.name }}</span>
        </div>
        <p class="hero-genres">{{ show.genres.join(' · ') }}</p>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Layer a readable gradient over artwork, falling back to a portrait poster. */
.show-hero { position: relative; isolation: isolate; display: flex; align-items: end; min-height: 390px; overflow: hidden; border-radius: 10px 10px 0 0; background: #202020; }
.show-hero::after { position: absolute; inset: 0; z-index: -1; content: ''; background: linear-gradient(0deg, #141414 0%, #1414148c 65%, #14141420), linear-gradient(90deg, #141414b3, transparent); }
.backdrop { position: absolute; inset: 0; z-index: -2; width: 100%; height: 100%; object-fit: cover; object-position: center 30%; }
.hero-content { display: flex; align-items: end; gap: 2rem; width: 100%; padding: clamp(1.25rem, 4vw, 3rem); }
.hero-copy { max-width: 800px; min-width: 0; }
.hero-poster { flex: 0 0 170px; overflow: hidden; aspect-ratio: 210 / 295; background: #292929; border-radius: 6px; display: grid; place-items: center; color: var(--muted); font-size: 0.8125rem; }
.hero-poster img { display: block; width: 100%; height: 100%; object-fit: cover; }
h1 { margin: 0.8rem 0 1.25rem; font-size: clamp(2.3rem, 5.5vw, 5rem); letter-spacing: -0.045em; line-height: 1.05; overflow-wrap: anywhere; text-wrap: balance; }
.hero-meta { display: flex; flex-wrap: wrap; gap: 0.5rem 1.25rem; font-size: 0.875rem; color: #ddd; }
.rating { color: #ffd479; font-weight: 700; }
.rating span { font-weight: 400; }
.hero-genres { margin: 1rem 0 0; color: #ddd; }
@media (max-width: 600px) {
  .show-hero { min-height: 300px; }
  .hero-content { gap: 1rem; }
  .hero-poster { flex-basis: 85px; align-self: start; }
  .eyebrow { font-size: 0.75rem; letter-spacing: 0.05em; }
  h1 { font-size: clamp(1.8rem, 7vw, 2.7rem); }
  .hero-genres { font-size: 0.875rem; }
}
@media (orientation: landscape) and (max-height: 550px) {
  .show-hero { min-height: 240px; }
  .hero-poster { flex-basis: 110px; }
}
</style>
