<script lang="ts" setup>
import { getSep } from '@/utils/system'
import { omit } from 'radash'
import { highlightProps } from 'naive-ui'

const props = defineProps({
  data: { type: String, required: true },
  search: { type: String, required: true },
  ...highlightProps
})

const sep = getSep()
const sepReg = /(\\|\/)/

const startLetter = computed(() => {
  const letters = props.data.split(sepReg).filter(el => el && !sepReg.test(el))
  letters.pop()
  return letters.join(sep)
})

const lastLetter = computed(() => {
  const last = props.data.split(sepReg).pop()
  return last || ''
})
</script>

<template>
  <span>
    <span v-if="lastLetter">{{ `${startLetter}${sep}` }}</span>
    <n-highlight
      :="omit($props, ['data', 'search'])"
      :text="lastLetter || data"
      :patterns="[search]"
    />
  </span>
</template>
