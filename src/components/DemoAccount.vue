<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { createDemoAccount, signInDemoAccount } from '../utils/demoAccounts'

const dialog = ref<HTMLDialogElement | null>(null)
const registering = ref(false)
const username = ref('')
const password = ref('')
const confirmation = ref('')
const signedIn = ref('')
const busy = ref(false)
const error = ref('')
const accountMenu = ref<HTMLDetailsElement | null>(null)
const loginButton = ref<HTMLButtonElement | null>(null)

// An outside click closes the account dropdown without changing the signed-in user.
function dismissMenu(event: MouseEvent) {
  if (accountMenu.value && !accountMenu.value.contains(event.target as Node)) accountMenu.value.open = false
}
// Escape returns focus to the avatar that opened the dropdown.
function closeMenu() {
  if (!accountMenu.value) return
  accountMenu.value.open = false
  accountMenu.value.querySelector('summary')?.focus()
}
// The session is only held in memory; saved account records remain available.
async function logout() {
  signedIn.value = ''
  await nextTick()
  loginButton.value?.focus()
}
onMounted(() => document.addEventListener('click', dismissMenu))
let previousOverflow = ''
let opener: HTMLElement | null = null

// Remember the trigger and lock background scrolling while the account form is open.
function open() {
  opener = document.activeElement as HTMLElement
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  error.value = ''
  dialog.value?.showModal()
}
// Clear password fields and return focus to the control that opened the form.
function close() {
  if (busy.value) return
  dialog.value?.close()
  document.body.style.overflow = previousOverflow
  password.value = ''
  confirmation.value = ''
  opener?.focus()
}
// Keep the username when switching forms, but discard passwords and old errors.
function switchMode() {
  registering.value = !registering.value
  error.value = ''
  password.value = ''
  confirmation.value = ''
}
// Validate confirmation before deriving a password hash or updating the active session.
async function submit() {
  error.value = ''
  if (registering.value && password.value !== confirmation.value) {
    error.value = 'Passwords do not match.'
    return
  }
  busy.value = true
  try {
    signedIn.value = await (registering.value ? createDemoAccount : signInDemoAccount)(username.value, password.value)
    busy.value = false
    close()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Unable to access local accounts. Check browser storage permissions.'
  } finally { busy.value = false }
}
onBeforeUnmount(() => {
  document.removeEventListener('click', dismissMenu)
  if (dialog.value?.open) document.body.style.overflow = previousOverflow
})
</script>

<!-- The account dropdown and form share the same local session. -->
<template>
  <div class="account-actions">
    <details v-if="signedIn" ref="accountMenu" class="profile-menu" @keydown.esc.prevent="closeMenu">
      <summary class="profile-avatar" :aria-label="`Account options for ${signedIn}`">{{ signedIn.slice(0, 2).toUpperCase() }}</summary>
      <div class="profile-dropdown">
        <p class="profile-name">{{ signedIn }}</p>
        <button type="button" class="logout-button" @click="logout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4H4v16h5M10 12h10m-4-4 4 4-4 4" /></svg>
          Log out
        </button>
      </div>
    </details>
    <button v-else ref="loginButton" type="button" class="account-button" @click="open">Log in</button>
  </div>
  <dialog ref="dialog" class="account-dialog" aria-labelledby="account-title" @cancel.prevent="close">
    <button class="close-account" type="button" aria-label="Close account" :disabled="busy" @click="close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    <p class="eyebrow">YOUR VivTV</p>
    <h2 id="account-title">{{ registering ? 'Sign up' : 'Log in' }}</h2>
    <form @submit.prevent="submit">
      <fieldset :disabled="busy">
        <label>Username<input v-model="username" required minlength="3" maxlength="24" pattern="[A-Za-z0-9_-]+" autocomplete="username" autocapitalize="none" /></label>
        <label>Password<input v-model="password" type="password" required minlength="8" maxlength="128" :autocomplete="registering ? 'new-password' : 'current-password'" /></label>
        <label v-if="registering">Confirm password<input v-model="confirmation" type="password" required minlength="8" maxlength="128" autocomplete="new-password" /></label>
        <p v-if="error" role="alert">{{ error }}</p>
        <button class="submit-account" type="submit">{{ busy ? 'Please wait…' : registering ? 'Sign up' : 'Log in' }}</button>
        <button class="switch-mode" type="button" @click="switchMode">{{ registering ? 'Already have an account? Log in' : 'New here? Sign up' }}</button>
      </fieldset>
    </form>
  </dialog>
</template>

<style scoped>
/* Account forms share the dark theme; the profile dropdown stays anchored to its avatar. */
.account-actions { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
.profile-menu { position: relative; }
.profile-avatar { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #b4a1ff, #6fd9c6); color: #18232b; font-size: 1rem; font-weight: 800; letter-spacing: 0.03em; cursor: pointer; list-style: none; box-shadow: inset 0 0 0 1px #ffffff30; }
.profile-avatar::-webkit-details-marker { display: none; }
.profile-avatar:hover, .profile-menu[open] .profile-avatar { box-shadow: 0 0 0 3px #ffffff26; }
.profile-dropdown { position: absolute; z-index: 6; right: 0; top: calc(100% + 0.75rem); width: 210px; padding: 0.5rem; border: 1px solid #444; border-radius: 10px; background: #242424; box-shadow: 0 16px 40px #0008; }
.profile-name { margin: 0; padding: 0.7rem; border-bottom: 1px solid #ffffff1a; overflow-wrap: anywhere; font-weight: 600; }
.logout-button { display: flex; align-items: center; gap: 0.7rem; width: 100%; min-height: 44px; margin-top: 0.4rem; padding: 0.7rem; border: 0; border-radius: 6px; background: transparent; color: #eee; text-align: left; }
.logout-button:hover { background: #363636; color: var(--accent); }
.switch-mode:hover, .close-account:hover { color: var(--accent); }
.account-button { min-height: 44px; padding: 0.5rem 1rem; background: var(--accent); color: #171717; border: 0; border-radius: 5px; white-space: nowrap; font-weight: 700; }
.account-dialog { position: fixed; width: min(440px, calc(100% - 2rem)); max-height: 90dvh; padding: 2rem; border: 1px solid #444; border-radius: 12px; background: #181818; color: #fff; }
.account-dialog::backdrop { background: #000b; }
h2 { font-size: 1.75rem; margin: 0.75rem 0; }
.close-account { display: grid; place-items: center; padding: 0; margin-left: auto; width: 44px; height: 44px; border: 0; border-radius: 50%; background: #252525; color: #fff; }
fieldset { padding: 0; border: 0; min-width: 0; }
label { display: grid; gap: 0.4rem; margin-block: 1rem; }
input { min-width: 0; width: 100%; min-height: 44px; padding: 0.7rem; font: inherit; border: 1px solid #777; border-radius: 5px; background: #242424; color: #fff; }
.submit-account { width: 100%; min-height: 46px; border: 0; border-radius: 5px; color: #171717; background: var(--accent); font-weight: 700; }
.switch-mode { width: 100%; margin-top: 1rem; min-height: 44px; color: #ddd; background: none; border: 0; text-decoration: underline; }
[role=alert] { color: #ffb5b5; }
button:disabled { opacity: 0.6; cursor: wait; }
</style>
