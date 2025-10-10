import plTranslations from "./locales/pl.json";
import enTranslations from "./locales/en.json";

// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Translation resources for background.js
const i18nResources = {
	pl: plTranslations,
	en: enTranslations
};

// Get current language from storage or default to 'en'
let currentLanguage = 'en';

// Helper function to get translation
function t(key) {
	return i18nResources[currentLanguage]?.[key] || i18nResources['en'][key] || key;
}

// Initialize language from storage
browserAPI.storage.sync.get(['language'], (result) => {
	if (result.language) {
		currentLanguage = result.language;
	}
});

browserAPI.action.onClicked.addListener(async (tab) => {
	try {
		// Get current language and pass translations
		browserAPI.storage.sync.get(['language'], async (result) => {
			const lang = result.language || 'en';
			await browserAPI.scripting.executeScript({
				target: { tabId: tab.id },
				func: initScreenshotSelector,
				args: [i18nResources[lang]]
			});
		});
	} catch (error) {
		console.error("Failed to inject script:", error);
	}
});

browserAPI.runtime.onMessage.addListener((request, _sender, sendResponse) => {
	if (request.action === "captureScreenshot") {
		browserAPI.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
			sendResponse({ dataUrl: dataUrl });
		});
		return true;
	}
});

function initScreenshotSelector(translations) {
	if (window.screenshotSelectorActive) {
		return;
	}

	window.screenshotSelectorActive = true;

	// Cross-browser compatibility
	const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

	// Helper function to get translation
	function t(key) {
		return translations[key] || key;
	}

	let isSelecting = false;
	let startX, startY, endX, endY;
	let selectionDiv;

	const overlay = document.createElement("div");
	overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: transparent;
    cursor: crosshair;
    z-index: 999999;
    pointer-events: all;
  `;

	selectionDiv = document.createElement("div");
	selectionDiv.className = "screenshot-selection-box";
	selectionDiv.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 1000000;
    display: none;
    border-radius: 4px;
    background: rgba(0, 150, 255, 0.05);
    box-shadow: 0 0 0 1px red;
    animation: rainbow-border 2s linear infinite;
  `;

	if (!document.getElementById("rainbow-animation-style")) {
		const style = document.createElement("style");
		style.id = "rainbow-animation-style";
		style.textContent = `
      @keyframes rainbow-border {
        0% {
          box-shadow: 0 0 0 1px red;
        }
        14% {
          box-shadow: 0 0 0 1px orange;
        }
        28% {
          box-shadow: 0 0 0 1px yellow;
        }
        42% {
          box-shadow: 0 0 0 1px green;
        }
        57% {
          box-shadow: 0 0 0 1px cyan;
        }
        71% {
          box-shadow: 0 0 0 1px blue;
        }
        85% {
          box-shadow: 0 0 0 1px violet;
        }
        100% {
          box-shadow: 0 0 0 1px red;
        }
      }
    `;
		document.head.appendChild(style);
	}

	document.body.appendChild(overlay);
	document.body.appendChild(selectionDiv);

	overlay.addEventListener("mousedown", (e) => {
		isSelecting = true;
		startX = e.clientX;
		startY = e.clientY;
		selectionDiv.style.display = "block";
		updateSelection(e);
	});

	overlay.addEventListener("mousemove", (e) => {
		if (isSelecting) {
			updateSelection(e);
		}
	});

	overlay.addEventListener("mouseup", async (e) => {
		if (!isSelecting) return;

		isSelecting = false;
		endX = e.clientX;
		endY = e.clientY;

		const x = Math.min(startX, endX);
		const y = Math.min(startY, endY);
		const width = Math.abs(endX - startX);
		const height = Math.abs(endY - startY);

		if (width > 10 && height > 10) {
			await captureSelection(x, y, width, height);
		}

		cleanup();
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape") {
			cleanup();
		}
	});

	function updateSelection(e) {
		const x = Math.min(startX, e.clientX);
		const y = Math.min(startY, e.clientY);
		const width = Math.abs(e.clientX - startX);
		const height = Math.abs(e.clientY - startY);

		selectionDiv.style.left = `${x}px`;
		selectionDiv.style.top = `${y}px`;
		selectionDiv.style.width = `${width}px`;
		selectionDiv.style.height = `${height}px`;
	}

	async function captureSelection(x, y, width, height) {
		try {
			overlay.style.display = "none";
			selectionDiv.style.display = "none";

			await new Promise((resolve) => setTimeout(resolve, 100));

			browserAPI.runtime.sendMessage(
				{ action: "captureScreenshot" },
				async (response) => {
					if (!response || !response.dataUrl) {
						showMessage(t("errorCapturingImage"), "error");
						cleanup();
						return;
					}

					const img = new Image();
					img.onload = () => {
						const canvas = document.createElement("canvas");
						const ctx = canvas.getContext("2d");

						const dpr = window.devicePixelRatio || 1;
						canvas.width = width * dpr;
						canvas.height = height * dpr;
						ctx.scale(dpr, dpr);

						ctx.drawImage(img, x, y, width, height, 0, 0, width, height);

						canvas.toBlob(async (blob) => {
							try {
								await navigator.clipboard.write([
									new ClipboardItem({ "image/png": blob }),
								]);

								await showAIAnalysis(blob, x, y);
							} catch (error) {
								console.error("Failed to copy to clipboard:", error);
								showMessage(t("errorCopyingToClipboard"), "error");
							}

							cleanup();
						});
					};

					img.onerror = () => {
						showMessage(t("errorLoadingImage"), "error");
						cleanup();
					};

					img.src = response.dataUrl;
				},
			);
		} catch (error) {
			console.error("Capture failed:", error);
			showMessage(t("errorCapturingImage"), "error");
			cleanup();
		}
	}

	function showMessage(text, type) {
		const msg = document.createElement("div");
		msg.textContent = text;
		msg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === "success" ? "#4caf50" : "#f44336"};
      color: white;
      border-radius: 4px;
      z-index: 1000001;
      font-family: Arial, sans-serif;
      font-size: 14px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    `;

		document.body.appendChild(msg);

		setTimeout(() => {
			if (msg.parentNode) {
				msg.parentNode.removeChild(msg);
			}
		}, 3000);
	}

	async function showAIAnalysis(imageBlob, x, y) {
		const popup = document.createElement("div");
		popup.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: 400px;
      min-width: 300px;
      max-width: 800px;
      background: white;
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000002;
      font-family: Arial, sans-serif;
      cursor: move;
      transition: all 0.3s ease;
      opacity: 0.15;
      transform: scale(0.8);
      resize: both;
      overflow: hidden;
    `;

		popup.innerHTML = `
      <div id="popup-header" style="
        padding: 15px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px 12px 0 0;
        cursor: move;
        user-select: none;
      ">
        <h3 style="margin: 0; color: white; font-size: 16px;">${t("aiAnalysis")}</h3>
      </div>
      <div id="popup-content" style="
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      ">
        <div id="ai-loading" style="color: #666; margin-bottom: 15px;">${t("analyzingImage")}</div>
        <div id="ai-result" style="display: none; color: #333; line-height: 1.6; margin-bottom: 15px;"></div>
        <button id="close-ai-popup" style="
          background: #4285f4;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          width: 100%;
        ">Zamknij</button>
      </div>
    `;

		document.body.appendChild(popup);

		let hasBeenHovered = false;

		popup.addEventListener("mouseenter", () => {
			popup.style.opacity = "1";
			popup.style.transform = "scale(1)";
			popup.style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
		});

		popup.addEventListener("mouseleave", () => {
			if (!hasBeenHovered) {
				popup.style.opacity = "0.15";
				popup.style.transform = "scale(0.8)";
				popup.style.boxShadow = "0 2px 12px rgba(0,0,0,0.2)";
				hasBeenHovered = true;
			} else {
				popup.style.opacity = "0";
				popup.style.transform = "scale(0.7)";
				popup.style.boxShadow = "none";
			}
		});

		let isDragging = false;
		let offsetX;
		let offsetY;

		const header = popup.querySelector("#popup-header");

		header.addEventListener("mousedown", (e) => {
			isDragging = true;
			offsetX = e.clientX - popup.getBoundingClientRect().left;
			offsetY = e.clientY - popup.getBoundingClientRect().top;
			popup.style.cursor = "grabbing";
			popup.style.transition = "none";
		});

		document.addEventListener("mousemove", (e) => {
			if (isDragging) {
				e.preventDefault();

				let newX = e.clientX - offsetX;
				let newY = e.clientY - offsetY;

				const maxX = window.innerWidth - popup.offsetWidth;
				const maxY = window.innerHeight - popup.offsetHeight;

				newX = Math.max(0, Math.min(newX, maxX));
				newY = Math.max(0, Math.min(newY, maxY));

				popup.style.left = `${newX}px`;
				popup.style.top = `${newY}px`;
			}
		});

		document.addEventListener("mouseup", () => {
			if (isDragging) {
				isDragging = false;
				popup.style.cursor = "move";
				popup.style.transition = "all 0.3s ease";
			}
		});

		popup.querySelector("#close-ai-popup").addEventListener("click", () => {
			popup.remove();
		});

		try {
			browserAPI.storage.sync.get(["pollinationsApiKey"], async (result) => {
				const apiKey = result.pollinationsApiKey;

				if (!apiKey) {
					popup.remove();
					showMessage(t("imageCopiedToClipboard"), "success");
					return;
				}

				const reader = new FileReader();
				reader.readAsDataURL(imageBlob);
				reader.onloadend = async () => {
					const base64Image = reader.result;

					try {
						const response = await fetch(
							"https://text.pollinations.ai/openai/v1/chat/completions",
							{
								method: "POST",
								headers: {
									"Content-Type": "application/json",
									Authorization: `Bearer ${apiKey}`,
								},
								body: JSON.stringify({
									model: "o4-mini",
									messages: [
										{
											role: "system",
											content: t("aiSystemPrompt"),
										},
										{
											role: "user",
											content: [
												{
													type: "text",
													text: t("aiUserPrompt"),
												},
												{
													type: "image_url",
													image_url: {
														url: base64Image,
													},
												},
											],
										},
									],
								}),
							},
						);

						if (!response.ok) {
							throw new Error(
								`API Error: ${response.status} ${response.statusText}`,
							);
						}

						const data = await response.json();
						const rawContent = data.choices?.[0]?.message?.content || "{}";

						console.log("🔍 Raw AI Response:", rawContent);

						let parsedData;
						try {
							let cleanJson = rawContent.trim();
							if (cleanJson.startsWith("```")) {
								cleanJson = cleanJson
									.replace(/```json\n?/g, "")
									.replace(/```\n?/g, "");
							}

							parsedData = JSON.parse(cleanJson);
						} catch (parseError) {
							console.error("JSON Parse Error:", parseError);
							console.error("Failed to parse:", rawContent);

							popup.querySelector("#ai-loading").style.display = "none";
							const resultDiv = popup.querySelector("#ai-result");
							resultDiv.style.display = "block";
							resultDiv.innerHTML = `
								<div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
									<div style="font-size: 11px; color: #92400e; font-weight: 600; margin-bottom: 6px;">
										${t("aiTextResponseWarning")}
									</div>
								</div>
								<div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px;">
									<div style="color: #1e293b; font-size: 13px; white-space: pre-wrap; word-break: break-word; line-height: 1.6;">
										${rawContent}
									</div>
								</div>
							`;
							return;
						}

						if (
							!parsedData.question ||
							!parsedData.answer_type ||
							!parsedData.answer
						) {
							popup.querySelector("#ai-loading").style.display = "none";
							const resultDiv = popup.querySelector("#ai-result");
							resultDiv.style.display = "block";
							resultDiv.innerHTML = `
								<div style="background: #fff7ed; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
									<div style="font-size: 11px; color: #92400e; font-weight: 600; margin-bottom: 6px;">
										⚠️ NIEPEŁNY JSON
									</div>
								</div>
								<div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px;">
									<div style="color: #1e293b; font-size: 13px; white-space: pre-wrap; word-break: break-word; line-height: 1.6;">
										${JSON.stringify(parsedData, null, 2)}
									</div>
								</div>
							`;
							return;
						}

						popup.querySelector("#ai-loading").style.display = "none";
						const resultDiv = popup.querySelector("#ai-result");
						resultDiv.style.display = "block";

						const answerTypeBadge =
							{
								text: t("aiAnswerTypeText"),
								select_one: t("aiAnswerTypeSelectOne"),
								multi_select: t("aiAnswerTypeMultiSelect"),
							}[parsedData.answer_type] || t("aiAnswerTypeUnknown");

						let answerHTML = "";
						if (parsedData.answer_type === "multi_select") {
							let answers = [];

							if (Array.isArray(parsedData.answer)) {
								answers = parsedData.answer;
							} else if (typeof parsedData.answer === "string") {
								try {
									const parsed = JSON.parse(parsedData.answer);
									answers = Array.isArray(parsed)
										? parsed
										: [parsedData.answer];
								} catch {
									answers = parsedData.answer
										.split(/[;\n,]/)
										.map((a) => a.trim())
										.filter((a) => a.length > 0);
								}
							} else {
								answers = [String(parsedData.answer)];
							}

							answerHTML = answers
								.map(
									(ans) => `
								<div style="
									display: flex;
									align-items: flex-start;
									gap: 8px;
									margin-bottom: 6px;
									padding: 8px;
									background: #f0fdf4;
									border-radius: 6px;
									border: 1px solid #bbf7d0;
								">
									<span style="color: #22c55e; font-size: 16px; flex-shrink: 0; margin-top: 1px;">✓</span>
									<span style="color: #1e293b; font-size: 13px; line-height: 1.4;">${ans}</span>
								</div>
							`,
								)
								.join("");
						} else {
							answerHTML = `
								<div style="
									color: #1e293b;
									font-size: 14px;
									font-weight: 600;
									margin-bottom: 8px;
								">
									${parsedData.answer}
								</div>
							`;
						}

						resultDiv.innerHTML = `
							<div style="
								background: #f0f9ff;
								border-left: 4px solid #0ea5e9;
								padding: 12px;
								border-radius: 6px;
								margin-bottom: 12px;
							">
								<div style="font-size: 11px; color: #0369a1; font-weight: 600; margin-bottom: 6px;">
									${t("aiQuestionLabel")}
								</div>
								<div style="color: #1e293b; font-size: 13px;">
									${parsedData.question}
								</div>
							</div>
							
							<div style="
								background: #f0fdf4;
								border-left: 4px solid #22c55e;
								padding: 12px;
								border-radius: 6px;
								margin-bottom: 10px;
							">
								<div style="
									display: flex;
									align-items: center;
									gap: 8px;
									margin-bottom: ${parsedData.answer_type === "multi_select" ? "12px" : "8px"};
								">
									<span style="font-size: 20px;">✓</span>
									<span style="font-size: 11px; color: #15803d; font-weight: 600;">
										${t("aiAnswerLabel")}
									</span>
								</div>
								${answerHTML}
								<div style="
									display: inline-block;
									background: #dcfce7;
									color: #15803d;
									padding: 4px 10px;
									border-radius: 12px;
									font-size: 11px;
									font-weight: 500;
									margin-top: 8px;
								">
									${answerTypeBadge}
								</div>
							</div>
						`;
					} catch (error) {
						console.error("AI Analysis failed:", error);
						popup.querySelector("#ai-loading").style.display = "none";
						const resultDiv = popup.querySelector("#ai-result");
						resultDiv.style.display = "block";
						resultDiv.innerHTML = `
							<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px;">
								<div style="font-size: 11px; color: #991b1b; font-weight: 600; margin-bottom: 6px;">
									${t("aiErrorLabel")}
								</div>
								<div style="color: #7f1d1d; font-size: 12px;">
									${error.message}
								</div>
							</div>
						`;
					}
				};
			});
		} catch (error) {
			console.error("AI Analysis failed:", error);
			popup.querySelector("#ai-loading").textContent =
				t("errorAnalyzingImage");
		}
	}

	function cleanup() {
		window.screenshotSelectorActive = false;
		if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
		if (selectionDiv.parentNode)
			selectionDiv.parentNode.removeChild(selectionDiv);
	}
}
