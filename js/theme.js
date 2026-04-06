(function () {
  function applyTheme(nextTheme, elements, themeLabels, onApplied) {
    document.documentElement.dataset.theme = nextTheme;
    elements.themeToggle.textContent = themeLabels[nextTheme];
    elements.themeToggle.setAttribute("aria-pressed", nextTheme === "night");
    onApplied?.();
  }

  window.PomodoroTheme = {
    applyTheme
  };
})();
