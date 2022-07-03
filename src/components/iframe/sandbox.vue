<script setup lang="ts">
import { SandboxHandleData, SandboxProxy } from "./proxy"
import srcdoc from "./srcdoc.html?raw"
import { createDefer } from "@/utils/promise"
import { PropType } from "vue";

// const IMPORT_MAP = "<!-- IMPORT_MAP -->"

const emit = defineEmits([
  'fetch_progress',
  'error',
  'unhandled_rejection',
  'console',
  'console_group',
  'console_group_collapsed',
  'console_group_end',
])

const props = defineProps({
  loadModules: {
    type: Function as PropType<(data: SandboxHandleData) => Promise<string>>,
    required: true
  }
})

const sandbox = ref<HTMLIFrameElement>()
const proxy = createDefer<SandboxProxy>()

onDeactivated(() => {
  proxy.promise.then((proxy) => {
    proxy.destroy()
  })
})

function iframeLoad() {
  console.log("[iframe-sandbox] sandbox load")
  const sandboxProxy = new SandboxProxy(sandbox.value!, {
    on_fetch_progress: (data: SandboxHandleData) => emit("fetch_progress", data),
    on_error: (data: SandboxHandleData) => emit("error", data),
    on_unhandled_rejection: (data: SandboxHandleData) => emit("unhandled_rejection", data),
    on_console: (data: SandboxHandleData) => emit("console", data),
    on_console_group: (data: SandboxHandleData) => emit("console_group", data),
    on_console_group_collapsed: (data: SandboxHandleData) => emit("console_group_collapsed", data),
    on_console_group_end: (data: SandboxHandleData) => emit("console_group_end", data),
    on_load: (data: SandboxHandleData) => props.loadModules(data),
  })
  proxy.resolve(sandboxProxy)
}

defineExpose({
  eval(script: string | string[]) {
    proxy.promise.then((proxy) => {
      proxy.eval(script)
    })
  },
  evalShim(script: string | string[]) {
    proxy.promise.then((proxy) => {
      proxy.evalShim(script)
    })
  },
})
</script>

<template>
  <iframe
    ref="sandbox"
    w-full h-full border-0 outline-0
    allow-forms
    allow-modals
    allow-pointer-lock
    allow-popups
    allow-same-origin
    allow-scripts
    allow-top-navigation-by-user-activation
    @load="iframeLoad"
    :srcdoc="srcdoc"
  >
  </iframe>
</template>
