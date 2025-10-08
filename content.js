(() => {
	const script = document.createElement("script");
	script.src = chrome.runtime.getURL("bypass-inject.js");
	script.onload = () => {
		console.log("[Content] Bypass script injected");
		script.remove();
	};
	(document.head || document.documentElement).prepend(script);
})();
