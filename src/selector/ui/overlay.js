/* SPDX-License-Identifier: MIT */

const OVERLAY_STYLE = `
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background: transparent;
	cursor: crosshair;
	z-index: 999999;
	pointer-events: all;
`

const SELECTION_STYLE = `
	position: fixed;
	pointer-events: none;
	z-index: 1000000;
	display: none;
	border-radius: 4px;
	background: rgba(0, 150, 255, 0.05);
	box-shadow: 0 0 0 1px red;
	animation: rainbow-border 2s linear infinite;
`

const RAINBOW_STYLE_ID = 'rainbow-animation-style'

function ensureRainbowStyle() {
	if (document.getElementById(RAINBOW_STYLE_ID)) {
		return
	}

	const style = document.createElement('style')
	style.id = RAINBOW_STYLE_ID
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
	`

	document.head.appendChild(style)
}

export function createOverlayElements() {
	ensureRainbowStyle()

	const overlay = document.createElement('div')
	overlay.style.cssText = OVERLAY_STYLE

	const selectionDiv = document.createElement('div')
	selectionDiv.className = 'screenshot-selection-box'
	selectionDiv.style.cssText = SELECTION_STYLE

	document.body.appendChild(overlay)
	document.body.appendChild(selectionDiv)

	const dispose = () => {
		if (overlay.parentNode) {
			overlay.parentNode.removeChild(overlay)
		}
		if (selectionDiv.parentNode) {
			selectionDiv.parentNode.removeChild(selectionDiv)
		}
	}

	return { overlay, selectionDiv, dispose }
}
