(function () {
    'use strict';

window.ADHIKARY_ARTS_SCRIPTS = {
    'web.whatsapp.com': 'whatsapp.js',
    'aroapp.in': 'aroapp.js'
};

    const host = location.hostname;
    const file = scripts[host];

    if (!file) {
        console.log('[AdhikaryArts] No script configured for:', host);
        return;
    }

    console.log('[AdhikaryArts] Requested file:', file);

    if (typeof window.AdhikaryArtsLoadScript === 'function') {
        window.AdhikaryArtsLoadScript(file);
    } else {
        console.error('[AdhikaryArts] Loader function not found.');
    }
})();
