(function () {
  function clampMinutes(value, fallback, max) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, 1), max);
  }

  function loadDurations(defaultDurations) {
    try {
      const stored = JSON.parse(localStorage.getItem("pomodoroDurations"));
      return {
        focus: clampMinutes(stored?.focus, defaultDurations.focus, 180),
        shortBreak: clampMinutes(stored?.shortBreak, defaultDurations.shortBreak, 60),
        longBreak: clampMinutes(stored?.longBreak, defaultDurations.longBreak, 90)
      };
    } catch {
      return { ...defaultDurations };
    }
  }

  function saveDurations(durations) {
    localStorage.setItem("pomodoroDurations", JSON.stringify(durations));
  }

  function loadTheme() {
    const storedTheme = localStorage.getItem("pomodoroTheme");
    if (storedTheme === "day" || storedTheme === "night") {
      return storedTheme;
    }
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "day" : "night";
  }

  function saveTheme(theme) {
    localStorage.setItem("pomodoroTheme", theme);
  }

  window.PomodoroStorage = {
    clampMinutes,
    loadDurations,
    saveDurations,
    loadTheme,
    saveTheme
  };
})();
