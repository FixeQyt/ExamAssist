# Screenshot Selector - AI Test Helper

Chrome extension for capturing screenshots and analyzing test questions using AI.

## 📋 Description

Screenshot Selector is a Chrome extension that allows you to:
- Select an area on a page and copy it as an image to the clipboard
- Analyze test questions using AI (Pollinations API)
- Automatically recognize question types (single choice, multiple choice, text)
- Receive answers in your selected language (Polish/English)
- Bypass testportal.pl/testportal.net protections

## ✨ Features

- **Area Selection**: Click the extension icon and select any area on the page
- **AI Analysis**: Automatic analysis of test questions from images
- **Clipboard Copy**: Image is automatically copied to the clipboard
- **Answer Modes**: Recognition of different question types (text/select_one/multi_select)
- **Multilingual**: Full support for Polish and English languages (UI and AI prompts)
- **Security Bypass**: Bypass testportal.pl protections

## 🚀 Installation

### Requirements
- Node.js (version 16 or newer)
- Chrome/Edge/Brave (supported Chromium browsers)

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/FixeQyt/ai-cheat.git
cd ai-cheat
```

2. **Install dependencies**
```bash
npm install
```

3. **Build the extension**
```bash
# Standard build
npm run build

# Build with obfuscation
npm run build:obfuscate
```

4. **Load into Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the project

## ⚙️ Configuration

### API Key (Pollinations)

1. Right-click the extension icon and select "Options"
2. Enter your Pollinations API key
3. Select your preferred interface language (Polish/English)
4. Click "Save"

**Note**: Without an API key, the extension will only copy images to the clipboard without AI analysis.

### Language Selection

The extension supports full internationalization (i18n):
- **UI Language**: All interface elements (buttons, labels, messages) are translated
- **AI Prompts**: The AI system receives instructions in the selected language
- **AI Responses**: The AI provides answers in the selected language

Supported languages:
- **Polish (Polski)**: Full UI and AI prompts in Polish
- **English**: Full UI and AI prompts in English

To change the language, go to the Options page and select your preferred language from the dropdown menu.

## 📖 Usage

### Basic Usage

1. **Click the extension icon** in the Chrome toolbar
2. **Select an area** on the page you want to capture
3. **Automatic analysis**: If you have an API key configured, you'll receive:
   - Detected question
   - Answer type
   - Suggested answer

### AI Analysis Result

The extension returns data in JSON format:
```json
{
  "question": "detected question",
  "answer_type": "text|select_one|multi_select",
  "answer": "answer"
}
```

### Answer Types

- **text**: Open-ended questions requiring text answers
- **select_one**: Single choice questions (A, B, C, D)
- **multi_select**: Multiple choice questions (select all correct)

## 🏗️ Project Structure

```
ai-cheat/
├── src/
│   ├── background.js      # Main extension logic
│   ├── content.js         # Content script
│   ├── bypass-inject.js   # Testportal bypass
│   ├── options.js         # Options page
│   ├── options.html       # Options page UI
│   └── locales/           # Translation files
│       ├── pl.json        # Polish translations
│       └── en.json        # English translations
├── build.js               # Build script
├── manifest.json          # Chrome extension manifest
├── package.json           # npm dependencies
└── LICENSE                # MIT License
```

## 🔨 Build Scripts

```bash
# Build without obfuscation
npm run build

# Build with obfuscation
npm run build:obfuscate
```

### What Does Building Do?

1. Compiles JavaScript files using esbuild
2. (Optionally) Obfuscates code using javascript-obfuscator
3. Copies static files (manifest.json, options.html, LICENSE, README.md)
4. Creates `dist/` folder with ready extension

## 🔒 Security and Privacy

- **API Key**: Stored securely in Chrome Storage API
- **Permissions**: Extension requires minimal permissions:
  - `activeTab`: Access to active tab
  - `scripting`: Script injection
  - `storage`: API key storage
- **Host Permissions**: Access only to testportal.pl/net and Pollinations API

## 📝 API

### Pollinations AI API

The extension uses Pollinations API for image analysis:
- **Endpoint**: `https://text.pollinations.ai/openai/v1/chat/completions`
- **Model**: `o4-mini`
- **Format**: OpenAI-compatible API

## 🐛 Troubleshooting

### Extension Not Working
1. Check if the extension is enabled in `chrome://extensions/`
2. Reload the page after installing the extension
3. Check the browser console (F12) for errors

### AI Not Returning Answers
1. Check if you have an API key configured in options
2. Check your internet connection
3. Verify that the API key is correct

### Image Not Being Copied
1. Check clipboard permissions in the browser
2. Try selecting a larger area (min. 10x10 px)

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## ⚠️ Disclaimer

This tool was created solely for educational purposes. The user bears full responsibility for how this extension is used. The author is not responsible for misuse of this software.

> [!NOTE]  
> README.md made by AI lol
