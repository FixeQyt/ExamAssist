/* SPDX-License-Identifier: MIT */

import { browserAPI } from '../browserApi.js'
import { showMessage } from './toast.js'

function createPopupShell(t, x, y) {
	const popup = document.createElement('div')
	popup.style.cssText = `
		position: fixed;
		left: ${x}px;
		top: ${y}px;
		width: 420px;
		min-width: 280px;
		max-width: 640px;
		background: rgba(255, 255, 255, 0.18);
		border-radius: 18px;
		padding: 0;
		box-shadow: 0 20px 60px rgba(15, 23, 42, 0.35);
		z-index: 1000002;
		font-family: Arial, sans-serif;
		cursor: move;
		transition: opacity 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease;
		opacity: 0.25;
		transform: translateY(12px) scale(0.97);
		resize: both;
		overflow: hidden;
		backdrop-filter: blur(24px) saturate(140%);
		border: 1px solid rgba(255, 255, 255, 0.45);
		outline: 1px solid rgba(15, 23, 42, 0.08);
	`

	popup.innerHTML = `
		<div id="popup-header" style="
			padding: 18px 22px;
			display: flex;
			align-items: center;
			justify-content: space-between;
			background: linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.05) 100%);
			border-radius: 18px 18px 0 0;
			cursor: move;
			user-select: none;
			border-bottom: 1px solid rgba(255, 255, 255, 0.25);
		">
			<h3 style="margin: 0; color: #0f172a; font-size: 15px; letter-spacing: 0.02em;">${t('aiAnalysis')}</h3>
			<span style="font-size: 11px; color: rgba(15, 23, 42, 0.6); text-transform: uppercase; letter-spacing: 0.15em;">AI</span>
		</div>
		<div id="popup-content" style="
			padding: 22px;
			max-height: 420px;
			overflow-y: auto;
			background: radial-gradient(circle at top, rgba(255,255,255,0.35), rgba(248,250,252,0.4));
		">
			<div id="ai-loading" style="color: rgba(15, 23, 42, 0.65); margin-bottom: 15px; font-size: 13px;">${t('analyzingImage')}</div>
			<div id="ai-result" style="display: none; color: #0f172a; line-height: 1.65; margin-bottom: 15px;"></div>
			<button id="close-ai-popup" style="
				background: rgba(15, 23, 42, 0.85);
				color: white;
				border: 1px solid rgba(255, 255, 255, 0.25);
				padding: 10px 16px;
				border-radius: 999px;
				cursor: pointer;
				font-size: 13px;
				width: 100%;
				letter-spacing: 0.03em;
				transition: background 0.2s ease, box-shadow 0.2s ease;
			">${t('close') || 'Close'}</button>
		</div>
	`

	document.body.appendChild(popup)
	return popup
}

