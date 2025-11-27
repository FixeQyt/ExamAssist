/* SPDX-License-Identifier: MIT */

import { browserAPI } from './browserApi.js'
import { showMessage } from './ui/toast.js'
import { showAIAnalysis } from './ui/popup.js'

const DELAY_MS = 100

function wait(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms))
}

function captureVisibleTab() {
	return new Promise((resolve, reject) => {
		browserAPI.runtime.sendMessage({ action: 'captureScreenshot' }, (response) => {
			if (!response || !response.dataUrl) {
				reject(new Error('Screenshot capture returned empty data'))
				return
			}
			resolve(response.dataUrl)
		})
	})
}

function loadImage(dataUrl) {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.onload = () => resolve(img)
		img.onerror = () => reject(new Error('Failed to load captured image'))
		img.src = dataUrl
	})
}

function drawSelection(img, rect) {
	const dpr = window.devicePixelRatio || 1
	const canvas = document.createElement('canvas')
	canvas.width = rect.width * dpr
	canvas.height = rect.height * dpr
	const ctx = canvas.getContext('2d')
	ctx.scale(dpr, dpr)
	ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height)

	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (!blob) {
				reject(new Error('Failed to convert canvas to Blob'))
				return
			}
			resolve(blob)
		})
	})
}

async function copyToClipboard(blob) {
	await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export async function captureArea({ rect, overlay, selectionDiv, t }) {
	try {
		overlay.style.display = 'none'
		selectionDiv.style.display = 'none'

		await wait(DELAY_MS)

		const dataUrl = await captureVisibleTab()
		const image = await loadImage(dataUrl)
		const blob = await drawSelection(image, rect)

		try {
			await copyToClipboard(blob)
		} catch (clipboardError) {
			console.error('Failed to copy to clipboard:', clipboardError)
			showMessage(t('errorCopyingToClipboard'), 'error')
			return
		}

		await showAIAnalysis(blob, rect.x, rect.y, t)
	} catch (error) {
		console.error('Capture failed:', error)
		showMessage(t('errorCapturingImage'), 'error')
	}
}
