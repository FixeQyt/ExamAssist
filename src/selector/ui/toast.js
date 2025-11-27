/* SPDX-License-Identifier: MIT */

const BASE_STYLE = `
	position: fixed;
	top: 20px;
	right: 20px;
	padding: 12px 20px;
	color: white;
	border-radius: 4px;
	z-index: 1000001;
	font-family: Arial, sans-serif;
	font-size: 14px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`

const TYPE_BACKGROUND = {
	success: '#4caf50',
	error: '#f44336',
}

export function showMessage(text, type = 'success') {
	const msg = document.createElement('div')
	msg.textContent = text
	msg.style.cssText = `${BASE_STYLE} background: ${
		TYPE_BACKGROUND[type] || TYPE_BACKGROUND.success
	};`

	document.body.appendChild(msg)

	setTimeout(() => {
		msg.remove()
	}, 3000)
}
