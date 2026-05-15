/**
 * Security Neural Firewall V5.0
 * Specialized protection against unauthorized access and debugging.
 */

const WEBHOOK_URL = 'https://discord.com/api/webhooks/1494839483869302826/abiDZE_a2tXPZr0qx9myzxatFaO3VXXHqqGR-7XA7YXGQ2Or1o6uAbeP5-9RuQxiqpHq';

const lastSentMap = new Map<string, number>();
const COOLDOWN_MS = 60000; // 1 minute cooldown per event type

export async function logSecurityEvent(type: string, detail: string = 'No details') {
  const now = Date.now();
  const lastSent = lastSentMap.get(type) || 0;

  if (now - lastSent < COOLDOWN_MS) {
    return; // Skip if in cooldown
  }

  lastSentMap.set(type, now);

  try {
    const payload = {
      embeds: [{
        title: '🚨 SECURITY_VIOLATION_DETECTED',
        color: 0xff0000,
        fields: [
          { name: 'TYPE', value: `\`${type}\``, inline: true },
          { name: 'TIMESTAMP', value: `\`${new Date().toISOString()}\``, inline: true },
          { name: 'DETAIL', value: `\`\`\`${detail}\`\`\`` }
        ],
        footer: { text: 'Alzaabi Team Neural Firewall' }
      }]
    };

    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn('Security logging failed');
  }
}

// Anti-Debugger Loop
export function startAntiDebug() {
  const check = () => {
    (function () {
      return false;
    })
      ["constructor"]("debugger")
      ["call"]();
  };

  setInterval(() => {
    check();
  }, 100);
}

// Detect if console is open via threshold
export function detectDevTools(onDetect: () => void) {
  const threshold = 200; // Increased threshold
  let devtoolsOpen = false;

  const check = () => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    if ((widthDiff > threshold || heightDiff > threshold) && !devtoolsOpen) {
      devtoolsOpen = true;
      onDetect();
    } else if (widthDiff < threshold && heightDiff < threshold) {
      devtoolsOpen = false;
    }
  };

  window.addEventListener('resize', check);
  // Also try the console.log getter trick
  const devtools = {
    isOpen: false,
    orientation: undefined
  };
  const element = new Image();
  Object.defineProperty(element, 'id', {
    get: function () {
      if (!devtoolsOpen) {
        devtoolsOpen = true;
        onDetect();
      }
    }
  });
  console.log(element);
}

// Memory / Performance monitor to detect heavy probes
export function monitorPerformance(onAnomaly: () => void) {
  let lastTime = performance.now();
  
  setInterval(() => {
    const currentTime = performance.now();
    if (currentTime - lastTime > 1500) { // 1.5s threshold
      onAnomaly();
    }
    lastTime = currentTime;
  }, 500); // Check every 0.5s
}
