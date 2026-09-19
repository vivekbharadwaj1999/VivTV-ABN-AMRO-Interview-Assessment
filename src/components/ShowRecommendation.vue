<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import type { Show } from '../types/show'
import { genrePreferences, recommendShows } from '../utils/recommendations'
import { firstSummarySentence } from '../utils/summary'

const props = defineProps<{ shows: Show[]; history: Show[] }>()
const router = useRouter()
const dialog = ref<HTMLDialogElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const preferences = computed(() => genrePreferences(props.history))
const recommendations = computed(() => recommendShows(props.shows, props.history))
const enoughHistory = computed(() => new Set(props.history.map(show => show.id)).size >= 3)
const index = ref(0)
const selected = computed(() => recommendations.value[index.value])
const description = computed(() => firstSummarySentence(selected.value?.show.summary))
const imageFailed = ref(false)
let previousOverflow = ''
let opened = false

// New activity recalculates the ranking and starts at its best match. Merely trying
// another recommendation changes only the index, never the browsing history.
watch(recommendations, () => { index.value = 0 })
watch(selected, () => { imageFailed.value = false })

function open() {
  if (!dialog.value || opened) return
  index.value = 0
  previousOverflow = document.body.style.overflow
  dialog.value.showModal()
  opened = true
  document.body.style.overflow = 'hidden'
}

// Restore scrolling before opening routed details so the next dialog saves the correct
// body state. Normal dismissal also returns keyboard focus to the recommendation button.
function close() {
  if (!opened) return
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
  opened = false
  trigger.value?.focus({ preventScroll: true })
}

function tryAnother() {
  if (recommendations.value.length > 1) index.value = (index.value + 1) % recommendations.value.length
}

function showDetails() {
  if (!selected.value) return
  const id = selected.value.show.id
  close()
  void router.push({ name: 'show', params: { id } })
}

// Browser navigation should not leave an unrelated dialog over the next route.
watch(() => router.currentRoute.value.fullPath, close)
onBeforeUnmount(close)
</script>

<template>
  <button v-if="enoughHistory" ref="trigger" class="recommend-trigger" type="button" aria-label="Find my next show" @click="open">
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z" /></svg>
    <span class="trigger-desktop">Find my next show</span><span class="trigger-mobile" aria-hidden="true">Next Show</span>
  </button>
  <dialog ref="dialog" class="recommend-dialog" aria-labelledby="recommend-title" @cancel.prevent="close" @click="($event.target === dialog) && close()">
    <div class="recommend-panel">
      <button class="recommend-back" type="button" aria-label="Back to browsing" autofocus @click="close">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg>
        <span aria-hidden="true">Back</span>
      </button>
      <p class="eyebrow">A LITTLE INSPIRATION</p>
      <h2 id="recommend-title">Find my next show</h2>
      <p v-if="!enoughHistory" class="recommend-empty">Open at least three different shows to help us find your next one. Your recent activity will guide the suggestions here.</p>
      <template v-else>
        <p v-if="preferences.length" class="recommend-intro">Based on the shows you’ve explored recently, your most common genres are:</p>
        <ul v-if="preferences.length" class="genre-chips" aria-label="Your most explored genres">
          <li v-for="item in preferences.slice(0, 3)" :key="item.genre">{{ item.genre }}</li>
        </ul>
        <!-- Announce each new pick without moving focus away from Try another.
             The summary spans the full card width on mobile, below the poster and heading. -->
        <div aria-live="polite" aria-atomic="true">
          <article v-if="selected" class="recommend-card">
            <div class="pick-copy">
              <p class="pick-label">YOUR NEXT WATCH</p>
              <h3>{{ selected.show.name }}</h3>
              <p class="pick-meta"><span class="pick-rating">{{ selected.show.rating.average !== null ? `★ ${selected.show.rating.average.toFixed(1)} / 10` : 'Not rated' }}</span><span v-if="selected.show.premiered">{{ selected.show.premiered.slice(0, 4) }}</span></p>
              <p class="pick-genres">{{ selected.show.genres.join(' · ') }}</p>
            </div>
            <img v-if="selected.show.image && !imageFailed" class="pick-poster" :src="selected.show.image.medium" :alt="selected.show.name + ' poster'" width="210" height="295" @error="imageFailed = true" />
            <div v-else class="pick-poster poster-placeholder">Poster unavailable</div>
            <p v-if="description" class="pick-description">{{ description }}</p>
            <p class="pick-reason">Matches your interest in <strong>{{ selected.genres.join(', ') }}</strong>.</p>
          </article>
          <p v-else class="recommend-empty">{{ preferences.length ? 'You’ve explored all the matching shows in this collection. Open something from another genre to discover more suggestions.' : 'These shows don’t have genre information yet. Explore a few more shows to help us find a match.' }}</p>
        </div>
        <div v-if="selected" class="recommend-actions">
          <button type="button" class="details-button" @click="showDetails">More details</button>
          <button type="button" class="another-button" :disabled="recommendations.length < 2" @click="tryAnother">Try another</button>
        </div>
        <p v-if="selected && recommendations.length === 1" class="recommend-note">This is the only new match in this collection right now.</p>
      </template>
    </div>
  </dialog>
</template>

