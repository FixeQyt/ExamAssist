import i18next from "i18next";
import plTranslations from "../locales/pl.json";
import enTranslations from "../locales/en.json";

// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Translation resources
const resources = {
	pl: {
		translation: plTranslations
	},
	en: {
		translation: enTranslations
	},
};

// Initialize i18next
async function initI18n(language = "en") {
	await i18next.init({
		lng: language,
		fallbackLng: "en",
		resources,
	});
}

// Update UI with translations
function updateUI() {
	document.querySelectorAll("[data-i18n]").forEach((element) => {
		const key = element.getAttribute("data-i18n");
		element.textContent = i18next.t(key);
	});
	document.title = `${i18next.t("settings")} - Screenshot Selector`;
}

document.addEventListener("DOMContentLoaded", async () => {
	const apiKeyInput = document.getElementById("apiKey");
	const languageSelect = document.getElementById("language");
	const saveButton = document.getElementById("save");
	const deleteButton = document.getElementById("delete");
	const statusDiv = document.getElementById("status");

	// Load saved settings
	browserAPI.storage.sync.get(
		["pollinationsApiKey", "language"],
		async (result) => {
			if (result.pollinationsApiKey) {
				apiKeyInput.value = result.pollinationsApiKey;
			}

			const savedLanguage = result.language || "en";
			languageSelect.value = savedLanguage;

			await initI18n(savedLanguage);
			updateUI();
		},
	);

	// Language change handler
	languageSelect.addEventListener("change", async () => {
		const selectedLanguage = languageSelect.value;
		browserAPI.storage.sync.set({ language: selectedLanguage }, async () => {
			await initI18n(selectedLanguage);
			updateUI();
		});
	});

	saveButton.addEventListener("click", () => {
		const apiKey = apiKeyInput.value.trim();

		if (!apiKey) {
			statusDiv.className = "status error";
			statusDiv.textContent = i18next.t("pleaseEnterApiKey");
			return;
		}

		browserAPI.storage.sync.set({ pollinationsApiKey: apiKey }, () => {
			statusDiv.className = "status success";
			statusDiv.textContent = i18next.t("apiKeySaved");

			setTimeout(() => {
				statusDiv.style.display = "none";
			}, 3000);
		});
	});

	deleteButton.addEventListener("click", () => {
		browserAPI.storage.sync.remove(["pollinationsApiKey"], () => {
			apiKeyInput.value = "";
			statusDiv.className = "status success";
			statusDiv.textContent = i18next.t("apiKeyDeleted");

			setTimeout(() => {
				statusDiv.style.display = "none";
			}, 3000);
		});
	});
});

