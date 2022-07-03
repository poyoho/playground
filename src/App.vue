<script setup lang="ts">
import { Sandbox, SandboxHandleData, SandboxExpose } from "@/components/iframe"
import { MonacoEditor } from "@/components/monaco"
import { TabsWrap, TabItem, Tabs } from "@/components/tabs/tabs"
import { fs } from "@/integrations/vfs"

const sandbox = ref<SandboxExpose>()

onMounted(async () => {
  sandbox.value!.evalShim(fs.readFile('main.ts')!.toString())
})

function loadModules(data: SandboxHandleData): string {
  return fs.readFile(data.id || '')?.toString() || ''
}

function changeTab(name: string) {
  console.log(name)
}
</script>
<template>
  <div w-full h-full flex>
    <div class="edit-wrap" flex flex-col w="1/2">
      <TabsWrap @change="changeTab">
        <Tabs>
          <TabItem text-white cursor-pointer name="main.ts">main.ts</TabItem>
        </Tabs>
      </TabsWrap>
      <MonacoEditor/>
    </div>
    <div w="1/2" h-full>
      <Sandbox ref="sandbox" :load-modules="loadModules"></Sandbox>
    </div>
  </div>
</template>
