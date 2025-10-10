(() => {
	// Cross-browser compatibility
	const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
	
	const script = document.createElement("script");
	script.src = browserAPI.runtime.getURL("bypass-inject.js");
	script.onload = () => {
		console.log("[Content] Bypass script injected");
		script.remove();
	};
	(document.head || document.documentElement).prepend(script);
})();
