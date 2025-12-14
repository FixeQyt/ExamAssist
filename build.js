import * as esbuild from 'esbuild'
import JavaScriptObfuscator from 'javascript-obfuscator'
import fs from 'fs'
import path from 'path'

const shouldObfuscate = process.argv.includes('--obfuscate')
const isFirefox = process.argv.includes('--firefox')
const distDir = isFirefox ? 'dist-firefox' : 'dist'
const srcDir = 'src'

const obfuscationOptions = {
	compact: true,
	simplify: true,
	identifierNamesGenerator: 'mangled-shuffled',
	renameGlobals: false,
	stringArray: true,
	stringArrayEncoding: ['rc4'],
	stringArrayThreshold: 1,
	stringArrayRotate: true,
	stringArrayShuffle: true,
	stringArrayWrappersCount: 1,
	stringArrayWrappersChainedCalls: false,
	stringArrayWrappersParametersMaxCount: 2,
	stringArrayWrappersType: 'variable',
	stringArrayIndexShift: true,
	stringArrayCallsTransform: true,
	stringArrayCallsTransformThreshold: 0.5,
	splitStrings: true,
	splitStringsChunkLength: 10,
	unicodeEscapeSequence: false,
	selfDefending: false,
	debugProtection: false,
	debugProtectionInterval: 0,
	disableConsoleOutput: false,
	numbersToExpressions: true,
	transformObjectKeys: true,
	controlFlowFlattening: true,
	controlFlowFlatteningThreshold: 0.25,
	deadCodeInjection: true,
	deadCodeInjectionThreshold: 0.05,
	log: false,
	reservedNames: ['^chrome$', '^window$', '^document$', '^navigator$', '^console$'],
}

function findJsEntryFiles(baseDir) {
	const entries = []

	function walk(currentDir) {
		const dirItems = fs.readdirSync(currentDir, { withFileTypes: true })
		for (const item of dirItems) {
			const absolutePath = path.join(currentDir, item.name)
			if (item.isDirectory()) {
				walk(absolutePath)
				continue
			}

			if (!item.isFile() || path.extname(absolutePath) !== '.js') {
				continue
			}

			entries.push(absolutePath)
		}
	}

	walk(baseDir)
	return entries
}

