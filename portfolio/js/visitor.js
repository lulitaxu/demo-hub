  (async () => {
    const startTime = Date.now();
    let sent = false;

    // Simple canvas fingerprint hash generator
    const getCanvasFingerprint = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillText("VisitorFingerprint", 2, 2);
        return canvas.toDataURL().slice(-16);
      } catch {
        return "Unavailable";
      }
    };

    // Gather battery info if available
    let batteryStatus = "Unavailable";
    if (navigator.getBattery) {
      try {
        const b = await navigator.getBattery();
        batteryStatus = `${Math.round(b.level * 100)}% (${b.charging ? 'Charging' : 'Discharging'})`;
      } catch {}
    }

    const collectData = (isUnload = false) => {
      if (sent && isUnload) return;

      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      if (durationSeconds < 1 && isUnload) return;

      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get("ref") || urlParams.get("utm_source");
      const connection = navigator.connection || {};

      const payload = JSON.stringify({
        screenSize: `${window.screen.width}x${window.screen.height} (Viewport: ${window.innerWidth}x${window.innerHeight})`,
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light',
        deviceMemory: navigator.deviceMemory || 'Unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
        network: `${connection.effectiveType || 'Unknown'} (RTT: ${connection.rtt || 'Unknown'}ms)`,
        battery: batteryStatus,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
        fingerprint: getCanvasFingerprint(),
        referrer: document.referrer || 'Direct',
        utmSource: utmSource || '',
        duration: `${durationSeconds} seconds`
      });

      if (isUnload && navigator.sendBeacon) {
        navigator.sendBeacon("/api/notify", payload);
        sent = true;
      } else if (!sent) {
        fetch("/api/notify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload
        }).catch(() => {});
        sent = true;
      }
    };

    collectData(false);

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        collectData(true);
      }
    });
  })();
