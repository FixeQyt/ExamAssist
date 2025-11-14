/* SPDX-License-Identifier: MIT */

import { browserAPI } from "./selector/browserApi.js";
import {
	DEFAULT_LANGUAGE,
	getTranslationsFor,
	initLanguage,
} from "./selector/translator.js";
import { TRANSLATIONS_KEY } from "./selector/constants.js";

function getLanguageFromStorage(api) {
	return new Promise((resolve) => {
		api.storage.sync.get(["language"], (result) => {
			resolve(result?.language || DEFAULT_LANGUAGE);
		});
	});
}

function injectSelector(api, tabId, translations) {
	return api.scripting
		.executeScript({
			target: { tabId },
			func: (key, value) => {
				globalThis[key] = value;
			},
			args: [TRANSLATIONS_KEY, translations],
		})
		.then(() =>
			api.scripting.executeScript({
				target: { tabId },
				files: ["selector.js"],
			}),
		)
		.catch((error) => {
			console.error("Failed to inject screenshot selector", error);
			throw error;
		});
}

function registerActionClickListener(api) {
	api.action.onClicked.addListener((tab) => {
		if (!tab?.id) {
			console.error("Cannot start selector without a valid tab id");
			return;
		}

		getLanguageFromStorage(api)
			.then((language) => {
				const translations = getTranslationsFor(language);
				return injectSelector(api, tab.id, translations);
			})
			.catch((error) => {
				console.error(
					"Unable to resolve language for screenshot selector",
					error,
				);
			});
	});
}

function registerCaptureListener(api) {
	api.runtime.onMessage.addListener((request, _sender, sendResponse) => {
		if (request.action === "captureScreenshot") {
			api.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
				sendResponse({ dataUrl });
			});
			return true;
		}
		return undefined;
	});
}

async function bootstrapBackground() {
	await initLanguage(browserAPI);
	registerActionClickListener(browserAPI);
	registerCaptureListener(browserAPI);
}

bootstrapBackground().catch((error) => {
	console.error("Background bootstrap failed", error);
});