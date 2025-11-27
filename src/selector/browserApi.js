/* SPDX-License-Identifier: MIT */

const rawAPI =
	typeof globalThis.browser !== 'undefined'
		? globalThis.browser
		: typeof globalThis.chrome !== 'undefined'
			? globalThis.chrome
			: undefined

if (!rawAPI) {
	throw new Error('Browser APIs are unavailable in the current tab context')
}

const isBrowser = typeof globalThis.browser !== 'undefined'

function adaptStorageSync(sync) {
	if (!sync) {
		return {
			get: () => Promise.resolve({}),
			set: (items) => Promise.resolve(),
			remove: (keys) => Promise.resolve(),
		}
	}

	return {
		get(keys, callback) {
			if (typeof callback === 'function') {
				if (isBrowser) {
					// browser.storage.sync.get returns a Promise
					sync.get(keys).then(callback, (err) => callback({}))
					return
				}
				sync.get(keys, callback)
				return
			}

			// Promise-style
			if (isBrowser) return sync.get(keys)
			return new Promise((resolve) => sync.get(keys, resolve))
		},
		set(items, callback) {
			if (typeof callback === 'function') {
				if (isBrowser) {
					sync.set(items).then(callback, () => callback())
					return
				}
				sync.set(items, callback)
				return
			}

			if (isBrowser) return sync.set(items)
			return new Promise((resolve) => sync.set(items, resolve))
		},
		remove(keys, callback) {
			if (typeof callback === 'function') {
				if (isBrowser) {
					sync.remove(keys).then(callback, () => callback())
					return
				}
				sync.remove(keys, callback)
				return
			}

			if (isBrowser) return sync.remove(keys)
			return new Promise((resolve) => sync.remove(keys, resolve))
		},
	}
}

function adaptRuntime(runtime) {
	if (!runtime) return runtime
	const r = { ...runtime }

	r.sendMessage = function (message, callback) {
		if (typeof callback === 'function') {
			if (isBrowser) {
				runtime
					.sendMessage(message)
					.then((res) => callback(res))
					.catch(() => callback(undefined))
				return
			}
			// chrome style
			runtime.sendMessage(message, callback)
			return
		}

		if (isBrowser) return runtime.sendMessage(message)

		return new Promise((resolve) => runtime.sendMessage(message, resolve))
	}

	return r
}

function adaptTabs(tabs) {
	if (!tabs) return tabs
	const t = { ...tabs }

	t.captureVisibleTab = function (windowId, options, callback) {
		if (typeof windowId === 'object' && typeof options === 'function') {
			callback = options
			options = windowId
			windowId = null
		} else if (typeof options === 'function') {
			callback = options
			options = undefined
		}

		if (typeof callback === 'function') {
			if (isBrowser) {
				try {
					// browser version returns a Promise
					if (windowId === null || typeof windowId === 'undefined') {
						tabs.captureVisibleTab(options)
							.then((res) => callback(res))
							.catch(() => callback(undefined))
					} else {
						tabs.captureVisibleTab(windowId, options)
							.then((res) => callback(res))
							.catch(() => callback(undefined))
					}
				} catch (err) {
					try {
						tabs.captureVisibleTab(windowId, options, callback)
					} catch (error) {
						callback(undefined)
					}
				}
				return
			}

			tabs.captureVisibleTab(windowId, options, callback)
			return
		}

		if (isBrowser) {
			return windowId === null || typeof windowId === 'undefined'
				? tabs.captureVisibleTab(options)
				: tabs.captureVisibleTab(windowId, options)
		}
		return new Promise((resolve) => tabs.captureVisibleTab(windowId, options, resolve))
	}

	return t
}

export const browserAPI = {
	...rawAPI,
	storage: {
		...rawAPI.storage,
		sync: adaptStorageSync(rawAPI.storage?.sync),
	},
	runtime: adaptRuntime(rawAPI.runtime),
	tabs: adaptTabs(rawAPI.tabs),
}
