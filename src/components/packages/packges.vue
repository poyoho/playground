<script lang="ts" setup>
import { fs } from "@/integrations/vfs"
import {
  resolveRecommendPackage,
  resolvePackageData,
  resolvePackageMetadata
} from "@/integrations/packages"
import { debounce } from "@/utils/debounce"
import type { Packages, PackageMeta } from "."

const props = defineProps({
  active: {
    type: String
  }
})

const keyword = ref('')
const packageMeta = ref<Packages>({ dependencies: {} })
const packages = ref<PackageMeta[]>()
const versionRecord = ref<{
  [key: string]: { list: string[], current: string }
}>({})

function updatePackage() {
  packageMeta.value = JSON.parse(fs.readFile('packages.json')!.content) as Packages
  packages.value = Object.keys(packageMeta.value.dependencies)
    .filter(name => name.includes(keyword.value))
    .map(name => ({ ...packageMeta.value.dependencies[name]!, name }))
}

fs.subscribe('delete', () => updatePackage())
fs.subscribe('update', () => updatePackage())
updatePackage()

watch(() => keyword.value || props.active, debounce(async () => {
  console.log('[packagesMetadata change]', keyword)
  switch(props.active) {
    case 'Installed':
      updatePackage()
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

function colorFormat(status?: string): string {
  return ({
    'UNBUILT': 'bg-yellow-1 text-yellow-5',
    'ERROR': 'bg-red-1 text-red-5',
    'LOCAL': 'bg-blue-1 text-blue-5',
    'SUCCESS': 'bg-green-1 text-green-5',
  } as any)[status || ''] || 'bg-gray-1 text-gray-5'
}

async function fetchPackageVersionList(pkgName: string) {
  const packageData = await resolvePackageData(pkgName)
  const list = Object.keys(packageData.versions).slice(-10, -1).reverse()
  versionRecord.value[pkgName] = {
    list,
    current: list[0]
  }
}

async function installPackage(pkgName: string, version: string) {
  const pkg = await resolvePackageMetadata(pkgName, version)
  console.log(pkg)
  // fs.writeBaseFile('packages.json', JSON.stringify(packageMeta.value, null, 2))
}

function uninstallPackage(pkgName: string) {
  delete packageMeta.value.dependencies[pkgName]
  fs.writeBaseFile('packages.json', JSON.stringify(packageMeta.value, null, 2))
}

</script>
<template>
  <div w-full h-full bg-dark-3 flex flex-col cursor-default>
    <input
      type="text" placeholder="pick package" v-model="keyword"
      outline-0 border-0 pl-3 m-3 bg-gray-5 text-white placeholder-gray-400 text-4 h-8
    >
    <div w-full overflow-scroll flex-1 class="scroll">
      <div v-for="pkg in packages" :key="pkg.name" m-3 p-3 hover:bg-dark-1>
        <p flex justify-between items-center>
          <a
            target="_blank"
            :href="`https://www.npmjs.com/package/${pkg.name}`"
          >
            {{ pkg.name }}
            <span v-if="pkg.version">@{{ pkg.version }}</span>
          </a>
          <a
            p-1 px-2 rounded-sm
            :class="colorFormat(pkg.source || pkg.buildStatus)"
            :href="pkg.url"
            target="_blank"
          >
            {{ pkg.source || pkg.buildStatus }}
          </a>
        </p>
        <p mt-3 break-words line-clamp-4>
          {{ pkg.description }}
        </p>
        <p flex justify-end v-if="props.active === 'Packages' && !packageMeta.dependencies[pkg.name]">
          <carbon:package h-6 w-6 cursor-pointer v-if="!versionRecord[pkg.name]" @click="fetchPackageVersionList(pkg.name)"></carbon:package>
          <p v-else relative select-none flex items-center flex-gap-3>
            <Expand w-30 bg-dark-9 p-2 rounded-lg inline text-center>
              <p cursor-pointer>{{ versionRecord[pkg.name].current }}</p>
              <template #view>
                <ul absolute top-12 left-1 rounded-lg overflow-hidden>
                  <li
                  bg-dark-1 text-light-1 line-clamp-1 py-2 px-1 text-4 hover:bg-dark-6 cursor-pointer w-30
                    v-for="ver in versionRecord[pkg.name].list"
                    :value="ver"
                    :key="ver"
                    @click="versionRecord[pkg.name].current = ver"
                  >
                    {{ ver }}
                  </li>
                </ul>
              </template>
            </Expand>
            <ic:baseline-check inline @click="installPackage(pkg.name, versionRecord[pkg.name].current)"/>
          </p>
        </p>
        <p flex justify-end v-else>
          <ph:trash flex justify-end h-6 w-6 @click="uninstallPackage(pkg.name)"></ph:trash>
        </p>
      </div>
    </div>
  </div>
</template>
