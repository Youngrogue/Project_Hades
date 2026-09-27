// Runs before first paint. Hades opens in dark mode for every first visit, regardless of the system theme
// (dark is the CSS default); a theme the visitor chose with the toggle is remembered and applied here.
// The js class lets icons fade in after loading; without JavaScript they simply appear.
document.documentElement.classList.add('js');
try {
  var saved = localStorage.getItem('hades-theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
} catch (error) { /* storage unavailable: stay on the dark default */ }
