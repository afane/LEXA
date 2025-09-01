import { CreateMLCEngine, prebuiltAppConfig } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/+esm?v=5";

class LexaTranslator {
    constructor() {
        this.engine = null;
        this.modelLoaded = false;
        // Try small, browser-friendly models. We will auto-filter by what's actually available.
        this.candidateModels = [
            // Very small first
            "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
            "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
            "Qwen2-0.5B-Instruct-q4f32_1-MLC",
            "Llama-3.2-1B-Instruct-q4f16_1-MLC",
            // Small/mini models
            "Phi-3-mini-4k-instruct-q4f16_1-MLC",
            "Phi-3.5-mini-instruct-q4f16_1-MLC"
        ];
        // Extra static fallbacks if prebuiltAppConfig is missing/empty
        this.staticFallbackModels = [
            "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
            "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
            "Qwen2-0.5B-Instruct-q4f32_1-MLC",
            "Llama-3.2-1B-Instruct-q4f16_1-MLC",
            "Phi-3-mini-4k-instruct-q4f16_1-MLC",
            "Phi-3.5-mini-instruct-q4f16_1-MLC"
        ];
        this.modelId = this.candidateModels[0];
        
        this.systemPrompts = {
            "law-to-xml": "You are a legal-to-XML translator. Convert the given statutory law text to structured XML with appropriate tags for sections, subsections, definitions, and provisions. Maintain all legal meaning and structure. Use semantic XML tags like <section>, <subsection>, <definition>, <provision>, etc.",
            "xml-to-law": "You are an XML-to-legal translator. Convert the given legal XML to readable statutory language. Maintain all legal meaning and structure while making it human-readable."
        };

        this.initializeElements();
        this.setupEventListeners();
        this.checkBrowserSupport();
    }

    initializeElements() {
        this.elements = {
            modelStatus: document.getElementById('model-status'),
            loadingBar: document.getElementById('loading-bar'),
            progressFill: document.getElementById('progress-fill'),
            translateBtn: document.getElementById('translate-btn'),
            clearBtn: document.getElementById('clear-btn'),
            inputText: document.getElementById('input-text'),
            outputText: document.getElementById('output-text'),
            translationDirection: document.getElementById('translation-direction'),
            browserCheck: document.getElementById('browser-check')
        };
    }

