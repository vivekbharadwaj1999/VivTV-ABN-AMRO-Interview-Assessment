# VivTV

A TV show browsing app built as part of the ABN AMRO frontend developer interview assessment. It uses Vue 3, TypeScript and the TVMaze API.

My previous frontend work has been in React, so this was also a chance to learn Vue. The design takes inspiration from streaming services, with a dark background and a yellow theme. You can browse genres, search for a show, and open its description, episodes and cast.

## Running it

I used **Node.js 24.11.1** and **npm 11.6.2**. The Node version is also in `.nvmrc`.

```sh
git clone https://github.com/vivekbharadwaj1999/VivTV-ABN-AMRO-Interview-Assessment.git
cd VivTV-ABN-AMRO-Interview-Assessment
npm ci
npm run dev
```

Open the local URL printed in the terminal. There is no API key or environment file to set up, but you need an internet connection to load the shows and images.

To try it on a phone on the same wireless network:

```sh
npm run dev -- --host 0.0.0.0
```

Use the Network URL from the terminal on your phone. Browsing works over HTTP, but account creation and login need HTTPS or localhost because they use Web Crypto.

## How it works

The homepage groups shows into horizontal genre rows, with the highest rated first. Shows without a rating go at the end. The banner picks a show from the collection's top ten, and search uses TVMaze's search endpoint so it can find shows outside the homepage collection too.

Clicking a card opens a details modal with Overview, Episodes and Cast tabs. It changes the URL to `/show/:id`, so you can share a show or open it directly. On mobile, the rows can be swiped and the search and genre controls sit in a floating pill at the bottom.

There are a few extras: top picks, recently opened shows, and a small local signup/login flow. You don't need to log in to browse.

I added “Find my next show” for those times when you keep browsing but can't decide what to watch. The button appears beside Previously watched once you've opened three different shows. On a phone, it's labelled “Next show” so it fits beside the heading.

It looks at the genres in your last ten opened shows and suggests a show from the homepage collection, with a short explanation of why it matches. Genres you've explored more often carry more weight, and ratings decide between equally good matches. Anything still in your recent history is left out. “Try another” gives you the next suggestion without adding it to your history, while “More details” opens its normal details modal. As you explore different shows, the suggestions change too.

## Some decisions behind the code

- **Vue and state:** Vue is preferred in the assignment, and this app was a manageable way to learn it coming from React. Most state belongs to one part of the interface, such as the selected season or active detail tab, so it stays in that component. Props and events connect the header search to the results. The small amount of shared browsing history uses a shared ref, so a separate state management library didn't seem necessary here.
- **Reusable cards and rows:** genre lists, top picks and recently opened shows all use `GenreRow` and `ShowCard`. They need the same scrolling, poster fallbacks and links to details. Optional props control the ranking badges and heading counts without duplicating the components.
- **Grouping the API data:** TVMaze doesn't have a genre endpoint, so the homepage fetches a show index page and groups it locally. A show can appear in several genres. Each group is sorted by rating, with missing ratings last and equal ratings sorted by name. This logic lives in a helper so it can be tested without rendering the page.
- **Details as a route and a modal:** opening a show should keep your place in the catalogue, but it should also have its own URL. A nested Vue Router route gives us both. The homepage stays mounted under the modal, and browser Back and Forward work with the selected show. A native dialog handles focus containment and makes the background inactive while it is open.
- **Separate requests and error states:** the request URLs and HTTP checks are in `src/api/tvmaze.ts`. Episodes, cast and artwork have separate requests, so a failed cast request doesn't hide the show's overview. Each section can show its own retry or fallback. Search cancels the previous request and checks for cancellation before displaying results, so a slow earlier response cannot replace a newer search.
- **TypeScript and missing data:** show images, ratings and several other API fields can be missing. The types make those cases visible while writing components. The UI still needs explicit fallbacks, such as “Not rated” or a poster placeholder; TypeScript doesn't validate the response at runtime.
- **CSS and browser controls:** the assignment asks to keep plugins and templates to a minimum. Vite handles the development tooling, while the UI uses custom CSS. Horizontal overflow gives the rows touch scrolling, and the desktop arrows use `scrollBy`, so there is no carousel dependency. Mobile controls use media queries, and the search pill also follows the visual viewport so it can stay above the phone keyboard.

The shared header and footer are in `App.vue`. The two views are in `src/views`, reusable UI pieces are in `src/components`, and helpers for grouping, summaries and local storage are in `src/utils`. Tests live separately in `tests/`, with matching `components`, `views` and `utils` folders.

## A few things to know

The homepage loads the **first page of TVMaze's show index**, up to 250 shows. So the top ten is the top ten within that collection, not the whole TVMaze catalogue. Search is not limited to that page.

“Previously watched” means shows whose details you have opened. There is no actual video playback, and TVMaze's public API doesn't provide trailers. This history keeps the last ten unique shows in localStorage and is shared by accounts in the same browser. “Top picks for you” is based on ratings, not personal recommendations.

Episodes include specials, and cast shows the main cast. All episodes are fetched when you open a show's details; loading them per season would be an improvement for shows with a lot of episodes. Episode summaries are collapsed initially to avoid spoilers. API summaries are converted to plain text before being displayed.

The account feature runs entirely in the frontend and is not production authentication. It saves usernames and salted password hashes in localStorage using PBKDF2-SHA-256. It does not save plaintext passwords, but browser storage can still be inspected or changed, so use a throwaway password. Accounts stay in that browser, while the login session ends on refresh. There is no password reset or access to the same account from another device. I decided to include this simple frontend authentication example to showcase a signup and login flow.

## Tests and build

```sh
npm test
npm run build
```

Tests use Vitest, Vue Test Utils and jsdom. They cover rating order, genre grouping, recommendations, search, show details, modal navigation, missing data, error/retry states and the local account helpers. The API is mocked in tests.

`npm run build` runs the TypeScript check and creates the production files in `dist`. You can preview those with `npm run preview`. There is also `npm run test:watch` for working on tests and `npm run type-check` to check types separately.

The app has also been checked on desktop and a phone, including the mobile keyboard behaviour. Keyboard navigation, visible focus styles and reduced motion settings are supported. Browser checks are still needed alongside the tests, especially for the dialogs and mobile layout.

## Data source

Show information and artwork come from [TVMaze](https://www.tvmaze.com/).
