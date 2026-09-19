import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ShowModal from '../components/ShowModal.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // Opening or closing details must preserve the catalogue's current scroll position.
    // Other navigation restores browser history position, follows an anchor or starts at the top.
    if (to.name === 'show' || from.name === 'show') return false
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      // Render details inside HomeView's outlet so the catalogue remains mounted.
      // Route params become component props, keeping the modal independent of route parsing.
      children: [
        { path: 'show/:id', name: 'show', component: ShowModal, props: true },
      ],
    },
  ],
})
