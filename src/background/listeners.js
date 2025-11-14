/* SPDX-License-Identifier: MIT */

import { DEFAULT_LANGUAGE, getTranslationsFor } from "../selector/translator.js";
import { TRANSLATIONS_KEY } from "../selector/constants.js";

function getLanguageFromStorage(browserAPI) {
	return new Promise((resolve) => {
		browserAPI.storage.sync.get(["language"], (result) => {
			resolve(result?.language || DEFAULT_LANGUAGE);
		});
	});
}

export function registerActionClickListener(browserAPI) {
	browserAPI.action.onClicked.addListener((tab) => {
		if (!tab?.id) {
			console.error("Cannot start selector without a valid tab id");
			return;
		}

		getLanguageFromStorage(browserAPI)
			.then((language) => {
				const translations = getTranslationsFor(language);
				return injectSelector(browserAPI, tab.id, translations);
			})
			.catch((error) => {
				console.error("Unable to resolve language for screenshot selector", error);
			});
	});
}

function injectSelector(browserAPI, tabId, translations) {
	return browserAPI.scripting
		.executeScript({
			target: { tabId },
			func: (key, value) => {
				globalThis[key] = value;
			},
			args: [TRANSLATIONS_KEY, translations],
		})
		.then(() =>
			browserAPI.scripting.executeScript({
				target: { tabId },
				files: ["selector.js"],
			}),
		)
		.catch((error) => {
			console.error("Failed to inject screenshot selector", error);
			throw error;
		});
}

export function registerCaptureListener(browserAPI) {
	browserAPI.runtime.onMessage.addListener((request, _sender, sendResponse) => {
		if (request.action === "captureScreenshot") {
			browserAPI.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
				sendResponse({ dataUrl });
			});
			return true;
		}
		return undefined;
	});
}
