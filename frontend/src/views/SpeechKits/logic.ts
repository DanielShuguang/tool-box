export const SpeechLangStorageKey = 'speech-language'

export function useInitSpeechEngine() {
  let synth: SpeechSynthesis | null = null
  const speechText = ref('')
  const voice = ref<SpeechSynthesisVoice>()
  const voices = ref<SpeechSynthesisVoice[]>([])

  const storage = useLocalStorage(SpeechLangStorageKey, '')

  const speech = useSpeechSynthesis(speechText, {
    lang: voice.value?.lang,
    voice: voice.value,
    window
  })
  const { isSupported } = speech

  onMounted(() => {
    if (isSupported.value) {
      setTimeout(() => {
        synth = window.speechSynthesis

        voices.value = synth.getVoices()

        const target = storage.value ? voices.value.find(v => v.name === storage.value) : null
        voice.value = target || voices.value[0]
      })
    }
  })

  function handleChangeVoice(value: string) {
    const target = voices.value.find(v => v.name === value)
    if (target) {
      voice.value = target
    }
  }

  return { voice, synth, speechText, voices, speech, handleChangeVoice }
}
