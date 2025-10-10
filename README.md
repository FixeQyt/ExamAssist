# Screenshot Selector - AI Test Helper

Rozszerzenie Chrome do przechwytywania zrzutów ekranu i analizowania pytań testowych za pomocą AI.

## 📋 Opis

Screenshot Selector to rozszerzenie Chrome, które pozwala:
- Zaznaczać obszar na stronie i kopiować go jako obraz do schowka
- Analizować pytania testowe za pomocą AI (Pollinations API)
- Automatycznie rozpoznawać typ pytania (jednokrotny wybór, wielokrotny wybór, tekstowe)
- Otrzymywać odpowiedzi w języku polskim
- Omijać zabezpieczenia testportal.pl/testportal.net

## ✨ Funkcje

### 🎯 Główne funkcje
- **Zaznaczanie obszaru**: Kliknij ikonę rozszerzenia i zaznacz dowolny obszar na stronie
- **Analiza AI**: Automatyczna analiza pytań testowych z obrazu
- **Kopiowanie do schowka**: Obraz jest automatycznie kopiowany do schowka
- **Tryby odpowiedzi**: Rozpoznawanie różnych typów pytań (text/select_one/multi_select)
- **Polski język**: Wszystkie odpowiedzi w języku polskim

### 🔧 Funkcje techniczne
- **Obfuskacja kodu**: Opcjonalna obfuskacja kodu JavaScript (`--obfuscate`)
- **Bypass zabezpieczeń**: Omijanie zabezpieczeń testportal.pl
- **Content Script Injection**: Wstrzykiwanie skryptów w kontekście strony
- **Storage API**: Bezpieczne przechowywanie klucza API

## 🚀 Instalacja

### Wymagania
- Node.js (wersja 16 lub nowsza)
- Chrome/Edge/Brave (wspierane przeglądarki Chromium)

### Kroki instalacji

1. **Sklonuj repozytorium**
```bash
git clone https://github.com/FixeQyt/ai-cheat.git
cd ai-cheat
```

2. **Zainstaluj zależności**
```bash
npm install
```

3. **Zbuduj rozszerzenie**
```bash
# Standardowa kompilacja
npm run build

# Z obfuskacją kodu
npm run build:obfuscate
```

4. **Załaduj do Chrome**
   - Otwórz `chrome://extensions/`
   - Włącz "Tryb programisty" (Developer mode)
   - Kliknij "Załaduj rozpakowane" (Load unpacked)
   - Wybierz folder `dist` z projektu

## ⚙️ Konfiguracja

### API Key (Pollinations)

1. Kliknij ikonę rozszerzenia
2. Kliknij prawym przyciskiem myszy i wybierz "Opcje"
3. Wpisz swój klucz API Pollinations
4. Kliknij "Zapisz"

**Uwaga**: Bez klucza API, rozszerzenie będzie tylko kopiować obrazy do schowka bez analizy AI.

## 📖 Użycie

### Podstawowe użycie

1. **Kliknij ikonę rozszerzenia** w pasku narzędzi Chrome
2. **Zaznacz obszar** na stronie, który chcesz przechwycić
3. **Automatyczna analiza**: Jeśli masz skonfigurowany API key, otrzymasz:
   - Rozpoznane pytanie
   - Typ odpowiedzi
   - Sugerowaną odpowiedź

### Wynik analizy AI

Rozszerzenie zwraca dane w formacie JSON:
```json
{
  "question": "wykryte pytanie",
  "answer_type": "text|select_one|multi_select",
  "answer": "odpowiedź"
}
```

### Typy odpowiedzi

- **text**: Pytania otwarte wymagające tekstowej odpowiedzi
- **select_one**: Pytania jednokrotnego wyboru (A, B, C, D)
- **multi_select**: Pytania wielokrotnego wyboru (zaznacz wszystkie poprawne)

### Specjalne funkcje

#### Rozwijanie skrótów
Jeśli pytanie zawiera skróty (np. CPU, RAM, HTML), AI odpowiada w oryginalnym języku skrótu:
- CPU → "Central Processing Unit" (angielski)
- BRD → "Bundesrepublik Deutschland" (niemiecki)