function deriveOutputName(filePath) {
	const relativePath = path.relative(srcDir, filePath).replace(/\\/g, '/')
	const segments = relativePath.split('/')
	const fileName = segments[segments.length - 1]

	if (fileName === 'index.js') {
		if (segments.length === 1) {
			return 'index'
		}
		return segments.slice(0, -1).join('-')
	}

	return relativePath.replace(/\.js$/, '').replace(/\//g, '-')
}

if (fs.existsSync(distDir)) {
	fs.rmSync(distDir, { recursive: true })
}
fs.mkdirSync(distDir)

const browserName = isFirefox ? 'Firefox' : 'Chrome'
console.log(`🏗️  Building ${browserName} Extension...\n`)

const entryFiles = findJsEntryFiles(srcDir)

if (!entryFiles.length) {
	console.error('❌ No .js entry files found under src/. Nothing to build.')
	process.exit(1)
}

const entryConfigs = entryFiles.map((filePath) => {
	return {
		input: filePath,
		output: deriveOutputName(filePath),
	}
})

const seenOutputs = new Set()
for (const cfg of entryConfigs) {
	const outputFileName = `${cfg.output}.js`
	if (seenOutputs.has(outputFileName)) {
		throw new Error(`Duplicate output file detected for ${outputFileName}.`)
	}
	seenOutputs.add(outputFileName)
}

const builtFiles = []

for (const entry of entryConfigs) {
	const relativeInput = path.relative('.', entry.input)
	const outputFileName = `${entry.output}.js`
	console.log(`📦 Building ${relativeInput} -> ${outputFileName}...`)

	const result = await esbuild.build({
		entryPoints: [entry.input],
		bundle: true,
		minify: false,
		format: 'iife',
		target: 'chrome120',
		write: false,
	})

	builtFiles.push({
		fileName: outputFileName,
		code: result.outputFiles[0].text,
	})
}

let finalFiles = builtFiles

if (shouldObfuscate) {
	console.log('🔒 Obfuscating bundles...')
	const sourceCodeMap = builtFiles.reduce((acc, file) => {
		acc[file.fileName] = file.code
		return acc
	}, {})

	const obfuscationResults = JavaScriptObfuscator.obfuscateMultiple(
		sourceCodeMap,
		obfuscationOptions
	)

	finalFiles = builtFiles.map((file) => ({
		fileName: file.fileName,
		code: obfuscationResults[file.fileName].getObfuscatedCode(),
	}))
}

for (const file of finalFiles) {
	fs.writeFileSync(path.join(distDir, file.fileName), file.code)
	console.log(`✅ ${file.fileName} complete\n`)
}

console.log('📋 Generating manifest...')

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const manifest = {
	manifest_version: 3,
	name: 'Screenshot Selector',
	version: pkg.version,
	description: 'Select an area on the page and copy it as an image to the clipboard',
	author: 'FixeQ',
	incognito: 'spanning',
	permissions: ['activeTab', 'scripting', 'storage'],
	host_permissions: ['https://text.pollinations.ai/*'],
	action: {},
	content_scripts: [
		{
			matches: ['https://*.testportal.pl/*', 'https://*.testportal.net/*'],
			js: ['content.js'],
			run_at: 'document_start',
			all_frames: true,
		},
	],
	web_accessible_resources: [
		{
			resources: ['bypass-inject.js'],
			matches: ['https://*.testportal.pl/*', 'https://*.testportal.net/*'],
		},
	],
}

if (isFirefox) {
	manifest.browser_specific_settings = {
		gecko: {
			id: 'screenshot-selector@fixeq.me',
			strict_min_version: '109.0',
		},
	}
	manifest.background = {
		scripts: ['background.js'],
	}
	manifest.options_ui = {
		page: 'options.html',
		open_in_tab: true,
	}
} else {
	manifest.background = {
		service_worker: 'background.js',
	}
	manifest.options_page = 'options.html'
}

fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
console.log('✅ Manifest generated\n')

const staticFiles = ['src/options.html', 'src/options/style.css', 'LICENSE']

for (const file of staticFiles) {
	if (!fs.existsSync(file)) continue
	const fileName = path.basename(file)

	// Preserve directory structure for nested files
	let destPath
	if (file.includes('options/')) {
		const optionsDir = path.join(distDir, 'options')
		if (!fs.existsSync(optionsDir)) {
			fs.mkdirSync(optionsDir, { recursive: true })
		}
		destPath = path.join(distDir, file.replace('src/', ''))
	} else {
		destPath = path.join(distDir, fileName)
	}

	if (fileName.endsWith('.html')) {
		let content = fs.readFileSync(file, 'utf8')
		for (const cfg of entryConfigs) {
			const rel = path.relative(srcDir, cfg.input).replace(/\\/g, '/')
			const outName = `${cfg.output}.js`
			content = content.split(`src="${rel}"`).join(`src="${outName}"`)
			content = content.split(`src='${rel}'`).join(`src='${outName}'`)
			content = content.split(`src="./${rel}"`).join(`src="${outName}"`)
			content = content.split(`src='./${rel}'`).join(`src='${outName}'`)
			content = content.split(`src="/${rel}"`).join(`src="${outName}"`)
			content = content.split(`src='/${rel}'`).join(`src='${outName}'`)
		}
		fs.writeFileSync(destPath, content)
	} else {
		fs.copyFileSync(file, destPath)
	}
}

console.log('\n🎉 Build complete!')
console.log(`📦 Output: ${distDir}/`)
if (shouldObfuscate) {
	console.log('🔒 Code obfuscated')
}
