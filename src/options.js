import i18next from "i18next";

// Translation resources
const resources = {
	pl: {
		translation: {
			settings: "Ustawienia",
			apiKey: "API Key",
			language: "Język",
			save: "Zapisz",
			delete: "Usuń",
			apiKeySaved: "API key zapisany pomyślnie!",
			apiKeyDeleted: "API key usunięty pomyślnie!",
			pleaseEnterApiKey: "Proszę wpisać API key",
			polish: "Polski",
			english: "Angielski",
		},
	},
	en: {
		translation: {
			settings: "Settings",
			apiKey: "API Key",
			language: "Language",
			save: "Save",
			delete: "Delete",
			apiKeySaved: "API key saved successfully!",
			apiKeyDeleted: "API key deleted successfully!",
			pleaseEnterApiKey: "Please enter API key",
			polish: "Polish",
			english: "English",
		},
	},
};

// Initialize i18next
async function initI18n(language = "pl") {
	await i18next.init({
		lng: language,
		fallbackLng: "pl",
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
	chrome.storage.sync.get(
		["pollinationsApiKey", "language"],
		async (result) => {
			if (result.pollinationsApiKey) {
				apiKeyInput.value = result.pollinationsApiKey;
			}

			const savedLanguage = result.language || "pl";
			languageSelect.value = savedLanguage;

			await initI18n(savedLanguage);
			updateUI();
		},
	);

	// Language change handler
	languageSelect.addEventListener("change", async () => {
		const selectedLanguage = languageSelect.value;
		chrome.storage.sync.set({ language: selectedLanguage }, async () => {
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

		chrome.storage.sync.set({ pollinationsApiKey: apiKey }, () => {
			statusDiv.className = "status success";
			statusDiv.textContent = i18next.t("apiKeySaved");

			setTimeout(() => {
				statusDiv.style.display = "none";
			}, 3000);
		});
	});

	deleteButton.addEventListener("click", () => {
		chrome.storage.sync.remove(["pollinationsApiKey"], () => {
			apiKeyInput.value = "";
			statusDiv.className = "status success";
			statusDiv.textContent = i18next.t("apiKeyDeleted");

			setTimeout(() => {
				statusDiv.style.display = "none";
			}, 3000);
		});
	});
});

