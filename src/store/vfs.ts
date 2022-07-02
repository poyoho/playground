import { acceptHMRUpdate, defineStore } from 'pinia'

export const useUserStore = defineStore('vfs', () => {

})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUserStore, import.meta.hot))
}
