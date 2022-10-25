<script setup></script>

<template>
  <div class="h-screen flex justify-center items-center flex-col">
    <div class="alert alert-error shadow-lg w-6/12 mb-10" v-if="error">
      <div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current flex-shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
    </div>

    <h1 class="text-4xl">STTTTST</h1>
    <h2 class="text-2xl mt-2.5 mb-5">
      Speech-to-Text Text-to-Speech Translation
    </h2>

    <!-- https://www.npmjs.com/package/vue-select -->
    <!-- https://vue-select.org/guide/install.html -->
    <p class="mt-5" id="fromLanguage">From Language</p>
    <v-select
      :options="languagesSelectAr"
      label="lang"
      v-model="recordLang"
      class="w-3/12 my-2.5"></v-select>

    <p class="mt-2">To Language</p>
    <v-select
      :options="voicesSelectAr"
      :reduce="displayName => displayName"
      label="displayName"
      v-model="translationLang"
      class="w-3/12 my-2.5"></v-select>

    <textarea
      class="textarea textarea-bordered w-4/12 mb-3 mt-6"
      placeholder="Recorded Text"
      v-model="recordedText"></textarea>

    <textarea
      class="textarea textarea-bordered w-4/12 mt-3 mb-6"
      placeholder="Translation"
      v-model="translatedText"></textarea>

    <div class="flex justify-center gap-3 my-2.5 w-3/12">
      <button
        class="btn btn-primary w-7/12"
        :class="isRecording ? 'animate-pulse' : ''"
        @click="record">
        {{ isRecording ? 'Stop' : 'Record' }}
      </button>

      <button class="btn btn-primary w-7/12" @click="translate">
        Translate
      </button>

      <button class="btn btn-primary w-7/12" @click="play">Play</button>
    </div>
  </div>
</template>

<script>
const synth = window.speechSynthesis
let SpeechRecognition

import axios from 'axios'

export default {
  data() {
    return {
      error: null,
      voices: [],
      voicesSelectAr: [],
      languagesSelectAr: [],
      recordLang: null,
      translationLang: null,
      isRecording: false,
      recordedText: '',
      translatedText: '',
      recognition: null
    }
  },

  methods: {
    /**
     * https://mdn.github.io/dom-examples/web-speech-api/speak-easy-synthesis
     * https://github.com/mdn/dom-examples/blob/main/web-speech-api/speak-easy-synthesis/script.js
     */
    requestVoices() {
      this.voices = synth.getVoices()

      // sort by lang-code
      this.voices.sort((a, b) => {
        const aname = a.lang.toUpperCase()
        const bname = b.lang.toUpperCase()

        if (aname < bname) {
          return -1
        } else if (aname == bname) {
          return 0
        } else {
          return +1
        }
      })

      // remove duplicate entries from array -> Set
      this.languagesSelectAr = [
        ...new Set(this.voices.map(v => v.lang.substring(0, 2)))
      ]

      this.voicesSelectAr = this.voices.map(v => {
        return {
          name: v.name,
          lang: v.lang,
          shortcode: v.lang.substring(0, 2),
          displayName:
            `${v.name} (${v.lang})` + (v.default ? ' -- DEFAULT' : '')
        }
      })
    },

    /**
     * https://mdn.github.io/dom-examples/web-speech-api/phrase-matcher
     * https://github.com/mdn/dom-examples/blob/main/web-speech-api/phrase-matcher/script.js
     */
    record() {
      this.isRecording = !this.isRecording

      if (!this.isRecording) {
        this.recognition.stop()
        return
      }

      this.recognition.lang = this.recordLang

      this.recognition.start()

      this.recognition.onresult = event => {
        let speechResult = event.results[0][0].transcript
        this.recordedText = speechResult
        this.isRecording = false
      }
    },

    /**
     * -- Translator: LibreTranslate --
     * https://libretranslate.com
     * https://github.com/LibreTranslate/LibreTranslate
     * https://libretranslate.com/docs
     * Installation: pip install libretranslate
     * Start (ignore error-msg): libretranslate
     * Hosted via PiP-Service -> Port: 5000 (default)
     *
     *
     * -- CORS-Error --
     * CORS-Error: NodeJS CORS Proxy
     * https://github.com/Rob--W/cors-anywhere
     * https://www.npmjs.com/package/cors-anywhere
     * Install (not in project folder): npm i cors-anywhere
     * Used example code from GitHub -> index.js
     * Port: 5050 (default: 8080)
     * Usage: URL as prefix in front of URL for LibreTranslate
     */
    async translate() {
      if (this.recordLang === null || this.translationLang === null) {
        console.error('Please select From/To Languages!')
        return
      }

      axios
        .post('http://localhost:5050/127.0.0.1:5000/translate', {
          q: this.recordedText,
          source: this.recordLang,
          target: this.translationLang.shortcode
        })
        .then(res => (this.translatedText = res.data.translatedText))
    },

    /**
     * https://mdn.github.io/dom-examples/web-speech-api/speak-easy-synthesis
     * https://github.com/mdn/dom-examples/blob/main/web-speech-api/speak-easy-synthesis/script.js
     */
    play() {
      if (synth.speaking) {
        console.error('speechSynthesis.speaking')
        return
      }

      if (this.translatedText !== '') {
        const utterThis = new SpeechSynthesisUtterance(this.translatedText)

        utterThis.onend = function (event) {
          console.log('SpeechSynthesisUtterance.onend')
        }

        utterThis.onerror = function (event) {
          console.error('SpeechSynthesisUtterance.onerror')
        }

        const voiceIndex = this.voices.findIndex(
          v => v.name === this.translationLang.name
        )
        if (voiceIndex >= 0) {
          utterThis.voice = this.voices[voiceIndex]
        }

        synth.speak(utterThis)
      }
    }
  },

  created() {
    try {
      SpeechRecognition = webkitSpeechRecognition
      this.recognition = new SpeechRecognition()
    } catch (e) {
      this.error = e
    }

    setTimeout(() => {
      this.requestVoices()
    }, 100)
  }
}
</script>
