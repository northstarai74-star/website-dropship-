/* Studio-lit product renders generated from shape + palette, so every colourway has a matching image.
   Placeholder artwork: replace with approved product photography before launch. */
(() => {
  'use strict';

  const PALETTES = {
    ivory: { label: 'Ivory', body: '#ebe7df', soft: '#cfc6b6', ink: '#2a2b29' },
    graphite: { label: 'Graphite', body: '#575855', soft: '#383937', ink: '#161615' },
    sage: { label: 'Sage', body: '#a3ad9f', soft: '#7f8a7b', ink: '#2b2f2a' },
    sand: { label: 'Sand', body: '#dccfb8', soft: '#b9ac94', ink: '#34312b' },
    slate: { label: 'Slate', body: '#98a2aa', soft: '#6c7780', ink: '#1f2428' }
  };

  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const mix = (hex, target, amount) => {
    const a = rgb(hex);
    const b = rgb(target);
    return '#' + a.map((v, i) => clamp(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('');
  };
  const light = (hex, amount) => mix(hex, '#ffffff', amount);
  const dark = (hex, amount) => mix(hex, '#000000', amount);

  let uid = 0;

  const KINDS = {
    gun: (c) => `${c.shadow(150, 66)}
      <rect x="131" y="146" width="38" height="96" rx="17" fill="${c.lin(c.p.soft)}"/>
      <path d="M135 188h30M135 199h30M135 210h30" stroke="${dark(c.p.soft, 0.35)}" stroke-width="1.5" opacity=".55"/>
      <rect x="143" y="62" width="14" height="30" rx="5" fill="${c.lin(c.p.ink)}"/>
      <rect x="112" y="84" width="76" height="88" rx="33" fill="${c.lin(c.p.body)}"/>
      <rect x="121" y="94" width="12" height="62" rx="6" fill="#fff" opacity=".5" filter="${c.hi}"/>
      <circle cx="150" cy="138" r="6.5" fill="${c.lin(c.p.ink)}"/>
      <circle cx="150" cy="138" r="9" fill="none" stroke="${dark(c.p.body, 0.2)}" stroke-width="1"/>
      <circle cx="150" cy="50" r="23" fill="${c.ball(c.p.ink)}"/>
      <ellipse cx="142" cy="41" rx="7" ry="4.5" fill="#fff" opacity=".28" filter="${c.hi}"/>`,

    handvac: (c) => `${c.shadow(160, 84)}
      <rect x="116" y="164" width="36" height="78" rx="16" fill="${c.lin(c.p.soft)}"/>
      <path d="M121 198h26M121 209h26M121 220h26" stroke="${dark(c.p.soft, 0.35)}" stroke-width="1.5" opacity=".55"/>
      <rect x="58" y="100" width="150" height="74" rx="35" fill="${c.lin(c.p.body)}"/>
      <rect x="50" y="110" width="16" height="54" rx="8" fill="${c.lin(c.p.soft)}"/>
      <rect x="78" y="111" width="94" height="52" rx="24" fill="${c.p.ink}" opacity=".12"/>
      <rect x="78" y="111" width="94" height="52" rx="24" fill="none" stroke="#fff" stroke-width="1.5" opacity=".7"/>
      <rect x="70" y="106" width="104" height="14" rx="7" fill="#fff" opacity=".5" filter="${c.hi}"/>
      <rect x="204" y="120" width="42" height="32" rx="9" fill="${c.lin(c.p.ink)}"/>
      <path d="M242 112 L274 106 Q281 105 281 112 L281 160 Q281 167 274 166 L242 160Z" fill="${dark(c.p.ink, 0.2)}"/>
      <circle cx="190" cy="137" r="5.5" fill="${c.lin(c.p.ink)}"/>`,

    pad: (c) => `${c.shadow(150, 108, true)}
      <rect x="46" y="126" width="208" height="114" rx="50" fill="${c.lin(c.p.body)}"/>
      <ellipse cx="104" cy="152" rx="36" ry="14" fill="${c.p.ink}" opacity=".6"/>
      <ellipse cx="196" cy="152" rx="36" ry="14" fill="${c.p.ink}" opacity=".6"/>
      <ellipse cx="104" cy="152" rx="36" ry="14" fill="none" stroke="#fff" stroke-width="1.5" opacity=".4"/>
      <ellipse cx="196" cy="152" rx="36" ry="14" fill="none" stroke="#fff" stroke-width="1.5" opacity=".4"/>
      <rect x="58" y="132" width="184" height="34" rx="24" fill="${c.sheen}" opacity=".5"/>
      <path d="M52 204 H248" stroke="${dark(c.p.body, 0.4)}" stroke-width="1.5" opacity=".45"/>
      <rect x="66" y="228" width="168" height="6" rx="3" fill="${c.p.ink}" opacity=".3"/>`,

    washer: (c) => `${c.shadow(148, 108)}
      <g transform="translate(-14 0)">
        <path d="M96 96V76Q96 62 110 62H146Q160 62 160 76V96" fill="none" stroke="${c.p.ink}" stroke-width="9" stroke-linecap="round"/>
        <rect x="76" y="96" width="104" height="142" rx="28" fill="${c.lin(c.p.body)}"/>
        <rect x="88" y="112" width="80" height="64" rx="16" fill="${c.p.ink}" opacity=".1"/>
        <rect x="84" y="104" width="12" height="100" rx="6" fill="#fff" opacity=".5" filter="${c.hi}"/>
        <rect x="84" y="228" width="88" height="12" rx="6" fill="${c.lin(c.p.ink)}"/>
        <path d="M180 172C226 172 220 224 232 226" fill="none" stroke="${c.p.ink}" stroke-width="7" stroke-linecap="round" opacity=".9"/>
        <rect x="228" y="218" width="38" height="20" rx="9" fill="${c.lin(c.p.ink)}"/>
        <rect x="264" y="224" width="16" height="8" rx="4" fill="#a7a7a0"/>
      </g>`,

    cylinder: (c) => `${c.shadow(150, 62)}
      <rect x="100" y="98" width="100" height="142" rx="32" fill="${c.lin(c.p.body)}"/>
      <rect x="106" y="84" width="88" height="22" rx="11" fill="${c.lin(c.p.soft)}"/>
      ${c.o.mist ? `
        <rect x="116" y="122" width="68" height="88" rx="18" fill="${c.p.ink}" opacity=".1"/>
        <rect x="116" y="160" width="68" height="50" rx="18" fill="#cfe3ee" opacity=".38"/>
        <rect x="116" y="122" width="68" height="88" rx="18" fill="none" stroke="#fff" stroke-width="1.5" opacity=".6"/>
        <ellipse cx="150" cy="62" rx="26" ry="12" fill="#fff" opacity=".85" filter="${c.glowBlur}"/>
        <ellipse cx="138" cy="38" rx="16" ry="8" fill="#fff" opacity=".6" filter="${c.glowBlur}"/>
        <ellipse cx="164" cy="24" rx="10" ry="6" fill="#fff" opacity=".45" filter="${c.glowBlur}"/>`
      : `${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M118 ${126 + i * 10}h64" stroke="${c.p.ink}" stroke-width="3" stroke-linecap="round" opacity=".28"/>`).join('')}`}
      <rect x="108" y="92" width="10" height="136" rx="5" fill="#fff" opacity=".45" filter="${c.hi}"/>
      <rect x="96" y="228" width="108" height="12" rx="6" fill="${c.lin(c.p.ink)}"/>`,

    lamp: (c) => `${c.shadow(150, 54)}
      <ellipse cx="150" cy="136" rx="84" ry="36" fill="#ffe3b0" opacity=".6" filter="${c.glowBlur}"/>
      <rect x="108" y="226" width="84" height="14" rx="7" fill="${c.lin(c.p.soft)}"/>
      <rect x="145" y="124" width="10" height="106" rx="5" fill="${c.lin(c.p.ink)}"/>
      <path d="M112 66 H188 L212 130 H88Z" fill="${c.lin(c.p.body)}"/>
      <ellipse cx="150" cy="130" rx="62" ry="6" fill="#ffe9bf"/>
      <path d="M122 74 L104 122" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".45" filter="${c.hi}"/>`,

    speaker: (c) => `${c.shadow(150, 58)}
      <path d="M132 94 V80 Q132 70 142 70 H158 Q168 70 168 80 V94" fill="none" stroke="${c.p.ink}" stroke-width="5" stroke-linecap="round"/>
      <rect x="94" y="94" width="112" height="146" rx="36" fill="${c.lin(c.p.body)}"/>
      <rect x="108" y="112" width="84" height="94" rx="22" fill="${c.p.ink}" opacity=".16"/>
      ${[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => `<path d="M116 ${124 + i * 9}H184" stroke="${c.p.ink}" stroke-width="2.5" stroke-linecap="round" opacity=".3"/>`).join('')}
      <circle cx="132" cy="224" r="5" fill="${c.p.ink}"/><circle cx="150" cy="224" r="5" fill="${c.p.ink}"/><circle cx="168" cy="224" r="5" fill="${c.p.ink}"/>
      <rect x="102" y="104" width="10" height="120" rx="5" fill="#fff" opacity=".45" filter="${c.hi}"/>`,

    dock: (c) => `${c.shadow(150, 88)}
      <rect x="70" y="224" width="160" height="16" rx="8" fill="${c.lin(c.p.soft)}"/>
      <path d="M108 224 L124 112 Q126 100 138 100 H172 Q184 100 186 112 L202 224Z" fill="${c.lin(c.p.body)}"/>
      <path d="M124 214 L136 120 H164 L176 214Z" fill="${c.p.ink}" opacity=".1"/>
      <circle cx="150" cy="168" r="14" fill="none" stroke="${c.p.ink}" stroke-width="2" opacity=".4"/>
      <circle cx="150" cy="168" r="4" fill="${c.p.ink}"/>
      <path d="M128 112 L116 214" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45" filter="${c.hi}"/>`,

    jump: (c) => `${c.shadow(150, 96)}
      <path d="M222 178 C268 178 264 214 250 226" fill="none" stroke="${c.p.ink}" stroke-width="6" stroke-linecap="round"/>
      <rect x="236" y="222" width="28" height="16" rx="5" fill="${c.lin(c.p.ink)}"/>
      <rect x="112" y="116" width="76" height="20" rx="10" fill="${c.lin(c.p.soft)}"/>
      <rect x="72" y="128" width="152" height="108" rx="24" fill="${c.lin(c.p.body)}"/>
      <rect x="92" y="150" width="112" height="30" rx="10" fill="${c.p.ink}" opacity=".88"/>
      ${[0, 1, 2, 3].map((i) => `<circle cx="${114 + i * 24}" cy="165" r="4.5" fill="#9fd7ab" opacity="${i < 3 ? '.9' : '.3'}"/>`).join('')}
      <rect x="92" y="198" width="112" height="8" rx="4" fill="${c.p.ink}" opacity=".2"/>
      <rect x="80" y="140" width="10" height="84" rx="5" fill="#fff" opacity=".45" filter="${c.hi}"/>`,

    inflator: (c) => `${c.shadow(150, 66)}
      <path d="M208 150 C252 150 254 102 232 86" fill="none" stroke="${c.p.ink}" stroke-width="7" stroke-linecap="round"/>
      <rect x="222" y="68" width="22" height="16" rx="5" fill="${c.lin(c.p.ink)}" transform="rotate(-28 233 76)"/>
      <rect x="108" y="220" width="84" height="20" rx="10" fill="${c.lin(c.p.soft)}"/>
      <rect x="92" y="112" width="116" height="116" rx="40" fill="${c.lin(c.p.body)}"/>
      <circle cx="150" cy="160" r="31" fill="${c.p.ink}"/>
      <circle cx="150" cy="160" r="26" fill="none" stroke="${light(c.p.ink, 0.5)}" stroke-width="1.5" opacity=".7"/>
      <path d="M150 160 L166 146" stroke="#e8e4da" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="150" cy="160" r="3.5" fill="#e8e4da"/>
      <rect x="100" y="124" width="10" height="84" rx="5" fill="#fff" opacity=".45" filter="${c.hi}"/>`,

    dashcam: (c) => `${c.shadow(150, 44)}
      <rect x="118" y="232" width="64" height="8" rx="4" fill="${c.lin(c.p.ink)}"/>
      <rect x="144" y="176" width="12" height="60" rx="5" fill="${c.lin(c.p.ink)}"/>
      <rect x="90" y="104" width="120" height="76" rx="18" fill="${c.lin(c.p.body)}"/>
      <circle cx="150" cy="142" r="27" fill="${c.lin(c.p.soft)}"/>
      <circle cx="150" cy="142" r="20" fill="${c.ball(c.p.ink)}"/>
      <ellipse cx="143" cy="135" rx="6" ry="4" fill="#fff" opacity=".35" filter="${c.hi}"/>
      <circle cx="196" cy="118" r="3" fill="#d96a5a"/>
      <rect x="98" y="112" width="10" height="60" rx="5" fill="#fff" opacity=".45" filter="${c.hi}"/>`
  };

  const render = (kind, color = 'ivory', opts = {}) => {
    const p = PALETTES[color] || PALETTES.ivory;
    const draw = KINDS[kind];
    if (!draw) return '';
    const id = `a${++uid}`;
    const defs = [];
    let n = 0;
    const gradient = (markup) => {
      const gid = `${id}g${++n}`;
      defs.push(markup(gid));
      return `url(#${gid})`;
    };
    const ctx = {
      p,
      o: opts,
      hi: `url(#${id}h)`,
      glowBlur: `url(#${id}w)`,
      sheen: `url(#${id}s)`,
      lin: (base) => gradient((gid) => `<linearGradient id="${gid}" x1="0" x2="1"><stop offset="0" stop-color="${dark(base, 0.3)}"/><stop offset=".28" stop-color="${light(base, 0.38)}"/><stop offset=".62" stop-color="${base}"/><stop offset="1" stop-color="${dark(base, 0.38)}"/></linearGradient>`),
      ball: (base) => gradient((gid) => `<radialGradient id="${gid}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${light(base, 0.32)}"/><stop offset=".55" stop-color="${base}"/><stop offset="1" stop-color="${dark(base, 0.5)}"/></radialGradient>`),
      shadow: (cx, rx, wide) => `<ellipse cx="${cx}" cy="243" rx="${rx}" ry="${wide ? 11 : 8}" fill="#2b2620" opacity=".34" filter="url(#${id}${wide ? 'sw' : 'ss'})"/>`
    };
    const body = draw(ctx);
    return `<svg viewBox="0 0 300 300" aria-hidden="true" focusable="false"><defs>
      <filter id="${id}ss" x="-40%" y="-200%" width="180%" height="500%"><feGaussianBlur stdDeviation="6"/></filter>
      <filter id="${id}sw" x="-40%" y="-200%" width="180%" height="500%"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="${id}h" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
      <filter id="${id}w" x="-60%" y="-120%" width="220%" height="340%"><feGaussianBlur stdDeviation="9"/></filter>
      <linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      ${defs.join('')}</defs>${body}</svg>`;
  };

  window.NV = Object.assign(window.NV || {}, { art: { render, PALETTES } });
})();