function setupPopupInteractions(popup) {
	let hasBeenHovered = false
	let isDragging = false
	let offsetX = 0
	let offsetY = 0

	popup.addEventListener('mouseenter', () => {
		popup.style.pointerEvents = 'auto'
		popup.style.opacity = '0.95'
		popup.style.transform = 'translateY(0) scale(1)'
		popup.style.boxShadow = '0 35px 90px rgba(15,23,42,0.35)'
	})

	popup.addEventListener('mouseleave', () => {
		if (!hasBeenHovered) {
			popup.style.opacity = '0.45'
			popup.style.transform = 'translateY(8px) scale(0.99)'
			popup.style.boxShadow = '0 18px 40px rgba(15,23,42,0.25)'
			hasBeenHovered = true
		} else {
			popup.style.opacity = '0'
			popup.style.transform = 'translateY(18px) scale(0.93)'
			popup.style.boxShadow = '0 6px 16px rgba(15,23,42,0.15)'
			popup.style.pointerEvents = 'none'
			setTimeout(() => {
				popup.style.pointerEvents = 'auto'
			}, 200)
		}
	})

	const header = popup.querySelector('#popup-header')

	header.addEventListener('mousedown', (event) => {
		isDragging = true
		offsetX = event.clientX - popup.getBoundingClientRect().left
		offsetY = event.clientY - popup.getBoundingClientRect().top
		popup.style.cursor = 'grabbing'
		popup.style.transition = 'none'
	})

	document.addEventListener('mousemove', (event) => {
		if (!isDragging) {
			return
		}

		event.preventDefault()

		let newX = event.clientX - offsetX
		let newY = event.clientY - offsetY

		const maxX = window.innerWidth - popup.offsetWidth
		const maxY = window.innerHeight - popup.offsetHeight

		newX = Math.max(0, Math.min(newX, maxX))
		newY = Math.max(0, Math.min(newY, maxY))

		popup.style.left = `${newX}px`
		popup.style.top = `${newY}px`
	})

	document.addEventListener('mouseup', () => {
		if (isDragging) {
			isDragging = false
			popup.style.cursor = 'move'
			popup.style.transition = 'all 0.3s ease'
		}
	})

	popup.querySelector('#close-ai-popup').addEventListener('click', () => {
		popup.remove()
	})

	const closeButton = popup.querySelector('#close-ai-popup')
	closeButton.addEventListener('mouseenter', () => {
		closeButton.style.background = 'rgba(15, 23, 42, 0.95)'
		closeButton.style.boxShadow = '0 10px 30px rgba(15,23,42,0.35)'
	})
	closeButton.addEventListener('mouseleave', () => {
		closeButton.style.background = 'rgba(15, 23, 42, 0.85)'
		closeButton.style.boxShadow = 'none'
	})
}

function sanitizeJSON(rawContent) {
	let cleanJson = rawContent.trim()
	if (cleanJson.startsWith('```')) {
		cleanJson = cleanJson.replace(/```json\n?/g, '').replace(/```\n?/g, '')
	}
	return cleanJson
}

function renderTextFallback(t, popup, rawContent) {
	popup.querySelector('#ai-loading').style.display = 'none'
	const resultDiv = popup.querySelector('#ai-result')
	resultDiv.style.display = 'block'
	resultDiv.innerHTML = `
		<div style="background: rgba(251, 191, 36, 0.18); border: 1px solid rgba(245, 158, 11, 0.4); padding: 14px; border-radius: 12px; margin-bottom: 12px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);">
			<div style="font-size: 11px; color: rgba(146, 64, 14, 0.8); font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.08em;">
				${t('aiTextResponseWarning')}
			</div>
		</div>
		<div style="background: rgba(248, 250, 252, 0.35); border: 1px solid rgba(148, 163, 184, 0.45); padding: 14px; border-radius: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);">
			<div style="color: #0f172a; font-size: 13px; white-space: pre-wrap; word-break: break-word; line-height: 1.65;">
				${rawContent}
			</div>
		</div>
	`
}

function renderIncompleteJSON(popup, parsedData) {
	popup.querySelector('#ai-loading').style.display = 'none'
	const resultDiv = popup.querySelector('#ai-result')
	resultDiv.style.display = 'block'
	resultDiv.innerHTML = `
		<div style="background: rgba(248, 113, 113, 0.2); border: 1px solid rgba(248, 113, 113, 0.4); padding: 14px; border-radius: 14px; margin-bottom: 12px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);">
			<div style="font-size: 11px; color: rgba(127, 29, 29, 0.85); font-weight: 600; margin-bottom: 6px; letter-spacing: 0.08em;">
				⚠️ NIEPEŁNY JSON
			</div>
		</div>
		<div style="background: rgba(15, 23, 42, 0.08); border: 1px solid rgba(148, 163, 184, 0.4); padding: 14px; border-radius: 16px;">
			<div style="color: #0f172a; font-size: 13px; white-space: pre-wrap; word-break: break-word; line-height: 1.65;">
				${JSON.stringify(parsedData, null, 2)}
			</div>
		</div>
	`
}

