document.addEventListener("DOMContentLoaded", () => {
	const apiKeyInput = document.getElementById("apiKey");
	const saveButton = document.getElementById("save");
	const deleteButton = document.getElementById("delete");
	const statusDiv = document.getElementById("status");

	chrome.storage.sync.get(["pollinationsApiKey"], (result) => {
		if (result.pollinationsApiKey) {
			apiKeyInput.value = result.pollinationsApiKey;
		}
	});

	saveButton.addEventListener("click", () => {
		const apiKey = apiKeyInput.value.trim();

		if (!apiKey) {
			statusDiv.className = "status error";
			statusDiv.textContent = "Proszę wpisać API key";
			return;
		}

		chrome.storage.sync.set({ pollinationsApiKey: apiKey }, () => {
			statusDiv.className = "status success";
			statusDiv.textContent = "API key zapisany pomyślnie!";

			setTimeout(() => {
				statusDiv.style.display = "none";
			}, 3000);
		});
	});

	deleteButton.addEventListener("click", () => {
		chrome.storage.sync.remove(["pollinationsApiKey"], () => {
			apiKeyInput.value = "";
			statusDiv.className = "status success";
			statusDiv.textContent = "API key usunięty pomyślnie!";

			setTimeout(() => {
				statusDiv.style.display = "none";
			}, 3000);
		});
	});
});
