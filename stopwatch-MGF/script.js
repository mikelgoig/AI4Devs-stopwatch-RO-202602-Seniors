(function () {
    "use strict";
  
    const app = document.getElementById("app");
    const stopwatchModeButton = document.getElementById("stopwatchModeButton");
    const countdownModeButton = document.getElementById("countdownModeButton");
    const startPauseButton = document.getElementById("startPauseButton");
    const clearButton = document.getElementById("clearButton");
    const timeDisplay = document.getElementById("timeDisplay");
    const millisecondsDisplay = document.getElementById("millisecondsDisplay");
    const hintText = document.getElementById("hintText");
  
    const hoursInput = document.getElementById("hoursInput");
    const minutesInput = document.getElementById("minutesInput");
    const secondsInput = document.getElementById("secondsInput");
  
    const MODE = {
      STOPWATCH: "stopwatch",
      COUNTDOWN: "countdown",
    };
  
    let mode = MODE.STOPWATCH;
  
    const state = {
      isRunning: false,
      isPaused: false,
      animationFrameId: null,
  
      // Stopwatch
      stopwatchElapsedMs: 0,
      stopwatchStartTs: 0,
  
      // Countdown
      countdownDurationMs: 0,
      countdownRemainingMs: 0,
      countdownEndTs: 0,
      countdownCompleted: false,
    };
  
    function pad(value, size = 2) {
      return String(value).padStart(size, "0");
    }
  
    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }
  
    function formatTimeParts(totalMilliseconds) {
      const safeMs = Math.max(0, totalMilliseconds);
      const totalSeconds = Math.floor(safeMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      const centiseconds = Math.floor((safeMs % 1000) / 10);
  
      return {
        hours: pad(hours),
        minutes: pad(minutes),
        seconds: pad(seconds),
        centiseconds: pad(centiseconds),
      };
    }
  
    function renderTime(milliseconds) {
      const parts = formatTimeParts(milliseconds);
      timeDisplay.textContent = `${parts.hours}:${parts.minutes}:${parts.seconds}`;
      millisecondsDisplay.textContent = parts.centiseconds;
    }
  
    function setHint(message) {
      hintText.textContent = message;
    }
  
    function updateModeButtons() {
      const isStopwatch = mode === MODE.STOPWATCH;
  
      stopwatchModeButton.classList.toggle("active", isStopwatch);
      stopwatchModeButton.setAttribute("aria-selected", String(isStopwatch));
  
      countdownModeButton.classList.toggle("active", !isStopwatch);
      countdownModeButton.setAttribute("aria-selected", String(!isStopwatch));
  
      app.classList.toggle("stopwatch-mode", isStopwatch);
      app.classList.toggle("countdown-mode", !isStopwatch);
    }
  
    function updateActionButton() {
      if (!state.isRunning && !state.isPaused) {
        startPauseButton.textContent = "Start";
        return;
      }
  
      if (state.isRunning) {
        startPauseButton.textContent = "Pause";
        return;
      }
  
      if (state.isPaused) {
        startPauseButton.textContent = "Continue";
      }
    }
  
    function setCountdownInputsDisabled(disabled) {
      hoursInput.disabled = disabled;
      minutesInput.disabled = disabled;
      secondsInput.disabled = disabled;
    }
  
    function sanitizeCountdownInputs() {
      const hours = clamp(parseInt(hoursInput.value || "0", 10) || 0, 0, 99);
      const minutes = clamp(parseInt(minutesInput.value || "0", 10) || 0, 0, 59);
      const seconds = clamp(parseInt(secondsInput.value || "0", 10) || 0, 0, 59);
  
      hoursInput.value = String(hours);
      minutesInput.value = String(minutes);
      secondsInput.value = String(seconds);
  
      return { hours, minutes, seconds };
    }
  
    function getCountdownDurationMs() {
      const { hours, minutes, seconds } = sanitizeCountdownInputs();
      return ((hours * 3600) + (minutes * 60) + seconds) * 1000;
    }
  
    function stopLoop() {
      if (state.animationFrameId !== null) {
        cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
      }
    }
  
    function resetCommonState() {
      stopLoop();
      state.isRunning = false;
      state.isPaused = false;
      state.countdownCompleted = false;
      updateActionButton();
    }
  
    function resetStopwatch() {
      state.stopwatchElapsedMs = 0;
      state.stopwatchStartTs = 0;
      renderTime(0);
      setHint("Start the stopwatch.");
    }
  
    function resetCountdown(fromInputs = true) {
      if (fromInputs) {
        state.countdownDurationMs = getCountdownDurationMs();
        state.countdownRemainingMs = state.countdownDurationMs;
      }
      state.countdownEndTs = 0;
      state.countdownCompleted = false;
      renderTime(state.countdownRemainingMs);
      setHint("Set a duration and start the countdown.");
    }
  
    function clearCurrentMode() {
      resetCommonState();
      setCountdownInputsDisabled(false);
  
      if (mode === MODE.STOPWATCH) {
        resetStopwatch();
      } else {
        resetCountdown(true);
      }
    }
  
    function tickStopwatch(timestamp) {
      if (!state.isRunning) {
        return;
      }
  
      state.stopwatchElapsedMs = timestamp - state.stopwatchStartTs;
      renderTime(state.stopwatchElapsedMs);
      state.animationFrameId = requestAnimationFrame(tickStopwatch);
    }
  
    function tickCountdown() {
      if (!state.isRunning) {
        return;
      }
  
      const remaining = Math.max(0, state.countdownEndTs - performance.now());
      state.countdownRemainingMs = remaining;
      renderTime(remaining);
  
      if (remaining <= 0) {
        finishCountdown();
        return;
      }
  
      state.animationFrameId = requestAnimationFrame(tickCountdown);
    }
  
    function startStopwatch() {
      if (!state.isRunning && !state.isPaused) {
        state.stopwatchElapsedMs = 0;
      }
  
      state.isRunning = true;
      state.isPaused = false;
      state.stopwatchStartTs = performance.now() - state.stopwatchElapsedMs;
      updateActionButton();
      setHint("Stopwatch is running.");
      stopLoop();
      state.animationFrameId = requestAnimationFrame(tickStopwatch);
    }
  
    function pauseStopwatch() {
      state.isRunning = false;
      state.isPaused = true;
      stopLoop();
      updateActionButton();
      setHint("Stopwatch paused.");
    }
  
    function startCountdown() {
      if (!state.isPaused) {
        state.countdownDurationMs = getCountdownDurationMs();
        state.countdownRemainingMs = state.countdownDurationMs;
      }
  
      if (state.countdownRemainingMs <= 0) {
        setHint("Please enter a countdown longer than 0 seconds.");
        updateActionButton();
        return;
      }
  
      state.isRunning = true;
      state.isPaused = false;
      state.countdownCompleted = false;
      state.countdownEndTs = performance.now() + state.countdownRemainingMs;
      setCountdownInputsDisabled(true);
      updateActionButton();
      setHint("Countdown is running.");
      stopLoop();
      state.animationFrameId = requestAnimationFrame(tickCountdown);
    }
  
    function pauseCountdown() {
      state.isRunning = false;
      state.isPaused = true;
      state.countdownRemainingMs = Math.max(0, state.countdownEndTs - performance.now());
      stopLoop();
      updateActionButton();
      setHint("Countdown paused.");
    }
  
    function finishCountdown() {
      resetCommonState();
      setCountdownInputsDisabled(false);
      state.countdownRemainingMs = 0;
      state.countdownCompleted = true;
      renderTime(0);
      setHint("Countdown complete.");
    }
  
    function handleStartPause() {
      if (mode === MODE.STOPWATCH) {
        if (state.isRunning) {
          pauseStopwatch();
        } else {
          startStopwatch();
        }
        return;
      }
  
      if (state.isRunning) {
        pauseCountdown();
      } else {
        startCountdown();
      }
    }
  
    function switchMode(nextMode) {
      if (mode === nextMode) {
        return;
      }
  
      resetCommonState();
      setCountdownInputsDisabled(false);
  
      mode = nextMode;
      updateModeButtons();
  
      if (mode === MODE.STOPWATCH) {
        resetStopwatch();
      } else {
        resetCountdown(true);
      }
    }
  
    function handleCountdownInputChange() {
      if (mode !== MODE.COUNTDOWN || state.isRunning || state.isPaused) {
        return;
      }
  
      resetCountdown(true);
    }
  
    function bindEvents() {
      stopwatchModeButton.addEventListener("click", function () {
        switchMode(MODE.STOPWATCH);
      });
  
      countdownModeButton.addEventListener("click", function () {
        switchMode(MODE.COUNTDOWN);
      });
  
      startPauseButton.addEventListener("click", handleStartPause);
      clearButton.addEventListener("click", clearCurrentMode);
  
      [hoursInput, minutesInput, secondsInput].forEach(function (input) {
        input.addEventListener("change", handleCountdownInputChange);
        input.addEventListener("blur", handleCountdownInputChange);
      });
    }
  
    function init() {
      updateModeButtons();
      updateActionButton();
      resetStopwatch();
      bindEvents();
    }
  
    init();
  })();
  