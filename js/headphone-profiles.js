// =========================================================================
// 🎧 PARALLEL // Headphone DSP Profiles & Hardware Acoustic Calibration
// Synchronized with headphone_profiles.json
// =========================================================================

const HEADPHONE_PROFILES = {
  FLAT: {
    badge: 'FLAT',
    name: 'Flat / Monitor',
    desc: '原音直通無渲染',
    low:  { freq: 100, gain: 0 },
    mid:  { freq: 2500, Q: 1.0, gain: 0 },
    high: { freq: 10000, gain: 0 }
  },
  AIRPODS_PRO: {
    badge: 'PRO 3D',
    name: 'AirPods Pro (1/2)',
    desc: '入耳密閉消除耳壓 + Air Band 通透空氣感 + 收斂悶音',
    low:  { freq: 150, gain: -1.2 },
    mid:  { freq: 2400, Q: 0.9, gain: 1.2 },
    high: { freq: 9000, gain: 3.2 }
  },
  AIRPODS_MAX: {
    badge: 'MAX',
    name: 'AirPods Max',
    desc: '60Hz 極低頻收束 + 2.8kHz 人聲微調 + 10kHz 空間開揚',
    low:  { freq: 60, gain: -1.0 },
    mid:  { freq: 2800, Q: 1.0, gain: 1.0 },
    high: { freq: 10000, gain: 1.2 }
  },
  AIRPODS_OPEN: {
    badge: 'AIRPODS',
    name: 'AirPods (1/2/3)',
    desc: '半入耳漏音補償：+4.5dB 澎湃低頻底層 + 撫平塑膠共振齒音',
    low:  { freq: 110, gain: 4.5 },
    mid:  { freq: 3200, Q: 1.2, gain: -1.8 },
    high: { freq: 8500, gain: 1.0 }
  },
  SOUNDCORE: {
    badge: 'SPACE ONE',
    name: 'Soundcore Space One',
    desc: '撫平 6.8kHz 金屬尖刺峰值 + 收束肥厚低頻 + 拓寬超高頻',
    low:  { freq: 120, gain: -1.5 },
    mid:  { freq: 6800, Q: 1.6, gain: -3.0 },
    high: { freq: 11000, gain: 2.2 }
  },
  SONY_1000X: {
    badge: 'PURIST // SONY',
    name: 'Sony WH/WF-1000X (極簡減法/消腫)',
    desc: '消解 220Hz 肥厚箱音泥濘 + 極簡微渲染，避免與 V1/QN1 晶片 DSP 撞車',
    low:  { freq: 220, gain: -2.0 },
    mid:  { freq: 3200, Q: 0.8, gain: 0.8 },
    high: { freq: 10000, gain: 0.0 }
  },
  BOSE_QC: {
    badge: 'BOSE QC',
    name: 'Bose QuietComfort',
    desc: '增強中頻人聲微動態與自然空間深度',
    low:  { freq: 140, gain: 0.5 },
    mid:  { freq: 3000, Q: 1.0, gain: 1.5 },
    high: { freq: 9500, gain: 2.0 }
  },
  SENNHEISER_M4: {
    badge: 'MOMENTUM',
    name: 'Sennheiser Momentum 4',
    desc: '減去箱音泥濘 (-2.5dB @ 240Hz) + 清透人聲微動態',
    low:  { freq: 80, gain: -1.5 },
    mid:  { freq: 240, Q: 0.9, gain: -2.5 },
    high: { freq: 10000, gain: 2.0 }
  },
  BW_PX: {
    badge: 'PX SERIES',
    name: 'B&W Px7 / Px8',
    desc: '650Hz 補足人聲厚度 (+1.5dB) + 6.5kHz 核心去齒音 (-2.0dB)',
    low:  { freq: 650, gain: 1.5 },
    mid:  { freq: 6500, Q: 1.2, gain: -2.0 },
    high: { freq: 12000, gain: -1.0 }
  },
  FOCAL_BATHYS: {
    badge: 'BATHYS',
    name: 'Focal Bathys / Audiophile',
    desc: '專為 M-Dome 鋁鎂振膜優化，提升 12kHz 超高頻空氣感與微動態',
    low:  { freq: 90, gain: 0.8 },
    mid:  { freq: 3000, Q: 1.0, gain: 0.6 },
    high: { freq: 12000, gain: 1.8 }
  }
};

function detectHeadphoneProfile(deviceName) {
  if (!deviceName) return 'FLAT';
  const name = deviceName.toLowerCase();
  if (name.includes('max') && (name.includes('airpod') || name.includes('air pod'))) return 'AIRPODS_MAX';
  if (name.includes('pro') && (name.includes('airpod') || name.includes('air pod'))) return 'AIRPODS_PRO';
  if (name.includes('airpod') || name.includes('air pod')) return 'AIRPODS_OPEN';
  if (name.includes('wh-1000') || name.includes('wf-1000') || name.includes('1000x') || name.includes('linkbuds')) return 'SONY_1000X';
  if (name.includes('quietcomfort') || name.includes('qc35') || name.includes('qc45') || name.includes('nc700') || (name.includes('bose') && name.includes('ultra'))) return 'BOSE_QC';
  if (name.includes('space one') || name.includes('space q') || name.includes('soundcore') || name.includes('life q')) return 'SOUNDCORE';
  if (name.includes('momentum') || name.includes('accentum') || (name.includes('sennheiser') && (name.includes('m4') || name.includes('tw')))) return 'SENNHEISER_M4';
  if (name.includes('px7') || name.includes('px8') || name.includes('bowers') || (name.includes('b&w') && name.includes('px'))) return 'BW_PX';
  if (name.includes('bathys') || (name.includes('focal') && name.includes('wireless'))) return 'FOCAL_BATHYS';
  return 'FLAT';
}