## 🏗️ Struktura projektu

```
ai-cheat/
├── src/
│   ├── background.js      # Główna logika rozszerzenia
│   ├── content.js         # Content script
│   ├── bypass-inject.js   # Bypass dla testportal
│   ├── options.js         # Strona opcji
│   └── options.html       # UI strony opcji
├── build.js               # Skrypt budowania
├── manifest.json          # Manifest rozszerzenia Chrome
├── package.json           # Zależności npm
└── LICENSE                # Licencja MIT
```

## 🔨 Skrypty budowania

```bash
# Budowanie bez obfuskacji
npm run build

# Budowanie z obfuskacją
npm run build:obfuscate
```

### Co robi budowanie?

1. Kompiluje pliki JavaScript za pomocą esbuild
2. (Opcjonalnie) Obfuskuje kod za pomocą javascript-obfuscator
3. Kopiuje pliki statyczne (manifest.json, options.html, LICENSE, README.md)
4. Tworzy folder `dist/` z gotowym rozszerzeniem

## 🔒 Bezpieczeństwo i prywatność

- **API Key**: Przechowywany bezpiecznie w Chrome Storage API
- **Uprawnienia**: Rozszerzenie wymaga minimalnych uprawnień:
  - `activeTab`: Dostęp do aktywnej karty
  - `scripting`: Wstrzykiwanie skryptów
  - `storage`: Przechowywanie klucza API
- **Host Permissions**: Dostęp tylko do testportal.pl/net i API Pollinations

## 🎨 Konfiguracja obfuskacji

Parametry obfuskacji (w `build.js`):
- `compact: true` - Kompaktowy kod
- `simplify: true` - Uproszczenie kodu
- `identifierNamesGenerator: "hexadecimal"` - Nazwy zmiennych w hex
- `splitStrings: true` - Dzielenie stringów
- `numbersToExpressions: true` - Konwersja liczb na wyrażenia

## 📝 API

### Pollinations AI API

Rozszerzenie używa Pollinations API do analizy obrazów:
- **Endpoint**: `https://text.pollinations.ai/openai/v1/chat/completions`
- **Model**: `o4-mini`
- **Format**: OpenAI-compatible API

## 🐛 Rozwiązywanie problemów

### Rozszerzenie nie działa
1. Sprawdź czy rozszerzenie jest włączone w `chrome://extensions/`
2. Przeładuj stronę po zainstalowaniu rozszerzenia
3. Sprawdź konsolę przeglądarki (F12) pod kątem błędów

### AI nie zwraca odpowiedzi
1. Sprawdź czy masz skonfigurowany API key w opcjach
2. Sprawdź połączenie internetowe
3. Sprawdź czy API key jest prawidłowy

### Obraz nie jest kopiowany
1. Sprawdź uprawnienia do schowka w przeglądarce
2. Spróbuj zaznaczać większy obszar (min. 10x10 px)

## 📄 Licencja

MIT License - zobacz plik [LICENSE](LICENSE)

Copyright (c) 2025 Paweł (fixeq)

## 👤 Autor

**fixeq** - [FixeQyt](https://github.com/FixeQyt)

## ⚠️ Disclaimer

To narzędzie zostało stworzone wyłącznie w celach edukacyjnych. Użytkownik ponosi pełną odpowiedzialność za sposób wykorzystania tego rozszerzenia. Autor nie ponosi odpowiedzialności za niewłaściwe użycie tego oprogramowania.

## 🤝 Wkład

Pull requesty są mile widziane! W przypadku większych zmian, najpierw otwórz issue, aby omówić proponowane zmiany.

## 📮 Kontakt

Jeśli masz pytania lub sugestie, otwórz issue w repozytorium GitHub.

---

**Uwaga**: To rozszerzenie działa najlepiej na stronach testportal.pl i testportal.net, gdzie automatycznie omija niektóre zabezpieczenia.
