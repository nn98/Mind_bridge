let promise = null;
export function loadGoogleCharts() {
    if (window.google && window.google.charts) {
        return Promise.resolve(window.google);
    }
    if (!promise) {
        promise = new Promise(res => {
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/charts/loader.js';
            script.onload = () => {
                window.google.charts.load('current', { packages: ['corechart'] });
                window.google.charts.setOnLoadCallback(() => res(window.google));
            };
            document.body.appendChild(script);
        });
    }
    return promise;
}