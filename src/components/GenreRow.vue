<script setup lang="ts">
import { ref } from 'vue'
import type { Show } from '../types/show'
import ShowCard from './ShowCard.vue'

defineProps<{ genre: string; shows: Show[]; ranked?: boolean; hideCount?: boolean }>()

const row = ref<HTMLUListElement | null>(null)

// Move most of a row at a time so the next cards still have some visual context.
function scrollRow(direction: number) {
  if (!row.value) return

  row.value.scrollBy({
    left: direction * row.value.clientWidth * 0.85,
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  })
}
</script>

<!-- Native horizontal scrolling supports swipes without a carousel dependency. -->
<template>
  <section :id="`genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`" class="genre-row" tabindex="-1" :aria-label="`${genre} shows`">
    <div class="row-heading">
      <h3>{{ genre }} <span v-if="!hideCount">{{ shows.length }}</span></h3>
      <div class="row-controls">
        <button type="button" :aria-label="`Scroll ${genre} left`" @click="scrollRow(-1)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6" /></svg></button>
        <button type="button" :aria-label="`Scroll ${genre} right`" @click="scrollRow(1)"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 6 6 6-6 6" /></svg></button>
      </div>
    </div>
    <ul ref="row" class="show-list" :class="{ ranked }" tabindex="0" :aria-label="`${genre} shows, scroll for more`">
      <li v-for="(show, index) in shows" :key="show.id">
        <span v-if="ranked" class="rank-number" aria-hidden="true">{{ index + 1 }}</span>
        <ShowCard :show="show" />
      </li>
    </ul>
  </section>
</template>

<style scoped>
/* Native horizontal scrolling supports both swipe gestures and the desktop arrows. */
.show-list.ranked {
  padding: 1.5rem 1.5rem 0.8rem;
  gap: 2rem;
  scroll-padding-inline: 1.5rem;
}
.ranked li { position: relative; }
.rank-number {
  position: absolute;
  left: 0;
  top: 0;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 2px solid #141414;
  border-radius: 50%;
  background: var(--accent);
  color: #171717;
  box-shadow: 0 3px 10px #0006;
  font-size: 1.4rem;
  line-height: 1;
  font-weight: 800;
  pointer-events: none;
}
.genre-row {
  scroll-margin-top: 1.5rem;
  margin-top: 1.75rem;
}

.row-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.65rem;
}

h3 {
  margin: 0;
  font-size: clamp(1.1rem, 2vw, 1.35rem);
}

h3 span {
  margin-left: 0.5rem;
  color: var(--muted);
  font-size: 0.8125rem;
  font-weight: 400;
}

.row-controls {
  display: flex;
  gap: 0.35rem;
}

.row-controls button {
  display: grid;
  place-items: center;
  padding: 0;
  width: 44px;
  height: 44px;
  border: 1px solid #ffffff24;
  border-radius: 50%;
  color: #fff;
  background: #232323;
  font-size: 1.6rem;
  line-height: 1;
}

.row-controls button:hover {
  background: #404040;
  color: var(--accent);
}

.show-list {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: clamp(160px, 14vw, 220px);
  gap: 1rem;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
  scrollbar-color: #4b4b4b #141414;
  margin: 0;
  padding: 0.25rem 0 0.8rem;
  list-style: none;
}

li {
  min-width: 0;
  scroll-snap-align: start;
}

@media (max-width: 600px) {
  .show-list {
    grid-auto-columns: 38%;
    gap: 0.75rem;
  }

  .genre-row {
    margin-top: 1.25rem;
  }
}

@media (max-width: 700px) {
  .row-controls { display: none; }
}

@media (orientation: landscape) and (max-height: 550px) {
  .show-list {
    grid-auto-columns: 150px;
  }
}
</style>
