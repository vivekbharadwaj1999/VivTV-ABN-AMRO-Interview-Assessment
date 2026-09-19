<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ShowDetailView from '../views/ShowDetailView.vue'

defineProps<{ id: string }>()
const router = useRouter()
const dialog = ref<HTMLDialogElement | null>(null)
let previousOverflow = ''
let opener: HTMLElement | null = null
let closing = false

// Close by navigating so the URL and dialog stay in sync. Ignore repeat clicks while
// navigation is pending, and send direct links back to the catalogue.
function closeModal() {
  if (closing) return
  closing = true
  const previousRoute = router.options.history.state.back

  // Go back only if the previous entry is the catalogue or one of its anchors.
  // Otherwise replace this route rather than returning to an unrelated page.
  if (typeof previousRoute === 'string' && /^\/(?:#.*)?$/.test(previousRoute)) {
    router.back()
  } else {
    void router.replace('/')
  }
}

// Only the empty overlay closes the modal; clicks inside the card are ignored.
function handleBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) closeModal()
}

// Save the scroll style and focused element before opening the native dialog.
// showModal makes the background inert; body overflow prevents it scrolling underneath.
onMounted(() => {
  opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  dialog.value?.showModal()
})

// Restore focus without another scroll jump. The trigger may have been removed,
// so only focus it if it is still connected to the document.
onBeforeUnmount(() => {
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
  if (opener?.isConnected) opener.focus({ preventScroll: true })
})
</script>

<!-- Escape navigates through closeModal instead of only hiding the dialog, keeping
     the route consistent. The detail key resets its state when a different show opens. -->
<template>
  <dialog
    ref="dialog"
    class="show-modal"
    aria-label="Show details"
    @cancel.prevent="closeModal"
    @click="handleBackdropClick"
  >
    <div class="modal-panel">
      <div class="close-bar">
        <button class="close-button" type="button" aria-label="Back to shows" autofocus @click="closeModal"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" /></svg><span aria-hidden="true">Back</span></button>
      </div>
      <ShowDetailView :key="id" :id="id" modal />
    </div>
  </dialog>
</template>

<style scoped>
/* The overlay scrolls at the viewport edge while the detail card keeps its own width. */
.show-modal {
  width: 100%;
  max-width: none;
  height: 100dvh;
  max-height: none;
  margin: 0;
  padding: 4dvh 2rem;
  border: 0;
  background: transparent;
  color: #f5f5f1;
  overscroll-behavior: contain;
  overflow-y: auto;
  color-scheme: dark;
  scrollbar-width: thin;
  scrollbar-color: #505050 #181818;
  scrollbar-gutter: stable;
}

.show-modal::-webkit-scrollbar {
  width: 10px;
}

.show-modal::-webkit-scrollbar-track {
  background: #181818;
}

.show-modal::-webkit-scrollbar-thumb {
  border: 2px solid #181818;
  border-radius: 999px;
  background: #505050;
}

.show-modal::-webkit-scrollbar-thumb:hover {
  background: #686868;
}

.modal-panel {
  position: relative;
  width: min(850px, 100%);
  margin-inline: auto;
  border-radius: 12px;
  overflow: clip;
  background: #141414;
  box-shadow: 0 24px 100px #000a;
}

.show-modal[open] .modal-panel {
  animation: modal-appear 180ms ease-out;
}

.show-modal::backdrop {
  background: #000b;
}

.close-bar {
  position: absolute;
  top: 0;
  left: 0;
  height: 0;
  z-index: 2;
  display: flex;
  justify-content: flex-end;
}

.close-button {
  position: relative;
  display: block;
  width: 44px;
  overflow: hidden;
  padding: 0;
  flex: 0 0 auto;
  height: 44px;
  margin: 1rem;
  border: 1px solid #ffffff40;
  border-radius: 24px;
  background: #141414e6;
  color: #fff;
  font-size: 0.9375rem;
  transition: width 180ms ease, background 180ms ease;
  line-height: 1;
}
/* Fix the arrow independently of the button width, so expansion reveals the label
   without moving the arrow. Only desktop widths enable the expanding button. */
.close-button svg { position: absolute; left: 10px; top: 10px; }
.close-button span { position: absolute; left: 42px; top: 0; line-height: 42px; opacity: 0; transition: opacity 180ms ease; }
@media (min-width: 701px) {
  .close-button:hover, .close-button:focus-visible { width: 100px; }
  .close-button:hover span, .close-button:focus-visible span { opacity: 1; }
}

.close-button:hover {
  background: #383838;
  color: var(--accent);
}

@keyframes modal-appear {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 600px) {
  .show-modal {
    padding: 2dvh 0.5rem;
  }

  .modal-panel {
    border-radius: 8px;
  }

  .close-button {
    margin: 0.5rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .close-button, .close-button span { transition: none; }
  .show-modal[open] .modal-panel { animation: none; }
}
</style>