function buildAnswerHTML(parsedData, t) {
	if (parsedData.answer_type === 'multi_select') {
		let answers = []

		if (Array.isArray(parsedData.answer)) {
			answers = parsedData.answer
		} else if (typeof parsedData.answer === 'string') {
			try {
				const parsed = JSON.parse(parsedData.answer)
				answers = Array.isArray(parsed) ? parsed : [parsedData.answer]
			} catch {
				answers = parsedData.answer
					.split(/[;\n,]/)
					.map((value) => value.trim())
					.filter((value) => value.length > 0)
			}
		} else {
			answers = [String(parsedData.answer)]
		}

		return answers
			.map(
				(ans) => `
					<div style="
						display: flex;
						align-items: flex-start;
						gap: 8px;
						margin-bottom: 6px;
						padding: 10px;
						background: rgba(34, 197, 94, 0.15);
						border-radius: 12px;
						border: 1px solid rgba(134, 239, 172, 0.5);
						box-shadow: inset 0 1px 0 rgba(255,255,255,0.2);
					">
						<span style="color: #22c55e; font-size: 16px; flex-shrink: 0; margin-top: 1px;">✓</span>
						<span style="color: #022c22; font-size: 13px; line-height: 1.5;">${ans}</span>
					</div>
				`
			)
			.join('')
	}

	return `
		<div style="
			color: #052e16;
			font-size: 14px;
			font-weight: 600;
			margin-bottom: 8px;
			padding: 10px 12px;
			background: rgba(255,255,255,0.25);
			border-radius: 12px;
			border: 1px solid rgba(15, 23, 42, 0.08);
		">
			${parsedData.answer}
		</div>
	`
}

function renderResultItem(parsedData, t, index = null) {
	const answerTypeBadge =
		{
			text: t('aiAnswerTypeText'),
			select_one: t('aiAnswerTypeSelectOne'),
			multi_select: t('aiAnswerTypeMultiSelect'),
		}[parsedData.answer_type] || t('aiAnswerTypeUnknown')

	const answerHTML = buildAnswerHTML(parsedData, t)

	return `
		<div style="margin-bottom: 10px;">
			<div style="
				background: rgba(14, 165, 233, 0.16);
				border: 1px solid rgba(14, 165, 233, 0.35);
				padding: 16px;
				border-radius: 16px;
				margin-bottom: 12px;
				box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
			">
				<div style="font-size: 11px; color: rgba(3, 105, 161, 0.85); font-weight: 600; margin-bottom: 6px; letter-spacing: 0.08em; text-transform: uppercase;">
					${t('aiQuestionLabel')}${index !== null ? ` ${index + 1}` : ''}
				</div>
				<div style="color: #0f172a; font-size: 13px;">
					${parsedData.question}
				</div>
			</div>
			<div style="
				background: rgba(34, 197, 94, 0.18);
				border: 1px solid rgba(34, 197, 94, 0.35);
				padding: 16px;
				border-radius: 18px;
				margin-bottom: 10px;
				box-shadow: inset 0 1px 0 rgba(255,255,255,0.25);
			">
				<div style="
					display: flex;
					align-items: center;
					gap: 8px;
					margin-bottom: ${parsedData.answer_type === 'multi_select' ? '12px' : '8px'};
				">
					<span style="font-size: 20px; color: #14532d;">✓</span>
					<span style="font-size: 11px; color: rgba(21, 128, 61, 0.85); font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;">
						${t('aiAnswerLabel')}
					</span>
				</div>
				${answerHTML}
				<div style="
					display: inline-block;
					background: rgba(15, 23, 42, 0.1);
					color: #064e3b;
					padding: 5px 12px;
					border-radius: 999px;
					font-size: 11px;
					font-weight: 500;
					margin-top: 8px;
					border: 1px solid rgba(15, 23, 42, 0.12);
				">
					${answerTypeBadge}
				</div>
			</div>
		</div>
	`
}

