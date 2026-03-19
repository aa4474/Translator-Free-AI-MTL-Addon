/**
 * CustomAPI_Translator — Translator++ Engine Add-on
 * ==================================================
 * Connects Translator++ to ANY OpenAI-compatible API endpoint.
 * Compatible with: Ollama, LM Studio, OpenRouter, OpenAI, and any
 * server that implements POST /v1/chat/completions.
 *
 * Architecture (reverse-engineered Translator++ rules):
 *  - Uses the built-in `TranslatorEngine` class directly (no npm, no require).
 *  - UI fields are declared via `optionsForm` (schema + angular-schema-form).
 *  - Translation logic lives in `fetchTranslation()` override.
 *  - Settings are read at runtime via `this.getOptions("key")`.
 *  - Bootstrapped with jQuery's $(document).ready().
 */

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 1: Default values
// Centralised here so they're easy to change without hunting through the code.
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// 🚨 أداة عكس الحروف العربية المخصصة (RTL) 🚨
// ─────────────────────────────────────────────────────────────────────────────

const ENABLE_ARABIC_REVERSE = false; // < --- Switch here to enable write `true`
function reverseArabicSafe(text) {
    if (!ENABLE_ARABIC_REVERSE || typeof text !== 'string') return text;

    // هذا التعبير النمطي يبحث عن: الأكواد (\V[1] أو \N)، الأوسمة (<br>)، والأرقام/الإنجليزي لحمايتها
    const protectRegex = /(\\[A-Za-z]+\[?\d*\]?|<[^>]+>|[A-Za-z0-9]+)/g;
    
    // تقسيم النص مع الاحتفاظ بالأشياء المحمية كـ "كتل" ثابتة
    let parts = text.split(protectRegex);

    // عكس الترتيب العام للجملة (لتصبح من اليمين لليسار)
    parts.reverse();

    // تمشيط الأجزاء: عكس حروف النص العربي فقط
    for (let i = 0; i < parts.length; i++) {
        let part = parts[i];
        // إذا كان الجزء ليس فارغاً ولا يطابق الأشياء المحمية، اعكس حروفه
        if (part && !part.match(protectRegex)) {
            parts[i] = part.split('').reverse().join('');
        }
    }
    
    return parts.join('');
}
// ----------------------------- > Here's where you input your api =============================
var DEFAULTS = {
  baseUrl: "Enter your api base url /v1/chat/completions",
  apiKey: "Enter your key here",
  model: "Enter model name here",
  systemPrompt:
"Write your prompt here",
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 2: Options Form Definition
// This object is passed to the TranslatorEngine constructor.
// `schema`  → JSON Schema describing each setting and its type/default.
// `form`    → Angular Schema Form layout array controlling how fields render.
// ─────────────────────────────────────────────────────────────────────────────

var optionsForm = {

  // ── JSON Schema ─────────────────────────────────────────────────────────────
  schema: {
    type: "object",
    properties: {

      baseUrl: {
        type: "string",
        title: "API Base URL",
        default: DEFAULTS.baseUrl,
        description:
          "Full URL to the chat completions endpoint. " +
          "For Ollama: http://localhost:11434/v1/chat/completions | " +
          "For LM Studio: http://localhost:1234/v1/chat/completions",
      },

      apiKey: {
        type: "string",
        title: "API Key",
        default: DEFAULTS.apiKey,
        description:
          "Bearer token sent in the Authorization header. " +
          "Local servers (Ollama, LM Studio) accept any non-empty string.",
      },

      model: {
        type: "string",
        title: "Model Name",
        default: DEFAULTS.model,
        description:
          "Exact model identifier as expected by the server. " +
          "Examples: llama3, mistral, gpt-4o, openhermes-2.5-mistral",
      },

      systemPrompt: {
        type: "string",
        title: "System Prompt",
        default: DEFAULTS.systemPrompt,
        description:
          "Instructions given to the model before translation begins. " +
          "Edit to change target language, tone, or special handling rules.",
      },

      maxTokens: {
        type: "number",
        title: "Max Tokens",
        default: 2048,
        minimum: 64,
        maximum: 32768,
        description: "Maximum tokens the model may generate per request.",
      },

      temperature: {
        type: "number",
        title: "Temperature",
        default: 0.2,
        minimum: 0,
        maximum: 2,
        description:
          "Sampling temperature. Lower = more deterministic (recommended for translation).",
      },

      batchSize: {
        type: "number",
        title: "Lines per Request",
        default: 8,
        minimum: 1,
        maximum: 50,
        description:
          "Number of source lines to bundle into one API call. " +
          "Reduce to 1 for strict line-by-line mode.",
      },

      timeoutMs: {
        type: "number",
        title: "Request Timeout (ms)",
        default: 60000,
        minimum: 3000,
        maximum: 300000,
        description: "Abort the request after this many milliseconds.",
      },

    }, // end properties
    required: ["baseUrl", "model"],
  }, // end schema

  // ── Angular Schema Form layout ───────────────────────────────────────────────
  // Controls the visual order and widget types in the Options panel.
  form: [
    {
      key: "baseUrl",
      type: "text",
    },
    {
      key: "apiKey",
      type: "text",            // use "password" if you want a masked field
    },
    {
      key: "model",
      type: "text",
    },
    {
      key: "systemPrompt",
      type: "textarea",
      placeholder: "Enter translation instructions for the model...",
    },
    {
      type: "section",
      title: "Advanced Settings",
      items: [
        { key: "maxTokens",    type: "number" },
        { key: "temperature",  type: "number" },
        { key: "batchSize",    type: "number" },
        { key: "timeoutMs",    type: "number" },
      ],
    },
  ], // end form

}; // end optionsForm

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 3: Engine instantiation
// ─────────────────────────────────────────────────────────────────────────────
var thisEngine = new TranslatorEngine({
  id:          "CustomAPI_Translator",
  name:        "OpenAI Custom API",
  description: "Translate via official OpenAI API",
  version:     "1.0.0",
  author:      "Custom",
  targetLang:  "AR",

  // ── إعدادات الطابور السريعة والآمنة ──
  mode:                 "rowByRow", 
  maxConcurrentRequest: 3,    // إرسال 3 طلبات متزامنة للسرعة
  rowLimitPerBatch:     1,    // 🚨 سطر واحد لكل طلب (الحل الجذري لمشكلة التوزيع في الخانات) 🚨
  batchDelay:           100,  // تأخير خفيف جداً لأن الطلبات صغيرة
  batchTimeOut:         60000,      

  optionsForm: optionsForm,
});

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 4: Helper — build the OpenAI messages array
//
// Uses a numbered-list strategy so the model returns results in a format
// that is easy to parse deterministically.
//
// Sent to the model:
//   1: <line 1>
//   2: <line 2>
//   ...
//
// Expected reply:
//   1: <translated line 1>
//   2: <translated line 2>
//   ...
// ─────────────────────────────────────────────────────────────────────────────

function buildMessages(lines, systemPrompt) {
  var numberedSource = lines
    .map(function (line, i) { return (i + 1) + ": " + line; })
    .join("\n");

  var userContent =
    "Translate the following " + lines.length + " line(s). " +
    "Reply ONLY with the same numbered format (1: ..., 2: ...). " +
    "No commentary, no extra lines.\n\n" +
    numberedSource;

  return [
    { role: "system", content: systemPrompt || DEFAULTS.systemPrompt },
    { role: "user",   content: userContent },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 5: Helper — parse the numbered-list response back into a string array
//
// Falls back gracefully if the model ignores the numbered format:
//   Stage 1 → parse "N: text" lines
//   Stage 2 → split by newlines and zip
//   Stage 3 → return original source line (so Translator++ never crashes)
// ─────────────────────────────────────────────────────────────────────────────

function parseNumberedResponse(responseText, originalLines) {
  var count  = originalLines.length;
  var parsed = new Array(count).fill(null);

  // Stage 1: parse numbered format
  var rows = responseText.split("\n");
  for (var r = 0; r < rows.length; r++) {
    var match = rows[r].match(/^(\d+):\s*(.*)$/);
    if (match) {
      var idx = parseInt(match[1], 10) - 1; // 0-based
      if (idx >= 0 && idx < count && parsed[idx] === null) {
        parsed[idx] = match[2].trim();
      }
    }
  }

  // Check if Stage 1 was fully successful
  var allFound = parsed.every(function (v) { return v !== null; });
  if (allFound) return parsed;

  // Stage 2: plain newline split
  var plainLines = responseText
    .split("\n")
    .map(function (l) { return l.trim(); })
    .filter(function (l) { return l.length > 0; });

  if (plainLines.length === count) return plainLines;

  // Stage 3: fill gaps — use plain line if available, else original source
  return parsed.map(function (val, i) {
    if (val !== null)                  return val;
    if (plainLines[i] !== undefined)   return plainLines[i];
    return originalLines[i];           // absolute fallback
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 6: Helper — chunk an array into sub-arrays of a given size
// ─────────────────────────────────────────────────────────────────────────────

function chunkArray(arr, size) {
  var chunks = [];
  for (var i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 7: Helper — perform one API call for a single batch of lines
//
// Uses the browser-native `fetch` API (no axios, no require).
// Returns a Promise<string[]> for the translated lines in this batch.
// ─────────────────────────────────────────────────────────────────────────────

function translateBatch(lines, options) {
  var baseUrl      = options.baseUrl      || DEFAULTS.baseUrl;
  var apiKey       = options.apiKey       || DEFAULTS.apiKey;
  var model        = options.model        || DEFAULTS.model;
  var systemPrompt = options.systemPrompt || DEFAULTS.systemPrompt;
  var maxTokens    = Number(options.maxTokens   || 2048);
  var temperature  = Number(options.temperature || 0.2);
  var timeoutMs    = Number(options.timeoutMs   || 60000);

  var requestBody = JSON.stringify({
    model:       model,
    messages:    buildMessages(lines, systemPrompt),
    max_tokens:  maxTokens,
    temperature: temperature,
    stream:      false,
  });

  // AbortController lets us enforce the timeout ourselves
  var controller = new AbortController();
  var timeoutId  = setTimeout(function () { controller.abort(); }, timeoutMs);

  return fetch(baseUrl, {
    method:  "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": "Bearer " + apiKey,
    },
    body:   requestBody,
    signal: controller.signal,
  })
  .then(function (response) {
    clearTimeout(timeoutId);

    if (!response.ok) {
      // Read error body for a helpful message, then reject
      return response.text().then(function (errText) {
        throw new Error(
          "[CustomAPI] HTTP " + response.status + " from " + baseUrl + "\n" + errText
        );
      });
    }

    return response.json();
  })
  .then(function (data) {
    // Validate the OpenAI-style response shape
    if (
      !data ||
      !Array.isArray(data.choices) ||
      data.choices.length === 0 ||
      !data.choices[0].message ||
      typeof data.choices[0].message.content !== "string"
    ) {
      throw new Error(
        "[CustomAPI] Unexpected response shape from " + baseUrl + "\n" +
        JSON.stringify(data, null, 2)
      );
    }

    var rawReply = data.choices[0].message.content.trim();
    return parseNumberedResponse(rawReply, lines);
  })
  .catch(function (err) {
    clearTimeout(timeoutId);

    // Friendly message for the most common local-server mistake
    if (err.name === "AbortError") {
      throw new Error(
        "[CustomAPI] Request timed out after " + timeoutMs + "ms.\n" +
        "Hint: increase the timeout or reduce 'Lines per Request'."
      );
    }

    // Re-throw anything else with context
    throw err;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 8: fetchTranslation — the method Translator++ calls
// ─────────────────────────────────────────────────────────────────────────────

thisEngine.fetchTranslation = async function (texts, sl, tl, textObj, options) {
    // توحيد المدخلات (مع rowLimitPerBatch: 1، سيكون texts دائماً نصاً مفرداً)
    var inputLines = Array.isArray(texts) ? texts : [texts];
    var self = this;

    var liveOptions = {
        baseUrl:      self.getOptions("baseUrl"),
        apiKey:       self.getOptions("apiKey"),
        model:        self.getOptions("model"),
        systemPrompt: self.getOptions("systemPrompt"),
        maxTokens:    self.getOptions("maxTokens"),
        temperature:  self.getOptions("temperature"),
        timeoutMs:    self.getOptions("timeoutMs"),
    };

    try {
        // إرسال السطر للذكاء الاصطناعي
        var resultsArray = await translateBatch(inputLines, liveOptions);

        // تطبيق دالة العكس (RTL) لحماية الأكواد
        var reversedArray = resultsArray.map(function(line) {
            return reverseArabicSafe(line);
        });

        // إرجاع النص المترجم والمعكوس للخانة
        return reversedArray[0] || texts;

    } catch (error) {
        // 🚨 هنا السحر: إذا حدث خطأ (تعليق من OpenAI)، لن نرمي Error يكسر البرنامج!
        // بل سنطبع الخطأ في الخلفية، ونعيد النص الأصلي كما هو لكي يستمر طابور الترجمة!
        console.error("[CustomAPI] Skipped line due to error:", error.message);
        return texts; 
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION 9: Bootstrap
// Translator++ requires engines to be initialised after the DOM is ready.
// `trans` is the global Translator++ application object.
// ─────────────────────────────────────────────────────────────────────────────

$(document).ready(function () {
  trans.getTranslatorEngine(thisEngine.id).init();
  console.log("[CustomAPI] Engine '" + thisEngine.name + "' registered and ready.");
});
