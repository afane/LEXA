import { CreateMLCEngine, prebuiltAppConfig } from "https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@latest/+esm";

class LexaTranslator {
    constructor() {
        this.engine = null;
        this.modelLoaded = false;
        // Try small, browser-friendly models; auto-filter to what exists in prebuilt config
        this.candidateModels = [
            "Phi-3-mini-4k-instruct-q4f16_1-MLC",
            "TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC",
            "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
            "Qwen2-0.5B-Instruct-q4f32_1-MLC"
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
        const availableKeys = prebuiltAppConfig?.model_list ? Object.keys(prebuiltAppConfig.model_list) : [];
        const available = new Set(availableKeys);
        let ordered = this.candidateModels.filter(m => available.has(m));

        if (ordered.length === 0 && availableKeys.length) {
            ordered = this.pickSmallModelsFromPrebuilt(availableKeys);
        }

        if (!ordered.length) {
            this.updateStatus('No compatible models found for this browser');
            console.error('No compatible models in prebuiltAppConfig.model_list');
            return;
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

    pickSmallModelsFromPrebuilt(keys) {
        const families = [
            'TinyLlama-1.1B-Chat',
            'Qwen2.5-0.5B-Instruct',
            'Qwen2-0.5B-Instruct',
            'Phi-3-mini-4k-instruct'
        ];
        const quantPrefs = ['q4f16_1', 'q4f32_1'];
        const results = [];
        for (const fam of families) {
            for (const q of quantPrefs) {
                const match = keys.find(k => k.startsWith(fam) && k.includes(q));
                if (match) results.push(match);
            }
        }
        if (!results.length) {
            results.push(...keys.filter(k => /TinyLlama|0\.5B|mini-4k/i.test(k)).slice(0, 3));
        }
        return results;
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
            const messages = [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user", 
                    content: `Convert this ${direction === 'law-to-xml' ? 'statutory text to XML' : 'XML to statutory language'}:\n\n${inputText}`
                }
            ];

            let response = '';
            this.elements.outputText.value = '';

            const completion = await this.engine.chat.completions.create({
                messages: messages,
                temperature: 0.1,
                max_tokens: 1024,
                stream: true
            });

            for await (const chunk of completion) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) {
                    response += content;
                    this.elements.outputText.value = response;
                    this.elements.outputText.scrollTop = this.elements.outputText.scrollHeight;
                }
            }

        } catch (error) {
            console.error('Translation error:', error);
            this.elements.outputText.value = 'Translation failed. Please try again.';
            this.updateStatus('Translation failed. Model may be overloaded.');
        } finally {
            this.elements.translateBtn.disabled = false;
            this.elements.translateBtn.textContent = 'Translate';
        }
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