function renderResults(popup, parsedList, t) {
	popup.querySelector('#ai-loading').style.display = 'none'
	const resultDiv = popup.querySelector('#ai-result')
	resultDiv.style.display = 'block'

	// Build HTML for all items
	const html = parsedList
		.map((item, i) => renderResultItem(item, t, parsedList.length > 1 ? i : null))
		.join('')

	resultDiv.innerHTML = html
}

export async function showAIAnalysis(imageBlob, x, y, t) {
	let apiKey
	let model
	let aiEnabled = false
	try {
		const storageData = await new Promise((resolve) => {
			browserAPI.storage.sync.get(
				['pollinationsApiKey', 'selectedModel', 'pollinationsModelName', 'aiEnabled'],
				resolve
			)
		})
		apiKey = storageData?.pollinationsApiKey
		model = storageData?.selectedModel || storageData?.pollinationsModelName || 'openai'
		aiEnabled = !!storageData?.aiEnabled
	} catch (err) {
		console.error('Failed to read API key or model from storage:', err)
		model = 'openai'
	}

	if (!aiEnabled) {
		showMessage(t('imageCopiedToClipboard'), 'success')
		return
	}

	const popup = createPopupShell(t, x, y)
	setupPopupInteractions(popup)

	try {
		const base64Image = await new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onloadend = () => resolve(reader.result)
			reader.onerror = reject
			reader.readAsDataURL(imageBlob)
		})

		if (!apiKey) {
			try {
				const modelsResp = await fetch('https://text.pollinations.ai/models')
				if (modelsResp.ok) {
					const modelsList = await modelsResp.json()
					const selectedModelInfo = modelsList.find((m) => m.name === model)
					if (selectedModelInfo?.tier !== 'anonymous') {
						showMessage(t('pleaseEnterApiKey'), 'error')
						return
					}
				}
			} catch (err) {
				console.warn('Model check failed, proceeding without API key check:', err)
			}
		}

		const response = await fetch('https://text.pollinations.ai/openai/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
			},
			body: JSON.stringify({
				model,
				messages: [
					{
						role: 'system',
						content: t('aiSystemPrompt'),
					},
					{
						role: 'user',
						content: [
							{ type: 'text', text: t('aiUserPrompt') },
							{ type: 'image_url', image_url: { url: base64Image } },
						],
					},
				],
			}),
		})

		if (!response.ok) {
			throw new Error(`API Error: ${response.status} ${response.statusText}`)
		}

		const data = await response.json()
		const rawContent = data.choices?.[0]?.message?.content || '{}'

		console.log('🔍 Raw AI Response:', rawContent)

		let parsedData
		try {
			parsedData = JSON.parse(sanitizeJSON(rawContent))
		} catch (error) {
			console.error('JSON Parse Error:', error)
			console.error('Failed to parse:', rawContent)
			return renderTextFallback(t, popup, rawContent)
		}

		// Support both single object and array of objects returned by the AI
		const parsedList = Array.isArray(parsedData) ? parsedData : [parsedData]

		// Validate every parsed item
		const invalid = parsedList.some((item) => {
			return !item || !item.question || !item.answer_type || (item.answer === undefined || item.answer === null)
		})

		if (invalid) {
			return renderIncompleteJSON(popup, parsedData)
		}

		// Render one or many results
		renderResults(popup, parsedList, t)
	} catch (error) {
		console.error('AI Analysis failed:', error)
		popup.querySelector('#ai-loading').style.display = 'none'
		const resultDiv = popup.querySelector('#ai-result')
		resultDiv.style.display = 'block'
		resultDiv.innerHTML = `
			<div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 6px;">
				<div style="font-size: 11px; color: #991b1b; font-weight: 600; margin-bottom: 6px;">
					${t('aiErrorLabel')}
				</div>
				<div style="color: #7f1d1d; font-size: 12px;">
					${error.message}
				</div>
			</div>
		`
	}
}
