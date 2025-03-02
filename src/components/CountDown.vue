<script setup lang="ts">
import { TimeUnits } from '@/utils/time'

interface Props {
  endTime: Date
}

const props = defineProps<Props>()

const days = ref(0)
const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
const intervalId = ref<number | null>(null)

const calculateTime = (distance: number) => {
  return {
    days: Math.floor(distance / TimeUnits.Day),
    hours: Math.floor((distance % TimeUnits.Day) / TimeUnits.Hour),
    minutes: Math.floor((distance % TimeUnits.Hour) / TimeUnits.Minute),
    seconds: Math.floor((distance % TimeUnits.Minute) / TimeUnits.Second)
  }
}

const updateCountdown = () => {
  const now = new Date()
  const distance = props.endTime.getTime() - now.getTime()

  if (distance < 0) {
    resetTimer()
    return
  }

  const time = calculateTime(distance)
  days.value = time.days
  hours.value = time.hours
  minutes.value = time.minutes
  seconds.value = time.seconds
}

const resetTimer = () => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
    intervalId.value = null
  }
  ;[days, hours, minutes, seconds].forEach(t => (t.value = 0))
}

const startTimer = () => {
  resetTimer()
  updateCountdown()
  intervalId.value = setInterval(updateCountdown, 1000)
}

watch(() => props.endTime, startTimer)

onMounted(startTimer)
onBeforeUnmount(resetTimer)
</script>

<template>
  <div class="flex items-baseline gap-[4px]">
    <template v-if="days > 0">
      <span class="bg-[#f0f0f0] p-[4px_8px] min-w-[32px] text-center">
        {{ days.toString().padStart(2, '0') }}
      </span>
      <span class="text-[#666] text-[0.9em] m-[0_2px]">天</span>
    </template>
    <span class="bg-[#f0f0f0] p-[4px_8px] min-w-[32px] text-center">
      {{ hours.toString().padStart(2, '0') }}
    </span>
    <span class="text-[#666] text-[0.9em] m-[0_2px]">:</span>
    <span class="bg-[#f0f0f0] p-[4px_8px] min-w-[32px] text-center">
      {{ minutes.toString().padStart(2, '0') }}
    </span>
    <span class="text-[#666] text-[0.9em] m-[0_2px]">:</span>
    <span class="bg-[#f0f0f0] p-[4px_8px] min-w-[32px] text-center">
      {{ seconds.toString().padStart(2, '0') }}
    </span>
  </div>
</template>
