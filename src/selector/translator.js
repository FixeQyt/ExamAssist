/* SPDX-License-Identifier: MIT */

import plTranslations from '../locales/pl.json'
import enTranslations from '../locales/en.json'
import { TRANSLATIONS_KEY } from './constants.js'

export const DEFAULT_LANGUAGE = 'en'

const i18nResources = {
	pl: plTranslations,
	en: enTranslations,
}

let currentLanguage = DEFAULT_LANGUAGE

function resolveLanguage(lang) {
	return i18nResources[lang] ? lang : DEFAULT_LANGUAGE
}

export function translate(key, lang = currentLanguage) {
	const pack = getTranslationsFor(lang)
	return pack?.[key] ?? i18nResources[DEFAULT_LANGUAGE][key] ?? key
}

export function getTranslationsFor(lang = currentLanguage) {
	const resolved = resolveLanguage(lang)
	return i18nResources[resolved]
}

export async function initLanguage(browserAPI) {
	try {
		const result = await new Promise((resolve) => {
			browserAPI.storage.sync.get(['language'], resolve)
		})
		if (result?.language) {
			currentLanguage = resolveLanguage(result.language)
		}
	} catch (error) {
		console.error('Failed to initialize language', error)
	}
	return currentLanguage
}

export function setLanguage(lang) {
	currentLanguage = resolveLanguage(lang)
}

function getWindowObject() {
	return typeof window === 'undefined' ? undefined : window
}

export function getTranslations() {
	const win = getWindowObject()
	if (!win) {
		return {}
	}
	return win[TRANSLATIONS_KEY] || {}
}

export function consumeTranslations() {
	const win = getWindowObject()
	if (!win) {
		return getTranslationsFor()
	}
	const current = win[TRANSLATIONS_KEY] || {}
	delete win[TRANSLATIONS_KEY]
	return current
}

export function assignTranslations(translations) {
	const win = getWindowObject()
	if (!win) {
		return
	}
	win[TRANSLATIONS_KEY] = translations
}

export function createTranslator(translations = getTranslations()) {
	return (key) => translations?.[key] || key
}

export { i18nResources }
