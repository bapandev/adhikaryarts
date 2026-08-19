(function () {
    'use strict';

    const AROAPP_NEW_PROJECT_URL = 'https://aroapp.in/new-project/from-code';
    const QUERY_PARAMETER_NAME = 'customer_code';
    const CODE_PATTERN = /^[A-Z](?=[A-Z0-9_-]{2,20}$)(?=.*\d)[A-Z0-9_-]+$/i;
    const OPEN_IN_NEW_TAB = true;

    const BUTTON_ID = 'aroapp-whatsapp-create-project';
    const STYLE_ID = 'aroapp-whatsapp-create-project-style';

    let activeState = {
        title: '',
        detectedCode: '',
    };
    let lastRenderedTitle = null;
    let lastRenderedCode = null;
    let scheduled = false;

    function installStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            #${BUTTON_ID} {
                align-items: center;
                background: #0f766e;
                border: 0;
                border-radius: 6px;
                color: #ffffff;
                cursor: pointer;
                display: inline-flex;
                flex: 0 0 auto;
                font: 600 12px/1.2 Arial, sans-serif;
                height: 30px;
                margin-inline-start: 8px;
                max-width: none;
                min-width: max-content;
                overflow: visible;
                padding: 0 10px;
                white-space: nowrap;
                width: auto;
            }

            #${BUTTON_ID}:hover {
                background: #115e59;
            }

            #${BUTTON_ID}:focus {
                outline: 2px solid #99f6e4;
                outline-offset: 2px;
            }

            #${BUTTON_ID}:disabled {
                background: #667781;
                cursor: not-allowed;
                opacity: 0.72;
            }

            @media (max-width: 520px) {
                #${BUTTON_ID} {
                    font-size: 11px;
                    padding: 0 8px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function activeChatHeader() {
        const main = document.getElementById('main');
        if (main) {
            const header = main.querySelector('header');
            if (header) return header;
        }

        const composeBox = document.querySelector('[data-testid="conversation-compose-box-input"][aria-label]');
        const chatPane = composeBox
            ? composeBox.closest('[data-testid="conversation-panel-wrapper"], [data-testid="conversation-panel-body"], [data-testid="conversation-panel"], [role="application"]')
            : null;

        if (chatPane) {
            const header = chatPane.querySelector('header:not([data-testid="chatlist-header"])');
            if (header) return header;
        }

        const headers = Array.from(document.querySelectorAll('header'));
        return headers.find(function (header) {
            return header.getAttribute('data-testid') !== 'chatlist-header'
                && !header.querySelector('[aria-label="Chats"]');
        }) || null;
    }

    function activeChatTitleFromComposeBox() {
        const composeBox = document.querySelector('[data-testid="conversation-compose-box-input"][aria-label]');
        const label = composeBox ? String(composeBox.getAttribute('aria-label') || '').trim() : '';

        return label
            .replace(/^Type a message to group\s+/i, '')
            .replace(/^Type a message to\s+/i, '')
            .trim();
    }

    function activeChatTitleFromHeader(header) {
        if (!header) return '';

        const directTitle = header.querySelector('[data-testid="conversation-info-header-chat-title"]');
        const directText = directTitle ? String(directTitle.textContent || '').trim() : '';
        if (directText) return directText;

        const titledElement = header.querySelector('[data-testid="conversation-info-header"] [dir="auto"][title], [data-testid="conversation-info-header"] [dir="auto"]');
        const titledText = titledElement
            ? String(titledElement.getAttribute('title') || titledElement.textContent || '').trim()
            : '';

        return titledText;
    }

    function activeChatTitle() {
        const headerTitle = activeChatTitleFromHeader(activeChatHeader());
        const composeTitle = activeChatTitleFromComposeBox();

        return String(headerTitle || composeTitle || '').trim();
    }

    function extractCode(title) {
        let normalizedTitle = String(title || '').trim();
        if (!normalizedTitle) return '';

        while (normalizedTitle && !/[A-Z0-9_-]/i.test(normalizedTitle.charAt(normalizedTitle.length - 1))) {
            normalizedTitle = normalizedTitle.slice(0, -1).trimEnd();
        }

        const match = normalizedTitle.match(/([A-Z][A-Z0-9_-]{2,20})$/i);
        const candidate = match ? match[1].toUpperCase() : '';

        return candidate && CODE_PATTERN.test(candidate) ? candidate : '';
    }

    function targetUrl(code) {
        const url = new URL(AROAPP_NEW_PROJECT_URL);
        url.searchParams.set(QUERY_PARAMETER_NAME, code);
        return url.toString();
    }

    function openProjectPage(code) {
        const url = targetUrl(code);

        if (OPEN_IN_NEW_TAB) {
            const opened = window.open(url, '_blank', 'noopener,noreferrer');
            if (opened) {
                opened.opener = null;
            }
            return;
        }

        window.location.assign(url);
    }

    function updateButtonLabel(button, detectedCode) {
        button.textContent = detectedCode
            ? `Create Project \u00B7 ${detectedCode}`
            : 'Create Project \u00B7 No code';
    }

    function renderButton(title, detectedCode) {
        const header = activeChatHeader();
        if (!header) {
            lastRenderedTitle = null;
            lastRenderedCode = null;
            return;
        }

        let button = document.getElementById(BUTTON_ID);
        if (!button) {
            button = document.createElement('button');
            button.id = BUTTON_ID;
            button.type = 'button';
            button.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();

                if (activeState.detectedCode) {
                    openProjectPage(activeState.detectedCode);
                }
            });
        }

        button.disabled = !detectedCode;
        updateButtonLabel(button, detectedCode);

        const tooltip = detectedCode
            ? `Chat: ${title}\nDetected code: ${detectedCode}`
            : 'No customer or sub-customer code detected in this chat title.';

        button.title = tooltip;
        button.setAttribute('aria-label', detectedCode
            ? `Create Aroapp project for ${detectedCode}`
            : 'Create Aroapp project. No customer or sub-customer code detected in this chat title.');

        if (button.parentElement !== header) {
            header.appendChild(button);
        }

        lastRenderedTitle = title;
        lastRenderedCode = detectedCode;
    }

    function updateButton() {
        scheduled = false;
        installStyles();

        const title = activeChatTitle();
        const detectedCode = extractCode(title);

        activeState = {
            title,
            detectedCode,
        };

        if (title === lastRenderedTitle && detectedCode === lastRenderedCode && document.getElementById(BUTTON_ID)) {
            return;
        }

        renderButton(title, detectedCode);
    }

    function scheduleUpdate() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(updateButton);
    }

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['title', 'aria-label'],
    });

    window.addEventListener('popstate', scheduleUpdate);
    window.addEventListener('resize', scheduleUpdate);
    scheduleUpdate();
})();
