'use strict';

/* ===========================
   HEADER SCROLL EFFECT
=========================== */
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
  header.style.background = window.scrollY > 60
    ? 'rgba(10,10,15,0.95)'
    : 'rgba(10,10,15,0.8)';
});

/* ===========================
   HAMBURGER MENU
=========================== */
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  nav.classList.toggle('open');
});

// Close on nav link click
nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    nav.classList.remove('open');
  });
});

/* ===========================
   SCROLL REVEAL ANIMATION
=========================== */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll(
  '.concept__card, .feature-card, .pricing__card, .gallery__item, .sim__form, .sim__result'
).forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// Add reveal CSS dynamically
const revealStyle = document.createElement('style');
revealStyle.textContent = `
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
  .reveal.revealed { opacity: 1; transform: translateY(0); }
`;
document.head.appendChild(revealStyle);

/* ===========================
   SIMULATOR
=========================== */

// --- Pricing config ---
const RATES = {
  work: 500,   // ¥/hour
  gym: 400,    // ¥/hour
  both: 800,   // ¥/hour (bundled)
};

const OPTION_PRICES = {
  booth: 300,       // flat add-on
  locker: 200,
  cafe: 500,
  personal: 3000,
};

const OPTION_LABELS = {
  booth: '個室ブース',
  locker: 'ロッカー',
  cafe: 'カフェ1ドリンク',
  personal: 'パーソナルトレーニング（1回）',
};

// --- Schedule templates ---
function buildSchedule(hours, area, options) {
  const schedule = [];
  let cursor = 9; // start at 9:00

  const fmt = (h) => {
    const hh = Math.floor(h);
    const mm = (h % 1) * 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  };

  if (area === 'work' || area === 'both') {
    const workHours = area === 'both' ? Math.ceil(hours * 0.65) : hours;
    schedule.push({ time: fmt(cursor), label: '☕ カフェでコーヒーを受け取り、作業開始' });
    cursor += 1;

    if (options.includes('booth')) {
      schedule.push({ time: fmt(cursor), label: '🔇 個室ブースに移動、集中モードへ' });
    } else {
      schedule.push({ time: fmt(cursor), label: '💻 フリーデスクで作業継続' });
    }
    cursor += workHours - 1;
  }

  if (area === 'gym' || area === 'both') {
    const gymHours = area === 'both' ? Math.floor(hours * 0.35) : hours;
    schedule.push({ time: fmt(cursor), label: '🏋️ ジムエリアへ移動、ウォームアップ' });
    cursor += 0.5;

    if (options.includes('personal')) {
      schedule.push({ time: fmt(cursor), label: '🧑‍🏫 パーソナルトレーニング開始' });
      cursor += 1;
    } else {
      schedule.push({ time: fmt(cursor), label: '💪 マシントレーニング' });
      cursor += gymHours - 0.5;
    }

    if (options.includes('locker')) {
      schedule.push({ time: fmt(cursor), label: '🚿 シャワー＆ロッカーでリフレッシュ' });
      cursor += 0.5;
    }
  }

  if (area === 'both') {
    schedule.push({ time: fmt(cursor), label: '✅ 作業再開 — 運動後の集中力でラストスパート' });
  }

  schedule.push({ time: fmt(cursor + 0.5), label: '🚪 退館' });
  return schedule;
}

// --- State ---
const state = {
  hours: null,
  area: null,
  options: [],
};

// --- Single-select groups ---
function setupSingleSelect(groupId, stateKey) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.sim__opt').forEach(btn => {
    btn.addEventListener('click', () => {
      group.querySelectorAll('.sim__opt').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state[stateKey] = btn.dataset.value;
    });
  });
}

// --- Multi-select group ---
function setupMultiSelect(groupId) {
  const group = document.getElementById(groupId);
  group.querySelectorAll('.sim__opt').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('selected');
      const val = btn.dataset.value;
      if (btn.classList.contains('selected')) {
        if (!state.options.includes(val)) state.options.push(val);
      } else {
        state.options = state.options.filter(v => v !== val);
      }
    });
  });
}

setupSingleSelect('sim-hours', 'hours');
setupSingleSelect('sim-area', 'area');
setupMultiSelect('sim-options');

// --- Calculate ---
function calculate() {
  const { hours, area, options } = state;
  const h = parseInt(hours, 10);
  const baseRate = RATES[area];
  let total = baseRate * h;

  const breakdown = [{ label: `${area === 'work' ? 'Work Pass' : area === 'gym' ? 'Gym Pass' : 'Focus & Flex Pass'} × ${h}h`, price: baseRate * h }];

  options.forEach(opt => {
    const price = OPTION_PRICES[opt];
    total += price;
    breakdown.push({ label: OPTION_LABELS[opt], price });
  });

  return { total, breakdown, schedule: buildSchedule(h, area, options) };
}

