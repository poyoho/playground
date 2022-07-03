import { h } from "vue"
const tabsToken = Symbol('tabsToken')

interface TabsContext {
  currentTab: string
}

export const TabsWrap = defineComponent({
  name: 'TabsWrap',
  emits: ['change'],
  props: {
    active: {
      type: String,
      required: false,
      default: ''
    }
  },
  setup(props, ctx) {
    const state = reactive<TabsContext>({
      currentTab: props.active
    })
    provide(tabsToken, state)

    watch(
      () => state.currentTab,
      () => {
        ctx.emit('change', state.currentTab)
      },
      { immediate: true }
    )

    return () =>
      h(
        'div',
        ctx.attrs,
        ctx.slots && ctx.slots.default && ctx.slots.default()
      )
  }
})

export const Tabs = defineComponent({
  name: 'Tabs',
  setup(_, ctx) {
    const tabCtx = inject(tabsToken)! as TabsContext
    if (!tabCtx)
      throw new Error('Tabs component must be used in a TabsWrap component')

    return () =>
      h(
        'ul',
        ctx.attrs,
        ctx.slots && ctx.slots.default && ctx.slots.default()
      )
  }
})

export const TabItem = defineComponent({
  name: 'TabItem',
  props: {
    name: {
      type: String,
      required: true
    }
  },
  setup(props, ctx) {
    const tabCtx = inject(tabsToken)! as TabsContext
    if (!tabCtx)
      throw new Error('TabItem component must be used in a TabsWrap component')

    function click() {
      tabCtx.currentTab = props.name
    }

    return () =>
      h(
        'li',
        { ...ctx.attrs, onClick: click },
        ctx.slots && ctx.slots.default && ctx.slots.default()
      )
  }
})

export const TabView = defineComponent({
  name: 'TabView',
  props: {
    name: {
      type: String,
      required: true
    }
  },
  setup(props, ctx) {
    const tabCtx = inject(tabsToken)! as TabsContext
    if (!tabCtx)
      throw new Error('TabView component must be used in a TabsWrap component')

    const active = computed(() => tabCtx.currentTab === props.name)

    return () => {
      if (!active.value) return null

      return h(
        'div',
        ctx.attrs,
        ctx.slots && ctx.slots.default && ctx.slots.default({ active })
      )
    }
  }
})
