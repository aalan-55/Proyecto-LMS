import { reactive } from 'vue'

const savedLang = localStorage.getItem('lang') || 'en'

export const i18n = reactive({
  lang: savedLang,

  cache: {
    en: {},
    es: {}
  },

  async translate(text) {
    if (this.lang === 'en') return text
    if (this.cache[this.lang][text]) return this.cache[this.lang][text]

    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`)

      const data = await response.json()
      const translated = data.responseData.translatedText

      this.cache[this.lang][text] = translated

      return translated
    } catch (err) {
      console.error("Translation Error:", err)
      return text
    }
  },

  t(text) {
    if (this.lang === 'en') return text
    if (this.cache[this.lang] && this.cache[this.lang][text]) {
      return this.cache[this.lang][text]
    }

    this.translate(text)
    return text
  },

  setLang(lang) {
    this.lang = lang
    localStorage.setItem('lang', lang)
  }
})