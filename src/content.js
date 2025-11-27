import { browserAPI } from "./selector/browserApi.js";

(() => {
	// Cross-browser compatibility
	
	const script = document.createElement("script");
	script.src = browserAPI.runtime.getURL("bypass-inject.js");
	script.onload = () => {
		console.log("[Content] Bypass script injected");
		script.remove();
	};
	(document.head || document.documentElement).prepend(script);
})();
