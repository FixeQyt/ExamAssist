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

console.log("📋 Copying static files...");

// Copy the appropriate manifest file
const manifestFile = isFirefox ? "manifest_firefox.json" : "manifest.json";
if (fs.existsSync(manifestFile)) {
	fs.copyFileSync(manifestFile, path.join(distDir, "manifest.json"));
}

const staticFiles = [
	"src/options.html",
	"LICENSE",
	"README.md",
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
