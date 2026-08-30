// @docusaurus/plugin-google-gtag calls window.gtag() on every route change
// without checking that it exists, which throws when a tracker blocker or CSP
// prevents the injected gtag snippet from running.
if (typeof window !== 'undefined' && typeof window.gtag !== 'function') {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
}
