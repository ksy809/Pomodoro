(function () {
  window.PomodoroConfig = {
    defaultDurations: {
      focus: 25,
      shortBreak: 5,
      longBreak: 15
    },
    modeOrder: ["focus", "shortBreak", "focus", "shortBreak", "focus", "shortBreak", "focus", "longBreak"],
    modeLabels: {
      focus: "집중",
      shortBreak: "짧은 휴식",
      longBreak: "긴 휴식"
    },
    themeLabels: {
      day: "☀ 데이 모드",
      night: "☾ 나이트 모드"
    }
  };
})();
