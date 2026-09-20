<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import DemoAccount from './components/DemoAccount.vue'
const genres = ref<string[]>([])
const searchOpen = ref(false)
const header = ref<HTMLElement | null>(null)
let headerObserver: ResizeObserver | undefined
let viewport: VisualViewport | null = null

// Calculate the space below the visible viewport and pass it to CSS. The mobile pill
// adds this offset to its bottom spacing when the keyboard covers part of the screen.
function updateVisibleBottom() {
  // offsetTop accounts for the browser panning after focus. Ignore pinch zoom so
  // zooming the page is not treated as extra keyboard space.
  const covered = viewport && viewport.scale === 1
    ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
    : 0
  document.documentElement.style.setProperty('--viewport-bottom-gap', `${covered}px`)
}

// Return focus to the logo so keyboard users can continue from the header.
function backToTop() {
  window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  header.value?.querySelector<HTMLAnchorElement>('.brand')?.focus({ preventScroll: true })
}
// Typing changes searchQuery. Submit copies it into searchTerm for the results.
// Keeping them separate avoids an API request on every keystroke.
const searchQuery = ref('')
const searchTerm = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const searchButton = ref<HTMLButtonElement | null>(null)
const genreMenu = ref<HTMLDetailsElement | null>(null)

// Dismiss the genre dropdown when the click lands outside it.
function closeGenres(event: MouseEvent) {
  if (genreMenu.value && !genreMenu.value.contains(event.target as Node)) genreMenu.value.open = false
}
// Build the same section ID as GenreRow, then scroll to and focus that row.
// preventScroll avoids a second jump when focus follows the animated scroll.
function chooseGenre(genre: string) {
  if (genreMenu.value) genreMenu.value.open = false
  const row = document.getElementById(`genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)
  row?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  row?.focus({ preventScroll: true })
}
// Wait for Vue to apply the expanded state before focusing the input. Closing clears
// both the draft and submitted query, then restores focus to the search control.
async function toggleSearch() {
  if (genreMenu.value) genreMenu.value.open = false
  searchOpen.value = !searchOpen.value
  await nextTick()
  if (searchOpen.value) {
    searchInput.value?.focus({ preventScroll: true })
  } else {
    searchQuery.value = ''
    searchTerm.value = ''
    searchButton.value?.focus()
  }
}
// Commit the query and blur to dismiss the phone keyboard. Wait for the results section
// to render before scrolling to it. The API request can still be loading at that point.
async function submitSearch() {
  searchTerm.value = searchQuery.value.trim()
  searchInput.value?.blur()
  await nextTick()
  document.getElementById('search')?.scrollIntoView({ block: 'start' })
}
onMounted(() => {
  viewport = window.visualViewport
  viewport?.addEventListener('resize', updateVisibleBottom)
  viewport?.addEventListener('scroll', updateVisibleBottom)
  window.addEventListener('resize', updateVisibleBottom)
  updateVisibleBottom()
  document.addEventListener('click', closeGenres)
  // Header height can change with the layout. Scroll padding uses its measured height
  // so genre anchors are not hidden underneath the sticky header.
  headerObserver = new ResizeObserver(() => {
    document.documentElement.style.setProperty('--header-height', `${header.value?.offsetHeight ?? 76}px`)
  })
  if (header.value) headerObserver.observe(header.value)
})
// Remove browser callbacks and CSS offsets if the shell is destroyed, rather than
// leaving listeners that still reference its old elements.
onBeforeUnmount(() => {
  viewport?.removeEventListener('resize', updateVisibleBottom)
  viewport?.removeEventListener('scroll', updateVisibleBottom)
  window.removeEventListener('resize', updateVisibleBottom)
  document.documentElement.style.removeProperty('--viewport-bottom-gap')
  document.removeEventListener('click', closeGenres)
  headerObserver?.disconnect()
  document.documentElement.style.removeProperty('--header-height')
})
</script>

<!-- Shared navigation surrounds the routed catalogue and details. -->
<template>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header ref="header" class="site-header">
    <div class="header-content">
      <RouterLink class="brand" to="/" aria-label="VivTV home">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3 6 5 6-5" /><rect x="3" y="8" width="26" height="19" rx="5" /><path d="M11 30h10" /><path d="m13 13 7 4.5-7 4.5z" fill="currentColor" stroke="none" /></svg>
        VivTV
      </RouterLink>
      <nav class="header-actions" aria-label="Main navigation">
        <div class="discovery-nav" :class="{ 'search-active': searchOpen }">
        <details ref="genreMenu" class="genre-menu" @keydown.esc="genreMenu && (genreMenu.open = false)">
          <summary>Browse Genres <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></summary>
          <div class="genre-options">
            <p v-if="!genres.length">Genres will appear when shows load.</p>
            <button v-for="genre in genres" :key="genre" type="button" @click="chooseGenre(genre)">{{ genre }}</button>
          </div>
        </details>
        <form class="header-search" :class="{ expanded: searchOpen }" role="search" @submit.prevent="submitSearch" @keydown.esc.prevent="searchOpen && toggleSearch()">
        <button ref="searchButton" class="search-toggle" :type="searchOpen ? 'submit' : 'button'" aria-label="Search shows" :aria-expanded="searchOpen" aria-controls="header-search-input" @click="!searchOpen && toggleSearch()">
          <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></svg>
          <span class="mobile-search-label">Search</span>
        </button>
        <input id="header-search-input" ref="searchInput" v-model="searchQuery" :tabindex="searchOpen ? 0 : -1" :aria-hidden="!searchOpen" type="search" aria-label="Search by show name" placeholder="Search shows…" maxlength="150" />
        <button v-if="searchOpen" class="close-search" type="button" aria-label="Close search" @click="toggleSearch"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
        </form>
        </div>
        <DemoAccount />
      </nav>
    </div>
  </header>
  <main id="main-content" class="page" tabindex="-1">
    <!-- Render the route with the submitted query and listen for its genre list.
         HomeView sends names upward so the header does not fetch the catalogue again. -->
    <RouterView v-slot="{ Component }">
      <component :is="Component" :search-term="searchTerm" @genres-loaded="genres = $event" />
    </RouterView>
  </main>
  <footer class="site-footer">
    <div class="footer-main">
      <div class="footer-intro">
        <RouterLink class="brand" to="/" aria-label="VivTV home">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 3 6 5 6-5" /><rect x="3" y="8" width="26" height="19" rx="5" /><path d="M11 30h10" /><path d="m13 13 7 4.5-7 4.5z" fill="currentColor" stroke="none" /></svg>
          VivTV
        </RouterLink>
        <p>A new favourite is just a show away.</p>
        <p>Explore stories, discover the cast, and find your next watch.</p>
      </div>
      <nav class="footer-links" aria-label="Footer navigation">
        <h2>Explore</h2>
        <a href="#genre-top-picks-for-you">Top picks for you</a>
        <a href="#genres">Browse shows</a>
        <button type="button" @click="backToTop">Back to top ↑</button>
      </nav>
      <div class="footer-links">
        <h2>Powered by TVMaze</h2>
        <p>Show information, ratings and artwork from TVMaze.</p>
        <a href="https://www.tvmaze.com/">Visit TVMaze ↗</a>
      </div>
    </div>
    <div class="footer-bottom"><span>© {{ new Date().getFullYear() }} VivTV</span></div>
  </footer>
</template>
