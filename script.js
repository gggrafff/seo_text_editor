document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Quill and Custom Highlight Blot
    const Inline = Quill.import('blots/inline');
    class HighlightBlot extends Inline {
        static create(value) {
            let node = super.create();
            if (value === 'highlight-main' || value === 'highlight-extra') {
                node.setAttribute('class', value);
            }
            return node;
        }
        static formats(node) {
            return node.getAttribute('class');
        }
    }
    HighlightBlot.blotName = 'app-highlight';
    HighlightBlot.tagName = 'mark';
    Quill.register(HighlightBlot, true);

    class InvisibleBlot extends Inline {
        static create() {
            let node = super.create();
            node.setAttribute('class', 'highlight-invisible');
            node.setAttribute('title', 'Invisible / non-printable character');
            return node;
        }
    }
    InvisibleBlot.blotName = 'hl-invisible';
    InvisibleBlot.tagName = 'mark';
    Quill.register(InvisibleBlot, true);

    const quill = new Quill('#editor-container', {
        theme: 'snow',
        placeholder: 'Paste or type your content here... Formatting will be preserved!',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline', 'strike'],
                ['blockquote', 'code-block'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                [{ 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'header': [1, 2, 3, 4, false] }],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ]
        }
    });

    const mainKeywordsInput = document.getElementById('main-keywords');
    const extraKeywordsInput = document.getElementById('extra-keywords');

    const mainResultsList = document.getElementById('main-results-list');
    const extraResultsList = document.getElementById('extra-results-list');

    const mainStatsEl = document.getElementById('main-stats');
    const extraStatsEl = document.getElementById('extra-stats');

    const totalWordsEl = document.getElementById('total-words');

    function loadState() {
        try {
            const main = localStorage.getItem('seo_main_keywords');
            if (main !== null) mainKeywordsInput.value = main;

            const extra = localStorage.getItem('seo_extra_keywords');
            if (extra !== null) extraKeywordsInput.value = extra;

            const content = localStorage.getItem('seo_editor_content');
            if (content) {
                quill.setContents(JSON.parse(content), 'silent');
            }
        } catch (e) {
            console.error("Could not load state: ", e);
        }
    }

    function saveState() {
        try {
            localStorage.setItem('seo_main_keywords', mainKeywordsInput.value);
            localStorage.setItem('seo_extra_keywords', extraKeywordsInput.value);
            localStorage.setItem('seo_editor_content', JSON.stringify(quill.getContents()));
        } catch (e) {
            console.error("Could not save state: ", e);
        }
    }

    function escapeHTML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function getKeywordRegex(kw) {
        let source = String(kw).toLowerCase().trim();
        source = source.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        source = source.replace(/(?:\\ |\s)+/g, '\\s+');
        source = `(?<![\\p{L}\\d_])${source}(?![\\p{L}\\d_])`;
        return new RegExp(source, 'gu');
    }

    function analyzeKeywords() {
        const text = quill.getText();
        const invisibleRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u00A0\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;

        // Auto-clean keyword inputs
        if (invisibleRegex.test(mainKeywordsInput.value)) {
            const cursor = mainKeywordsInput.selectionStart;
            mainKeywordsInput.value = mainKeywordsInput.value.replace(invisibleRegex, ' ');
            mainKeywordsInput.setSelectionRange(cursor, cursor);
        }
        if (invisibleRegex.test(extraKeywordsInput.value)) {
            const cursor = extraKeywordsInput.selectionStart;
            extraKeywordsInput.value = extraKeywordsInput.value.replace(invisibleRegex, ' ');
            extraKeywordsInput.setSelectionRange(cursor, cursor);
        }

        const mainText = mainKeywordsInput.value;
        const extraText = extraKeywordsInput.value;

        // Calculate total words
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        totalWordsEl.textContent = `${words} Words`;

        const lowerText = text.toLowerCase();

        function getKeywords(inputText) {
            return inputText.split('\n')
                .map(k => k.trim())
                .filter(k => k.length > 0);
        }

        const mainKeywords = getKeywords(mainText);
        const extraKeywords = getKeywords(extraText);

        function renderList(keywords, listElement, statsElement, emptyMessage) {
            statsElement.textContent = `${keywords.length}`;

            if (keywords.length === 0) {
                listElement.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
                return { totalOccurrences: 0, keywordCounts: [] };
            }

            listElement.innerHTML = '';

            let totalOccurrences = 0;
            const keywordCounts = [];

            keywords.forEach(keyword => {
                const regex = getKeywordRegex(keyword);
                let count = 0;
                while (regex.exec(lowerText) !== null) {
                    count++;
                }

                totalOccurrences += count;
                keywordCounts.push({ keyword, count });

                const itemConfigEl = document.createElement('div');
                itemConfigEl.className = 'keyword-item';

                const keywordTextEl = document.createElement('div');
                keywordTextEl.className = 'keyword-text';
                keywordTextEl.textContent = keyword;

                const keywordCountEl = document.createElement('div');
                keywordCountEl.className = `keyword-count ${count > 0 ? 'has-matches' : ''}`;
                keywordCountEl.textContent = count;

                itemConfigEl.appendChild(keywordTextEl);
                itemConfigEl.appendChild(keywordCountEl);

                listElement.appendChild(itemConfigEl);
            });

            return { totalOccurrences, keywordCounts };
        }

        const mainStats = renderList(mainKeywords, mainResultsList, mainStatsEl, "No main keywords entered");
        const extraStats = renderList(extraKeywords, extraResultsList, extraStatsEl, "No extra keywords entered");

        const mainCount = mainStats.totalOccurrences;
        const extraCount = extraStats.totalOccurrences;
        const totalCount = mainCount + extraCount;

        const firstMainCount = mainStats.keywordCounts.length > 0 ? mainStats.keywordCounts[0].count : 0;
        const firstMainText = mainStats.keywordCounts.length > 0 ? mainStats.keywordCounts[0].keyword : 'None';

        // Highlighting Logic (resolving overlapping instances)
        const matches = [];
        function findMatches(keywords, type) {
            keywords.forEach(keyword => {
                const regex = getKeywordRegex(keyword);
                let match;
                while ((match = regex.exec(lowerText)) !== null) {
                    matches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        length: match[0].length,
                        type: type
                    });
                }
            });
        }

        findMatches(mainKeywords, 'main');
        findMatches(extraKeywords, 'extra');

        matches.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            if (b.length !== a.length) return b.length - a.length;
            if (a.type !== b.type) return a.type === 'main' ? -1 : 1;
            return 0;
        });

        const validMatches = [];
        let lastEnd = 0;

        for (const match of matches) {
            if (match.start >= lastEnd) {
                validMatches.push(match);
                lastEnd = match.end;
            }
        }

        quill.formatText(0, quill.getLength(), 'app-highlight', false, 'silent');
        quill.formatText(0, quill.getLength(), 'hl-invisible', false, 'silent');

        for (const match of validMatches) {
            const highlightClass = match.type === 'main' ? 'highlight-main' : 'highlight-extra';
            quill.formatText(match.start, match.length, 'app-highlight', highlightClass, 'silent');
        }

        let invMatch;
        invisibleRegex.lastIndex = 0;
        while ((invMatch = invisibleRegex.exec(text)) !== null) {
            quill.formatText(invMatch.index, 1, 'hl-invisible', true, 'silent');
        }

        // Checklist Rules Evaluation
        const exactText = text.replace(/\n$/, ''); // Remove trailing newline from Quill
        const charCount = exactText.length;

        const minListLength = Math.min(mainKeywords.length, extraKeywords.length);
        const rule1Color = minListLength >= 15 ? 'green' : (minListLength >= 10 ? 'yellow' : 'red');
        const rule2Color = (charCount >= 4300 && charCount <= 5000) ? 'green' : ((charCount > 5000 || (charCount >= 4000 && charCount < 4300)) ? 'yellow' : 'red');
        const rule3Color = (totalCount >= 28 && totalCount <= 40) ? 'green' : 'red';
        const rule4Color = (mainCount >= 14 && mainCount <= 20) ? 'green' : 'red';
        const rule5Color = (firstMainCount >= 7 && firstMainCount <= 10) ? 'green' : 'red';
        const rule6Color = (extraCount >= 14 && extraCount <= 20) ? 'green' : 'red';

        const stopWordsList = ["best", "recommended", "premium", "free", "#1"];
        let foundStopwords = [];
        stopWordsList.forEach(w => {
            if (lowerText.includes(w)) {
                foundStopwords.push(w);
            }
        });
        const rule7Color = foundStopwords.length === 0 ? 'green' : 'red';

        let listsCount = quill.root.querySelectorAll('ul, ol').length;
        if (listsCount === 0) {
            const rawListBlocks = exactText.split(/\n\s*\n/).filter(block => /^[\s]*[-*•]\s+/m.test(block));
            listsCount = rawListBlocks.length;
        }
        const rule8Color = listsCount >= 2 ? 'green' : (listsCount === 1 ? 'yellow' : 'red');

        const emojiRegex = /([\p{L}\d])\p{Extended_Pictographic}|\p{Extended_Pictographic}([\p{L}\d])/gu;
        const invalidEmojis = exactText.match(emojiRegex) || [];
        const rule9Color = invalidEmojis.length === 0 ? 'green' : 'red';

        const invisibleInText = (text.match(invisibleRegex) || []).length;
        const rule10Color = invisibleInText === 0 ? 'green' : 'red';

        const rules = [
            {
                title: 'Keywords count (≥ 15 green, ≥ 10 yellow)',
                value: `Main: ${mainKeywords.length}, Extra: ${extraKeywords.length}`,
                color: rule1Color
            },
            {
                title: 'Text length (4300-5000 characters with spaces)',
                value: `${charCount} characters`,
                color: rule2Color
            },
            {
                title: 'Total keyword occurrences (28-40)',
                value: `${totalCount} times`,
                color: rule3Color
            },
            {
                title: 'Main keyword occurrences (14-20)',
                value: `${mainCount} times`,
                color: rule4Color
            },
            {
                title: 'First Main keyword occurrences (7-10)',
                value: `${firstMainCount} times ("${escapeHTML(firstMainText)}")`,
                color: rule5Color
            },
            {
                title: 'Extra keyword occurrences (14-20)',
                value: `${extraCount} times`,
                color: rule6Color
            },
            {
                title: 'No stop words used (best, recommended, premium, free, #1)',
                value: foundStopwords.length === 0 ? 'Clean' : `Found: ${foundStopwords.join(', ')}`,
                color: rule7Color
            },
            {
                title: 'Multiple formatted lists used (≥ 2 green, 1 yellow)',
                value: `${listsCount} list(s) found`,
                color: rule8Color
            },
            {
                title: 'Spaces between emojis and words',
                value: invalidEmojis.length === 0 ? 'Clean' : `Missing spaces: ${invalidEmojis.length} match(es)`,
                color: rule9Color
            },
            {
                title: 'No invisible characters used in text',
                value: invisibleInText === 0 ? 'Clean' : `Found ${invisibleInText} hidden element(s)`,
                color: rule10Color
            }
        ];

        const checklistGrid = document.getElementById('quality-checklist');
        if (checklistGrid) {
            checklistGrid.innerHTML = '';
            rules.forEach(r => {
                const ruleDiv = document.createElement('div');
                ruleDiv.className = 'rule-item';
                ruleDiv.innerHTML = `
                    <div class="traffic-light indicator-${r.color}"></div>
                    <div class="rule-content">
                        <div class="rule-text">${r.title}</div>
                        <div class="rule-value">${r.value}</div>
                    </div>
                `;
                checklistGrid.appendChild(ruleDiv);
            });
        }

        const wordMatchesList = lowerText.match(/\p{L}+/gu) || [];
        const validTotalWordsCount = wordMatchesList.length;

        const frequencies = {};
        wordMatchesList.forEach(w => {
            if (w.length > 2) {
                frequencies[w] = (frequencies[w] || 0) + 1;
            }
        });

        const sortedWords = Object.keys(frequencies).map(w => {
            return {
                word: w,
                count: frequencies[w],
                percentage: validTotalWordsCount > 0 ? ((frequencies[w] / validTotalWordsCount) * 100).toFixed(2) : 0
            };
        }).sort((a, b) => b.count - a.count).slice(0, 50);

        const freqGrid = document.getElementById('word-frequency-list');
        if (freqGrid) {
            freqGrid.innerHTML = '';
            sortedWords.forEach(entry => {
                const isOverused = parseFloat(entry.percentage) > 3;
                const rowClass = isOverused ? 'freq-item danger-word' : 'freq-item';

                const row = document.createElement('div');
                row.className = rowClass;
                row.innerHTML = `
                    <div class="freq-word">${escapeHTML(entry.word)}</div>
                    <div class="freq-stats">
                        <span class="freq-count">${entry.count}</span>
                        <span class="freq-pct">${entry.percentage}%</span>
                    </div>
                `;
                freqGrid.appendChild(row);
            });
        }

        saveState();
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    const debouncedAnalyze = debounce(analyzeKeywords, 300);

    // Listen for text changes in Quill (ignoring format-only changes from API to avoid loops)
    quill.on('text-change', (delta, oldDelta, source) => {
        if (source !== 'silent') {
            debouncedAnalyze();
        }
    });

    mainKeywordsInput.addEventListener('input', debouncedAnalyze);
    extraKeywordsInput.addEventListener('input', debouncedAnalyze);

    loadState();
    analyzeKeywords();
});
