import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('d:/work/demoSlot/assets/sprites');
const SYMBOLS_DIR = path.join(OUT_DIR, 'symbols');
const UI_DIR = path.join(OUT_DIR, 'ui');
const FRAME_DIR = path.join(OUT_DIR, 'machine');

for (const dir of [OUT_DIR, SYMBOLS_DIR, UI_DIR, FRAME_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

// Common SVG defs for high-tech cyber gloss, bevels, neon glows, circuit patterns
const COMMON_DEFS = `
  <defs>
    <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur1"/>
      <feGaussianBlur stdDeviation="3" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="glow-Strong" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="12" result="blur1"/>
      <feGaussianBlur stdDeviation="4" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000511" flood-opacity="0.85"/>
    </filter>
    <linearGradient id="dark-metal" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1b2845"/>
      <stop offset="50%" stop-color="#0d1527"/>
      <stop offset="100%" stop-color="#060a14"/>
    </linearGradient>
    <linearGradient id="chrome-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e0f7ff"/>
      <stop offset="25%" stop-color="#7fa6c9"/>
      <stop offset="50%" stop-color="#2c4263"/>
      <stop offset="85%" stop-color="#8cb8de"/>
      <stop offset="100%" stop-color="#16243b"/>
    </linearGradient>
    <linearGradient id="gold-cyber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff6a9"/>
      <stop offset="30%" stop-color="#ffd000"/>
      <stop offset="70%" stop-color="#ff7b00"/>
      <stop offset="100%" stop-color="#9e3600"/>
    </linearGradient>
    <linearGradient id="magenta-cyber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffb8ff"/>
      <stop offset="35%" stop-color="#ff2cdf"/>
      <stop offset="75%" stop-color="#a800ff"/>
      <stop offset="100%" stop-color="#3c0078"/>
    </linearGradient>
    <linearGradient id="cyan-cyber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e0ffff"/>
      <stop offset="35%" stop-color="#00f0ff"/>
      <stop offset="75%" stop-color="#0077ff"/>
      <stop offset="100%" stop-color="#002663"/>
    </linearGradient>
    <linearGradient id="emerald-cyber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d4ffea"/>
      <stop offset="30%" stop-color="#00ff88"/>
      <stop offset="75%" stop-color="#009e52"/>
      <stop offset="100%" stop-color="#00381d"/>
    </linearGradient>
    <linearGradient id="crimson-cyber" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffd6d6"/>
      <stop offset="30%" stop-color="#ff2a54"/>
      <stop offset="75%" stop-color="#b80028"/>
      <stop offset="100%" stop-color="#42000e"/>
    </linearGradient>
    <linearGradient id="glass-sheen" x1="0%" y1="0%" x2="70%" y2="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="45%" stop-color="#ffffff" stop-opacity="0.06"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <pattern id="hex-grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M12 0 L24 7 L24 17 L12 24 L0 17 L0 7 Z" fill="none" stroke="#00f0ff" stroke-width="0.7" stroke-opacity="0.16"/>
    </pattern>
  </defs>
`;

function createTechCardFrame({ borderGrad, glowColor, bgInnerColor, tierBadgeColor, cornerAccent }) {
  return `
    <!-- Outer Glow -->
    <rect x="18" y="18" width="220" height="220" rx="34" fill="none" stroke="${glowColor}" stroke-width="5" opacity="0.55" filter="url(#glow-cyan)"/>
    <!-- Base Metallic Chassis -->
    <rect x="16" y="16" width="224" height="224" rx="34" fill="url(#dark-metal)" stroke="url(#${borderGrad})" stroke-width="7" filter="url(#drop-shadow)"/>
    <!-- Inner Cyber Background -->
    <rect x="28" y="28" width="200" height="200" rx="24" fill="${bgInnerColor}"/>
    <rect x="28" y="28" width="200" height="200" rx="24" fill="url(#hex-grid)"/>
    <!-- Circuit Traces -->
    <g stroke="${glowColor}" stroke-width="1.5" opacity="0.3" fill="none">
      <path d="M40 50 L65 50 L78 63 L110 63"/>
      <circle cx="113" cy="63" r="2.5" fill="${glowColor}"/>
      <path d="M216 195 L185 195 L172 182 L145 182"/>
      <circle cx="142" cy="182" r="2.5" fill="${glowColor}"/>
      <path d="M50 210 L50 180 L65 165"/>
      <path d="M204 45 L204 75 L189 90"/>
    </g>
    <!-- Tech Corner Brackets -->
    <g fill="${cornerAccent}" opacity="0.9">
      <path d="M24 48 L24 32 Q24 24 32 24 L48 24 L48 30 L32 30 Q30 30 30 32 L30 48 Z"/>
      <path d="M208 24 L224 24 Q232 24 232 32 L232 48 L226 48 L226 32 Q226 30 224 30 L208 30 Z"/>
      <path d="M24 208 L24 224 Q24 232 32 232 L48 232 L48 226 L32 226 Q30 226 30 224 L30 208 Z"/>
      <path d="M208 232 L224 232 Q232 232 232 224 L232 208 L226 208 L226 224 Q226 226 224 226 L208 226 Z"/>
    </g>
    <!-- Top/Bottom LED notches -->
    <rect x="104" y="15" width="48" height="6" rx="3" fill="${glowColor}" filter="url(#glow-cyan)"/>
    <rect x="104" y="235" width="48" height="6" rx="3" fill="${glowColor}" filter="url(#glow-cyan)"/>
  `;
}

// 13 Symbols definitions matching server SymbolId (0..12)
const SYMBOLS = [
  {
    id: 0,
    code: 'wild',
    name: 'WW // Quantum AI Core (Wild)',
    tier: 'SPECIAL',
    payout: [0, 0, 0],
    svgContent: `
      ${createTechCardFrame({
        borderGrad: 'gold-cyber',
        glowColor: '#00f0ff',
        bgInnerColor: '#091326',
        cornerAccent: '#ffd000',
      })}
      <!-- Quantum Reactor Core -->
      <g filter="url(#drop-shadow)">
        <circle cx="128" cy="118" r="68" fill="#050d1a" stroke="url(#cyan-cyber)" stroke-width="5"/>
        <!-- Outer rotating energy rings -->
        <circle cx="128" cy="118" r="58" fill="none" stroke="#ffd000" stroke-width="3" stroke-dasharray="22 10 8 10" filter="url(#glow-cyan)"/>
        <circle cx="128" cy="118" r="46" fill="none" stroke="#00f0ff" stroke-width="4" stroke-dasharray="36 14" filter="url(#glow-cyan)"/>
        <!-- Octagonal Energy Housing -->
        <polygon points="128,68 163,83 178,118 163,153 128,168 93,153 78,118 93,83" fill="url(#dark-metal)" stroke="url(#gold-cyber)" stroke-width="3"/>
        <!-- Plasma Center -->
        <circle cx="128" cy="118" r="28" fill="url(#cyan-cyber)" filter="url(#glow-Strong)"/>
        <polygon points="128,94 148,118 128,142 108,118" fill="#ffffff" opacity="0.9"/>
        <!-- Energy Beams -->
        <path d="M128 48 L128 74 M128 162 L128 188 M58 118 L84 118 M172 118 L198 118" stroke="#00f0ff" stroke-width="4" stroke-linecap="round" filter="url(#glow-cyan)"/>
      </g>
      <!-- Holographic WILD Plate -->
      <g filter="url(#drop-shadow)">
        <polygon points="44,178 212,178 200,216 56,216" fill="#071224" stroke="url(#gold-cyber)" stroke-width="4"/>
        <text x="128" y="206" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="30" fill="url(#gold-cyber)" stroke="#00f0ff" stroke-width="1" letter-spacing="4" filter="url(#glow-cyan)">WILD</text>
      </g>
      <rect x="28" y="28" width="200" height="90" rx="24" fill="url(#glass-sheen)" pointer-events="none"/>
    `
  },
  {
    id: 1,
    code: 'h1',
    name: 'H1 // Космическая Ракета (Hyper Rocket)',
    tier: 'HIGH',
    payout: [150, 600, 2500],
    svgContent: `
      ${createTechCardFrame({
        borderGrad: 'gold-cyber',
        glowColor: '#ffb700',
        bgInnerColor: '#120e24',
        cornerAccent: '#00f0ff',
      })}
      <!-- Hyper Rocket (Diagonal Launch) -->
      <g filter="url(#drop-shadow)" transform="translate(4, 2) rotate(38 128 128)">
        <!-- Thruster Plasma Exhaust -->
        <path d="M110 172 Q128 232 146 172 Z" fill="url(#gold-cyber)" filter="url(#glow-Strong)"/>
        <path d="M117 172 Q128 212 139 172 Z" fill="#00f0ff" filter="url(#glow-cyan)"/>
        <path d="M122 172 Q128 196 134 172 Z" fill="#ffffff"/>
        <!-- Swept Wing Fins -->
        <path d="M100 130 L70 166 L74 180 L106 164 Z" fill="url(#crimson-cyber)" stroke="#ffd6d6" stroke-width="2"/>
        <path d="M156 130 L186 166 L182 180 L150 164 Z" fill="url(#crimson-cyber)" stroke="#ffd6d6" stroke-width="2"/>
        <!-- Engine Nozzle -->
        <polygon points="110,162 146,162 140,176 116,176" fill="url(#dark-metal)" stroke="#00f0ff" stroke-width="2"/>
        <!-- Main Rocket Fuselage -->
        <path d="M128 42 C156 72 162 122 150 164 L106 164 C94 122 100 72 128 42 Z" fill="url(#chrome-bevel)" stroke="#ffffff" stroke-width="2.5"/>
        <!-- Nose Cone Cap -->
        <path d="M128 42 C142 57 150 75 153 88 L103 88 C106 75 114 57 128 42 Z" fill="url(#crimson-cyber)" stroke="#ffd6d6" stroke-width="2"/>
        <!-- Gold Accent Stripe -->
        <path d="M102 146 L154 146 L151 156 L105 156 Z" fill="url(#gold-cyber)"/>
        <!-- Center Tail Fin -->
        <path d="M128 134 L134 172 L122 172 Z" fill="url(#gold-cyber)" stroke="#fff6a9" stroke-width="1.5"/>
        <!-- Glowing Porthole Window -->
        <circle cx="128" cy="114" r="19" fill="url(#dark-metal)" stroke="url(#gold-cyber)" stroke-width="4"/>
        <circle cx="128" cy="114" r="13" fill="url(#cyan-cyber)" filter="url(#glow-cyan)"/>
        <circle cx="123" cy="109" r="4" fill="#ffffff" opacity="0.9"/>
      </g>
      <rect x="28" y="28" width="200" height="90" rx="24" fill="url(#glass-sheen)"/>
    `
  },
  {
    id: 2,
    code: 'h2',
    name: 'H2 // Плазменный Бластер (Plasma Blaster)',
    tier: 'HIGH',
    payout: [150, 600, 2500],
    svgContent: `
      ${createTechCardFrame({
        borderGrad: 'magenta-cyber',
        glowColor: '#ff2cdf',
        bgInnerColor: '#1a0a28',
        cornerAccent: '#00f0ff',
      })}
      <!-- Sci-Fi Plasma Blaster Pistol -->
      <g filter="url(#drop-shadow)" transform="translate(-2, 4) rotate(-14 128 128)">
        <!-- Muzzle Plasma Flash / Bolt -->
        <polygon points="196,104 218,98 206,108 224,114 204,118 214,128 194,118" fill="#00f0ff" filter="url(#glow-Strong)"/>
        <circle cx="200" cy="111" r="7" fill="#ffffff"/>
        <!-- Ergonomic Handle / Grip -->
        <polygon points="64,132 98,132 88,186 52,182" fill="url(#dark-metal)" stroke="url(#chrome-bevel)" stroke-width="3"/>
        <polygon points="66,142 88,142 82,176 60,174" fill="url(#magenta-cyber)" opacity="0.85"/>
        <!-- Trigger Guard & Trigger -->
        <path d="M96 134 L122 134 Q126 154 108 156 L92 156" fill="none" stroke="url(#chrome-bevel)" stroke-width="4"/>
        <path d="M104 134 Q108 144 102 150" fill="none" stroke="#00f0ff" stroke-width="3.5" stroke-linecap="round"/>
        <!-- Top Holographic Scope -->
        <rect x="86" y="74" width="44" height="14" rx="5" fill="url(#dark-metal)" stroke="#00f0ff" stroke-width="2"/>
        <rect x="102" y="88" width="12" height="8" fill="url(#chrome-bevel)"/>
        <circle cx="128" cy="81" r="4" fill="#ff2cdf" filter="url(#glow-cyan)"/>
        <!-- Main Receiver Chassis -->
        <path d="M54 98 L142 94 L152 104 L152 128 L138 136 L58 136 L48 120 Z" fill="url(#chrome-bevel)" stroke="#ffffff" stroke-width="2"/>
        <!-- Glowing Energy Core Inside Receiver -->
        <rect x="68" y="106" width="58" height="16" rx="6" fill="#090314" stroke="#ff2cdf" stroke-width="2"/>
        <rect x="72" y="110" width="50" height="8" rx="4" fill="url(#magenta-cyber)" filter="url(#glow-cyan)"/>
        <!-- Barrel & Plasma Accelerator Coils -->
        <rect x="148" y="102" width="46" height="18" rx="4" fill="url(#dark-metal)" stroke="#00f0ff" stroke-width="2"/>
        <rect x="156" y="96" width="7" height="30" rx="3" fill="url(#cyan-cyber)" filter="url(#glow-cyan)"/>
        <rect x="169" y="97" width="7" height="28" rx="3" fill="url(#cyan-cyber)" filter="url(#glow-cyan)"/>
        <rect x="182" y="99" width="7" height="24" rx="3" fill="url(#gold-cyber)"/>
        <!-- Flared Muzzle Emitter -->
        <polygon points="190,100 202,95 202,127 190,122" fill="url(#chrome-bevel)" stroke="#00f0ff" stroke-width="2"/>
      </g>
      <rect x="28" y="28" width="200" height="90" rx="24" fill="url(#glass-sheen)"/>
    `
  },
  {
    id: 3,
    code: 'm1',
    name: 'M1 // Джетпак (Cyber Jetpack)',
    tier: 'MEDIUM',
    payout: [75, 300, 1000],
    svgContent: `
      ${createTechCardFrame({
        borderGrad: 'emerald-cyber',
        glowColor: '#00ff88',
        bgInnerColor: '#061d17',
        cornerAccent: '#00ff88',
      })}
      <!-- Twin-Thruster Cyber Jetpack -->
      <g filter="url(#drop-shadow)">
        <!-- Twin Jet Flames -->
        <path d="M74 178 Q88 224 102 178 Z" fill="url(#gold-cyber)" filter="url(#glow-Strong)"/>
        <path d="M80 178 Q88 208 96 178 Z" fill="#00ff88" filter="url(#glow-cyan)"/>
        <path d="M154 178 Q168 224 182 178 Z" fill="url(#gold-cyber)" filter="url(#glow-Strong)"/>
        <path d="M160 178 Q168 208 176 178 Z" fill="#00ff88" filter="url(#glow-cyan)"/>

        <!-- Shoulder Harness Straps -->
        <path d="M98 78 Q98 54 114 54 L142 54 Q158 54 158 78" fill="none" stroke="url(#gold-cyber)" stroke-width="8" stroke-linecap="round"/>

        <!-- Central Connector Pack -->
        <rect x="104" y="84" width="48" height="76" rx="10" fill="url(#dark-metal)" stroke="url(#chrome-bevel)" stroke-width="3"/>
        <circle cx="128" cy="116" r="14" fill="#051410" stroke="#00ff88" stroke-width="3"/>
        <circle cx="128" cy="116" r="7" fill="#00ff88" filter="url(#glow-cyan)"/>
        <rect x="116" y="140" width="24" height="8" rx="3" fill="#00f0ff"/>

        <!-- Left Rocket Tank -->
        <rect x="68" y="68" width="40" height="98" rx="20" fill="url(#chrome-bevel)" stroke="#ffffff" stroke-width="2"/>
        <path d="M68 90 Q88 76 108 90 L108 102 L68 102 Z" fill="url(#emerald-cyber)"/>
        <rect x="76" y="112" width="24" height="36" rx="5" fill="#061a14" stroke="#00ff88" stroke-width="2"/>
        <rect x="81" y="118" width="14" height="24" rx="3" fill="url(#emerald-cyber)" filter="url(#glow-cyan)"/>
        <!-- Left Nozzle -->
        <polygon points="75,164 101,164 105,180 71,180" fill="url(#dark-metal)" stroke="#00ff88" stroke-width="2"/>

        <!-- Right Rocket Tank -->
        <rect x="148" y="68" width="40" height="98" rx="20" fill="url(#chrome-bevel)" stroke="#ffffff" stroke-width="2"/>
        <path d="M148 90 Q168 76 188 90 L188 102 L148 102 Z" fill="url(#emerald-cyber)"/>
        <rect x="156" y="112" width="24" height="36" rx="5" fill="#061a14" stroke="#00ff88" stroke-width="2"/>
        <rect x="161" y="118" width="14" height="24" rx="3" fill="url(#emerald-cyber)" filter="url(#glow-cyan)"/>
        <!-- Right Nozzle -->
        <polygon points="155,164 181,164 185,180 151,180" fill="url(#dark-metal)" stroke="#00ff88" stroke-width="2"/>
      </g>
      <rect x="28" y="28" width="200" height="90" rx="24" fill="url(#glass-sheen)"/>
    `
  },
  {
    id: 4,
    code: 'm2',
    name: 'M2 // Энерго-Батарея (Energy Battery)',
    tier: 'MEDIUM',
    payout: [75, 300, 1000],
    svgContent: `
      ${createTechCardFrame({
        borderGrad: 'cyan-cyber',
        glowColor: '#00f0ff',
        bgInnerColor: '#07182b',
        cornerAccent: '#00f0ff',
      })}
      <!-- High-Tech Energy Battery -->
      <g filter="url(#drop-shadow)" transform="rotate(-8 128 128)">
        <!-- Top Positive Terminal Cap -->
        <rect x="104" y="48" width="48" height="18" rx="6" fill="url(#gold-cyber)" stroke="#ffffff" stroke-width="2"/>
        <!-- Main Battery Casing -->
        <rect x="78" y="64" width="100" height="142" rx="16" fill="url(#chrome-bevel)" stroke="#ffffff" stroke-width="2.5"/>
        <!-- Dark Glass Charge Window -->
        <rect x="88" y="76" width="80" height="118" rx="10" fill="#050d1c" stroke="#00f0ff" stroke-width="2"/>
        <!-- 4 Glowing Neon Charge Bars -->
        <rect x="96" y="164" width="64" height="20" rx="5" fill="url(#cyan-cyber)" filter="url(#glow-cyan)"/>
        <rect x="96" y="138" width="64" height="20" rx="5" fill="url(#cyan-cyber)" filter="url(#glow-cyan)"/>
        <rect x="96" y="112" width="64" height="20" rx="5" fill="url(#emerald-cyber)" filter="url(#glow-cyan)"/>
        <rect x="96" y="86" width="64" height="20" rx="5" fill="url(#emerald-cyber)" filter="url(#glow-cyan)"/>
        <!-- Bold Golden Lightning Bolt Symbol -->
        <polygon points="136,88 104,136 126,136 118,182 152,128 130,128" fill="url(#gold-cyber)" stroke="#ffffff" stroke-width="2.5" filter="url(#drop-shadow)"/>
      </g>
      <rect x="28" y="28" width="200" height="90" rx="24" fill="url(#glass-sheen)"/>
    `
  },
  {
    id: 5,
    code: 'm3',
    name: 'M3 // Квантовый Микрочип (AI Microchip)',
    tier: 'MEDIUM',
    payout: [75, 300, 1000],
    svgContent: `
      ${createTechCardFrame({
        borderGrad: 'crimson-cyber',
        glowColor: '#ff2a54',
        bgInnerColor: '#210915',
        cornerAccent: '#ff9900',
      })}
      <!-- Quantum AI Microchip / CPU -->
      <g filter="url(#drop-shadow)">
        <!-- Gold CPU Pins (Top, Bottom, Left, Right) -->
        <g fill="url(#gold-cyber)" stroke="#fff6a9" stroke-width="1">
          <!-- Top Pins -->
          <rect x="86" y="50" width="10" height="26" rx="3"/>
          <rect x="110" y="50" width="10" height="26" rx="3"/>
          <rect x="136" y="50" width="10" height="26" rx="3"/>
          <rect x="160" y="50" width="10" height="26" rx="3"/>
          <!-- Bottom Pins -->
          <rect x="86" y="180" width="10" height="26" rx="3"/>
          <rect x="110" y="180" width="10" height="26" rx="3"/>
          <rect x="136" y="180" width="10" height="26" rx="3"/>
          <rect x="160" y="180" width="10" height="26" rx="3"/>
          <!-- Left Pins -->
          <rect x="50" y="86" width="26" height="10" rx="3"/>
          <rect x="50" y="110" width="26" height="10" rx="3"/>
          <rect x="50" y="136" width="26" height="10" rx="3"/>
          <rect x="50" y="160" width="26" height="10" rx="3"/>
          <!-- Right Pins -->
          <rect x="180" y="86" width="26" height="10" rx="3"/>
          <rect x="180" y="110" width="26" height="10" rx="3"/>
          <rect x="180" y="136" width="26" height="10" rx="3"/>
          <rect x="180" y="160" width="26" height="10" rx="3"/>
        </g>
        <!-- Main Ceramic/Metallic Chip Package -->
        <rect x="72" y="72" width="112" height="112" rx="16" fill="url(#dark-metal)" stroke="url(#chrome-bevel)" stroke-width="4"/>
        <!-- Corner Alignment Dot -->
        <circle cx="86" cy="86" r="4" fill="#ffd000"/>
        <!-- Glowing Inner Silicon Core -->
        <rect x="94" y="94" width="68" height="68" rx="10" fill="#14040c" stroke="#ff2a54" stroke-width="3" filter="url(#glow-cyan)"/>
        <rect x="102" y="102" width="52" height="52" rx="6" fill="url(#crimson-cyber)" opacity="0.9"/>
        <!-- AI Core Text -->
        <text x="128" y="138" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#ff2a54" stroke-width="1" letter-spacing="2" filter="url(#glow-cyan)">AI</text>
      </g>
      <rect x="28" y="28" width="200" height="90" rx="24" fill="url(#glass-sheen)"/>
    `
  },
  {
    id: 6,
    code: 'l1',
    name: 'L1 // Cyber Glyph A (Ace)',
    tier: 'LOW',
    payout: [30, 120, 500],
    svgContent: createLowGlyphSVG({
      glyph: 'A',
      gradId: 'crimson-cyber',
      strokeColor: '#ff9eb5',
      glowColor: '#ff2a54',
      subLabel: 'ACE // 01',
    })
  },
  {
    id: 7,
    code: 'l2',
    name: 'L2 // Cyber Glyph K (King)',
    tier: 'LOW',
    payout: [30, 120, 500],
    svgContent: createLowGlyphSVG({
      glyph: 'K',
      gradId: 'gold-cyber',
      strokeColor: '#fff6a9',
      glowColor: '#ffb700',
      subLabel: 'KNG // 02',
    })
  },
  {
    id: 8,
    code: 'l3',
    name: 'L3 // Cyber Glyph Q (Queen)',
    tier: 'LOW',
    payout: [30, 120, 500],
    svgContent: createLowGlyphSVG({
      glyph: 'Q',
      gradId: 'magenta-cyber',
      strokeColor: '#ffb8ff',
      glowColor: '#ff2cdf',
      subLabel: 'QUN // 03',
    })
  },
  {
    id: 9,
    code: 'l4',
    name: 'L4 // Cyber Glyph J (Jack)',
    tier: 'LOW',
    payout: [30, 120, 500],
    svgContent: createLowGlyphSVG({
      glyph: 'J',
      gradId: 'cyan-cyber',
      strokeColor: '#e0ffff',
      glowColor: '#00f0ff',
      subLabel: 'JCK // 04',
    })
  },
  {
    id: 10,
    code: 'l5',
    name: 'L5 // Cyber Glyph 10 (Ten)',
    tier: 'LOW',
    payout: [30, 120, 500],
    svgContent: createLowGlyphSVG({
      glyph: '10',
      gradId: 'emerald-cyber',
      strokeColor: '#d4ffea',
      glowColor: '#00ff88',
      subLabel: 'TEN // 05',
      fontSize: 112,
    })
  },
  {
    id: 11,
    code: 'l6',
    codeAlt: '9',
    name: 'L6 // Cyber Glyph 9 (Nine)',
    tier: 'LOW',
    payout: [30, 120, 500],
    svgContent: createLowGlyphSVG({
      glyph: '9',
      gradId: 'chrome-bevel',
      strokeColor: '#00f0ff',
      glowColor: '#00a2ff',
      subLabel: 'NIN // 06',
    })
  },
  {
    id: 12,
    code: 'scatter',
    name: 'SC // Hyperdrive Singularity Portal (Scatter)',
    tier: 'SPECIAL',
    payout: [0, 0, 0],
    svgContent: `
      ${createTechCardFrame({
        borderGrad: 'magenta-cyber',
        glowColor: '#ff2cdf',
        bgInnerColor: '#130726',
        cornerAccent: '#00f0ff',
      })}
      <!-- Hyperdrive Singularity Portal -->
      <g filter="url(#drop-shadow)">
        <!-- Outer Warp Ring -->
        <circle cx="128" cy="116" r="68" fill="#090214" stroke="url(#magenta-cyber)" stroke-width="6"/>
        <!-- Turbine Blades -->
        <g stroke="#00f0ff" stroke-width="3" opacity="0.85">
          <line x1="128" y1="48" x2="128" y2="66"/>
          <line x1="128" y1="166" x2="128" y2="184"/>
          <line x1="60" y1="116" x2="78" y2="116"/>
          <line x1="178" y1="116" x2="196" y2="116"/>
          <line x1="80" y1="68" x2="93" y2="81"/>
          <line x1="163" y1="151" x2="176" y2="164"/>
          <line x1="176" y1="68" x2="163" y2="81"/>
          <line x1="93" y1="151" x2="80" y2="164"/>
        </g>
        <!-- Inner Vortex Rings -->
        <circle cx="128" cy="116" r="50" fill="none" stroke="#00f0ff" stroke-width="4" stroke-dasharray="18 10" filter="url(#glow-cyan)"/>
        <circle cx="128" cy="116" r="35" fill="url(#magenta-cyber)" filter="url(#glow-Strong)"/>
        <!-- 8-Point Singularity Star -->
        <polygon points="128,64 138,106 180,116 138,126 128,168 118,126 76,116 118,106" fill="#ffffff" filter="url(#glow-cyan)"/>
        <circle cx="128" cy="116" r="10" fill="#00f0ff"/>
      </g>
      <!-- SCATTER Plate -->
      <g filter="url(#drop-shadow)">
        <polygon points="36,178 220,178 208,216 48,216" fill="#1a0633" stroke="url(#cyan-cyber)" stroke-width="3.5"/>
        <text x="128" y="205" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="24" fill="#ffffff" stroke="#ff2cdf" stroke-width="1" letter-spacing="3" filter="url(#glow-cyan)">SCATTER</text>
      </g>
      <rect x="28" y="28" width="200" height="90" rx="24" fill="url(#glass-sheen)"/>
    `
  }
];

function createLowGlyphSVG({ glyph, gradId, strokeColor, glowColor, subLabel, fontSize = 132 }) {
  return `
    ${createTechCardFrame({
      borderGrad: 'chrome-bevel',
      glowColor,
      bgInnerColor: '#091224',
      cornerAccent: glowColor,
    })}
    <!-- Holographic Pedestal -->
    <ellipse cx="128" cy="186" rx="58" ry="12" fill="${glowColor}" opacity="0.28" filter="url(#glow-cyan)"/>
    <ellipse cx="128" cy="186" rx="42" ry="6" fill="none" stroke="${glowColor}" stroke-width="2" opacity="0.75"/>
    <!-- 3D Metallic Cyber Glyph -->
    <g filter="url(#drop-shadow)">
      <!-- Extrusion shadow layer -->
      <text x="128" y="166" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="${fontSize}" fill="#040812" stroke="#040812" stroke-width="12">${glyph}</text>
      <!-- Main gradient glyph -->
      <text x="128" y="160" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="${fontSize}" fill="url(#${gradId})" stroke="${strokeColor}" stroke-width="4" filter="url(#glow-cyan)">${glyph}</text>
    </g>
    <!-- Micro Tech Tag -->
    <text x="128" y="212" text-anchor="middle" font-family="'Orbitron', monospace" font-weight="700" font-size="13" fill="${glowColor}" letter-spacing="3" opacity="0.85">${subLabel}</text>
    <rect x="28" y="28" width="200" height="90" rx="24" fill="url(#glass-sheen)"/>
  `;
}

// Write all 13 Symbol SVGs
for (const sym of SYMBOLS) {
  const filename = `symbol_${String(sym.id).padStart(2, '0')}_${sym.code}.svg`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  ${COMMON_DEFS}
  ${sym.svgContent}
</svg>\n`;
  fs.writeFileSync(path.join(SYMBOLS_DIR, filename), svg, 'utf8');
}

// ============================================================================
// UI & MACHINE SPRITES (All separate sprites matching reference layout in High-Tech style)
// ============================================================================

const EXTRA_SPRITES = [
  // 0. Full High-Tech Cyber Stage Background (1600x900)
  {
    dir: FRAME_DIR,
    filename: 'bg_cyber_stage.svg',
    width: 1600,
    height: 900,
    content: `
      <defs>
        <linearGradient id="bg-sky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#030612"/>
          <stop offset="45%" stop-color="#091633"/>
          <stop offset="72%" stop-color="#17103b"/>
          <stop offset="100%" stop-color="#050914"/>
        </linearGradient>
        <radialGradient id="bg-horizon-glow" cx="50%" cy="68%" r="48%">
          <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.35"/>
          <stop offset="45%" stop-color="#ff2cdf" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="bg-floor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#150d38"/>
          <stop offset="30%" stop-color="#091329"/>
          <stop offset="100%" stop-color="#03060f"/>
        </linearGradient>
        <linearGradient id="tower-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#15264a"/>
          <stop offset="100%" stop-color="#050a18"/>
        </linearGradient>
      </defs>

      <!-- Deep Cyber Sky -->
      <rect width="1600" height="900" fill="url(#bg-sky)"/>
      <rect width="1600" height="900" fill="url(#bg-horizon-glow)"/>

      <!-- Starfield -->
      <g fill="#e0f7ff" opacity="0.75">
        <circle cx="110" cy="80" r="2"/><circle cx="240" cy="140" r="1.5"/><circle cx="380" cy="60" r="2.2"/>
        <circle cx="520" cy="110" r="1.5"/><circle cx="670" cy="50" r="2"/><circle cx="940" cy="70" r="1.8"/>
        <circle cx="1120" cy="120" r="2.2"/><circle cx="1280" cy="65" r="1.5"/><circle cx="1460" cy="95" r="2.5"/>
        <circle cx="180" cy="240" r="1.5"/><circle cx="1410" cy="210" r="1.8"/><circle cx="800" cy="40" r="2"/>
      </g>

      <!-- Orbital Holographic Moon / Cyber Ring -->
      <g opacity="0.85">
        <circle cx="1320" cy="210" r="76" fill="#0d234a" stroke="#00f0ff" stroke-width="2" filter="url(#glow-cyan)"/>
        <ellipse cx="1320" cy="210" rx="145" ry="26" fill="none" stroke="#ff2cdf" stroke-width="3" transform="rotate(-18 1320 210)" filter="url(#glow-cyan)"/>
        <circle cx="1320" cy="210" r="56" fill="none" stroke="#00f0ff" stroke-width="1.5" stroke-dasharray="14 8" opacity="0.7"/>
      </g>

      <!-- Atmospheric Light Beams -->
      <g opacity="0.14">
        <polygon points="180,680 340,0 440,0 260,680" fill="#00f0ff"/>
        <polygon points="1420,680 1260,0 1160,0 1340,680" fill="#ff2cdf"/>
        <polygon points="720,680 620,0 980,0 880,680" fill="#00f0ff"/>
      </g>

      <!-- Left Cyber Skyline Silhouette -->
      <g fill="url(#tower-grad)" stroke="#00f0ff" stroke-opacity="0.35" stroke-width="1.5">
        <rect x="0" y="260" width="95" height="420"/>
        <rect x="85" y="180" width="110" height="500"/>
        <polygon points="140,110 146,180 134,180" fill="#00f0ff"/>
        <rect x="185" y="310" width="90" height="370"/>
        <rect x="265" y="390" width="75" height="290"/>
      </g>
      <!-- Left Neon Windows -->
      <g fill="#00f0ff" opacity="0.65">
        <rect x="104" y="210" width="14" height="48"/><rect x="128" y="210" width="14" height="48"/>
        <rect x="152" y="210" width="14" height="48"/><rect x="104" y="280" width="62" height="6"/>
        <rect x="104" y="300" width="62" height="6"/><rect x="104" y="320" width="62" height="6"/>
        <rect x="20" y="300" width="50" height="8" fill="#ff2cdf"/><rect x="20" y="325" width="50" height="8" fill="#ff2cdf"/>
        <rect x="205" y="340" width="50" height="6"/><rect x="205" y="360" width="50" height="6"/>
      </g>

      <!-- Right Cyber Skyline Silhouette -->
      <g fill="url(#tower-grad)" stroke="#ff2cdf" stroke-opacity="0.35" stroke-width="1.5">
        <rect x="1505" y="240" width="95" height="440"/>
        <rect x="1405" y="160" width="110" height="520"/>
        <polygon points="1460,90 1466,160 1454,160" fill="#ff2cdf"/>
        <rect x="1325" y="300" width="90" height="380"/>
        <rect x="1260" y="385" width="75" height="295"/>
      </g>
      <!-- Right Neon Windows -->
      <g fill="#ff2cdf" opacity="0.65">
        <rect x="1424" y="195" width="14" height="52"/><rect x="1448" y="195" width="14" height="52"/>
        <rect x="1472" y="195" width="14" height="52"/><rect x="1424" y="270" width="62" height="6"/>
        <rect x="1424" y="290" width="62" height="6"/><rect x="1525" y="280" width="50" height="8" fill="#00f0ff"/>
        <rect x="1525" y="305" width="50" height="8" fill="#00f0ff"/><rect x="1345" y="330" width="50" height="6" fill="#00f0ff"/>
      </g>

      <!-- Cyber Deck Floor with Perspective Neon Grid -->
      <rect x="0" y="660" width="1600" height="240" fill="url(#bg-floor)"/>
      <line x1="0" y1="660" x2="1600" y2="660" stroke="#00f0ff" stroke-width="3" filter="url(#glow-cyan)"/>
      <!-- Horizontal Perspective Grid Lines -->
      <g stroke="#00f0ff" stroke-opacity="0.28" stroke-width="1.5">
        <line x1="0" y1="684" x2="1600" y2="684"/>
        <line x1="0" y1="716" x2="1600" y2="716"/>
        <line x1="0" y1="758" x2="1600" y2="758"/>
        <line x1="0" y1="812" x2="1600" y2="812"/>
        <line x1="0" y1="876" x2="1600" y2="876"/>
      </g>
      <!-- Converging Perspective Rays -->
      <g stroke="#00f0ff" stroke-opacity="0.25" stroke-width="1.5">
        <line x1="800" y1="660" x2="800" y2="900"/>
        <line x1="700" y1="660" x2="540" y2="900"/>
        <line x1="600" y1="660" x2="280" y2="900"/>
        <line x1="500" y1="660" x2="20" y2="900"/>
        <line x1="400" y1="660" x2="-240" y2="900"/>
        <line x1="900" y1="660" x2="1060" y2="900"/>
        <line x1="1000" y1="660" x2="1320" y2="900"/>
        <line x1="1100" y1="660" x2="1580" y2="900"/>
        <line x1="1200" y1="660" x2="1840" y2="900"/>
      </g>

      <!-- Subtle Vignette & Hex Overlay -->
      <rect width="1600" height="900" fill="url(#hex-grid)" opacity="0.35"/>
    `
  },
  // 1. Main 5x3 Reel Frame Chassis (High-Tech metallic frame replacing the wooden frame in reference)
  {
    dir: FRAME_DIR,
    filename: 'reel_frame_5x3.svg',
    width: 1100,
    height: 680,
    content: `
      <!-- Outer Cyber Frame Glow -->
      <rect x="24" y="24" width="1052" height="632" rx="28" fill="none" stroke="#00f0ff" stroke-width="6" opacity="0.5" filter="url(#glow-Strong)"/>
      <!-- Dark Deep Space Reel Backplate -->
      <rect x="30" y="30" width="1040" height="620" rx="22" fill="#050b18" stroke="url(#chrome-bevel)" stroke-width="16" filter="url(#drop-shadow)"/>
      <!-- Semi-transparent Reel Column Lanes (5 columns) -->
      <g opacity="0.9">
        <rect x="44" y="44" width="196" height="592" fill="#08142b"/>
        <rect x="248" y="44" width="196" height="592" fill="#0a1833"/>
        <rect x="452" y="44" width="196" height="592" fill="#08142b"/>
        <rect x="656" y="44" width="196" height="592" fill="#0a1833"/>
        <rect x="860" y="44" width="196" height="592" fill="#08142b"/>
      </g>
      <rect x="44" y="44" width="1012" height="592" fill="url(#hex-grid)"/>
      <!-- Corner Heavy Armor Plates -->
      <g fill="url(#gold-cyber)" stroke="#ffffff" stroke-width="1.5">
        <polygon points="18,64 18,18 64,18 52,36 36,36 36,52"/>
        <polygon points="1082,64 1082,18 1036,18 1048,36 1064,36 1064,52"/>
        <polygon points="18,616 18,662 64,662 52,644 36,644 36,628"/>
        <polygon points="1082,616 1082,662 1036,662 1048,644 1064,644 1064,628"/>
      </g>
      <!-- Top & Bottom Neon Energy Conduits -->
      <rect x="280" y="20" width="540" height="8" rx="4" fill="#00f0ff" filter="url(#glow-cyan)"/>
      <rect x="280" y="652" width="540" height="8" rx="4" fill="#00f0ff" filter="url(#glow-cyan)"/>
    `
  },
  // 2. Separate Vertical Laser Reel Divider (replaces golden rope dividers between reels)
  {
    dir: FRAME_DIR,
    filename: 'reel_divider_laser.svg',
    width: 32,
    height: 600,
    content: `
      <!-- Metallic Emitter Top & Bottom -->
      <polygon points="2,0 30,0 26,28 6,28" fill="url(#chrome-bevel)" stroke="#00f0ff" stroke-width="1.5"/>
      <polygon points="6,572 26,572 30,600 2,600" fill="url(#chrome-bevel)" stroke="#00f0ff" stroke-width="1.5"/>
      <!-- Laser Conduit Core -->
      <rect x="12" y="28" width="8" height="544" fill="#061428"/>
      <rect x="14" y="28" width="4" height="544" fill="#00f0ff" filter="url(#glow-cyan)"/>
      <!-- Energy Nodes -->
      <circle cx="16" cy="200" r="6" fill="url(#gold-cyber)" stroke="#ffffff" stroke-width="1"/>
      <circle cx="16" cy="400" r="6" fill="url(#gold-cyber)" stroke="#ffffff" stroke-width="1"/>
    `
  },
  // 3. Side Badge "10 LINES" (Square chamfered high-tech armor plate)
  {
    dir: FRAME_DIR,
    filename: 'badge_10_paylines.svg',
    width: 160,
    height: 160,
    content: `
      <!-- Outer Neon Glow -->
      <polygon points="28,12 132,12 148,28 148,132 132,148 28,148 12,132 12,28" fill="none" stroke="#00f0ff" stroke-width="4" opacity="0.6" filter="url(#glow-cyan)"/>
      <!-- Square Chamfered Metallic Chassis -->
      <polygon points="28,12 132,12 148,28 148,132 132,148 28,148 12,132 12,28" fill="url(#dark-metal)" stroke="url(#gold-cyber)" stroke-width="6" filter="url(#drop-shadow)"/>
      <!-- Inner Cyber Plate -->
      <polygon points="34,24 126,24 136,34 136,126 126,136 34,136 24,126 24,34" fill="#09152b" stroke="#00f0ff" stroke-width="2"/>
      <rect x="24" y="24" width="112" height="112" fill="url(#hex-grid)" opacity="0.6"/>
      <!-- Top & Bottom LED Bars -->
      <rect x="52" y="10" width="56" height="6" rx="3" fill="#00f0ff" filter="url(#glow-cyan)"/>
      <rect x="52" y="144" width="56" height="6" rx="3" fill="#00f0ff" filter="url(#glow-cyan)"/>
      <!-- 10 LINES Label -->
      <text x="80" y="84" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="48" fill="url(#gold-cyber)" filter="url(#glow-cyan)">10</text>
      <text x="80" y="114" text-anchor="middle" font-family="'Orbitron', sans-serif" font-weight="800" font-size="18" fill="#00f0ff" letter-spacing="3">LINES</text>
    `
  },
  // 4. Primary SPIN Button (Wide horizontal chamfered high-tech emerald/gold button)
  {
    dir: UI_DIR,
    filename: 'btn_spin.svg',
    width: 320,
    height: 112,
    content: `
      <!-- Outer Glow -->
      <polygon points="28,10 292,10 310,28 310,84 292,102 28,102 10,84 10,28" fill="none" stroke="#00ff88" stroke-width="5" opacity="0.6" filter="url(#glow-Strong)"/>
      <!-- Armored Wide Frame -->
      <polygon points="28,10 292,10 310,28 310,84 292,102 28,102 10,84 10,28" fill="url(#dark-metal)" stroke="url(#gold-cyber)" stroke-width="6" filter="url(#drop-shadow)"/>
      <!-- Glowing Emerald Wide Core -->
      <polygon points="34,19 286,19 300,33 300,79 286,93 34,93 20,79 20,33" fill="url(#emerald-cyber)" stroke="#00f0ff" stroke-width="3" filter="url(#glow-cyan)"/>
      <!-- Top Gloss Highlight -->
      <polygon points="34,19 286,19 300,33 300,56 20,56 20,33" fill="url(#glass-sheen)"/>
      <!-- Side Tech Energy Chevrons -->
      <path d="M36 44 L48 56 L36 68 M48 44 L60 56 L48 68" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
      <path d="M284 44 L272 56 L284 68 M272 44 L260 56 L272 68" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.75"/>
      <!-- Top & Bottom LED Strips -->
      <rect x="108" y="8" width="104" height="5" rx="2.5" fill="#00ff88" filter="url(#glow-cyan)"/>
      <rect x="108" y="99" width="104" height="5" rx="2.5" fill="#00ff88" filter="url(#glow-cyan)"/>
      <!-- SPIN Label -->
      <text x="160" y="64" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="42" fill="#ffffff" stroke="#00381d" stroke-width="3" letter-spacing="6" filter="url(#drop-shadow)">SPIN</text>
      <text x="160" y="85" text-anchor="middle" font-family="'Orbitron', sans-serif" font-weight="800" font-size="11" fill="#001f10" letter-spacing="2">HOLD FOR AUTO</text>
    `
  },
  // 5. Bet Minus Button (-) (Square tech button)
  {
    dir: UI_DIR,
    filename: 'btn_minus.svg',
    width: 80,
    height: 80,
    content: `
      <rect x="8" y="8" width="64" height="64" rx="14" fill="url(#dark-metal)" stroke="url(#cyan-cyber)" stroke-width="4" filter="url(#drop-shadow)"/>
      <rect x="22" y="35" width="36" height="10" rx="4" fill="#00f0ff" filter="url(#glow-cyan)"/>
    `
  },
  // 6. Bet Plus Button (+) (Square tech button)
  {
    dir: UI_DIR,
    filename: 'btn_plus.svg',
    width: 80,
    height: 80,
    content: `
      <rect x="8" y="8" width="64" height="64" rx="14" fill="url(#dark-metal)" stroke="url(#cyan-cyber)" stroke-width="4" filter="url(#drop-shadow)"/>
      <rect x="22" y="35" width="36" height="10" rx="4" fill="#00f0ff" filter="url(#glow-cyan)"/>
      <rect x="35" y="22" width="10" height="36" rx="4" fill="#00f0ff" filter="url(#glow-cyan)"/>
    `
  },
  // 7. MAX BET Button
  {
    dir: UI_DIR,
    filename: 'btn_max_bet.svg',
    width: 110,
    height: 80,
    content: `
      <rect x="8" y="8" width="94" height="64" rx="18" fill="url(#dark-metal)" stroke="url(#magenta-cyber)" stroke-width="4" filter="url(#drop-shadow)"/>
      <text x="55" y="38" text-anchor="middle" font-family="'Orbitron', sans-serif" font-weight="900" font-size="18" fill="#00f0ff" filter="url(#glow-cyan)">MAX</text>
      <text x="55" y="58" text-anchor="middle" font-family="'Orbitron', sans-serif" font-weight="800" font-size="16" fill="#ffffff">BET</text>
    `
  },
  // 8. Info / Paytable Button (i)
  {
    dir: UI_DIR,
    filename: 'btn_info.svg',
    width: 72,
    height: 72,
    content: `
      <circle cx="36" cy="36" r="30" fill="url(#dark-metal)" stroke="url(#cyan-cyber)" stroke-width="3.5" filter="url(#drop-shadow)"/>
      <text x="36" y="47" text-anchor="middle" font-family="'Orbitron', serif" font-weight="900" font-size="30" fill="#00f0ff" filter="url(#glow-cyan)">i</text>
    `
  },
  // 9. HUD Balance Display Panel
  {
    dir: UI_DIR,
    filename: 'panel_display_meter.svg',
    width: 380,
    height: 84,
    content: `
      <rect x="6" y="6" width="368" height="72" rx="22" fill="#050b17" stroke="url(#chrome-bevel)" stroke-width="4" filter="url(#drop-shadow)"/>
      <rect x="14" y="14" width="352" height="56" rx="16" fill="#091326" stroke="#00f0ff" stroke-width="1.5" stroke-opacity="0.45"/>
      <path d="M30 14 L95 14 L85 22 L40 22 Z" fill="#00f0ff" opacity="0.6"/>
    `
  },
  // 9b. Extra-Wide LAST WIN Display Panel (680x84)
  {
    dir: UI_DIR,
    filename: 'panel_win_display.svg',
    width: 680,
    height: 84,
    content: `
      <!-- Outer Chamfered Chassis -->
      <polygon points="22,6 658,6 674,22 674,62 658,78 22,78 6,62 6,22" fill="#050b17" stroke="url(#chrome-bevel)" stroke-width="4" filter="url(#drop-shadow)"/>
      <!-- Inner Neon Screen -->
      <polygon points="26,14 654,14 666,26 666,58 654,70 26,70 14,58 14,26" fill="#081326" stroke="#00ff88" stroke-width="2" stroke-opacity="0.65"/>
      <rect x="20" y="16" width="640" height="52" fill="url(#hex-grid)" opacity="0.45"/>
      <!-- Top & Bottom Glowing Emerald Accent Rails -->
      <rect x="160" y="4" width="360" height="4" rx="2" fill="#00ff88" filter="url(#glow-cyan)"/>
      <rect x="160" y="76" width="360" height="4" rx="2" fill="#00f0ff" filter="url(#glow-cyan)"/>
      <!-- Side Cyber Brackets -->
      <path d="M28 28 L20 42 L28 56" fill="none" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
      <path d="M652 28 L660 42 L652 56" fill="none" stroke="#00f0ff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
    `
  },
  // 10. Cyber Credit Coin Icon
  {
    dir: UI_DIR,
    filename: 'icon_cyber_coin.svg',
    width: 64,
    height: 64,
    content: `
      <circle cx="32" cy="32" r="28" fill="url(#gold-cyber)" stroke="#ffffff" stroke-width="2" filter="url(#drop-shadow)"/>
      <circle cx="32" cy="32" r="21" fill="none" stroke="#9e3600" stroke-width="2" stroke-dasharray="10 4"/>
      <text x="32" y="42" text-anchor="middle" font-family="'Orbitron', sans-serif" font-weight="900" font-size="28" fill="#fff9c4">₵</text>
    `
  },
  // 11. Quantum Gem Icon (top bar gem from reference)
  {
    dir: UI_DIR,
    filename: 'icon_quantum_gem.svg',
    width: 64,
    height: 64,
    content: `
      <polygon points="32,6 54,20 48,54 16,54 10,20" fill="url(#magenta-cyber)" stroke="#ffffff" stroke-width="2" filter="url(#glow-cyan)"/>
      <polygon points="32,6 54,20 32,34 10,20" fill="#ffb8ff" opacity="0.65"/>
      <polygon points="32,34 54,20 48,54 32,54" fill="#a800ff" opacity="0.5"/>
    `
  },
  // 12. Win Line Highlight Frame (Animated/Overlay border for winning cells)
  {
    dir: FRAME_DIR,
    filename: 'win_cell_frame.svg',
    width: 256,
    height: 256,
    content: `
      <rect x="12" y="12" width="232" height="232" rx="36" fill="none" stroke="#00ff88" stroke-width="8" filter="url(#glow-Strong)"/>
      <rect x="20" y="20" width="216" height="216" rx="28" fill="none" stroke="#ffffff" stroke-width="3" stroke-dasharray="28 14"/>
    `
  },
  // 13. Bottom Console Dock Plate (1200x104)
  {
    dir: UI_DIR,
    filename: 'panel_bottom_dock.svg',
    width: 1200,
    height: 104,
    content: `
      <!-- Armored Bottom Console Chassis -->
      <polygon points="24,6 1176,6 1194,24 1194,98 6,98 6,24" fill="url(#dark-metal)" stroke="url(#chrome-bevel)" stroke-width="4" filter="url(#drop-shadow)"/>
      <polygon points="30,14 1170,14 1184,28 1184,90 16,90 16,28" fill="#060d1e" stroke="#00f0ff" stroke-width="1.5" stroke-opacity="0.4"/>
      <rect x="30" y="14" width="1140" height="76" fill="url(#hex-grid)" opacity="0.45"/>
      <!-- Top Glowing Accent Rail -->
      <rect x="260" y="4" width="680" height="5" rx="2.5" fill="#00f0ff" filter="url(#glow-cyan)"/>
      <!-- Corner Cyber Brackets -->
      <rect x="24" y="88" width="90" height="4" rx="2" fill="#ff2cdf" opacity="0.8"/>
      <rect x="1086" y="88" width="90" height="4" rx="2" fill="#00ff88" opacity="0.8"/>
    `
  },
  // 14. Square Buy Bonus Button (160x160)
  {
    dir: UI_DIR,
    filename: 'btn_buy_bonus.svg',
    width: 160,
    height: 160,
    content: `
      <!-- Outer Magenta/Gold Neon Glow -->
      <polygon points="24,8 136,8 152,24 152,136 136,152 24,152 8,136 8,24" fill="none" stroke="#ff2cdf" stroke-width="5" opacity="0.65" filter="url(#glow-Strong)"/>
      <!-- Armored Square Chassis -->
      <polygon points="24,8 136,8 152,24 152,136 136,152 24,152 8,136 8,24" fill="url(#dark-metal)" stroke="url(#gold-cyber)" stroke-width="6" filter="url(#drop-shadow)"/>
      <!-- Glowing Magenta Core -->
      <polygon points="30,18 130,18 142,30 142,130 130,142 30,142 18,130 18,30" fill="url(#magenta-cyber)" stroke="#00f0ff" stroke-width="2.5"/>
      <!-- Top Gloss -->
      <polygon points="30,18 130,18 142,30 142,74 18,74 18,30" fill="url(#glass-sheen)"/>
      <!-- Top & Bottom LED Strips -->
      <rect x="48" y="6" width="64" height="5" rx="2.5" fill="#ffd000" filter="url(#glow-cyan)"/>
      <rect x="48" y="149" width="64" height="5" rx="2.5" fill="#00f0ff" filter="url(#glow-cyan)"/>
      <!-- BUY BONUS Stacked Title -->
      <text x="80" y="54" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="24" fill="#ffffff" stroke="#3c0078" stroke-width="2" letter-spacing="2">BUY</text>
      <text x="80" y="82" text-anchor="middle" font-family="'Orbitron', 'Arial Black', sans-serif" font-weight="900" font-size="23" fill="#fff6a9" stroke="#3c0078" stroke-width="2" letter-spacing="1.5">BONUS</text>
      <!-- Recessed Dark Price Slot -->
      <rect x="28" y="96" width="104" height="34" rx="8" fill="#090318" stroke="#ffd000" stroke-width="2"/>
    `
  }
];

for (const item of EXTRA_SPRITES) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${item.width} ${item.height}" width="${item.width}" height="${item.height}">
  ${COMMON_DEFS}
  ${item.content}
</svg>\n`;
  fs.writeFileSync(path.join(item.dir, item.filename), svg, 'utf8');
}

// Write JSON manifest mapping server SymbolId (0..12) and UI sprites
const manifest = {
  theme: 'Cyber Nexus // High-Tech Slot Machine',
  grid: { rows: 3, columns: 5, activePaylines: 10 },
  symbols: SYMBOLS.map((s) => ({
    id: s.id,
    code: s.code.toUpperCase(),
    name: s.name,
    tier: s.tier,
    payoutMultipliers: s.payout,
    svg: `symbols/symbol_${String(s.id).padStart(2, '0')}_${s.code}.svg`,
    png: `symbols/png/symbol_${String(s.id).padStart(2, '0')}_${s.code}.png`,
  })),
  machineSprites: EXTRA_SPRITES.filter((x) => x.dir === FRAME_DIR).map((x) => ({
    name: x.filename.replace('.svg', ''),
    width: x.width,
    height: x.height,
    svg: `machine/${x.filename}`,
    png: `machine/png/${x.filename.replace('.svg', '.png')}`,
  })),
  uiSprites: EXTRA_SPRITES.filter((x) => x.dir === UI_DIR).map((x) => ({
    name: x.filename.replace('.svg', ''),
    width: x.width,
    height: x.height,
    svg: `ui/${x.filename}`,
    png: `ui/png/${x.filename.replace('.svg', '.png')}`,
  })),
};

fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
console.log('Generated', SYMBOLS.length, 'symbol SVGs and', EXTRA_SPRITES.length, 'machine/UI SVGs.');
