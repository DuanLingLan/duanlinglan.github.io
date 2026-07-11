(function() {
    const blockedTags = new Set([
        'SCRIPT',
        'IFRAME',
        'OBJECT',
        'EMBED',
        'FORM',
        'INPUT',
        'BUTTON',
        'TEXTAREA',
        'SELECT',
        'OPTION',
        'META',
        'LINK',
        'STYLE'
    ]);

    function isUnsafeUrl(value) {
        return /^\s*(javascript|vbscript):/i.test(value);
    }

    function sanitizeHtml(html) {
        const template = document.createElement('template');
        template.innerHTML = html;

        template.content.querySelectorAll('*').forEach(element => {
            if (blockedTags.has(element.tagName)) {
                element.remove();
                return;
            }

            [...element.attributes].forEach(attribute => {
                const name = attribute.name.toLowerCase();
                const value = attribute.value || '';

                if (name.startsWith('on') || ((name === 'href' || name === 'src' || name === 'xlink:href') && isUnsafeUrl(value))) {
                    element.removeAttribute(attribute.name);
                }
            });
        });

        return template.innerHTML;
    }

    window.renderMarkdown = function(markdown) {
        if (!window.marked) {
            return '';
        }

        marked.setOptions({
            breaks: true,
            gfm: true,
            mangle: false,
            headerIds: false
        });

        return sanitizeHtml(marked.parse(markdown || ''));
    };
})();