// --- Render result ---
function renderResult({ total, breakdown, schedule }) {
  const planNames = {
    work: 'Work Pass — 集中特化プラン',
    gym: 'Gym Pass — トレーニング特化プラン',
    both: 'Focus & Flex Pass — ハイブリッドプラン',
  };

  const scheduleHTML = schedule.map(s => `
    <li>
      <span class="time">${s.time}</span>
      <span>${s.label}</span>
    </li>
  `).join('');

  const breakdownHTML = breakdown.map(b => `
    <li>
      <span>${b.label}</span>
      <span>¥${b.price.toLocaleString()}</span>
    </li>
  `).join('');

  return `
    <div class="sim__output">
      <div class="sim__output-price">
        <div class="price-label">合計料金（目安）</div>
        <div class="price-value">¥${total.toLocaleString()}<small> / 今回</small></div>
      </div>
      <div class="sim__output-plan">
        <h4>おすすめプラン</h4>
        <div class="plan-name">${planNames[state.area]}</div>
      </div>
      <div class="sim__output-plan">
        <h4>おすすめの過ごし方</h4>
        <ul class="sim__output-schedule">${scheduleHTML}</ul>
      </div>
      <div class="sim__output-breakdown">
        <h4 style="font-family:var(--font-en);font-size:0.75rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--clr-muted);margin-bottom:8px;">料金内訳</h4>
        <ul>${breakdownHTML}</ul>
      </div>
    </div>
  `;
}

// --- Submit ---
document.getElementById('sim-submit').addEventListener('click', () => {
  const { hours, area } = state;

  if (!hours || !area) {
    // Shake animation for missing fields
    const form = document.querySelector('.sim__form');
    form.style.animation = 'shake 0.4s ease';
    setTimeout(() => { form.style.animation = ''; }, 400);

    // Highlight missing
    if (!hours) document.getElementById('sim-hours').style.outline = '1px solid var(--clr-gym)';
    if (!area) document.getElementById('sim-area').style.outline = '1px solid var(--clr-gym)';

    setTimeout(() => {
      document.getElementById('sim-hours').style.outline = '';
      document.getElementById('sim-area').style.outline = '';
    }, 1500);
    return;
  }

  const result = calculate();
  const resultEl = document.getElementById('sim-result');
  resultEl.querySelector('.sim__result-inner').innerHTML = renderResult(result);
});

// Shake keyframe
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-8px); }
    40% { transform: translateX(8px); }
    60% { transform: translateX(-6px); }
    80% { transform: translateX(6px); }
  }
`;
document.head.appendChild(shakeStyle);

/* ===========================
   MAIL MODAL
=========================== */
const TO = 'info@focusandflex.jp';

const gmailModal    = document.getElementById('gmail-modal');
const gmailClose    = document.getElementById('gmail-close');
const gmailClose2   = document.getElementById('gmail-close-2');
const gmailBackdrop = document.getElementById('gmail-backdrop');
const mailSend      = document.getElementById('mail-send');

function openGmailModal() {
  gmailModal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeGmailModal() {
  gmailModal.classList.remove('open');
  document.body.style.overflow = '';
}

document.querySelectorAll('.js-gmail-modal').forEach(btn => {
  btn.addEventListener('click', openGmailModal);
});

[gmailClose, gmailClose2, gmailBackdrop].forEach(el => {
  el.addEventListener('click', closeGmailModal);
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && gmailModal.classList.contains('open')) closeGmailModal();
});

// mailto: で既定のメーラーを起動
mailSend.addEventListener('click', () => {
  const subject = encodeURIComponent(document.getElementById('mail-subject').value);
  const body    = encodeURIComponent(document.getElementById('mail-body').value);
  window.location.href = `mailto:${TO}?subject=${subject}&body=${body}`;
});

/* ===========================
   LEAFLET MAP（現在地）
=========================== */
(function initMap() {
  // 施設固定座標（千葉県千葉市中央区要町14-15）
  const LAT  = 35.614622;
  const LNG  = 140.122843;
  const DEFAULT_ZOOM = 17;

  const map = L.map('leaflet-map', { zoomControl: true, scrollWheelZoom: false });

  // タイルプロバイダーを順番に試してフォールバック
  const tileProviders = [
    {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19 },
    },
    {
      url: 'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
      options: { attribution: '&copy; OpenStreetMap DE', maxZoom: 18 },
    },
    {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      options: { attribution: '&copy; <a href="https://carto.com/">CARTO</a>', maxZoom: 19, subdomains: 'abcd' },
    },
  ];

  function addTileLayer(index) {
    if (index >= tileProviders.length) return;
    const { url, options } = tileProviders[index];
    const layer = L.tileLayer(url, options).addTo(map);
    // タイル読み込みエラーが続いたら次のプロバイダーへ
    let errorCount = 0;
    layer.on('tileerror', () => {
      errorCount++;
      if (errorCount === 3) {
        map.removeLayer(layer);
        addTileLayer(index + 1);
      }
    });
  }

  addTileLayer(0);

  // 施設マーカー用アイコン
  const facilityIcon = L.divIcon({
    className: '',
    html: `<div style="
      background: linear-gradient(135deg,#1a6bff,#ff6b1a);
      width:36px; height:36px; border-radius:50% 50% 50% 0;
      transform:rotate(-45deg); border:3px solid #fff;
      box-shadow:0 4px 12px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38],
  });


  // 施設マーカーを固定座標に表示
  map.setView([LAT, LNG], DEFAULT_ZOOM);

  L.marker([LAT, LNG], { icon: facilityIcon })
    .addTo(map)
    .bindPopup('<strong>Focus &amp; Flex</strong><br>〒260-0017 千葉市中央区要町14-15<br>DXビジョンセンタービル')
    .openPopup();
})();

/* ===========================
   BACK TO TOP
=========================== */
const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 400);
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
