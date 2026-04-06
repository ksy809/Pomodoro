(function () {
  const {
    defaultDurations,
    modeOrder,
    modeLabels,
    themeLabels
  } = window.PomodoroConfig;
  const {
    clampMinutes,
    loadDurations,
    saveDurations,
    loadTheme,
    saveTheme
  } = window.PomodoroStorage;

  const elements = {
    time: document.querySelector("#time"),
    state: document.querySelector("#state"),
    timer: document.querySelector(".timer"),
    startPause: document.querySelector("#startPause"),
    reset: document.querySelector("#reset"),
    skip: document.querySelector("#skip"),
    pip: document.querySelector("#pip"),
    themeToggle: document.querySelector("#themeToggle"),
    tabs: document.querySelectorAll("[data-mode]"),
    settings: document.querySelector("#settings"),
    focusMinutes: document.querySelector("#focusMinutes"),
    shortBreakMinutes: document.querySelector("#shortBreakMinutes"),
    longBreakMinutes: document.querySelector("#longBreakMinutes")
  };

  let durations = loadDurations(defaultDurations);
  let theme = loadTheme();
  let modeIndex = 0;
  let mode = modeOrder[modeIndex];
  let remainingSeconds = durations[mode] * 60;
  let totalSeconds = remainingSeconds;
  let timerId = null;
  let expectedTick = 0;

  const pip = window.PomodoroPip.createPipController({
    announce,
    getCurrentTime: () => elements.time.textContent,
    getTheme: () => theme
  });

  hydrateSettings();
  applyTheme(theme);
  render();
  bindEvents();

  function bindEvents() {
    elements.themeToggle.addEventListener("click", () => {
      theme = theme === "night" ? "day" : "night";
      saveTheme(theme);
      applyTheme(theme);
      announce(`${themeLabels[theme]}로 변경했어요.`);
    });

    elements.startPause.addEventListener("click", () => {
      timerId ? pauseTimer() : startTimer();
    });

    elements.reset.addEventListener("click", () => {
      pauseTimer();
      setMode(mode, false);
      announce(`${modeLabels[mode]} 타이머를 리셋했어요.`);
    });

    elements.skip.addEventListener("click", () => {
      goToNextMode();
    });

    elements.pip.addEventListener("click", () => {
      pip.open();
    });

    elements.tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const selectedMode = tab.dataset.mode;
        const nextIndex = modeOrder.findIndex((candidate) => candidate === selectedMode);
        modeIndex = nextIndex >= 0 ? nextIndex : 0;
        pauseTimer();
        setMode(selectedMode, false);
        announce(`${modeLabels[selectedMode]} 모드로 바꿨어요.`);
      });
    });

    elements.settings.addEventListener("submit", (event) => {
      event.preventDefault();
      durations = {
        focus: clampMinutes(elements.focusMinutes.value, defaultDurations.focus, 180),
        shortBreak: clampMinutes(elements.shortBreakMinutes.value, defaultDurations.shortBreak, 60),
        longBreak: clampMinutes(elements.longBreakMinutes.value, defaultDurations.longBreak, 90)
      };
      saveDurations(durations);
      pauseTimer();
      setMode(mode, false);
      hydrateSettings();
      announce("설정을 저장했어요.");
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        render();
      }
    });
  }

  function startTimer() {
    if (remainingSeconds <= 0) {
      setMode(mode, false);
    }
    expectedTick = Date.now() + 1000;
    timerId = window.setTimeout(tick, 1000);
    elements.startPause.textContent = "일시정지";
    announce(`${modeLabels[mode]} 타이머를 시작했어요.`);
  }

  function pauseTimer() {
    if (!timerId) return;
    window.clearTimeout(timerId);
    timerId = null;
    elements.startPause.textContent = "시작";
    render();
  }

  function tick() {
    const drift = Date.now() - expectedTick;
    remainingSeconds = Math.max(remainingSeconds - 1, 0);
    render();

    if (remainingSeconds === 0) {
      timerId = null;
      elements.startPause.textContent = "시작";
      window.PomodoroAudio.ringBell();
      goToNextMode(true);
      return;
    }

    expectedTick += 1000;
    timerId = window.setTimeout(tick, Math.max(0, 1000 - drift));
  }

  function goToNextMode(autoStart = false) {
    pauseTimer();
    modeIndex = (modeIndex + 1) % modeOrder.length;
    setMode(modeOrder[modeIndex], false);
    announce(`${modeLabels[mode]} 시간입니다.`);
    if (autoStart) {
      startTimer();
    }
  }

  function setMode(nextMode, keepRemaining) {
    mode = nextMode;
    totalSeconds = durations[mode] * 60;
    if (!keepRemaining) {
      remainingSeconds = totalSeconds;
    }
    render();
  }

  function render() {
    const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, "0");
    const seconds = Math.floor(remainingSeconds % 60).toString().padStart(2, "0");
    const progress = totalSeconds === 0 ? 0 : ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
    const timeText = `${minutes}:${seconds}`;

    elements.time.textContent = timeText;
    elements.timer.style.setProperty("--progress", `${progress}%`);
    elements.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
    document.title = `${timeText} - ${modeLabels[mode]}`;
    pip.update(timeText);
  }

  function announce(message) {
    elements.state.textContent = message;
  }

  function hydrateSettings() {
    elements.focusMinutes.value = durations.focus;
    elements.shortBreakMinutes.value = durations.shortBreak;
    elements.longBreakMinutes.value = durations.longBreak;
  }

  function applyTheme(nextTheme) {
    window.PomodoroTheme.applyTheme(nextTheme, elements, themeLabels, pip.syncTheme);
  }
})();
