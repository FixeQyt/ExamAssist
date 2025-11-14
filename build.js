import * as esbuild from "esbuild";
import JavaScriptObfuscator from "javascript-obfuscator";
import fs from "fs";
import path from "path";

const shouldObfuscate = process.argv.includes("--obfuscate");
const isFirefox = process.argv.includes("--firefox");
const distDir = isFirefox ? "dist-firefox" : "dist";

if (fs.existsSync(distDir)) {
	fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

const browserName = isFirefox ? "Firefox" : "Chrome";
console.log(`🏗️  Building ${browserName} Extension...\n`);

const entryPoints = [
	{ in: "src/background.js", out: "background" },
	{ in: "src/content.js", out: "content" },
	{ in: "src/bypass-inject.js", out: "bypass-inject" },
	{ in: "src/options.js", out: "options" },
	{ in: "src/selector/index.js", out: "selector" },
];

for (const entry of entryPoints) {
	console.log(`📦 Building ${entry.in}...`);

	const result = await esbuild.build({
		entryPoints: [entry.in],
		bundle: true,
		minify: false,
		format: "iife",
		target: "chrome120",
		write: false,
	});

	let code = result.outputFiles[0].text;

	if (shouldObfuscate) {
		console.log(`🔒 Obfuscating ${entry.out}.js...`);

		const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
			compact: true,
			simplify: true,
			identifierNamesGenerator: "hexadecimal",
			renameGlobals: false,
			stringArray: false,
			splitStrings: true,
			splitStringsChunkLength: 10,
			unicodeEscapeSequence: false,
			selfDefending: false,
			debugProtection: false,
			disableConsoleOutput: false,
			numbersToExpressions: true,
			transformObjectKeys: false,
			controlFlowFlattening: false,
			deadCodeInjection: false,
			reservedNames: [
				"^chrome$",
				"^window$",
				"^document$",
				"^navigator$",
				"^console$",
			],
		});

		code = obfuscationResult.getObfuscatedCode();
	}

	fs.writeFileSync(`${distDir}/${entry.out}.js`, code);
	console.log(`✅ ${entry.out}.js complete\n`);
}

console.log("📋 Generating manifest...");

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const manifest = {
	manifest_version: 3,
	name: "Screenshot Selector",
	version: pkg.version,
	description: "Select an area on the page and copy it as an image to the clipboard",
	author: "FixeQ",
	incognito: "spanning",
	permissions: ["activeTab", "scripting", "storage"],
	host_permissions: ["https://text.pollinations.ai/*"],
	action: {},
	content_scripts: [
		{
			matches: ["https://*.testportal.pl/*", "https://*.testportal.net/*"],
			js: ["content.js"],
			run_at: "document_start",
			all_frames: true
		}
	],
	web_accessible_resources: [
		{
			resources: ["bypass-inject.js"],
			matches: ["https://*.testportal.pl/*", "https://*.testportal.net/*"]
		}
	]
};

if (isFirefox) {
	manifest.browser_specific_settings = {
		gecko: {
			id: "screenshot-selector@fixeqyt.github.io",
			strict_min_version: "109.0"
		}
	};
	manifest.background = {
		scripts: ["background.js"]
	};
	manifest.options_ui = {
		page: "options.html",
		open_in_tab: true
	};
} else {
	manifest.background = {
		service_worker: "background.js"
	};
	manifest.options_page = "options.html";
}

fs.writeFileSync(path.join(distDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("✅ Manifest generated\n");

const staticFiles = [
	"src/options.html",
	"LICENSE",
];

for (const file of staticFiles) {
	if (fs.existsSync(file)) {
		const fileName = path.basename(file);
		fs.copyFileSync(file, path.join(distDir, fileName));
	}
}

console.log("\n🎉 Build complete!");
console.log(`📦 Output: ${distDir}/`);
if (shouldObfuscate) {
	console.log("🔒 Code obfuscated");
}
