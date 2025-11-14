/* SPDX-License-Identifier: MIT */

import { browserAPI } from "../browserApi.js";
import { showMessage } from "./toast.js";

function createPopupShell(t, x, y) {
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
			">${t("close") || "Close"}</button>
		</div>
	`;

	document.body.appendChild(popup);
	return popup;
}

function setupPopupInteractions(popup) {
	let hasBeenHovered = false;
	let isDragging = false;
	let offsetX = 0;
	let offsetY = 0;

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

	const header = popup.querySelector("#popup-header");

	header.addEventListener("mousedown", (event) => {
		isDragging = true;
		offsetX = event.clientX - popup.getBoundingClientRect().left;
		offsetY = event.clientY - popup.getBoundingClientRect().top;
		popup.style.cursor = "grabbing";
		popup.style.transition = "none";
	});

	document.addEventListener("mousemove", (event) => {
		if (!isDragging) {
			return;
		}

		event.preventDefault();

		let newX = event.clientX - offsetX;
		let newY = event.clientY - offsetY;

		const maxX = window.innerWidth - popup.offsetWidth;
		const maxY = window.innerHeight - popup.offsetHeight;

		newX = Math.max(0, Math.min(newX, maxX));
		newY = Math.max(0, Math.min(newY, maxY));

		popup.style.left = `${newX}px`;
		popup.style.top = `${newY}px`;
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
}

function sanitizeJSON(rawContent) {
	let cleanJson = rawContent.trim();
	if (cleanJson.startsWith("```") ) {
		cleanJson = cleanJson.replace(/```json\n?/g, "").replace(/```\n?/g, "");
	}
	return cleanJson;
}

function renderTextFallback(t, popup, rawContent) {
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
}

function renderIncompleteJSON(popup, parsedData) {
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
}

function buildAnswerHTML(parsedData, t) {
	if (parsedData.answer_type === "multi_select") {
		let answers = [];

		if (Array.isArray(parsedData.answer)) {
			answers = parsedData.answer;
		} else if (typeof parsedData.answer === "string") {
			try {
				const parsed = JSON.parse(parsedData.answer);
				answers = Array.isArray(parsed) ? parsed : [parsedData.answer];
			} catch {
				answers = parsedData.answer
					.split(/[;\n,]/)
					.map((value) => value.trim())
					.filter((value) => value.length > 0);
			}
		} else {
			answers = [String(parsedData.answer)];
		}

		return answers
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
	}

	return `
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

function renderResult(popup, parsedData, t) {
	popup.querySelector("#ai-loading").style.display = "none";
	const resultDiv = popup.querySelector("#ai-result");
	resultDiv.style.display = "block";

	const answerTypeBadge =
		{
			text: t("aiAnswerTypeText"),
			select_one: t("aiAnswerTypeSelectOne"),
			multi_select: t("aiAnswerTypeMultiSelect"),
		}[parsedData.answer_type] || t("aiAnswerTypeUnknown");

	const answerHTML = buildAnswerHTML(parsedData, t);

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
}

export async function showAIAnalysis(imageBlob, x, y, t) {
	const popup = createPopupShell(t, x, y);
	setupPopupInteractions(popup);

	try {
		const storageData = await new Promise((resolve) => {
			browserAPI.storage.sync.get(["pollinationsApiKey"], resolve);
		});

		const apiKey = storageData?.pollinationsApiKey;
		if (!apiKey) {
			popup.remove();
			showMessage(t("imageCopiedToClipboard"), "success");
			return;
		}

		const base64Image = await new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onloadend = () => resolve(reader.result);
			reader.onerror = reject;
			reader.readAsDataURL(imageBlob);
		});

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
								{ type: "text", text: t("aiUserPrompt") },
								{ type: "image_url", image_url: { url: base64Image } },
							],
						},
					],
				}),
			},
		);

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`);
		}

		const data = await response.json();
		const rawContent = data.choices?.[0]?.message?.content || "{}";

		console.log("🔍 Raw AI Response:", rawContent);

		let parsedData;
		try {
			parsedData = JSON.parse(sanitizeJSON(rawContent));
		} catch (error) {
			console.error("JSON Parse Error:", error);
			console.error("Failed to parse:", rawContent);
			return renderTextFallback(t, popup, rawContent);
		}

		if (!parsedData.question || !parsedData.answer_type || !parsedData.answer) {
			return renderIncompleteJSON(popup, parsedData);
		}

		renderResult(popup, parsedData, t);
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
}
