(function () {
  function createPipController({ announce, getCurrentTime, getTheme }) {
    let pipMode = null;
    let pipWindow = null;
    let pipTime = null;
    let pipCanvas = null;
    let pipContext = null;
    let pipVideo = null;

    async function open() {
      if (pipMode === "video" && document.pictureInPictureElement === pipVideo) {
        announce("PIP 타이머가 이미 열려 있어요.");
        return;
      }

      if (pipWindow && !pipWindow.closed) {
        pipWindow.focus();
        announce("PIP 타이머가 이미 열려 있어요.");
        return;
      }

      if (await openVideoPipTimer()) {
        announce("타이머 숫자를 PIP 창으로 띄웠어요.");
        return;
      }

      try {
        if ("documentPictureInPicture" in window) {
          pipWindow = await window.documentPictureInPicture.requestWindow({
            width: 280,
            height: 150
          });
        } else {
          pipWindow = window.open("", "pomodoroTimerPip", "popup,width=280,height=150");
        }
      } catch {
        pipWindow = null;
      }

      if (!pipWindow) {
        announce("브라우저에서 PIP 창을 열 수 없어요. 팝업 차단 설정을 확인해 주세요.");
        return;
      }

      pipMode = "window";
      buildPipTimer();
      update(getCurrentTime());
      syncTheme();
      pipWindow.addEventListener("pagehide", close);
      pipWindow.addEventListener("beforeunload", close);
      announce("타이머 숫자를 PIP 창으로 띄웠어요.");
    }

    async function openVideoPipTimer() {
      if (!document.pictureInPictureEnabled || !HTMLCanvasElement.prototype.captureStream) {
        return false;
      }

      try {
        if (!pipCanvas) {
          pipCanvas = document.createElement("canvas");
          pipCanvas.width = 560;
          pipCanvas.height = 300;
          pipContext = pipCanvas.getContext("2d");
          pipVideo = document.createElement("video");
          pipVideo.muted = true;
          pipVideo.playsInline = true;
          pipVideo.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;";
          pipVideo.srcObject = pipCanvas.captureStream(1);
          pipVideo.addEventListener("leavepictureinpicture", close);
          document.body.append(pipVideo);
        }

        pipMode = "video";
        drawCanvas(getCurrentTime());
        await pipVideo.play();
        await pipVideo.requestPictureInPicture();
        return true;
      } catch {
        close();
        return false;
      }
    }

    function buildPipTimer() {
      pipWindow.document.open();
      pipWindow.document.write(`
        <!doctype html>
        <html lang="ko">
        <head>
          <meta charset="utf-8">
          <title>Pomodoro PIP</title>
          <style>
            :root {
              color-scheme: dark;
              --bg: #10131a;
              --text: #f6f7fb;
              --accent: #ff6b6b;
              --shadow: rgba(0, 0, 0, 0.35);
            }

            * {
              box-sizing: border-box;
            }

            body {
              width: 100vw;
              height: 100vh;
              margin: 0;
              display: grid;
              place-items: center;
              overflow: hidden;
              background:
                radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 34%, transparent), transparent 11rem),
                var(--bg);
              color: var(--text);
              font-family: "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
            }

            #pipTime {
              font-size: clamp(3.25rem, 28vw, 5.5rem);
              font-weight: 900;
              font-variant-numeric: tabular-nums;
              letter-spacing: -0.08em;
              line-height: 1;
              text-shadow: 0 12px 34px var(--shadow);
            }
          </style>
        </head>
        <body>
          <div id="pipTime" aria-live="polite">25:00</div>
        </body>
        </html>
      `);
      pipWindow.document.close();
      pipTime = pipWindow.document.querySelector("#pipTime");
    }

    function update(timeText) {
      if (pipMode === "video") {
        drawCanvas(timeText);
        return;
      }

      if (!pipWindow || pipWindow.closed || !pipTime) return;
      pipTime.textContent = timeText;
      pipWindow.document.title = `${timeText} - Pomodoro`;
    }

    function syncTheme() {
      if (pipMode === "video") {
        drawCanvas(getCurrentTime());
        return;
      }

      if (!pipWindow || pipWindow.closed) return;

      const source = getComputedStyle(document.documentElement);
      const target = pipWindow.document.documentElement;
      target.style.setProperty("--bg", source.getPropertyValue("--bg"));
      target.style.setProperty("--text", source.getPropertyValue("--text"));
      target.style.setProperty("--accent", source.getPropertyValue("--accent"));
      target.style.setProperty("--shadow", source.getPropertyValue("--shadow"));
      target.style.colorScheme = getTheme() === "day" ? "light" : "dark";
    }

    function drawCanvas(timeText) {
      if (!pipContext) return;

      const source = getComputedStyle(document.documentElement);
      const bg = source.getPropertyValue("--bg").trim();
      const text = source.getPropertyValue("--text").trim();
      const accent = source.getPropertyValue("--accent").trim();

      pipContext.clearRect(0, 0, pipCanvas.width, pipCanvas.height);
      pipContext.fillStyle = bg;
      pipContext.fillRect(0, 0, pipCanvas.width, pipCanvas.height);

      const gradient = pipContext.createRadialGradient(90, 70, 0, 90, 70, 260);
      gradient.addColorStop(0, accent);
      gradient.addColorStop(1, "transparent");
      pipContext.globalAlpha = 0.32;
      pipContext.fillStyle = gradient;
      pipContext.fillRect(0, 0, pipCanvas.width, pipCanvas.height);
      pipContext.globalAlpha = 1;

      pipContext.fillStyle = text;
      pipContext.font = '900 120px "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      pipContext.textAlign = "center";
      pipContext.textBaseline = "middle";
      pipContext.fillText(timeText, pipCanvas.width / 2, pipCanvas.height / 2);
    }

    function close() {
      pipMode = null;
      pipWindow = null;
      pipTime = null;
    }

    return {
      open,
      update,
      syncTheme
    };
  }

  window.PomodoroPip = {
    createPipController
  };
})();
