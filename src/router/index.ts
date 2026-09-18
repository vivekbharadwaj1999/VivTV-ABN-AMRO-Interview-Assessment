import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ShowModal from '../components/ShowModal.vue'

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    // Opening or closing details should not move the catalogue underneath.
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
      children: [
        { path: 'show/:id', name: 'show', component: ShowModal, props: true },
      ],
    },
  ],
})
