/* Vercel Web Analytics loader with an owner opt-out.
 *
 * Visit any page with ?noanalytics=1 once per browser/device to stop your
 * own visits from being counted (stored in localStorage). Use ?noanalytics=0
 * to turn counting back on. Everyone else is tracked normally.
 */
(function () {
    try {
        var params = new URLSearchParams(window.location.search);
        if (params.get('noanalytics') === '1') localStorage.setItem('offertje_noanalytics', '1');
        if (params.get('noanalytics') === '0') localStorage.removeItem('offertje_noanalytics');
        if (localStorage.getItem('offertje_noanalytics') === '1') return; // owner: do not load analytics
    } catch (e) {
        /* localStorage blocked: fall through and load analytics normally */
    }
    var s = document.createElement('script');
    s.defer = true;
    s.src = '/_vercel/insights/script.js';
    document.head.appendChild(s);
})();