<style scoped>
.recommend-trigger { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; min-height: 44px; padding: 0.6rem 1rem; border: 1px solid #f1c86a70; border-radius: 24px; background: #f1c86a0c; color: var(--accent); font-size: 0.875rem; font-weight: 600; }
@media (min-width: 701px) and (hover: hover) {
  .recommend-trigger:hover { background: var(--accent); border-color: var(--accent); color: #141414; }
}
.trigger-mobile { display: none; }
@media (max-width: 700px) {
  .trigger-desktop { display: none; }
  .trigger-mobile { display: inline; }
  .recommend-trigger { gap: 0.3rem; padding: 0.5rem 0.6rem; font-size: 0.9rem; white-space: nowrap; }
  .recommend-trigger svg { width: 16px; height: 16px; }
}
/* The outer dialog scrolls at the viewport edge, like the existing details dialog.
   Its inner panel supplies the width, padding and dark surface. */
.recommend-dialog { width: 100%; max-width: none; height: 100dvh; max-height: none; margin: 0; padding: 5dvh 1rem; border: 0; background: transparent; color: #f5f5f1; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; scrollbar-color: #505050 #181818; }
.recommend-dialog::backdrop { background: #000b; }
.recommend-panel { position: relative; width: min(680px, 100%); margin: auto; padding: clamp(1.25rem, 4vw, 2.5rem); padding-top: 5rem; border: 1px solid #ffffff20; border-radius: 16px; background: #181818; box-shadow: 0 24px 80px #0008; }
/* Keep the arrow fixed as the desktop label expands, matching the show details control. */
.recommend-back { position: absolute; top: 0; left: 0; display: block; width: 44px; height: 44px; overflow: hidden; padding: 0; margin: 1rem; border: 1px solid #ffffff40; border-radius: 24px; background: #141414e6; color: #fff; font-size: 0.9375rem; line-height: 1; transition: width 180ms ease, background 180ms ease; }
.recommend-back svg { position: absolute; left: 10px; top: 10px; }
.recommend-back span { position: absolute; left: 42px; top: 0; line-height: 42px; opacity: 0; transition: opacity 180ms ease; }
.recommend-back:hover { background: #383838; color: var(--accent); }
@media (min-width: 701px) {
  .recommend-back:hover, .recommend-back:focus-visible { width: 100px; }
  .recommend-back:hover span, .recommend-back:focus-visible span { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .recommend-back, .recommend-back span { transition: none; }
}
h2 { margin: 0.65rem 0 1rem; font-size: clamp(1.7rem, 5vw, 2.3rem); line-height: 1.15; letter-spacing: -0.035em; }
.recommend-intro, .recommend-empty { color: #c4c4c4; }
.genre-chips { display: flex; flex-wrap: wrap; gap: 0.5rem; padding: 0; margin: 1rem 0 1.5rem; list-style: none; }
.genre-chips li { padding: 0.3rem 0.7rem; border: 1px solid #f1c86a30; border-radius: 20px; color: var(--accent); background: #f1c86a0a; font-size: 0.8125rem; }
.recommend-card { display: grid; grid-template-columns: minmax(0, 1fr) 130px; align-items: start; gap: 1rem 1.25rem; padding: 1.25rem; border: 1px solid #ffffff15; border-radius: 10px; background: radial-gradient(ellipse at top right, #f1c86a18, transparent 70%), #202020; }
.pick-label { margin: 0 0 0.75rem; color: var(--muted); font-size: 0.65rem; letter-spacing: 0.12em; font-weight: 700; }
h3 { margin: 0; font-size: clamp(1.5rem, 4vw, 2rem); line-height: 1.15; overflow-wrap: anywhere; }
.pick-meta { display: flex; flex-wrap: wrap; gap: 0.4rem 0.8rem; font-size: 0.875rem; }
.pick-rating { color: var(--accent); font-weight: 700; }
.pick-genres { margin: 0; color: #bbb; font-size: 0.8125rem; }
.pick-poster { width: 100%; height: auto; aspect-ratio: 210 / 295; object-fit: cover; border-radius: 6px; }
.poster-placeholder { display: grid; place-items: center; padding: 0.5rem; background: #292929; color: var(--muted); text-align: center; font-size: 0.8125rem; }
.pick-description, .pick-reason { grid-column: 1 / -1; margin: 0; }
.pick-description { color: #ddd; }
.pick-reason { padding-top: 1rem; border-top: 1px solid #ffffff15; color: #bbb; font-size: 0.8125rem; }
.pick-reason strong { color: var(--accent); font-weight: 600; }
.recommend-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
.recommend-actions button { display: inline-flex; align-items: center; justify-content: center; gap: 1.5rem; min-height: 44px; padding: 0.7rem 1.25rem; border: 0; border-radius: 5px; font-size: 1rem; font-weight: 700; text-decoration: none; }
.details-button { background: #f5f5f1; color: #141414; }
.details-button:hover { background: #d8d8d8; }
.another-button { background: var(--accent); color: #141414; }
.another-button:hover:not(:disabled) { background: #ffdb83; }
.another-button:disabled { opacity: 0.45; cursor: default; }
.recommend-note { margin: 1rem 0 0; color: var(--muted); font-size: 0.75rem; }
@media (max-width: 600px) {
  .recommend-back { margin: 0.5rem; }
  .recommend-dialog { padding: 1rem 0.5rem; }
  .recommend-card { grid-template-columns: minmax(0, 1fr) 90px; padding: 1rem; gap: 1rem; }
  .recommend-actions button { flex: 1; }
}
</style>
