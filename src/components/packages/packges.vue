<script lang="ts" setup>
import { fs } from "@/integrations/vfs"
import { resolveRecommendPackage } from "@/integrations/packages"
import { debounce } from "@/utils/debounce"

interface PackageMeta {
  description: string
  name: string
  source: string
  url: string
  version?: string
}
const active = ref('Installed')
const keyword = ref('')
const packages = ref<PackageMeta[]>([])

watch(() => keyword.value, debounce(async () => {
  switch(active.value) {
    case 'Installed':
      packages.value = JSON.parse(fs.readFile('packages.json')!.content)
      break
    case 'Packages':
      if (keyword.value) {
        packages.value = await resolveRecommendPackage(keyword.value)
      } else {
        packages.value = []
      }
      break
    default:
      packages.value = []
      break
  }
  console.log('[packagesMetadata change]', packages.value)
}), { immediate: true })

</script>
<template>
{{active}}
  <div w-full h-full bg-dark-3 flex flex-col cursor-default>
    <input
      type="text" placeholder="pick package" v-model="keyword" flex-1 text-4
      outline-0 border-0 rounded-lg pl-3 mx-5 my-2 bg-gray-5 text-white placeholder-gray-400
    >
    <div w-full>
      <div v-for="pkg in packages" :key="pkg.name" m-3 p-3 hover:bg-dark-1>
        <p flex justify-between items-center>
          <a target="_blank" :href="`https://www.npmjs.com/package/${pkg.name}`">
            {{ pkg.name }}<span v-if="pkg.version">@{{ pkg.version }}</span>
          </a>
          <a bg-gray p-1 rounded-sm :href="pkg.url" target="_blank">{{ pkg.source }}</a>
        </p>
        <p mt-3>
          {{ pkg.description }}
        </p>
      </div>
    </div>
  </div>
</template>
<style scoped>
::-webkit-scrollbar {
  width: 12px;
}
::-webkit-scrollbar-track {
  border-radius: 10px;
}
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.5);
}
::-webkit-scrollbar-thumb:window-inactive {
  background: rgba(0, 0, 0, 0.5);
}
</style>
