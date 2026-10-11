/* Shared deadline timer. Per-exam state remains in the page. */
      function tickTimer() {
        if (examSubmitted || examDeadline === null) return;
        secondsLeft = Math.max(0, Math.ceil((examDeadline - Date.now()) / 1000));
        const m = Math.floor(secondsLeft / 60),
          s = secondsLeft % 60;
        const el = document.getElementById("timer");
        el.textContent =
          String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
        if (secondsLeft <= 300) el.className = "timer danger";
        else if (secondsLeft <= 900) el.className = "timer warn";
        else el.className = "timer";
        if (secondsLeft === 0) doSubmit(true);
      }

