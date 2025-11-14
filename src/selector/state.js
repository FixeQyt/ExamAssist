/* SPDX-License-Identifier: MIT */

import { SELECTOR_FLAG } from "./constants.js";

export function isSelectorActive() {
	return Boolean(window[SELECTOR_FLAG]);
}

export function markSelectorActive() {
	window[SELECTOR_FLAG] = true;
}

export function clearSelectorActive() {
	window[SELECTOR_FLAG] = false;
}
