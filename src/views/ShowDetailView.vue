<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import ShowHero from '../components/ShowHero.vue'
import ShowEpisodes from '../components/ShowEpisodes.vue'
import ShowCast from '../components/ShowCast.vue'
import { getShow } from '../api/tvmaze'
import type { Show } from '../types/show'
import { summaryToText } from '../utils/summary'
import { rememberShow } from '../utils/recentShows'

const props = defineProps<{ id: string; modal?: boolean }>()
const show = ref<Show | null>(null)
const isLoading = ref(true)
const error = ref('')
const tabs = ['Overview', 'Episodes', 'Cast'] as const
const activeTab = ref<(typeof tabs)[number]>('Overview')

// Follow the usual tab-list keyboard controls while keeping only one tab in the tab order.
function handleTabKey(event: KeyboardEvent, index: number) {
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % tabs.length
  else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = tabs.length - 1
  else return

  event.preventDefault()
  activeTab.value = tabs[next]!
  const tabList = (event.currentTarget as HTMLElement).parentElement
  tabList?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
}
const summary = computed(() => summaryToText(show.value?.summary))
let controller: AbortController | undefined

// Cancel the previous route's request before fetching the next show's details.
async function loadShow() {
  controller?.abort()
  const request = new AbortController()
  controller = request
  isLoading.value = true
  error.value = ''
  show.value = null
  activeTab.value = 'Overview'

  try {
    if (!/^[1-9]\d*$/.test(props.id)) return
    const result = await getShow(props.id, request.signal)
    if (!request.signal.aborted) {
      show.value = result
      if (result) rememberShow(result)
    }
  } catch {
    if (!request.signal.aborted) error.value = 'We couldn’t load this show. Please try again.'
  } finally {
    if (!request.signal.aborted) isLoading.value = false
  }
}

// Vue reuses this page when only the route ID changes.
watch(() => props.id, loadShow, { immediate: true })
onUnmounted(() => controller?.abort())
</script>

<!-- The same detail content supports modal and standalone rendering. -->
<template>
  <div class="detail-page" :class="{ 'in-modal': modal }">
    <RouterLink v-if="!modal" class="back-link" to="/">← All shows</RouterLink>
    <p v-if="isLoading" class="detail-status" role="status">Loading show…</p>
    <div v-else-if="error" class="detail-status" role="alert">
      <h1>Something went wrong</h1>
      <p>{{ error }}</p>
      <button type="button" @click="loadShow">Try again</button>
    </div>
    <section v-else-if="!show" class="detail-status">
      <h1>Show not found</h1>
      <p>This show may have been removed, or the link may be incorrect.</p>
    </section>
    <article v-else class="show-detail">
      <ShowHero :key="show.id" :show="show" />
      <div class="detail-tabs" role="tablist" aria-label="Show information">
        <button
          v-for="(tab, index) in tabs"
          :id="'tab-' + tab"
          :key="tab"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab"
          :aria-controls="'panel-' + tab"
          :tabindex="activeTab === tab ? 0 : -1"
          @click="activeTab = tab"
          @keydown="handleTabKey($event, index)"
        >{{ tab }}</button>
      </div>
      <section v-show="activeTab === 'Overview'" id="panel-Overview" class="detail-panel" role="tabpanel" aria-labelledby="tab-Overview" tabindex="0">
        <h2>Overview</h2>
        <p class="summary">{{ summary || 'No summary is available for this show yet.' }}</p>
        <dl class="facts">
          <div><dt>Status</dt><dd>{{ show.status || 'Unknown' }}</dd></div>
          <div><dt>Language</dt><dd>{{ show.language || 'Unknown' }}</dd></div>
          <div><dt>Premiered</dt><dd>{{ show.premiered || 'Unknown' }}</dd></div>
          <div><dt>Runtime</dt><dd>{{ (show.runtime ?? show.averageRuntime) != null ? `${show.runtime ?? show.averageRuntime} minutes` : 'Unknown' }}</dd></div>
          <div><dt>Network / platform</dt><dd>{{ show.network?.name || show.webChannel?.name || 'Unknown' }}</dd></div>
          <div v-if="show.ended"><dt>Ended</dt><dd>{{ show.ended }}</dd></div>
        </dl>

      </section>
      <section v-show="activeTab === 'Episodes'" id="panel-Episodes" class="detail-panel" role="tabpanel" aria-labelledby="tab-Episodes" tabindex="0">
        <ShowEpisodes :key="show.id" :show-id="show.id" />
      </section>
      <section v-show="activeTab === 'Cast'" id="panel-Cast" class="detail-panel" role="tabpanel" aria-labelledby="tab-Cast" tabindex="0">
        <ShowCast :key="show.id" :show-id="show.id" />
      </section>
    </article>
  </div>
</template>

<style scoped>
/* Component layout and responsive states. */
.detail-page {
  padding-block: 1.25rem 2rem;
}

.detail-page.in-modal {
  padding: 0;
}

.in-modal .detail-tabs {
  margin-inline: clamp(1rem, 4vw, 3rem);
}

.in-modal .detail-panel, .in-modal .detail-status {
  padding: 2rem clamp(1rem, 4vw, 3rem);
}

.back-link {
  display: inline-block;
  padding-block: 0.5rem;
  margin-bottom: 0.75rem;
  color: #ccc;
  text-decoration: none;
}

.back-link:hover {
  color: var(--accent);
}

.show-detail {
  max-width: 1440px;
  margin: 0 auto;
}

.detail-tabs {
  display: flex;
  gap: clamp(1.25rem, 4vw, 3rem);
  border-bottom: 1px solid #ffffff25;
}

.detail-tabs button {
  position: relative;
  padding: 1.1rem 0.2rem;
  border: 0;
  border-bottom: 3px solid transparent;
  color: var(--muted);
  background: transparent;
  font-size: 1rem;
  font-weight: 700;
}

.detail-tabs button[aria-selected="true"] {
  color: #fff;
  border-bottom-color: var(--accent);
}

.detail-tabs button:hover {
  color: var(--accent);
}

.detail-panel {
  padding-block: 2rem;
  min-height: 220px;
}

h2 {
  margin: 0 0 1rem;
  font-size: 1.4rem;
}

.summary {
  max-width: 850px;
  color: #d4d4d4;
  line-height: 1.8;
}

.facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
  border-top: 1px solid #ffffff20;
  padding-top: 1.5rem;
  margin-top: 2rem;
}

dt {
  color: var(--muted);
  font-size: 0.875rem;
}

dd {
  margin: 0.35rem 0 0;
  overflow-wrap: anywhere;
}

.detail-status {
  padding-block: 2rem;
}

.detail-status button {
  min-height: 44px;
  padding: 0.6rem 1.25rem;
  border: 0;
  border-radius: 5px;
  color: #141414;
  background: #f5f5f1;
}

@media (max-width: 600px) {
  .facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-panel {
    padding-top: 1.5rem;
  }
}
</style>
