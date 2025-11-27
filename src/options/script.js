import i18next from "i18next";
import plTranslations from "../locales/pl.json";
import enTranslations from "../locales/en.json";
import { browserAPI } from "../selector/browserApi.js";

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
	const modelSelect = document.getElementById("model");
	const modelInfoDiv = document.getElementById("modelInfo");
	const languageSelect = document.getElementById("language");
	const saveButton = document.getElementById("save");
	const deleteButton = document.getElementById("delete");
	const refreshButton = document.getElementById("refreshModels");
	const statusDiv = document.getElementById("status");
	const buttonGroup = document.querySelector('.button-group');
	const toggleVisibilityBtn = document.querySelector(".toggle-visibility");
	const apiKeyGroup = document.getElementById("apiKeyGroup");
	const aiToggle = document.getElementById("aiToggle");
	const aiBadge = document.getElementById("aiBadge");
    
	let modelsByName = {};

	// Toggle password visibility
	if (toggleVisibilityBtn) {
		toggleVisibilityBtn.addEventListener("click", () => {
			const type = apiKeyInput.getAttribute("type") === "password" ? "text" : "password";
			apiKeyInput.setAttribute("type", type);
			toggleVisibilityBtn.classList.toggle("active");
		});
	}

	// Load saved settings
	const result = await browserAPI.storage.sync.get(["pollinationsApiKey", "language", "selectedModel", "aiEnabled"]);
	if (result?.pollinationsApiKey) {
		apiKeyInput.value = result.pollinationsApiKey;
	}

	const savedLanguage = result?.language || "en";
	languageSelect.value = savedLanguage;

	await initI18n(savedLanguage);
	updateUI();
	const aiEnabled = !!result?.aiEnabled;
	if (aiToggle) {
		aiToggle.checked = aiEnabled;
	}

	setAIControlsVisible(aiEnabled);

	if (aiEnabled) await fetchModels();
	if (aiToggle) {
		const label = aiToggle.closest('label');
		if (label) {
			label.setAttribute('tabindex', '0');
			label.addEventListener('keydown', (e) => {
				if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
					e.preventDefault();
					aiToggle.checked = !aiToggle.checked;
					aiToggle.dispatchEvent(new Event('change', { bubbles: true }));
				}
			});
		}
	}
    
	// Fetch model list and populate the model select
	async function fetchModels() {
		if (!aiToggle?.checked) {
			try {
				const resp = await fetch("https://text.pollinations.ai/models");
				if (!resp.ok) return;
				const models = await resp.json();
				const visionModels = models.filter((m) => m.vision === true);
				modelsByName = {};
				visionModels.forEach((m) => (modelsByName[m.name] = m));
			} catch (err) {
				// ignore silently
			}
			return;
		}
		try {
			showStatus(i18next.t("loading"), "info");
			const resp = await fetch("https://text.pollinations.ai/models");
			if (!resp.ok) throw new Error("Failed to fetch models");
			const models = await resp.json();
			// Filter only vision=true
			const visionModels = models.filter((m) => m.vision === true);
			modelsByName = {};
			// Clear select
			modelSelect.innerHTML = "";

			if (!visionModels.length) {
				const opt = document.createElement("option");
				opt.value = "";
				opt.textContent = i18next.t("loading");
				modelSelect.appendChild(opt);
				modelInfoDiv.classList.remove("visible");
				return;
			}

			visionModels.forEach((m) => {
				modelsByName[m.name] = m;
				const opt = document.createElement("option");
				opt.value = m.name;
				opt.textContent = `${m.name} — ${m.description || ""}`;
				modelSelect.appendChild(opt);
			});

			// Select saved model if present
			const savedModelName = result?.selectedModel || result?.pollinationsModelName;
			if (savedModelName && modelsByName[savedModelName]) {
				modelSelect.value = savedModelName;
				updateModelInfo(modelsByName[savedModelName]);
			} else if (modelsByName["openai"]) {
				modelSelect.value = "openai";
				updateModelInfo(modelsByName["openai"]);
			} else {
				// pick first model by default
				modelSelect.selectedIndex = 0;
				updateModelInfo(modelsByName[visionModels[0].name]);
			}

			hideStatus();
		} catch (err) {
			showStatus(`${i18next.t("errorFetchingModels")}: ${err?.message || err}`, "error");
			modelInfoDiv.classList.remove("visible");
		}
	}

	function showStatus(message, type = "info") {
		statusDiv.textContent = message;
		statusDiv.className = `status ${type} visible`;
	}

	function hideStatus() {
		statusDiv.classList.remove("visible");
		setTimeout(() => {
			statusDiv.className = "status";
		}, 300);
	}

	function updateModelInfo(model) {
		const isAIEnabled = aiToggle ? aiToggle.checked : true;
		if (!isAIEnabled) {
			modelInfoDiv.classList.remove('visible');
			modelInfoDiv.classList.add('ai-controls-hidden');
			return;
		}
		if (!model) {
			modelInfoDiv.classList.remove("visible");
			return;
		}

		const desc = model.description || "";
		const tier = model.tier || "";
		const inputs = (model.input_modalities || []).join(", ");
		const outputs = (model.output_modalities || []).join(", ");

		const infoContent = modelInfoDiv.querySelector(".info-content");
		infoContent.innerHTML = `
			<strong>${i18next.t("modelInfoDescription")}:</strong> ${desc}<br>
			<strong>${i18next.t("modelInfoTier")}:</strong> ${tier}<br>
			<strong>${i18next.t("modelInfoInputModalities")}:</strong> ${inputs}<br>
			<strong>${i18next.t("modelInfoOutputModalities")}:</strong> ${outputs}
		`;
		modelInfoDiv.classList.add("visible");

		// Show or hide API key field depending on tier
		if (tier !== "anonymous") {
			apiKeyGroup.style.display = "block";
			setTimeout(() => apiKeyGroup.style.opacity = "1", 10);
		} else {
			apiKeyGroup.style.opacity = "0";
			setTimeout(() => apiKeyGroup.style.display = "none", 200);
		}
		if (!isAIEnabled) {
			modelSelect.classList.add("ai-controls-hidden");
			modelInfoDiv.classList.add("ai-controls-hidden");
			apiKeyGroup.classList.add("ai-controls-hidden");
		} else {
			modelSelect.classList.remove("ai-controls-hidden");
			modelInfoDiv.classList.remove("ai-controls-hidden");
			apiKeyGroup.classList.remove("ai-controls-hidden");
		}
	}

	// Language change handler
	languageSelect.addEventListener("change", async () => {
		const selectedLanguage = languageSelect.value;
		await browserAPI.storage.sync.set({ language: selectedLanguage });
		await initI18n(selectedLanguage);
		updateUI();
	});

	// Model change handler
	modelSelect.addEventListener("change", async () => {
		const selectedModel = modelsByName[modelSelect.value];
		updateModelInfo(selectedModel);
		if (selectedModel) {
			await browserAPI.storage.sync.set({ selectedModel: selectedModel.name });
			showStatus(i18next.t("modelSaved"), "success");
			setTimeout(() => hideStatus(), 1500);
		}
	});

	refreshButton.addEventListener("click", async () => {
		await fetchModels();
	});

	// Handle AI toggle changes
	if (aiToggle) {
		aiToggle.addEventListener("change", async () => {
			const enabled = aiToggle.checked;
			await browserAPI.storage.sync.set({ aiEnabled: enabled });
			setAIControlsVisible(enabled);
			showStatus(enabled ? i18next.t("aiEnabled") : i18next.t("aiDisabled"), enabled ? "success" : "info");
			setTimeout(() => hideStatus(), 1800);
			if (enabled) {
				await fetchModels();
			} else {
				modelSelect.innerHTML = "";
				modelInfoDiv.classList.remove('visible');
				modelInfoDiv.classList.add('ai-controls-hidden');
			}
		});
	}

	function setAIControlsVisible(enabled) {
		const modelGroup = modelSelect ? modelSelect.closest('.form-group') : null;
		if (!enabled) {
			if (modelGroup) {
				modelGroup.classList.remove('ai-controls-visible');
				modelGroup.classList.add('ai-controls-hidden');
				modelGroup.setAttribute('aria-hidden', 'true');
			}
			modelInfoDiv.classList.remove('ai-controls-visible');
			modelInfoDiv.classList.add('ai-controls-hidden');
			modelInfoDiv.setAttribute('aria-hidden', 'true');
			if (apiKeyGroup) {
				apiKeyGroup.classList.remove('ai-controls-visible');
				apiKeyGroup.classList.add('ai-controls-hidden');
				apiKeyGroup.setAttribute('aria-hidden', 'true');
			}
			if (aiBadge) {
				aiBadge.classList.remove('ai-controls-visible');
				aiBadge.classList.add('ai-controls-hidden');
				aiBadge.setAttribute('aria-hidden', 'true');
			}
			if (buttonGroup) {
				buttonGroup.classList.remove('ai-controls-visible');
				buttonGroup.classList.add('ai-controls-hidden');
				buttonGroup.setAttribute('aria-hidden', 'true');
			}
		} else {
			if (modelGroup) {
				modelGroup.classList.remove('ai-controls-hidden');
				modelGroup.classList.add('ai-controls-visible');
				modelGroup.setAttribute('aria-hidden', 'false');
			}
			modelInfoDiv.classList.remove('ai-controls-hidden');
			modelInfoDiv.classList.add('ai-controls-visible');
		   modelInfoDiv.setAttribute('aria-hidden', 'false');
			if (apiKeyGroup) {
				apiKeyGroup.classList.remove('ai-controls-hidden');
				apiKeyGroup.classList.add('ai-controls-visible');
				apiKeyGroup.setAttribute('aria-hidden', 'false');
			}
			if (aiBadge) {
				aiBadge.classList.remove('ai-controls-hidden');
				aiBadge.classList.add('ai-controls-visible');
				aiBadge.setAttribute('aria-hidden', 'false');
			}
			if (buttonGroup) {
				buttonGroup.classList.remove('ai-controls-hidden');
				buttonGroup.classList.add('ai-controls-visible');
				buttonGroup.setAttribute('aria-hidden', 'false');
			}
		}
	}

	saveButton.addEventListener("click", async () => {
		const apiKey = apiKeyInput.value.trim();
		const selectedModelName = modelSelect.value;
		const selectedModel = modelsByName[selectedModelName];
		const requiresApiKey = selectedModel?.tier !== "anonymous";

		if (requiresApiKey && !apiKey) {
			showStatus(i18next.t("pleaseEnterApiKey"), "error");
			return;
		}

		if (requiresApiKey) await browserAPI.storage.sync.set({ pollinationsApiKey: apiKey });

		// Also save selected model
		if (selectedModelName) {
			await browserAPI.storage.sync.set({ selectedModel: selectedModelName });
		}
		showStatus(i18next.t("apiKeySaved"), "success");
		setTimeout(() => hideStatus(), 3000);
	});

	deleteButton.addEventListener("click", async () => {
		await browserAPI.storage.sync.remove(["pollinationsApiKey"]);
		apiKeyInput.value = "";
		showStatus(i18next.t("apiKeyDeleted"), "success");
		setTimeout(() => hideStatus(), 3000);
	});
});


