<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Show } from '../types/show'
import { summaryToText } from '../utils/summary'

const props = defineProps<{ show: Show }>()
const imageFailed = ref(false)
const touchInput = ref(false)
const summary = computed(() => summaryToText(props.show.summary))
</script>

<!-- The entire card stays a single link on mouse, touch and keyboard. -->
<template>
  <article class="show-card">
    <RouterLink class="card-link" :class="{ 'touch-input': touchInput }" :to="{ name: 'show', params: { id: show.id } }" :aria-label="'View details for ' + show.name" @pointerenter="touchInput = $event.pointerType === 'touch'" @pointerdown="touchInput = $event.pointerType === 'touch'">
      <div class="poster">
        <img
          v-if="show.image && !imageFailed"
          :src="show.image.medium"
          alt=""
          width="210"
          height="295"
          loading="lazy"
          @error="imageFailed = true"
        />
        <div v-else class="poster-fallback">Poster unavailable</div>
        <span class="rating" :aria-label="show.rating.average === null ? 'Not rated' : 'Rating: ' + show.rating.average + ' out of 10'">
          <span aria-hidden="true">★</span> {{ show.rating.average?.toFixed(1) ?? 'N/A' }}
        </span>
        <div class="preview" aria-hidden="true">
          <p class="preview-genres">{{ show.genres.join(' · ') }}</p>
          <p class="preview-summary">{{ summary || 'Discover more about this show.' }}</p>
          <span class="preview-action">View details <span>↗</span></span>
        </div>
      </div>
      <h4>{{ show.name }}</h4>
      <p class="show-meta">{{ show.premiered?.slice(0, 4) ?? 'Year unknown' }}</p>
    </RouterLink>
  </article>
</template>

<style scoped>
/* Keep previews inside the poster so neighbouring cards do not shift on hover. */
.card-link {
  display: block;
  border-radius: 6px;
  text-decoration: none;
}

.poster {
  position: relative;
  overflow: hidden;
  aspect-ratio: 210 / 295;
  border: 1px solid #ffffff12;
  border-radius: 6px;
  background: #252525;
}

img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 180ms ease;
}

.poster-fallback {
  display: grid;
  place-items: center;
  height: 100%;
  padding: 1rem;
  color: #b3b3b3;
  text-align: center;
  font-size: 0.875rem;
}

.rating {
  position: absolute;
  right: 0.5rem;
  top: 0.5rem;
  z-index: 1;
  padding: 0.2rem 0.5rem;
  border: 1px solid #ffffff26;
  border-radius: 4px;
  background: #141414ed;
  font-size: 0.8125rem;
  font-weight: 650;
}

.rating span {
  color: #f4c66a;
}

.preview {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: end;
  padding: 2.5rem 0.8rem 0.8rem;
  background: linear-gradient(transparent, #141414ed 35%, #141414);
  opacity: 0;
  visibility: hidden;
  transform: translateY(6px);
  transition: opacity 180ms ease, transform 180ms ease, visibility 180ms;
  pointer-events: none;
}

.preview-genres {
  margin: 0 0 0.4rem;
  color: #ddd;
  font-size: 0.75rem;
}

.preview-summary {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  margin: 0 0 0.75rem;
  font-size: 0.875rem;
  line-height: 1.45;
}

.preview-action {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  font-weight: 700;
}

h4 {
  margin: 0.6rem 0 0.15rem;
  font-size: 0.875rem;
  line-height: 1.4;
}

.show-meta {
  margin: 0;
  color: var(--muted);
  font-size: 0.8125rem;
}

.card-link:focus-visible .preview {
  opacity: 1;
  visibility: visible;
  transform: none;
}

  .card-link:not(.touch-input):hover .preview {
    opacity: 1;
    visibility: visible;
    transform: none;
  }

  .card-link:not(.touch-input):hover img {
    transform: scale(1.035);
  }
@media (prefers-reduced-motion: reduce) {
  img, .preview {
    transition: none;
    transform: none;
  }

  .card-link:not(.touch-input):hover img {
    transform: none;
  }
}
</style>
