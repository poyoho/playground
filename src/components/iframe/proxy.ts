// ReplProxy and srcdoc implementation from Svelte REPL
// MIT License https://github.com/sveltejs/svelte-repl/blob/master/LICENSE
// <script type="importmap"><!-- IMPORT_MAP --></script>

let uid = 1

interface PendingCMD {
  resolve: (value: unknown) => void
  reject: (reason?: any) => void
}

export type SandboxHandler =  Partial<{
  on_fetch_progress: (data: SandboxHandleData) => void
  on_error: (data: SandboxHandleData) => void
  on_load: (data: SandboxHandleData) => string
  on_unhandled_rejection: (data: SandboxHandleData) => void
  on_console: (data: SandboxHandleData) => void
  on_console_group: (data: SandboxHandleData) => void
  on_console_group_collapsed: (data: SandboxHandleData) => void
  on_console_group_end: (data: SandboxHandleData) => void
}>

export interface SandboxHandleData {
  action: string
  level?: string
  duplicate?: boolean
  args?: any[]
  label?: any
  id?: string
}

export class SandboxProxy {
  iframe: HTMLIFrameElement
  handlers: SandboxHandler
  pending_cmds: Map<number, PendingCMD>

  handle_event: (e: any) => void

  constructor(iframe: HTMLIFrameElement, handlers: SandboxHandler) {
    this.iframe = iframe
    this.handlers = handlers

    this.pending_cmds = new Map()

    this.handle_event = e => this.handle_repl_message(e)
    window.addEventListener('message', this.handle_event, false)
    ;(this.iframe.contentWindow as any)!.postAble.resolve(null)
  }

  destroy() {
    window.removeEventListener('message', this.handle_event)
  }

  iframe_command(action: string, args: any) {
    return new Promise((resolve, reject) => {
      const cmd_id = uid++
      this.pending_cmds.set(cmd_id, { resolve, reject })
      this.iframe.contentWindow!.postMessage({ action, cmd_id, args }, '*')
    })
  }

  handle_command_message(cmd_data: any) {
    const action = cmd_data.action
    const id = cmd_data.cmd_id
    const handler = this.pending_cmds.get(id)

    if (handler) {
      this.pending_cmds.delete(id)
      if (action === 'cmd_error') {
        const { message, stack } = cmd_data
        const e = new Error(message)
        e.stack = stack
        handler.reject(e)
      }

      if (action === 'cmd_ok') {
        handler.resolve(cmd_data.args)
      }
    }
    else {
      console.error('command not found', id, cmd_data, [
        ...this.pending_cmds.keys(),
      ])
    }
  }

  handle_repl_message(event: any) {
    if (event.source !== this.iframe.contentWindow) {
      return
    }
    const { action, args, command_id } = event.data
    switch (action) {
      case 'cmd_error':
      case 'cmd_ok':
        return this.handle_command_message(event.data)
      case 'fetch_progress':
        return this.handlers.on_fetch_progress && this.handlers.on_fetch_progress(args.remaining)
      case 'error':
        return this.handlers.on_error && this.handlers.on_error(event.data)
      case 'unhandledrejection':
        return this.handlers.on_unhandled_rejection && this.handlers.on_unhandled_rejection(event.data)
      case 'console':
        return this.handlers.on_console && this.handlers.on_console(event.data)
      case 'console_group':
        return this.handlers.on_console_group && this.handlers.on_console_group(event.data)
      case 'console_group_collapsed':
        return this.handlers.on_console_group_collapsed && this.handlers.on_console_group_collapsed(event.data)
      case 'console_group_end':
        return this.handlers.on_console_group_end && this.handlers.on_console_group_end(event.data)
      case 'load':
        const data = this.handlers.on_load && this.handlers.on_load(event.data)
        this.iframe.contentWindow!.postMessage({ action, args: { data }, command_id }, '*')
        return
    }
  }

  eval(script: string | string[]) {
    return this.iframe_command('eval', { script, type: 'module' })
  }

  evalShim(script: string | string[]) {
    return this.iframe_command('eval', { script, type: 'module-shim' })
  }

  handle_links() {
    return this.iframe_command('catch_clicks', {})
  }
}