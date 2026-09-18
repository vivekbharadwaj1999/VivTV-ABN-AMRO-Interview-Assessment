# VivTV

A responsive TV-show discovery app built with Vue 3, TypeScript and the TVMaze API. Browse shows by genre and rating, search by name, and explore episodes and cast without losing your place in the catalogue.

## Run locally

Developed with **Node.js 24.11.1** and **npm 11.6.2**. Use Node 24 and npm 11; `.nvmrc` records the development Node version.

```sh
npm ci
npm run dev
```

Open the URL printed in the terminal. No API key or environment file is needed. An internet connection is required for TVMaze data and artwork.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm test` | Run unit and component tests |
| `npm run test:watch` | Rerun tests while editing |
| `npm run type-check` | Check TypeScript and Vue types |
| `npm run build` | Check types and build into `dist/` |
| `npm run preview` | Preview the production build locally |

To test on a phone connected to the same Wi-Fi, run `npm run dev -- --host 0.0.0.0` and open the Network URL shown in the terminal. Local accounts require HTTPS or localhost; browsing works over the local network's HTTP address.

## Features

- Horizontal genre rows, sorted by rating with unrated shows last.
- Search by show name across TVMaze's catalogue, with loading, empty and retry states.
- Shareable show URLs with an Overview, Episodes and Cast modal.
- A featured banner randomly chosen from the loaded collection's ten highest-rated shows, avoiding the previous selection when possible.
- Ranked top picks and the ten most recently opened shows, without duplicates.
- Desktop card previews and smooth row navigation; swipeable rows and direct card taps on mobile.
- Sticky navigation, a mobile search/genre pill and a layout that adapts to the on-screen keyboard.
- Optional local account creation, login and logout.

## Technical decisions

**Vue 3** matches the assessment's preferred framework. Single-file components keep each component's template, behaviour and styling together. The app uses ordinary refs, computed values, props and events, without a global state library or component framework.

**TypeScript** documents the API fields used by the app, including nullable ratings and images. **Vite** provides development and build tooling; the interface is built with custom CSS, native controls and native scrolling rather than a UI template or carousel plugin.

**Vue Router** gives each show a URL at `/show/:id`. The detail modal is a nested route, so the catalogue and search results remain mounted underneath it. Closing the modal returns to browsing without resetting the rows. Direct links also work. A native HTML dialog handles focus containment and makes the background inert while details are open.

API requests live in `api/tvmaze.ts`, while each view or content section owns its loading and error state. AbortController cancels obsolete requests. Optional artwork failures fall back to a poster. Small TypeScript helpers handle grouping, ranking, summaries and browsing history separately from presentation.

## Source layout

```text
src/
  App.vue          Shared navigation, search controls and footer
  main.ts          Vue entry point
  styles.css       Theme, shared styles and accessibility defaults
  api/             TVMaze requests and response handling
  router/          Dashboard and show-detail routes
  views/           Dashboard and show-detail content
  components/      Cards, rows, hero, modal, search, accounts and detail tabs
  types/           API fields used by the interface
  utils/           Grouping, summaries, discovery and local storage
```

Tests sit beside the components and helpers they cover.

## Data and scope

The dashboard loads the first show-index page, containing up to 250 shows. Genre rows and top picks are ranked within this selection, not across all of TVMaze. Equal ratings are sorted by name. Shows can appear in more than one genre.

Search uses TVMaze's search endpoint rather than filtering the dashboard selection. Results retain the API's relevance order. Requests are cancelled when replaced, and stale responses cannot overwrite newer results.

Episodes include specials. The season selector is derived from the returned episodes, and summaries start collapsed to avoid spoilers. All episodes load once per detail visit; fetching per season would be a useful improvement for very long-running shows. Cast displays the main cast, not every episode's guest stars.

TVMaze summaries are converted to plain text instead of rendered with `v-html`. The banner displays the first sentence. TVMaze's documented public API provides metadata and artwork, not trailers or video playback.

“Previously watched” records shows whose details were opened, rather than actual playback. It stores the ten most recent unique shows in this browser, shared across local accounts. “Top picks for you” is a rating-based list, not personalised recommendations.

## Local accounts

Accounts demonstrate the registration and login interface; they are not an authentication boundary and do not protect content. Use a made-up username and a throwaway password.

JSON records in localStorage contain usernames, random 16-byte salts and 256-bit PBKDF2-SHA-256 hashes with 210,000 iterations. Plaintext passwords are not stored. Web Crypto requires HTTPS or localhost. The active session is held in memory and ends on refresh or logout; account records remain until site storage is cleared.

Browser storage can be inspected or changed. There is no email verification, password reset or cross-device synchronisation. Production authentication would need a backend or authentication provider with server-side verification and secure sessions.

## Accessibility and verification

The interface includes a skip link, visible focus styles, labelled icon buttons, keyboard-operated detail tabs, native modal behaviour and loading/error feedback. Reduced-motion preferences disable animations. Touch users open cards directly without relying on hover.

Vitest, Vue Test Utils and jsdom cover grouping and rating order, fallbacks, loading and retry behaviour, search, navigation, detail tabs, discovery helpers and local accounts. API responses are mocked, so these tests do not verify TVMaze availability. Native dialog focus handling and virtual-keyboard behaviour also need real-browser checks.

Desktop and phone checks were carried out during development. The final manual checks reported working mobile interactions and no console errors. Recheck these interactions after changing navigation or layout.

## Hosting

Build with `npm run build` and serve `dist/`. Configure the host to return `index.html` for client-side routes such as `/show/1`, so direct links and refreshes work. Use HTTPS for local account functionality.

## Attribution

Show data and artwork come from [TVMaze](https://www.tvmaze.com/). See the [API documentation](https://www.tvmaze.com/api) and its [CC BY-SA 4.0 licence](https://creativecommons.org/licenses/by-sa/4.0/). Artwork belongs to its respective owners.
