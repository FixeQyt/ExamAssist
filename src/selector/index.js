/* SPDX-License-Identifier: MIT */

import { captureArea } from "./capture.js";
import { createOverlayElements } from "./ui/overlay.js";
import { createTranslator } from "./translator.js";
import { clearSelectorActive, isSelectorActive, markSelectorActive } from "./state.js";

const MIN_SELECTION = 10;

function bootstrapSelector() {
	if (isSelectorActive()) {
		return;
	}

	markSelectorActive();

	const t = createTranslator();
	const { overlay, selectionDiv, dispose } = createOverlayElements();
	let cleanedUp = false;

	let isSelecting = false;
	let startX = 0;
	let startY = 0;

	const onMouseDown = (event) => {
		isSelecting = true;
		startX = event.clientX;
		startY = event.clientY;
		selectionDiv.style.display = "block";
		updateSelection(event.clientX, event.clientY);
	};

	const onMouseMove = (event) => {
		if (!isSelecting) {
			return;
		}
		updateSelection(event.clientX, event.clientY);
	};

	const onMouseUp = async (event) => {
		if (!isSelecting) {
			return;
		}

		isSelecting = false;

		const endX = event.clientX;
		const endY = event.clientY;

		const x = Math.min(startX, endX);
		const y = Math.min(startY, endY);
		const width = Math.abs(endX - startX);
		const height = Math.abs(endY - startY);

		if (width > MIN_SELECTION && height > MIN_SELECTION) {
			await captureArea({ rect: { x, y, width, height }, overlay, selectionDiv, t });
		}

		cleanup();
	};

	const onKeyDown = (event) => {
		if (event.key === "Escape") {
			cleanup();
		}
	};

	function updateSelection(currentX, currentY) {
		const x = Math.min(startX, currentX);
		const y = Math.min(startY, currentY);
		const width = Math.abs(currentX - startX);
		const height = Math.abs(currentY - startY);

		selectionDiv.style.left = `${x}px`;
		selectionDiv.style.top = `${y}px`;
		selectionDiv.style.width = `${width}px`;
		selectionDiv.style.height = `${height}px`;
	}

	function cleanup() {
		if (cleanedUp) {
			return;
		}
		cleanedUp = true;
		overlay.removeEventListener("mousedown", onMouseDown);
		overlay.removeEventListener("mousemove", onMouseMove);
		overlay.removeEventListener("mouseup", onMouseUp);
		document.removeEventListener("keydown", onKeyDown);

		dispose();
		clearSelectorActive();
	}

	overlay.addEventListener("mousedown", onMouseDown);
	overlay.addEventListener("mousemove", onMouseMove);
	overlay.addEventListener("mouseup", onMouseUp);
	document.addEventListener("keydown", onKeyDown);
}

bootstrapSelector();
