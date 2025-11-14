/* SPDX-License-Identifier: MIT */

export const browserAPI =
	typeof globalThis.browser !== "undefined"
		? globalThis.browser
		: globalThis.chrome;

if (!browserAPI) {
	throw new Error("Browser APIs are unavailable in the current tab context");
}
