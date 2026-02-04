<script lang="ts" setup>
import { computed, toRaw } from 'vue'
import type { ObjectProperties } from '../types'

interface Props {
  objectProperties: ObjectProperties
}

interface Emits {
  (e: 'update:property', property: keyof ObjectProperties, value: unknown): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const getFillColor = computed(() => props.objectProperties.fill)
const getStrokeColor = computed(() => props.objectProperties.stroke)
const getStrokeWidth = computed(() => props.objectProperties.strokeWidth)
const getOpacity = computed(() => props.objectProperties.opacity)
const getStrokeDash = computed(() => toRaw(props.objectProperties.strokeDashArray))

const handlePropertyUpdate = (property: keyof ObjectProperties, value: unknown) => {
  emit('update:property', property, value)
}

const strokeDashOptions = [
  { label: '实线', value: JSON.stringify([]) },
  { label: '虚线', value: JSON.stringify([5, 5]) },
  { label: '点线', value: JSON.stringify([2, 4]) }
]

const colorModes: ('rgb' | 'hex' | 'hsl')[] = ['hex']
</script>

<template>
  <div
    class="property-panel w-[250px] border-l border-[--borderColor] bg-[--modalColor] p-[10px] overflow-y-auto">
    <n-collapse>
      <n-collapse-item title="填充颜色" name="fill">
        <div class="flex items-center gap-[10px]">
          <n-color-picker
            :value="getFillColor"
            :show-alpha="false"
            :modes="colorModes"
            @update:value="(v: string) => handlePropertyUpdate('fill', v)" />
        </div>
      </n-collapse-item>

      <n-collapse-item title="描边颜色" name="stroke">
        <div class="flex items-center gap-[10px]">
          <n-color-picker
            :value="getStrokeColor"
            :show-alpha="false"
            :modes="colorModes"
            @update:value="(v: string) => handlePropertyUpdate('stroke', v)" />
        </div>
      </n-collapse-item>

      <n-collapse-item title="线条宽度" name="strokeWidth">
        <n-slider
          :value="getStrokeWidth"
          :min="1"
          :max="20"
          :step="1"
          @update:value="(v: number) => handlePropertyUpdate('strokeWidth', v)" />
        <div class="text-right text-[12px] text-[--text-color-secondary]">
          {{ Math.round(getStrokeWidth * 100) }}%
        </div>
      </n-collapse-item>

      <n-collapse-item title="透明度" name="opacity">
        <n-slider
          :value="getOpacity"
          :min="0"
          :max="1"
          :step="0.1"
          @update:value="(v: number) => handlePropertyUpdate('opacity', v)" />
        <div class="text-right text-[12px] text-[--text-color-secondary]">
          {{ Math.round(getOpacity * 100) }}%
        </div>
      </n-collapse-item>

      <n-collapse-item title="线条样式" name="strokeDashArray">
        <n-select
          :value="JSON.stringify(getStrokeDash)"
          :options="strokeDashOptions"
          @update:value="(v: string) => handlePropertyUpdate('strokeDashArray', JSON.parse(v))" />
      </n-collapse-item>
    </n-collapse>
  </div>
</template>
