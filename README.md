# Translator-Free-AI-MTL-Addon
A 100% free alternative to the developer's exploitative AI MTL add-ons for Translator++. Stop wasting money on the stupid point system of Translator++ !! Translate unlimited text using your own API keys or free local models (Ollama/LM Studio).


# CustomAPI Translator for Translator++

A powerful and lightweight engine add-on for [Translator++](https://dreamsavior.net/translator-plusplus/) that allows you to translate games using **ANY OpenAI-compatible API**. 

Whether you want to use completely free, uncensored local AI models (via Ollama or LM Studio) or premium cloud APIs (like OpenAI GPT-4o or OpenRouter), this add-on connects them seamlessly to your Translator++ workflow.

## ✨ Key Features
* **Universal Compatibility:** Works with any API endpoint that uses the standard OpenAI `POST /v1/chat/completions` format.
* **Local AI Support:** Perfect for offline translation using **Ollama** or **LM Studio**. Zero API costs and complete privacy.
* **Built-in RTL (Arabic) Support:** Includes a smart, toggleable Right-To-Left (RTL) text reverser. It reverses Arabic letters while protecting game codes (like `\V[1]`, `<br>`, `\N[2]`) and numbers from breaking.
* **Smart Batching & Rate Limit Protection:** Prevents API overloads by sending requests in customizable batches with built-in delays. Say goodbye to `429 Too Many Requests` errors!
* **Fully Customizable UI:** Change the Base URL, API Key, Model Name, and System Prompts directly from the Translator++ Options menu.

---

## 📥 Installation

Unlike traditional Node.js add-ons, this engine requires zero external dependencies. Just drop it in and run!

1. Open Translator++ folder.
2. Navigate to the `addons` directory (e.g., `C:\Translator++\www\addons\`).
3. Create a new folder and name it `CustomAPI_Translator`.
4. Download or copy the `package.json` and `index.js` files from this repository and place them inside the [CustomAPI_Translator](https://dreamsavior.net/translator-plusplus/](https://github.com/aa4474/Translator-Free-AI-MTL-Addon/releases/tag/CustomAPI_Translator) folder.
5. Restart Translator++.

---

## ⚙️ How to Use & Configuration

Configuration is done directly within the code. Once installed, you need to configure your API settings before translating:

1. Open the `index.js` file using **any text editor** (even standard Windows Notepad works perfectly).
2. Locate the configuration variables at the top of the file.
3. Fill in the required API settings based on your provider:

### Example Configurations:

**Option A: Local AI (LM Studio)**
* `baseUrl:` `"http://localhost:1234/v1/chat/completions"`
* `apiKey:` `"local"` (or anything)
* `model:` `"your-loaded-model-name"`
* *(Note: Make sure CORS is enabled in LM Studio server settings)*

**Option B: Official OpenAI Cloud**
* `baseUrl:` `"https://api.openai.com/v1/chat/completions"`
* `apiKey:` `"sk-your-real-api-key-here"`
* `model:` `"gpt-4o-mini"` (or `gpt-4o`)

4. **System Prompt:** Customize the `systemPrompt` variable to fit your target language and game context. The default prompt is heavily optimized for video game localization.
5. **Save** the `index.js` file and (re)start Translator++.
6. In your project grid, select the rows you want to translate, right-click, choose **Translate Selected**, and pick **OpenAI Custom API** from the translation dropdown list.

---

## 🌍 Note for Arabic / RTL Translators
This add-on features a built-in RTL text reverser designed specifically for old engines like RPG Maker. It will safely reverse your text while keeping game variables intact.

By default, this feature is **DISABLED** to support standard Left-To-Right (LTR) languages like English, Spanish, etc. 

If you are translating to **Arabic** (or any Right-To-Left language), you must enable it:
1. Open `index.js` in your text editor (Notepad, VS Code, etc.).
2. Find the line: `const ENABLE_ARABIC_REVERSE = false;`
3. Change it to: `const ENABLE_ARABIC_REVERSE = true;`
4. Save the file and restart Translator++.
---

## 📝 License
This project is open-source and free to use. Feel free to modify and adapt it to your specific localization needs!