    async checkBrowserSupport() {
        try {
            if (!navigator.gpu) {
                this.showBrowserWarning();
                return;
            }

            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                this.showBrowserWarning();
                return;
            }

            this.initializeModel();
        } catch (error) {
            this.showBrowserWarning();
        }
    }

    showBrowserWarning() {
        this.elements.browserCheck.classList.remove('hidden');
        this.elements.modelStatus.textContent = 'Browser not supported';
        this.elements.translateBtn.textContent = 'Browser Not Supported';
    }

    async initializeModel() {
        const availableIds = Array.isArray(prebuiltAppConfig?.model_list)
            ? prebuiltAppConfig.model_list.map(m => m?.model_id).filter(Boolean)
            : [];
        if (availableIds.length) {
            console.log('WebLLM available models:', availableIds);
        } else {
            console.warn('WebLLM prebuiltAppConfig.model_list missing or empty; using static fallbacks');
        }

        let ordered = availableIds.length
            ? this.prioritizeModels(availableIds, this.candidateModels)
            : [];

        if (!ordered.length) {
            ordered = [...this.staticFallbackModels];
        }

        console.log('Trying models in order:', ordered);
        const errors = [];

        for (const model of ordered) {
            try {
                this.modelId = model;
                this.updateStatus(`Loading model: ${model} ...`, true);

                const initProgressCallback = (report) => {
                    const progress = Math.round((report.progress || 0) * 100);
                    this.updateProgress(progress);
                    if (report.text) {
                        this.updateStatus(`Loading ${model}: ${report.text} (${progress}%)`);
                    }
                };

                this.engine = await CreateMLCEngine(this.modelId, { initProgressCallback });
                this.modelLoaded = true;
                this.updateStatus(`Model ready: ${model}`);
                this.elements.translateBtn.disabled = false;
                this.hideLoadingBar();
                return;
            } catch (error) {
                console.warn(`Failed to load ${model}:`, error);
                errors.push(`${model}: ${error?.message || 'Unknown error'}`);
            }
        }

        this.updateStatus('Failed to load any model. See console for details.');
        console.error('Model load failures:', errors);
    }

    prioritizeModels(allIds, preferred) {
        // Rank models by regex-based heuristics: smallest and quantized first
        const rank = (id) => {
            let r = 100;
            if (/TinyLlama/i.test(id)) r -= 50;
            if (/0\.5B/i.test(id) || /1B/i.test(id)) r -= 40;
            if (/mini-4k/i.test(id)) r -= 30;
            if (/Phi-3\.5-mini|Phi-3-mini/i.test(id)) r -= 20;
            if (/Llama-3\.2-1B/i.test(id)) r -= 15;
            if (/q4f16_1/i.test(id)) r -= 8;
            if (/q4f32_1/i.test(id)) r -= 6;
            // Nudge preferred ids to the front
            if (preferred.includes(id)) r -= 3;
            return r;
        };
        return [...allIds].sort((a,b) => rank(a) - rank(b));
    }

    updateStatus(message, showLoading = false) {
        this.elements.modelStatus.textContent = message;
        
        if (showLoading) {
            this.elements.loadingBar.classList.remove('hidden');
        }
    }

    updateProgress(percentage) {
        this.elements.progressFill.style.width = `${percentage}%`;
    }

    hideLoadingBar() {
        this.elements.loadingBar.classList.add('hidden');
    }

    setupEventListeners() {
        this.elements.translateBtn.addEventListener('click', () => this.translate());
        this.elements.clearBtn.addEventListener('click', () => this.clearText());
        
        this.elements.inputText.addEventListener('input', () => {
            if (!this.modelLoaded) return;
            this.elements.translateBtn.disabled = this.elements.inputText.value.trim() === '';
        });

        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                if (!this.elements.translateBtn.disabled) {
                    this.translate();
                }
            }
        });
    }

    async translate() {
        if (!this.modelLoaded || !this.engine) {
            this.updateStatus('Model not ready. Please wait...');
            return;
        }

        const inputText = this.elements.inputText.value.trim();
        if (!inputText) {
            return;
        }

        const direction = this.elements.translationDirection.value;
        const systemPrompt = this.systemPrompts[direction];
        
        this.elements.translateBtn.disabled = true;
        this.elements.translateBtn.textContent = 'Translating...';
        this.elements.outputText.value = 'Translating...';

        try {
            // Build a single, explicit instruction prompt to avoid chat-template issues on tiny models
            const prompt = this.buildPrompt(direction, systemPrompt, inputText);

            let response = '';
            this.elements.outputText.value = '';

            const completion = await this.engine.completions.create({
                prompt,
                temperature: 0.0,
                max_tokens: 1024,
                stream: true
            });

            for await (const chunk of completion) {
                const piece = chunk.choices?.[0]?.text ?? chunk.choices?.[0]?.delta?.content ?? '';
                if (piece) {
                    response += piece;
                    this.elements.outputText.value = response;
                    this.elements.outputText.scrollTop = this.elements.outputText.scrollHeight;
                }
            }

            // Clean up any chat markers echoed by some templates
            this.elements.outputText.value = this.stripChatMarkers(this.elements.outputText.value);

        } catch (error) {
            console.error('Translation error:', error);
            this.elements.outputText.value = 'Translation failed. Please try again.';
            this.updateStatus('Translation failed. Model may be overloaded.');
        } finally {
            this.elements.translateBtn.disabled = false;
            this.elements.translateBtn.textContent = 'Translate';
        }
    }

    buildPrompt(direction, systemPrompt, inputText) {
        if (direction === 'law-to-xml') {
            return [
                'You are a legal-to-XML translator.',
                'Convert the statutory law text to well-formed, semantic XML.',
                'Preserve all meaning and structure using tags like <section>, <subsection>, <definition>, <provision>.',
                'Output ONLY XML with no extra commentary.',
                '',
                'INPUT:',
                inputText
            ].join('\n');
        } else {
            return [
                'You are an XML-to-legal translator.',
                'Convert the legal XML to readable statutory language while preserving meaning and structure.',
                'Output clear prose; no XML in the output.',
                '',
                'INPUT:',
                inputText
            ].join('\n');
        }
    }

    stripChatMarkers(text) {
        if (!text) return text;
        // Remove common chat markers echoed by some models
        return text
            .replace(/<\|user\|>/gi, '')
            .replace(/<\|assistant\|>/gi, '')
            .replace(/^#+\s*(user|assistant)\s*:?/gim, '')
            .trim();
    }

    clearText() {
        this.elements.inputText.value = '';
        this.elements.outputText.value = '';
        this.elements.translateBtn.disabled = true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new LexaTranslator();
});
