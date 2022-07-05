<script lang="ts">
import { defineComponent, ref, watch } from 'vue'

export default defineComponent({
  name: 'Expand',
  model: {
    prop: 'modelValue',
    event: 'update:modelValue'
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
  },
  emits: ['change', 'update:modelValue', 'blur'],
  setup(props, { emit }) {
    const checked = ref(false)
    watch(() => props.modelValue, () => {
      checked.value = props.modelValue
    })
    watch(checked, () => {
      emit('change', checked.value)
      emit('update:modelValue', checked.value)
    })
    return {
      checked,
      blur() {
        checked.value = false
        emit('blur')
      }
    }
  }
})
</script>
<template>
  <div
    style="outline: 0"
    tabindex="1"
    v-bind="$attrs"
    @blur="blur"
    @click="checked = !checked"
  >
    <slot></slot>
    <slot v-if="checked" name="view"></slot>
  </div>
</template>
