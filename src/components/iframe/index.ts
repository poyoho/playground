import Sandbox from "./sandbox.vue"
export * from "./proxy"
export {
  Sandbox,
}

export interface SandboxExpose {
  eval(scripts: string | string[]): void
  evalShim(scripts: string | string[]): void
}
