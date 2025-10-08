window.addEventListener(
	"error",
	(e) => {
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();
		return true;
	},
	true,
);

Object.defineProperty(document, "hasFocus", {
	get: () => {
		throw new ReferenceError("FixeQ was here");
	},
});

window.logToServer = () => false;

console.log(
	"%c[Bypass] ✓ Injected in MAIN world",
	"color: #4CAF50; font-weight: bold",
);
