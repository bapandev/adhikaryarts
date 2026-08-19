(function () {
    'use strict';

    const host = location.hostname;

    const scripts = {
        'web.whatsapp.com': 'whatsapp.js',
        'aroapp.in': 'aroapp.js',

        // Future websites
        // 'example.com': 'example.js',
    };

    const file = scripts[host];

    if (!file) {
        return;
    }

    const url =
        'https://raw.githubusercontent.com/bapandev/adhikaryarts/main/'
        + file
        + '?t='
        + Date.now();

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response.text();
        })
        .then(code => {
            new Function(code)();

            console.log(
                '[AdhikaryArts] Loaded:',
                file
            );
        })
        .catch(error => {
            console.error(
                '[AdhikaryArts] Failed:',
                file,
                error
            );
        });

})();
