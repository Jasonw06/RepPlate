/* RepPlate — free workout guide + calorie counter. Everything is stored on this device (localStorage).
   Exercise pictures: free-exercise-db (public domain). Food data: Open Food Facts (ODbL). */
'use strict';
(() => {

/* ============================== constants ============================== */
const STORE_KEY = 'repplate:v1';
const EX_SHA = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const IMG_A = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${EX_SHA}/exercises/`;
const IMG_B = `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@${EX_SHA}/exercises/`;
const OFF_FIELDS = 'code,product_name,product_name_en,generic_name,brands,quantity,serving_size,serving_quantity,product_quantity,nutriments,image_front_small_url,image_front_thumb_url,nutriscore_grade,allergens_tags,traces_tags,ingredients_analysis_tags,ingredients_text,ingredients_text_en,labels_tags';
const MEALS = [['breakfast', 'Breakfast'], ['lunch', 'Lunch'], ['dinner', 'Dinner'], ['snacks', 'Snacks']];
const MEAL_NAME = Object.fromEntries(MEALS);
const REGIONS = [['world', 'Anywhere'], ['au', 'Australia'], ['ca', 'Canada'], ['fr', 'France'], ['de', 'Germany'], ['in', 'India'], ['ie', 'Ireland'], ['it', 'Italy'], ['ke', 'Kenya'], ['nl', 'Netherlands'], ['nz', 'New Zealand'], ['ng', 'Nigeria'], ['za', 'South Africa'], ['es', 'Spain'], ['uk', 'United Kingdom'], ['us', 'United States']];
const REST_OPTIONS = [0, 30, 45, 60, 90, 120, 180];
const KJ = 4.184, LB = 2.20462;

// [exercise id, sets, reps, seconds]
const STARTERS = [
  { id: 's-home', name: 'Home Full Body', note: 'No equipment', rest: 45, items: [['Bodyweight_Squat', 3, 15], ['Pushups', 3, 10], ['Bodyweight_Walking_Lunge', 3, 10], ['Butt_Lift_Bridge', 3, 15], ['Superman', 3, 12], ['Plank', 3, 0, 30], ['Mountain_Climbers', 3, 0, 30]] },
  { id: 's-core', name: 'Core Basics', note: 'No equipment', rest: 30, items: [['Crunches', 3, 15], ['Cross-Body_Crunch', 3, 12], ['Flat_Bench_Lying_Leg_Raise', 3, 12], ['Russian_Twist', 3, 20], ['Plank', 3, 0, 40], ['Side_Bridge', 2, 0, 30]] },
  { id: 's-db', name: 'Dumbbell Full Body', note: 'A pair of dumbbells', rest: 60, items: [['Goblet_Squat', 3, 12], ['Dumbbell_Bench_Press', 3, 10], ['Bent_Over_Two-Dumbbell_Row', 3, 10], ['Dumbbell_Shoulder_Press', 3, 10], ['Dumbbell_Lunges', 3, 10], ['Dumbbell_Bicep_Curl', 3, 12], ['Dumbbell_One-Arm_Triceps_Extension', 3, 12]] },
  { id: 's-push', name: 'Gym Push', note: 'Chest, shoulders, triceps', rest: 90, items: [['Barbell_Bench_Press_-_Medium_Grip', 4, 8], ['Incline_Dumbbell_Press', 3, 10], ['Standing_Military_Press', 3, 8], ['Side_Lateral_Raise', 3, 12], ['Triceps_Pushdown', 3, 12], ['Dips_-_Triceps_Version', 3, 10]] },
  { id: 's-pull', name: 'Gym Pull', note: 'Back, biceps', rest: 90, items: [['Wide-Grip_Lat_Pulldown', 4, 10], ['Seated_Cable_Rows', 3, 10], ['Bent_Over_Two-Dumbbell_Row', 3, 10], ['Face_Pull', 3, 15], ['Barbell_Curl', 3, 10], ['Hammer_Curls', 3, 12]] },
  { id: 's-legs', name: 'Gym Legs', note: 'Quads, hamstrings, calves', rest: 90, items: [['Barbell_Squat', 4, 8], ['Romanian_Deadlift', 3, 10], ['Leg_Press', 3, 12], ['Lying_Leg_Curls', 3, 12], ['Leg_Extensions', 3, 12], ['Standing_Calf_Raises', 4, 15]] },
];
const exSplit = n => { const i = String(n).indexOf(' - '); return i > 0 ? [n.slice(0, i), n.slice(i + 3)] : [String(n), '']; };
const LOCAL_IMG = new Set(STARTERS.flatMap(r => r.items.map(i => i[0])));

/* ============================== icons ============================== */
const svg = (p, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const I = {
  tToday: svg('<path d="M11.3 2.6a1.1 1.1 0 0 1 1.4 0l8.6 7.2a1 1 0 0 1-1.3 1.5l-.5-.4V19a2.5 2.5 0 0 1-2.5 2.5h-2.5v-5.2a1.3 1.3 0 0 0-1.3-1.3h-2.4a1.3 1.3 0 0 0-1.3 1.3v5.2H7A2.5 2.5 0 0 1 4.5 19v-8.1l-.5.4a1 1 0 0 1-1.3-1.5Z"/>', 'fill'),
  tFood: svg('<path d="M4.5 2.5a1 1 0 0 1 1 1V8h1V3.5a1 1 0 0 1 2 0V8h1V3.5a1 1 0 0 1 2 0V9a3.5 3.5 0 0 1-3 3.4v8.1a1 1 0 0 1-2 0v-8.1A3.5 3.5 0 0 1 3.5 9V3.5a1 1 0 0 1 1-1ZM17.5 2.5c1.9 0 3 2.6 3 6.5 0 2.4-.9 3.6-2 4.1v7.4a1 1 0 0 1-2 0v-17a1 1 0 0 1 1-1Z"/>', 'fill'),
  tTrain: svg('<path d="M5 5.5a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-3 0V7A1.5 1.5 0 0 1 5 5.5Zm14 0A1.5 1.5 0 0 1 20.5 7v10a1.5 1.5 0 0 1-3 0V7A1.5 1.5 0 0 1 19 5.5ZM3.5 9.5v5h-.6a1.2 1.2 0 0 1-1.2-1.2v-2.6a1.2 1.2 0 0 1 1.2-1.2Zm17 0h.6a1.2 1.2 0 0 1 1.2 1.2v2.6a1.2 1.2 0 0 1-1.2 1.2h-.6ZM6.5 10.9h11v2.2h-11Z"/>', 'fill'),
  tMe: svg('<path d="M12 3a4.2 4.2 0 1 1 0 8.4A4.2 4.2 0 0 1 12 3Zm0 10.2c4.5 0 8 2.3 8 5.4V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1.4c0-3.1 3.5-5.4 8-5.4Z"/>', 'fill'),
  home: svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>'),
  apple: svg('<path d="M12 7.5c-1.2-1.8-3.3-2.6-5.2-1.8C3.9 7 3.8 11.6 5.6 15.2 6.8 17.6 8.7 20 10.2 20c.8 0 1.1-.5 1.8-.5s1 .5 1.8.5c1.5 0 3.4-2.4 4.6-4.8 1.8-3.6 1.7-8.2-1.2-9.5-1.9-.8-4 0-5.2 1.8z"/><path d="M12 7.5c0-2 1-3.6 3-4.5"/>'),
  scan: svg('<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M8 8.5v7M11 8.5v7M13.5 8.5v7M16 8.5v7"/>'),
  dumbbell: svg('<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>'),
  user: svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6"/>'),
  plus: svg('<path d="M12 5v14M5 12h14"/>'),
  minus: svg('<path d="M5 12h14"/>'),
  chevL: svg('<path d="M15 5l-7 7 7 7"/>'),
  chevR: svg('<path d="M9 5l7 7-7 7"/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>'),
  search: svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>'),
  play: svg('<path d="M7 4.5v15l13-7.5z"/>', 'fill'),
  pause: svg('<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>', 'fill'),
  check: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
  edit: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>'),
  clock: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  flash: svg('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
  keyboard: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M11 10h.01M15 10h.01M17 10h.01M7 14h10"/>'),
  image: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 8"/>'),
  up: svg('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: svg('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  video: svg('<rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10.5l5-3v9l-5-3"/>'),
  bolt: svg('<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>'),
  flame: svg('<path d="M12 2c.5 3.5-2.5 5.3-4.2 7.6A7 7 0 0 0 12 22a7 7 0 0 0 7-7c0-2.6-1.2-4.6-2.6-6-.3 1.6-1.2 2.7-2.4 3.2C14.6 8.6 13.8 4.6 12 2Z"/>', 'fill'),
  playF: svg('<path d="M8 5.5v13l10.5-6.5z"/>', 'fill'),
  pen: svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
  download: svg('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  upload: svg('<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>'),
  phone: svg('<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>'),
  chat: svg('<path d="M5 4.5h14a2 2 0 0 1 2 2V15a2 2 0 0 1-2 2h-7.5L7 20.5V17H5a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2z"/><path d="M8 9.5h8M8 12.5h5"/>'),
  alert: svg('<path d="M12 3.5L2.8 19.5h18.4z"/><path d="M12 10v4.5"/><circle cx="12" cy="17" r=".6"/>'),
  target: svg('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
  camera: svg('<path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.6"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>'),
  repeat: svg('<path d="M4 11V9a3 3 0 0 1 3-3h12M16 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H5M8 21l-3-3 3-3"/>'),
  bookmark: svg('<path d="M6 3.5h12v17l-6-4.2-6 4.2z"/>'),
  utensils: svg('<path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3M7 11v10"/><path d="M17.5 21V3c-2 1-3.5 3.5-3.5 7v3.5h3.5"/>'),
  shuffle: svg('<path d="M3 7h3.5c3.5 0 4.5 10 8 10H21M3 17h3.5c1.5 0 2.5-1.8 3.4-4M14.6 9C15.5 7.8 16.4 7 18 7h3"/><path d="M18 4l3 3-3 3M18 14l3 3-3 3"/>'),
  volOn: svg('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>'),
  volOff: svg('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
  chart: svg('<path d="M4 19.5h16"/><path d="M5 15.5l4.2-4.2 3.3 3.2L19 8"/><path d="M15 8h4v4"/>'),
  sliders: svg('<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'),
  sparkle: svg('<path d="M11 3.5l1.9 5.1 5.1 1.9-5.1 1.9L11 17.5l-1.9-5.1L4 10.5l5.1-1.9z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>'),
  shield: svg('<path d="M12 3l7.5 3v5.3c0 4.6-3.1 8.4-7.5 9.7-4.4-1.3-7.5-5.1-7.5-9.7V6z"/><path d="M8.8 12l2.2 2.2 4.2-4.4"/>'),
  leaf: svg('<path d="M5 19.5C5 11 10 5.5 19.5 4.5c0 9.5-5.5 15-14.5 15z"/><path d="M5 19.5l7.5-7.5"/>'),
};

/* ============================== helpers ============================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const parseNum = v => {
  if (v == null) return null;
  const s = String(v).trim().replace(/\s/g, '').replace(',', '.');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};
const NF0 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const NF1 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });
const n0 = n => NF0.format(Math.round(n || 0));
const n1 = n => (n == null || Number.isNaN(n)) ? '–' : (Math.abs(n) < 10 ? NF1.format(Math.round(n * 10) / 10) : NF0.format(Math.round(n)));
const trimNum = n => String(Math.round(n * 100) / 100);
const NF2 = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const wN = n => (n == null || Number.isNaN(n)) ? '–' : NF2.format(Math.round(n * 100) / 100);
const short = n => Math.abs(n) >= 1000 ? (Math.round(n / 100) / 10) + 'k' : String(Math.round(n));
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const dkey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
function dayLabel(k) {
  const t = dkey();
  if (k === t) return 'Today';
  if (k === addDays(t, -1)) return 'Yesterday';
  if (k === addDays(t, 1)) return 'Tomorrow';
  return fromKey(k).toLocaleDateString(undefined, { weekday: 'long' });
}
const longDate = k => fromKey(k).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long' });
function ago(ts) {
  const d = Math.round((fromKey(dkey()) - fromKey(dkey(new Date(ts)))) / 864e5);
  if (d <= 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
function clock(sec) {
  const s = Math.max(0, Math.round(sec)); const m = Math.floor(s / 60); const h = Math.floor(m / 60);
  return h ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`;
}
function mealNow() {
  const d = new Date(); const h = d.getHours() + d.getMinutes() / 60;
  return h < 10.5 ? 'breakfast' : h < 15 ? 'lunch' : h < 20.5 ? 'dinner' : 'snacks';
}

/* ============================== storage ============================== */
function starterRoutines() {
  return STARTERS.map(r => ({ id: r.id, name: r.name, note: r.note, starter: true, items: r.items.map(([ex, sets, reps, secs]) => ({ ex, sets, reps: reps || 0, secs: secs || 0, rest: r.rest })) }));
}
function defaults() {
  return {
    v: 1,
    settings: { kcal: 2000, protein: 130, carbs: 220, fat: 65, energy: 'kcal', weight: 'kg', rest: 60, region: 'world', theme: 'dark', themeV: 2, sound: true, goalsSet: false, installDismissed: false, profile: {}, guided: true, coach: true, tempo: 'normal', voiceURI: '', aiKey: '', aiModels: [], voiceBasic: false, waterGoal: 8, rate: null, summarySeen: '', quickKit: 'none', demoStyle: 'anim', diet: { avoid: [], style: 'all', other: '', asked: false } },
    log: {}, foods: {}, routines: starterRoutines(), workouts: [], lastWeights: {}, videos: {}, meals: [], weights: [], water: {}, schedule: {}, week: null, active: null,
  };
}
function migrate(s) {
  const d = defaults();
  if (!s || typeof s !== 'object') return d;
  const oldLook = !s.settings || s.settings.themeV !== 2;
  s.settings = Object.assign(d.settings, s.settings || {});
  for (const k of ['log', 'foods', 'lastWeights', 'videos']) if (!s[k] || typeof s[k] !== 'object') s[k] = d[k];
  if (!Array.isArray(s.routines)) s.routines = d.routines;
  if (!Array.isArray(s.workouts)) s.workouts = [];
  if (!Array.isArray(s.meals)) s.meals = [];
  if (!Array.isArray(s.weights)) s.weights = [];
  for (const k of ['water', 'schedule']) if (!s[k] || typeof s[k] !== 'object') s[k] = {};
  if (s.week === undefined) s.week = null;
  if (s.active === undefined) s.active = null;
  if (oldLook) { if (s.settings.theme === 'system') s.settings.theme = 'dark'; s.settings.themeV = 2; }
  s.v = 1;
  return s;
}
function load() {
  try { const raw = localStorage.getItem(STORE_KEY); if (raw) return migrate(JSON.parse(raw)); } catch (e) { /* fall through */ }
  return defaults();
}
let S = load();
let saveTimer = 0, persistAsked = false;
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 120); }
function saveNow() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); }
  catch (e) { toast('Couldn’t save. Your phone’s storage may be full.'); }
  if (!persistAsked && navigator.storage?.persist) { persistAsked = true; navigator.storage.persist().catch(() => {}); }
}
window.addEventListener('pagehide', saveNow);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveNow(); });

/* ============================== units ============================== */
const eUnit = () => S.settings.energy;
const toE = kcal => S.settings.energy === 'kJ' ? kcal * KJ : kcal;      // kcal -> display
const fromE = v => S.settings.energy === 'kJ' ? v / KJ : v;              // display -> kcal
const fmtE = kcal => n0(toE(kcal || 0));
const wUnit = () => S.settings.weight;
const toW = kg => S.settings.weight === 'lb' ? kg * LB : kg;
const fromW = v => S.settings.weight === 'lb' ? v / LB : v;
const wStep = () => S.settings.weight === 'lb' ? 5 : 2.5;
const roundW = v => Math.round(v * 2) / 2;

/* ============================== exercises ============================== */
// EX: every exercise we know (old ids keep working in routines and history). EXV: the ones listed in the library,
// all with a 3D animation. Animations: ExerciseDB free V1 dataset by AscendAPI (free for personal, non-commercial
// apps; credit required); e.a is the ExerciseDB animation id and the GIF loads from ExerciseDB's own servers.
let EX = [], EXV = [], EXMAP = new Map(), exError = false;
const ANIM_B = 'https://static.exercisedb.dev/media/';
const animFailed = new Set();
const exReady = fetch('data/exercises.json')
  .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
  .then(list => { EX = list; EXV = list.filter(e => !e.h); for (const e of list) EXMAP.set(e.i, e); })
  .catch(() => { exError = true; });
const hasMedia = e => !!(e && (e.g || e.a));
const animId = id => { const e = EXMAP.get(id); return e && e.a && !animFailed.has(e.a) ? e.a : ''; };
const animFor = id => { const a = animId(id); return a && (S.settings.demoStyle !== 'photo' || !EXMAP.get(id).g) ? a : ''; };
const exName = id => EXMAP.get(id)?.n || String(id).replace(/_/g, ' ');
const imgSrc = (id, k) => LOCAL_IMG.has(id) ? `img/ex/${encodeURIComponent(id)}/${k}.jpg` : `${IMG_A}${encodeURIComponent(id)}/${k}.jpg`;
function imgTag(id, k, cls) {
  const e = EXMAP.get(id), a = animId(id);
  if (a) return `<img class="${cls} anim-thumb" src="${ANIM_B}${a}.gif" data-anim="${a}" data-ex="${esc(id)}" data-k="${k}" data-cls="${esc(cls)}" alt="" loading="lazy" decoding="async">`;
  if (e && !e.g) return `<div class="${cls} noimg" aria-hidden="true">${I.dumbbell}</div>`;
  const remote = !LOCAL_IMG.has(id);
  return `<img class="${cls}" src="${imgSrc(id, k)}" ${remote ? `data-alt="${IMG_B}${encodeURIComponent(id)}/${k}.jpg" crossorigin="anonymous"` : ''} alt="" loading="lazy" decoding="async">`;
}
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
function demo(id, cls = '', driven = false) {
  const e = EXMAP.get(id), aid = animFor(id);
  const keep = `data-ex="${esc(id)}" data-cls="${esc(cls)}" data-driven="${driven ? 1 : ''}"`;
  const swap = to => e && e.g && animId(id) ? `<button type="button" class="demo-swap" data-demo-swap aria-label="Show ${to === 'photo' ? 'photos' : 'the 3D animation'} instead">${to === 'photo' ? `${I.image} Photos` : `${I.playF} 3D`}</button>` : '';
  if (aid) return `<div class="demo anim ${cls}" ${keep}>
    <img class="anim-gif" src="${ANIM_B}${aid}.gif" data-anim="${aid}" alt="${esc(exName(id))}: animated demonstration" decoding="async">
    ${swap('photo')}</div>`;
  if (e && !e.g) return `<div class="demo noimg ${cls}" ${keep}>${I.dumbbell}<span>No pictures for this one yet</span>${swap('anim')}</div>`;
  const remote = !LOCAL_IMG.has(id);
  const attrs = k => `src="${imgSrc(id, k)}" ${remote ? `data-alt="${IMG_B}${encodeURIComponent(id)}/${k}.jpg" crossorigin="anonymous"` : ''}`;
  return `<div class="demo ${cls} ${driven ? 'driven' : reduceMotion ? 'paused' : ''}" data-demo ${keep}>
    <img class="f0" ${attrs(0)} alt="${esc(exName(id))}: start position">
    <img class="f1" ${attrs(1)} alt="${esc(exName(id))}: finish position">
    <span class="demo-tag">Start</span>
    ${driven ? '' : `<button type="button" class="demo-btn" data-demo-toggle aria-label="${reduceMotion ? 'Play' : 'Pause'} demonstration">${reduceMotion ? I.play : I.pause}</button>`}
    ${swap('anim')}
  </div>`;
}
const redrawDemo = d => { if (d && d.dataset.ex) d.outerHTML = demo(d.dataset.ex, d.dataset.cls || '', d.dataset.driven === '1'); };
// an animation that can't load (offline and not saved yet, or missing) quietly falls back to the photos
document.addEventListener('error', ev => {
  const img = ev.target; if (!(img instanceof HTMLImageElement) || !img.dataset.anim) return;
  animFailed.add(img.dataset.anim);
  if (img.classList.contains('anim-thumb')) { img.outerHTML = imgTag(img.dataset.ex, +img.dataset.k || 0, img.dataset.cls || 'thumb'); return; }
  redrawDemo(img.closest('.demo'));
}, true);
setInterval(() => {
  for (const d of $$('.demo[data-demo]:not(.paused):not(.driven)')) {
    d.classList.toggle('alt');
    const t = d.querySelector('.demo-tag'); if (t) t.textContent = d.classList.contains('alt') ? 'Finish' : 'Start';
  }
}, 1100);
// fall back to the second image host if the first fails
document.addEventListener('error', e => {
  const t = e.target;
  if (t && t.tagName === 'IMG' && t.dataset.alt && !t.dataset.tried) { t.dataset.tried = '1'; t.src = t.dataset.alt; }
}, true);

function routineMuscles(r) {
  const c = {};
  for (const it of r.items) for (const m of (EXMAP.get(it.ex)?.m || [])) c[m] = (c[m] || 0) + it.sets;
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(x => x[0]);
}
function routineMinutes(r) {
  let s = 0;
  for (const it of r.items) s += it.sets * ((it.secs || it.reps * 3) + 15 + (it.rest || 0));
  return Math.max(5, Math.round(s / 60 / 5) * 5);
}
const lastDone = rid => S.workouts.find(w => w.rid === rid);

/* ============================== audio, wake lock ============================== */
let AC = null;
function audio() {
  try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; }
  return AC;
}
function beep(freq = 880, dur = 0.12, vol = 0.22) {
  if (!S.settings.sound) return;
  const ac = audio(); if (!ac) return;
  try {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + dur + 0.03);
  } catch (e) { /* ignore */ }
}
const buzz = p => { try { navigator.vibrate?.(p); } catch (e) { /* ignore */ } };
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && document.visibilityState === 'visible') wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { /* not available */ }
}

/* ============================== voice coach (the phone's built-in speech) ============================== */
const voice = { ok: 'speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function', v: null, list: [] };
function pickVoice() {
  if (!voice.ok) return;
  let vs = []; try { vs = speechSynthesis.getVoices() || []; } catch (e) { /* ignore */ }
  voice.list = vs;
  const want = S.settings.voiceURI, lang = (navigator.language || 'en').toLowerCase();
  voice.v = vs.find(v => v.voiceURI === want)
    || vs.find(v => v.lang.toLowerCase() === lang && v.localService) || vs.find(v => v.lang.toLowerCase() === lang)
    || vs.find(v => /^en[-_]/i.test(v.lang) && v.localService) || vs.find(v => /^en/i.test(v.lang)) || null;
}
if (voice.ok) {
  pickVoice();
  try { speechSynthesis.addEventListener('voiceschanged', () => { pickVoice(); if (/^me/.test(currentRoute) && !layers.length) rerender(); }); }
  catch (e) { speechSynthesis.onvoiceschanged = pickVoice; }
}
const coachOn = () => voice.ok && !!S.settings.coach;
// Speaks straight away, inside the tap that caused it (phones only allow speech that starts from a tap).
// If the chosen voice fails, it tries once more with the phone's default voice.
function speakNow(text, { interrupt = true, onResult } = {}) {
  let done = false;
  const report = (ok, why) => { if (done) return; done = true; if (onResult) onResult(ok, why); };
  if (!voice.ok || !text) { report(false, 'unsupported'); return; }
  try {
    let started = false, retried = false;
    const go = useVoice => {
      const u = new SpeechSynthesisUtterance(text);
      try {
        if (useVoice && voice.v) { u.voice = voice.v; u.lang = voice.v.lang; }
        else if (voice.v) u.lang = voice.v.lang;
      } catch (e) { voice.skipChosen = true; retried = true; }
      u.rate = 1.05; u.volume = 1;
      u.onstart = () => { started = true; report(true); };
      u.onerror = e => {
        const err = e && e.error;
        if (err === 'interrupted' || err === 'canceled') return;
        if (!retried && useVoice && voice.v) { retried = true; voice.skipChosen = true; go(false); return; }
        report(false, err || 'error');
      };
      speechSynthesis.speak(u);
    };
    if (speechSynthesis.paused) speechSynthesis.resume();
    if (interrupt && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
    go(!voice.skipChosen);
    if (onResult) setTimeout(() => { if (!started) report(false, 'timeout'); }, 3000);
  } catch (e) { report(false, 'error'); }
}
function say(text, interrupt = true) { if (coachOn()) speakNow(text, { interrupt }); }
function hush() { try { if (voice.ok) speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
function unlockSpeech() { try { if (voice.ok && speechSynthesis.paused) speechSynthesis.resume(); } catch (e) { /* ignore */ } }
function voiceHelp(why) {
  const box = $('#voice-help'); if (!box) { toast('The voice didn’t play. Check your volume and try again.'); return; }
  const android = /Android/i.test(navigator.userAgent), ios = isIOS();
  let tip;
  if (why === 'unsupported') tip = 'This browser can’t speak, so workouts will use beeps instead. Chrome on Android and Safari on iPhone both support the voice.';
  else if (!voice.list.length && android) tip = 'Your phone doesn’t have a text-to-speech voice set up. Open Settings, search for “Text-to-speech”, choose Speech Services by Google, download the English voice, then try again.';
  else if (ios) tip = 'Turn up the volume and switch off Silent mode, then tap the button again. If it’s still quiet, check Settings → Accessibility → Spoken Content → Voices and make sure an English voice is downloaded.';
  else if (android) tip = 'Turn up the media volume and tap the button again. If it’s still quiet, open Settings, search for “Text-to-speech”, and make sure Speech Services by Google has an English voice downloaded.';
  else tip = 'Turn up your volume and check the right speakers or headphones are selected, then tap the button again.';
  box.innerHTML = `<div class="notice">${I.volOff}<div><strong>The voice didn’t play</strong><p>${esc(tip)}</p></div></div>`;
}

/* ============================== YouTube videos (optional, per exercise) ============================== */
function parseYT(input) {
  const s = String(input || '').trim();
  let id = null;
  const m = s.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/i);
  if (m) id = m[1]; else if (/^[A-Za-z0-9_-]{11}$/.test(s)) id = s;
  if (!id) return null;
  let start = 0;
  const t = s.match(/[?&#](?:t|start)=([0-9hms]+)/i);
  if (t) {
    const v = t[1];
    if (/^\d+$/.test(v)) start = +v;
    else { const h = /(\d+)h/.exec(v), mm = /(\d+)m/.exec(v), ss = /(\d+)s/.exec(v); start = (h ? +h[1] * 3600 : 0) + (mm ? +mm[1] * 60 : 0) + (ss ? +ss[1] : 0); }
  }
  return { id, start };
}
const ytSrc = (v, controls) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.id)}?autoplay=1&mute=1&loop=1&playlist=${encodeURIComponent(v.id)}&playsinline=1&rel=0&modestbranding=1&controls=${controls ? 1 : 0}${v.start ? `&start=${v.start}` : ''}`;
function videoBox(v, title, controls) {
  return `<div class="yt"><iframe src="${ytSrc(v, controls)}" title="${esc(title)} video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>`;
}

/* ============================== toast ============================== */
let toastTimer = 0;
function toast(msg, action) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  if (action) t.querySelector('button').onclick = () => { t.classList.remove('show'); action.fn(); };
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), action ? 5000 : 2600);
}

/* ============================== layers (sheets & overlays) ============================== */
const layers = [];
let afterUnwind = null;
function mountLayer(el) {
  $('#layers').append(el);
  document.body.classList.add('locked');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('open')));
  setTimeout(() => { const f = el.querySelector('[autofocus]'); if (f) f.focus(); }, 280);
}
function pushLayer(el, opts = {}) {
  layers.push({ el, ...opts });
  history.pushState({ layer: layers.length }, '');
  mountLayer(el);
  return el;
}
function replaceLayer(el, opts = {}) {
  if (!layers.length) return pushLayer(el, opts);
  const top = layers.pop();
  destroyLayer(top);
  layers.push({ el, ...opts });
  mountLayer(el);
  return el;
}
function destroyLayer(l) {
  try { l.onClose && l.onClose(); } catch (e) { /* ignore */ }
  l.el.classList.remove('open');
  setTimeout(() => l.el.remove(), 260);
}
function popLayer() { if (layers.length) history.back(); }
function closeAll(then) {
  if (!layers.length) { then && then(); return; }
  for (const l of layers) l.guard = null;
  afterUnwind = then || null;
  history.go(-layers.length);
}
let handledLayerPop = false;
window.addEventListener('popstate', () => {
  const depth = history.state?.layer || 0;
  handledLayerPop = layers.length > depth;
  if (layers.length > depth) {
    const top = layers[layers.length - 1];
    if (top.guard && layers.length === depth + 1 && !top.guard()) { history.pushState({ layer: layers.length }, ''); return; }
    while (layers.length > depth) destroyLayer(layers.pop());
  }
  if (!layers.length) {
    document.body.classList.remove('locked');
    if (afterUnwind) { const f = afterUnwind; afterUnwind = null; f(); }
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && layers.length) popLayer(); });
if (history.state?.layer) history.replaceState(null, '');

function sheetEl(inner, cls = '') {
  const el = document.createElement('div');
  el.className = `layer ${cls}`;
  el.innerHTML = `<div class="backdrop" data-close></div><div class="sheet" role="dialog" aria-modal="true">${inner}</div>`;
  el.addEventListener('click', e => {
    const g = e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); closeAll(() => { location.hash = g.dataset.goto; }); return; }
    if (e.target.closest('[data-close]')) popLayer();
  });
  return el;
}
function overlayEl(inner, cls = '') {
  const el = document.createElement('div');
  el.className = 'layer';
  el.innerHTML = `<div class="overlay ${cls}" role="dialog" aria-modal="true">${inner}</div>`;
  return el;
}
const sheetHead = (title, sub = '') => `<div class="sheet-head"><div><h2>${esc(title)}</h2>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</div><button type="button" class="icon-btn" data-close aria-label="Close">${I.close}</button></div>`;

/* ============================== router ============================== */
let currentRoute = '', navBack = false;
const scrollMem = {};
let foodDate = dkey();
let pickMode = false;
let draft = null;
const lib = { q: '', muscle: '', equip: '', limit: 40 };

window.addEventListener('popstate', () => { if (!handledLayerPop) navBack = true; handledLayerPop = false; });
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.addEventListener('hashchange', () => route());

/* ---------- app history: the back arrow goes to the page you came from, and tab switches don't pile up ---------- */
let NAV = [], navN = 0, navReplacing = false, pendingNav = null;
try { NAV = JSON.parse(sessionStorage.getItem('rp-nav') || '[]'); if (!Array.isArray(NAV)) NAV = []; } catch (e) { NAV = []; }
const navHash = () => '#/' + (location.hash.replace(/^#\/?/, '').split('#')[0] || 'today');
const navPage = h => (String(h || '').replace(/^#\/?/, '').split('#')[0] || 'today').replace(/^plan(\/.*)?$/, 'plan');
function trackNav() {
  const st = history.state || {}, h = navHash();
  if (st.n) navN = st.n;                                   // went back/forward, or reloaded
  else {
    if (!navN) { navN = 1; NAV = []; }                     // first page this visit
    else if (!navReplacing) { navN += 1; NAV.length = navN - 1; }   // a link opened a new page
    history.replaceState({ ...st, n: navN }, '');
  }
  navReplacing = false;
  NAV[navN - 1] = h;
  try { sessionStorage.setItem('rp-nav', JSON.stringify(NAV)); } catch (e) { /* private browsing */ }
}
function navReplace(hash) { navReplacing = true; location.replace(hash); }
// Go back to a page already in this visit's history (e.g. from the routine editor back to the routine), or swap to it.
function navUpTo(hash) {
  for (let k = navN - 1; k >= 1; k--) if (NAV[k - 1] === hash) { history.go(k - navN); return; }
  navReplace(hash);
}
// Back to the last page that isn't this one (tabs of the same page, like Meal ideas / This week / Shopping list, count as one).
function goBack(fallback) {
  const cur = navPage(NAV[navN - 1] || navHash());
  let k = navN - 1;
  while (k >= 1 && navPage(NAV[k - 1]) === cur) k--;
  if (k >= 1 && NAV[k - 1]) history.go(k - navN);
  else navReplace(fallback || '#/today');
}
// Bottom tabs work like a phone app: history is at most Today → tab, so back goes to Today and then out of the app.
function goTab(t) {
  const target = '#/' + t;
  if (navPage(navHash()) === t) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const homeFirst = navPage(NAV[0]) === 'today';
  if (t === 'today') { if (homeFirst && navN > 1) history.go(1 - navN); else navReplace(target); return; }
  if (homeFirst && navN > 2) { pendingNav = target; history.go(2 - navN); }
  else if (homeFirst && navN === 2) navReplace(target);
  else if (homeFirst) location.hash = target;
  else { history.replaceState({ ...(history.state || {}), n: 1 }, '', '#/today'); NAV = ['#/today']; navN = 1; location.hash = target; }
}
window.addEventListener('popstate', () => {
  if (!pendingNav || layers.length) return;
  const t = pendingNav; pendingNav = null;
  if (history.state?.n) navN = history.state.n;
  navReplace(t);
});

async function route(opts = {}) {
  const prevN = navN;
  trackNav();
  const wentBack = navN < prevN;                           // back button, swipe back, or Android back
  try { syncProgram(); } catch (e) { /* program data damaged: ignore */ }
  await exReady;
  const [path, anchor] = location.hash.replace(/^#\/?/, '').split('#');
  const h = path || 'today';
  if (currentRoute) scrollMem[currentRoute] = window.scrollY;
  const [name, ...rest] = h.split('/');
  const arg = decodeURIComponent(rest.join('/'));
  if (name === 'scan' || name === 'snap' || name === 'say') {
    history.replaceState({ n: navN }, '', '#/today'); NAV[navN - 1] = '#/today'; currentRoute = 'today'; render('today');
    const ctx = { date: dkey(), meal: mealNow() };
    if (name === 'scan') openScanner(ctx); else if (name === 'snap') openSnap(ctx); else { loadFoodDb().catch(() => {}); openSay(ctx); }
    return;
  }
  if (!['exercises', 'ex', 'edit'].includes(name)) pickMode = false;
  if (name === 'plan') { try { await loadFoodDb(); } catch (e) { /* shown in view */ } }
  // iOS-style page slide: going deeper pushes in from the right, going back slides it away; tab switches are instant
  const fromName = (currentRoute || '').split('/')[0], ROOTS = ['today', 'food', 'train', 'me'];
  const sameArea = fromName === name || [fromName, name].every(x => x === 'train' || x === 'exercises');
  let vt = null;
  if (!opts.keepScroll && currentRoute && currentRoute !== h && !sameArea) {
    if (wentBack) vt = ROOTS.includes(name) && ROOTS.includes(fromName) ? null : 'pop';
    else if (!ROOTS.includes(name)) vt = 'push';
  }
  const y = opts.keepScroll ? (scrollMem[h] ?? window.scrollY) : navBack ? (scrollMem[h] || 0) : 0;
  currentRoute = h;
  navBack = false;
  const apply = () => {
    render(name, arg);
    window.scrollTo(0, y);
    if (anchor) { const t = document.getElementById(anchor); if (t) t.scrollIntoView(); }
    syncNavbar();
  };
  if (vt && document.startViewTransition && !navigator.webdriver && !layers.length && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.dataset.vt = vt;
    try { const t = document.startViewTransition(apply); t.ready.catch(() => {}); t.finished.catch(() => {}).finally(() => { delete document.documentElement.dataset.vt; }); }   // a skipped transition (fast taps) is fine
    catch (e) { delete document.documentElement.dataset.vt; apply(); }
  } else apply();
}
function render(name, arg) {
  const v = $('#view');
  let html;
  switch (name) {
    case 'food': html = viewFood(); break;
    case 'train': html = viewTrain(); break;
    case 'exercises': html = viewLibrary(); break;
    case 'ex': html = viewExercise(arg); break;
    case 'routine': html = viewRoutine(arg); break;
    case 'edit': html = viewEditor(arg); break;
    case 'me': html = viewMe(); break;
    case 'plan': html = arg === 'week' ? viewWeekPlan() : arg === 'shop' ? viewShop() : viewPlan(); break;
    case 'progress': html = viewProgress(); break;
    case 'summary': html = viewSummary(); break;
    case 'programs': html = viewPrograms(); break;
    case 'strength': html = viewStrength(); break;
    default: name = 'today'; html = viewToday();
  }
  v.innerHTML = html;
  lastRendered = name;
  document.body.classList.toggle('modal-page', name === 'edit');
  document.body.dataset.page = name;
  const tab = { plan: 'food', progress: 'me', summary: 'me', programs: 'train', strength: 'train', today: 'today', food: 'food', train: 'train', exercises: 'train', ex: 'train', routine: 'train', edit: 'train', me: 'me' }[name] || 'today';
  $$('.tabbar a').forEach(a => { const on = a.dataset.tab === tab; a.classList.toggle('on', on); if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (name === 'exercises') renderLibResults();
  if (name === 'me') updateGoalCheck();
  syncNavbar();
}
const rerender = () => route({ keepScroll: true });
const go = hash => { if (location.hash === hash) rerender(); else location.hash = hash; };

/* ============================== shared bits ============================== */
function dayTotals(k) {
  const t = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const e of (S.log[k] || [])) { t.kcal += e.kcal || 0; t.p += e.p || 0; t.c += e.c || 0; t.f += e.f || 0; }
  return t;
}
function ringSVG(pct, size = 170, stroke = 18, id = '') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, cx = size / 2;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${cx}" cy="${cx}" r="${r}" class="ring-track" stroke-width="${stroke}" fill="none"/>
    <circle cx="${cx}" cy="${cx}" r="${r - stroke / 2 + 2}" class="ring-groove" stroke-width="1" fill="none"/>
    <circle ${id ? `id="${id}"` : ''} cx="${cx}" cy="${cx}" r="${r}" class="ring-fill" stroke-width="${stroke}" fill="none" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${(c * (1 - clamp(pct, 0, 1))).toFixed(2)}" transform="rotate(-90 ${cx} ${cx})"/>
  </svg>`;
}
/* ---------- keep the number inside its ring, whatever the phone, font size or number ----------
   Measures the real text against the inside edge of the ring and shrinks the number until every
   corner clears it. Runs before the screen is painted, again when the size changes, and when a
   timer's number gets longer (9:59 -> 10:00). */
function fitRing(c) {
  const wrap = c && c.parentElement, svg = wrap && wrap.querySelector(':scope > svg.ring'), big = c && c.firstElementChild;
  if (!svg || !big || !wrap.offsetWidth) return;
  const key = `${wrap.offsetWidth}|${big.textContent.length}|${c.textContent.length}`;
  if (big.dataset.fit === key) return;
  big.style.fontSize = '';
  const box = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal.width || box.width || 1, tr = svg.querySelector('.ring-track');
  const inner = tr ? +tr.getAttribute('r') - +tr.getAttribute('stroke-width') / 2 : vb * 0.39;
  const R = inner * box.width / vb - Math.max(4, box.width * 0.035);           // leave a little air next to the ring
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  let fs = parseFloat(getComputedStyle(big).fontSize);
  for (let i = 0; i < 10; i++) {
    let worst = 0;
    for (const el of c.children) {
      const rg = document.createRange(); rg.selectNodeContents(el);
      const r = rg.getBoundingClientRect(); if (!r.width) continue;
      const f = parseFloat(getComputedStyle(el).fontSize), mid = (r.top + r.bottom) / 2, half = Math.min(r.height / 2, f * 0.38);
      const dx = Math.max(Math.abs(r.left - cx), Math.abs(r.right - cx)), dy = Math.max(Math.abs(mid - half - cy), Math.abs(mid + half - cy));
      worst = Math.max(worst, Math.hypot(dx, dy));
    }
    if (worst <= R || fs <= 14) break;
    fs = Math.max(14, Math.floor(fs * Math.min(0.97, R / worst) * 2) / 2);
    big.style.fontSize = fs + 'px';
  }
  big.dataset.fit = key;
}
/* ---------- iOS top bar: content blurs under it, and the large title moves into it as you scroll ---------- */
const navbar = document.createElement('div');
navbar.id = 'navbar'; navbar.setAttribute('aria-hidden', 'true'); navbar.innerHTML = '<span class="nb-title"></span>';
document.body.appendChild(navbar);
let navTick = 0;
function syncNavbar() {
  navTick = 0;
  const h1 = document.querySelector('#view .h-display'), t = navbar.firstChild;
  navbar.classList.toggle('edge', window.scrollY > 2);
  let titled = false;
  if (h1) {
    titled = h1.getBoundingClientRect().bottom < navbar.offsetHeight - 4;
    const txt = h1.textContent.trim(); if (t.textContent !== txt) t.textContent = txt;
  }
  navbar.classList.toggle('titled', titled);
}
addEventListener('scroll', () => { if (!navTick) navTick = requestAnimationFrame(syncNavbar); }, { passive: true });
addEventListener('resize', syncNavbar);

/* ---------- swipe in from the left edge to go back, like any iPhone app (only when opened from the home screen) ---------- */
(() => {
  const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;
  if (!standalone) return;                                   // in Safari the browser already does this
  let sw = null;
  document.addEventListener('touchstart', e => {
    sw = null;
    if (layers.length || e.touches.length !== 1 || e.touches[0].clientX > 24) return;
    const back = document.querySelector('#view .top.bar [data-act="back"]'); if (!back) return;
    sw = { x0: e.touches[0].clientX, y0: e.touches[0].clientY, back };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!sw) return;
    const dx = e.touches[0].clientX - sw.x0, dy = Math.abs(e.touches[0].clientY - sw.y0);
    if (dy > 30 && dy > dx) { sw = null; return; }
    if (dx > 70 && dx > dy * 2) { const b = sw.back; sw = null; b.click(); }
  }, { passive: true });
})();

/* ---------- sheets: pull down to close, like iOS ---------- */
(() => {
  let d = null;
  document.addEventListener('touchstart', e => {
    d = null;
    const sheet = e.target.closest && e.target.closest('.layer.open > .sheet');
    if (!sheet || e.touches.length !== 1 || !layers.length || sheet.parentElement !== layers[layers.length - 1].el) return;
    if (e.target.closest('input, textarea, select, canvas, video, .no-drag')) return;
    const onHead = !!e.target.closest('.sheet-head');
    if (!onHead && sheet.scrollTop > 0) return;
    d = { sheet, layer: sheet.parentElement, y0: e.touches[0].clientY, t0: e.timeStamp, dy: 0, onHead, active: false };
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!d) return;
    const dy = e.touches[0].clientY - d.y0;
    if (!d.active) {
      if (dy < 8) { if (dy < -4) d = null; return; }           // going up: normal scrolling
      if (!d.onHead && d.sheet.scrollTop > 0) { d = null; return; }
      d.active = true; d.layer.classList.add('dragging');
    }
    if (e.cancelable) e.preventDefault();
    d.dy = Math.max(0, dy - 8);
    d.sheet.style.transform = `translateY(${d.dy}px)`;
    const bd = d.layer.querySelector('.backdrop'); if (bd) bd.style.opacity = String(Math.max(0, 1 - d.dy / ((d.sheet.offsetHeight || 1) * 1.2)));
  }, { passive: false });
  const end = e => {
    if (!d) return;
    const x = d; d = null;
    if (!x.active) return;
    x.layer.classList.remove('dragging');
    const fast = x.dy > 40 && x.dy / Math.max(1, e.timeStamp - x.t0) > .5;
    const bd = x.layer.querySelector('.backdrop');
    if (fast || x.dy > Math.min(140, x.sheet.offsetHeight * .3)) {
      x.sheet.style.transition = 'transform .24s cubic-bezier(.4, 0, .9, .6)'; x.sheet.style.transform = 'translateY(100%)';
      popLayer();
      setTimeout(() => { if (x.layer.isConnected && x.layer.classList.contains('open')) { x.sheet.style.transition = ''; x.sheet.style.transform = ''; if (bd) bd.style.opacity = ''; } }, 420);
    } else { x.sheet.style.transform = ''; if (bd) bd.style.opacity = ''; }
  };
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);
})();

const fitAllRings = (force = false) => document.querySelectorAll('.ring-center').forEach(c => { if (force && c.firstElementChild) delete c.firstElementChild.dataset.fit; fitRing(c); });
if (typeof MutationObserver === 'function') {
  const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(es => es.forEach(e => fitRing(e.target.querySelector(':scope > .ring-center')))) : null;
  const seen = c => { if (ro && c.parentElement) ro.observe(c.parentElement); fitRing(c); };
  new MutationObserver(ms => {
    const todo = new Set();
    for (const m of ms) {
      const t = m.target.nodeType === 1 ? m.target : m.target.parentElement;
      const inRing = t && t.closest && t.closest('.ring-center'); if (inRing) todo.add(inRing);
      for (const n of m.addedNodes) if (n.nodeType === 1) { if (n.matches('.ring-center')) todo.add(n); n.querySelectorAll('.ring-center').forEach(x => todo.add(x)); }
    }
    todo.forEach(seen);
  }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  addEventListener('resize', () => fitAllRings(true));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitAllRings(true));
}
function macroBars(t) {
  const st = S.settings;
  return `<div class="macros">${[['p', 'Protein', st.protein], ['c', 'Carbs', st.carbs], ['f', 'Fat', st.fat]].map(([k, l, g]) => `
    <div class="m-${k}">
      <div class="macro-head"><span><i class="dot"></i>${l}</span><span class="num">${n0(t[k])}<small> / ${n0(g)} g</small></span></div>
      <div class="mbar" role="img" aria-label="${l}: ${n0(t[k])} of ${n0(g)} grams"><i style="width:${g ? clamp(t[k] / g * 100, 0, 100) : 0}%"></i></div>
    </div>`).join('')}</div>`;
}
function eqStrip(t, k = dkey()) {
  const st = S.settings, bonus = bonusOn(k), left = st.kcal + bonus - t.kcal;
  return `${bonus ? '' : ''}<dl class="eq">
    <div><dt>Goal</dt><dd>${fmtE(st.kcal)}</dd></div><div class="op" aria-hidden="true">−</div>
    <div><dt>Food</dt><dd>${fmtE(t.kcal)}</dd></div><div class="op" aria-hidden="true">=</div>
    <div><dt>${left >= 0 ? 'Left' : 'Over'}</dt><dd>${fmtE(Math.abs(left))}</dd></div>
  </dl>${bonus ? `<p class="eq-note">${I.bolt} Includes +${fmtE(bonus)} ${eUnit()} from exercise</p>` : ''}`;
}
function resumeBanner() {
  if (!S.active) return '';
  return `<div class="resume"><div><strong>Workout in progress</strong><span>${esc(S.active.name)} · ${plural(S.active.sets.length, 'set')} done</span></div><button type="button" class="btn primary" data-act="resume">Resume</button></div>`;
}
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let installPrompt = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installPrompt = e; if (/today|me/.test(currentRoute || 'today')) rerender(); });
window.addEventListener('appinstalled', () => { installPrompt = null; toast('RepPlate is on your home screen'); });
function installHowTo() {
  if (installPrompt) return 'Install it like an app so it opens full screen and works offline.';
  if (isIOS()) return 'In Safari, tap the Share button, then “Add to Home Screen”.';
  return 'Open your browser menu and choose “Install app” or “Add to Home screen”.';
}

/* ============================== TODAY ============================== */
function weekChart() {
  const today = dkey(), goal = S.settings.kcal;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const k = addDays(today, -i);
    days.push({ k, kcal: dayTotals(k).kcal, w: S.workouts.some(w => dkey(new Date(w.start)) === k) });
  }
  const max = Math.max(goal * 1.15, ...days.map(d => d.kcal)) || 1;
  const W = 320, top = 20, base = 112, step = W / 7, bw = 26, hgt = base - top;
  const y = v => base - (v / max) * hgt;
  const bars = days.map((d, i) => {
    const x = i * step + (step - bw) / 2, h = Math.max(d.kcal > 0 ? 3 : 0, (d.kcal / max) * hgt);
    const isT = d.k === today;
    const lbl = fromKey(d.k).toLocaleDateString(undefined, { weekday: 'narrow' });
    return `<rect class="wk-bar ${isT ? 'today' : ''}" x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${bw}" height="${h.toFixed(1)}" rx="4"/>
      ${d.kcal > 0 ? `<text class="val" x="${(x + bw / 2).toFixed(1)}" y="${(base - h - 5).toFixed(1)}" text-anchor="middle">${short(toE(d.kcal))}</text>` : ''}
      <text class="${isT ? 'today' : ''}" x="${(x + bw / 2).toFixed(1)}" y="${base + 17}" text-anchor="middle">${esc(lbl)}</text>
      ${d.w ? `<circle class="wk-dot" cx="${(x + bw / 2).toFixed(1)}" cy="${base + 29}" r="3.5"/>` : ''}`;
  }).join('');
  return `<svg viewBox="0 0 ${W} 146" role="img" aria-label="Energy eaten on each of the last 7 days compared with your goal">
    <line class="wk-base" x1="0" x2="${W}" y1="${base}" y2="${base}"/>
    ${bars}
    <line class="wk-goal" x1="0" x2="${W}" y1="${y(goal).toFixed(1)}" y2="${y(goal).toFixed(1)}"/>
  </svg>`;
}

/* ============================== FOOD LOG ============================== */
function viewFood() {
  const k = foodDate, entries = S.log[k] || [], t = dayTotals(k), st = S.settings, prev = S.log[addDays(k, -1)] || [];
  const meals = MEALS.map(([m, label]) => {
    const list = entries.filter(e => e.meal === m);
    const sum = list.reduce((s, e) => s + (e.kcal || 0), 0);
    return `<section class="meal" aria-label="${label}">
      <div class="meal-head"><h2>${label}</h2><span>${list.length ? `${fmtE(sum)} <small class="muted">${eUnit()}</small>` : ''}</span></div>
      <div class="meal-card"><ul class="entries">${list.map(e => `<li><button type="button" class="entry" data-act="entry" data-id="${esc(e.id)}">
        <span class="e-name">${esc(e.name)}</span><span class="e-sub">${esc([e.brand, e.amountLabel].filter(Boolean).join(' · '))}</span><span class="e-kcal">${fmtE(e.kcal)}</span></button></li>`).join('')}</ul>
      <button type="button" class="add-row" data-act="add" data-meal="${m}">${I.plus} Add food</button>
      ${!list.length && prev.filter(e => e.meal === m).length ? `<button type="button" class="add-row repeat" data-act="repeat-meal" data-meal="${m}">${I.repeat} Same as ${k === dkey() ? 'yesterday' : 'the day before'} · ${plural(prev.filter(e => e.meal === m).length, 'food')} · ${fmtE(mealSum(prev.filter(e => e.meal === m)))} ${eUnit()}</button>` : ''}
      ${list.length ? `<button type="button" class="add-row subtle" data-act="save-meal" data-meal="${m}">${I.bookmark} Save as a meal</button>` : ''}</div>
    </section>`;
  }).join('');
  const goal = goalOn(k), left = goal - t.kcal, bonus = bonusOn(k);
  const ring = pulseRings([{ id: 'k', pct: t.kcal / (goal || 1), label: `Calories: ${fmtE(t.kcal)} of ${fmtE(goal)} ${eUnit()} eaten` }], firstVisit('food'));
  return `
  <header class="top datebar"><div><p class="eyebrow date">${['Today', 'Yesterday', 'Tomorrow'].includes(dayLabel(k)) ? `${esc(dayLabel(k))} · ` : ''}${esc(longDate(k))}</p><h1 class="h-display">Food</h1></div>
    <div class="day-nav top-acts"><button type="button" class="icon-btn" data-act="day" data-d="-1" aria-label="Previous day">${I.chevL}</button><button type="button" class="icon-btn" data-act="day" data-d="1" aria-label="Next day">${I.chevR}</button></div>
  </header>
  ${k !== dkey() ? `<button type="button" class="link" style="justify-self:center" data-act="day-today">Back to today</button>` : ''}
  <div class="cols"><div class="col-a">
  <section class="panel pulse-hero solo" aria-label="Day summary">
    <div class="pulse-rings">${ring}</div>
    <div class="pulse-legend">
      <div class="pl pl-k"><span class="pl-lab">${eUnit() === 'kJ' ? 'Kilojoules' : 'Calories'} ${left >= 0 ? 'left' : 'over'}</span><span class="pl-val pl-big num">${fmtE(Math.abs(left))}<small> ${eUnit()}</small></span></div>
      <div class="pl pl-n"><span class="pl-lab">Eaten</span><span class="pl-val num">${fmtE(t.kcal)}<small> ${eUnit()}</small></span></div>
      <div class="pl pl-n"><span class="pl-lab">Goal</span><span class="pl-val num">${fmtE(goal)}<small> ${eUnit()}</small></span>${bonus ? `<span class="pl-sub eq-note">${I.bolt} incl. +${fmtE(bonus)} from exercise</span>` : ''}</div>
    </div>
    <a class="pulse-ideas" href="#/plan">${I.utensils}<span>Meal ideas for your goal</span>${I.chevR}</a>
  </section>
  ${macroTiles(t)}
  </div><div class="col-b">
  ${meals}
  ${nutrientsPanel(k)}
  <p class="credit">Everyday foods: USDA nutrient data. Barcodes and packaged products: Open Food Facts (ODbL licence).</p>
  </div></div>`;
}

/* ---------- Open Food Facts ---------- */
async function fetchJSON(url, ms = 12000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    let j = null; try { j = await r.json(); } catch (e) { /* not json */ }
    if (!r.ok && !j) throw new Error('http ' + r.status);
    return j;
  } finally { clearTimeout(timer); }
}
const numOrNull = v => { const n = parseNum(v); return n == null || n < 0 ? null : n; };
function fromOFF(p, code) {
  const n = p.nutriments || {};
  const servingG = numOrNull(p.serving_quantity);
  const pick = (k100, kServ) => {
    let v = numOrNull(n[k100]);
    if (v == null && kServ && servingG) { const s = numOrNull(n[kServ]); if (s != null) v = s / servingG * 100; }
    return v;
  };
  let kcal = pick('energy-kcal_100g', 'energy-kcal_serving');
  if (kcal == null) { const kj = pick('energy-kj_100g', 'energy-kj_serving') ?? pick('energy_100g', 'energy_serving'); if (kj != null) kcal = kj / KJ; }
  const quantity = (p.quantity || '').trim();
  const ul = /\d\s*(ml|cl|l)\b/i.test(quantity) ? 'ml' : 'g';
  return {
    key: String(code || p.code), code: String(code || p.code || ''),
    name: (p.product_name || p.product_name_en || p.generic_name || '').trim() || 'Unnamed product',
    brand: (p.brands || '').split(',')[0].trim(),
    quantity, ul,
    img: p.image_front_small_url || p.image_front_thumb_url || '',
    servingG: servingG || null,
    servingLabel: (p.serving_size || '').trim(),
    packageG: numOrNull(p.product_quantity) || null,
    ns: /^[a-e]$/.test(String(p.nutriscore_grade || '')) ? p.nutriscore_grade : '',
    allergens: Array.isArray(p.allergens_tags) ? p.allergens_tags.slice(0, 20) : [],
    traces: Array.isArray(p.traces_tags) ? p.traces_tags.slice(0, 20) : [],
    labels: Array.isArray(p.labels_tags) ? p.labels_tags.filter(l => /vegan|vegetarian|halal|halaal|gluten|lactose|kosher/.test(l)).slice(0, 10) : [],
    ingredients: String(p.ingredients_text_en || p.ingredients_text || '').slice(0, 1500),
    vegan: (p.ingredients_analysis_tags || []).includes('en:non-vegan') ? 'no' : (p.ingredients_analysis_tags || []).includes('en:vegan') ? 'yes' : '',
    vegetarian: (p.ingredients_analysis_tags || []).includes('en:non-vegetarian') ? 'no' : (p.ingredients_analysis_tags || []).includes('en:vegetarian') ? 'yes' : '',
    per100: {
      kcal, p: pick('proteins_100g', 'proteins_serving'), c: pick('carbohydrates_100g', 'carbohydrates_serving'),
      sugar: pick('sugars_100g', 'sugars_serving'), f: pick('fat_100g', 'fat_serving'), sat: pick('saturated-fat_100g', 'saturated-fat_serving'),
      fiber: pick('fiber_100g', 'fiber_serving'), salt: pick('salt_100g', 'salt_serving'),
    },
  };
}
async function lookupBarcode(code) {
  if (S.foods[code]) return S.foods[code];
  const tries = [code];
  if (code.length === 12) tries.push('0' + code);
  if (code.length === 13 && code[0] === '0') tries.push(code.slice(1));
  for (const c of tries) {
    if (S.foods[c]) return S.foods[c];
    const j = await fetchJSON(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(c)}.json?fields=${OFF_FIELDS}`);
    if (j && j.status === 1 && j.product) return fromOFF(j.product, c);
  }
  return null;
}
async function searchOFF(q) {
  const host = S.settings.region === 'world' ? 'world' : S.settings.region;
  const url = `https://${host}.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=30&sort_by=unique_scans_n&fields=${OFF_FIELDS}`;
  const j = await fetchJSON(url, 20000);
  return (j?.products || []).filter(p => p.code && (p.product_name || p.product_name_en)).map(p => fromOFF(p, p.code));
}

/* ---------- entries ---------- */
function unitGrams(food, unit) {
  if (unit === 'serving') return food.servingG || 0;
  if (unit === 'package') return food.packageG || 0;
  if (/^p\d+$/.test(unit)) return food.portions?.[+unit.slice(1)]?.g || 0;
  return 1;
}
function gramsFor(food, qty, unit) { return qty * unitGrams(food, unit); }
function amountLabel(food, qty, unit) {
  const q = trimNum(qty), u = food.ul || 'g';
  if (unit === 'serving') return `${q} serving${qty === 1 ? '' : 's'} (${n0(qty * food.servingG)} ${u})`;
  if (unit === 'package') return `${q} pack${qty === 1 ? '' : 's'} (${n0(qty * food.packageG)} ${u})`;
  if (/^p\d+$/.test(unit)) { const p = food.portions?.[+unit.slice(1)]; if (p) return `${q} × ${p.label} (${n0(qty * p.g)} ${u})`; }
  return `${q} ${u}`;
}
function nutrFor(per100, grams) {
  const f = grams / 100, o = {};
  for (const k of ['kcal', 'p', 'c', 'f', 'sugar', 'sat', 'fiber', 'salt']) o[k] = per100?.[k] == null ? null : per100[k] * f;
  return o;
}
function makeEntry(food, qty, unit, meal, id) {
  const grams = gramsFor(food, qty, unit), v = nutrFor(food.per100, grams);
  return {
    id: id || uid(), meal, key: food.key, name: food.name, brand: food.brand || '', qty, unit, grams,
    amountLabel: amountLabel(food, qty, unit), kcal: v.kcal || 0, p: v.p || 0, c: v.c || 0, f: v.f || 0,
    per100: { ...food.per100 }, servingG: food.servingG || null, servingLabel: food.servingLabel || '', packageG: food.packageG || null, portions: food.portions || null, source: food.source || '', group: food.group || '', ul: food.ul || 'g', img: food.img || '', code: food.code || '', ts: Date.now(),
  };
}
function touchFood(food, qty, unit) {
  const prev = S.foods[food.key] || {};
  S.foods[food.key] = { ...prev, ...food, lastUsed: Date.now(), lastQty: qty, lastUnit: unit, uses: (prev.uses || 0) + 1 };
  const keys = Object.keys(S.foods);
  if (keys.length > 400) { keys.sort((a, b) => (S.foods[a].lastUsed || 0) - (S.foods[b].lastUsed || 0)); for (const k of keys.slice(0, keys.length - 400)) delete S.foods[k]; }
}
function foodFromEntry(e) {
  return S.foods[e.key] || { key: e.key || 'e_' + e.id, code: e.code || '', name: e.name, brand: e.brand, per100: e.per100 || {}, servingG: e.servingG, servingLabel: e.servingLabel, packageG: e.packageG, portions: e.portions || null, source: e.source || '', group: e.group || '', ul: e.ul || 'g', img: e.img || '' };
}
function addEntry(date, entry) {
  (S.log[date] = S.log[date] || []).push(entry);
  save();
}
function removeEntry(date, id) {
  const list = S.log[date] || [];
  const i = list.findIndex(e => e.id === id);
  if (i < 0) return null;
  const [e] = list.splice(i, 1);
  if (!list.length) delete S.log[date];
  save();
  return { e, i };
}
function afterLog(date, entry, verb = 'Added') {
  closeAll(() => {
    if (/^(today|food)/.test(currentRoute || 'today')) rerender();
    toast(`${verb} to ${MEAL_NAME[entry.meal]}${date !== dkey() ? ` (${dayLabel(date).toLowerCase()})` : ''}`, verb === 'Added' ? {
      label: 'Undo', fn: () => { removeEntry(date, entry.id); rerender(); },
    } : null);
  });
}

/* ---------- built-in common foods (USDA, works offline) ---------- */
let FOODDB = null, FOODMAP = null, FOODGROUPS = [], foodDbP = null;
function loadFoodDb() {
  if (!foodDbP) foodDbP = fetch('data/foods.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(j => {
      FOODGROUPS = j.groups;
      FOODDB = j.foods.map(f => {
        const alt = f[12] && !/^includes/i.test(f[12]) ? f[12] : '';
        return { id: f[0], name: f[1], g: f[2], kcal: f[3], p: f[4], c: f[5], f: f[6], sugar: f[7], fiber: f[8], sat: f[9], salt: f[10], portions: f[11], alt,
          hay: ' ' + `${f[1]} ${alt}`.toLowerCase().replace(/[^a-z0-9%]+/g, ' ') + ' ', commas: (f[1].match(/,/g) || []).length,
          first: f[1].split(',')[0].toLowerCase().split(/[^a-z0-9%]+/).filter(Boolean).map(stem) };
      });
      FOODMAP = new Map(FOODDB.map(d => [d.id, d]));
      return FOODDB;
    })
    .catch(e => { foodDbP = null; throw e; });
  return foodDbP;
}
const stem = t => { const s = t.replace(/(ies|es|s)$/, ''); return t.length > 3 && s.length >= 3 ? s : t; };
// spelling variants and everyday names -> the words the USDA list uses
const SYNONYMS = { yoghurt: 'yogurt', yoghurts: 'yogurt', yogourt: 'yogurt', mince: 'ground', minced: 'ground', courgette: 'zucchini', courgettes: 'zucchini',
  aubergine: 'eggplant', aubergines: 'eggplant', prawn: 'shrimp', prawns: 'shrimp', beetroot: 'beets', rocket: 'arugula', maize: 'corn', mealie: 'corn', mielie: 'corn',
  mealies: 'corn', mielies: 'corn', crisps: 'chips', cooldrink: 'carbonated', fizzy: 'carbonated', soda: 'carbonated', chickpea: 'chickpeas', porridge: 'oats',
  sultanas: 'raisins', sultana: 'raisins', icing: 'powdered', wholemeal: 'whole wheat', wholewheat: 'whole wheat', spud: 'potatoes', spuds: 'potatoes', oatmeal: 'oats' };
const RAW_GROUPS = new Set(['Fruit', 'Vegetables', 'Nuts & seeds']);
const COOKED_GROUPS = new Set(['Poultry', 'Beef', 'Pork', 'Lamb, veal & game', 'Fish & seafood', 'Grains & pasta', 'Beans & lentils']);
const GROUP_PENALTY = { 'Fast food': 4, 'Meals & dishes': 2, 'Soups & sauces': 1.5, 'Sweets': 1 };
const PROCESSED = ['breaded', 'tender', 'nugget', 'patt', 'microwav', 'frozen', 'substitute', 'powder', 'mix', 'imitation', 'flavor', 'dehydrated', 'sweetened',
  'fat free', 'nonfat', 'low fat', 'lowfat', 'reduced', 'instant', 'concentrate', 'syrup', 'toddler', 'shake', 'bar', 'salad', 'spread', 'noodle', 'cracker', 'bran',
  'flour', 'dried', 'recipe', 'canned', 'feet', 'giblet', 'gizzard', 'liver', 'heart', 'neck', 'tongue', 'kidney', 'tripe', 'buttermilk', 'candies', 'cookie', 'cake', 'sauce', 'sausage', 'pie', 'soup'];
const PHRASES = [[/\b(mealie|mielie|maize)\s*meal\b/g, 'cornmeal'], [/\bmaize porridge\b/g, 'corn grits'], [/\bpap\b/g, 'corn grits'], [/\bminced? meat\b/g, 'beef ground'], [/^\s*minced?\s*$/, 'beef ground']];
const near = (a, b) => (a.startsWith(b) || b.startsWith(a)) && Math.abs(a.length - b.length) <= 2;
function searchDb(q, limit = 30) {
  if (!FOODDB) return [];
  let ql = q.toLowerCase();
  for (const [re, rep] of PHRASES) ql = ql.replace(re, rep);
  const words = ql.split(/[^a-z0-9%]+/).filter(Boolean).flatMap(w => (SYNONYMS[w] || w).split(' '));
  const toks = words.map(stem);
  if (!toks.length) return [];
  const qtext = ' ' + words.join(' ') + ' ';
  const prepWords = /\b(raw|cook|boil|fried|fry|roast|grill|bake|steam|dried|dry|canned|frozen)/.test(ql);
  const hits = [];
  for (const d of FOODDB) {
    let whole = 0, ok = true, firstWhole = false;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (!d.hay.includes(' ' + t)) { ok = false; break; }
      const w = d.hay.includes(' ' + t + ' ') || d.hay.includes(' ' + t + 's ') || d.hay.includes(' ' + t + 'es ') || d.hay.includes(' ' + t + 'ies ');
      if (w) whole++; if (w && i === 0) firstWhole = true;
    }
    if (!ok) continue;
    const grp = FOODGROUPS[d.g];
    const lead = d.hay.slice(1, d.hay.indexOf(' ', 1));
    let score = (near(lead, toks[0]) ? 0 : firstWhole ? 4 : 12) - whole * 3 + (toks.length - whole) * 4
      + d.commas * 0.8 + d.name.length / 30 + (GROUP_PENALTY[grp] || 0);
    if (d.first.length && d.first.every(w => toks.some(t => near(w, t)))) score -= 8;
    for (const p of PROCESSED) if (d.hay.includes(' ' + p) && !qtext.includes(' ' + p)) score += 3;
    if (d.hay.includes(' dry ') && !d.hay.includes(' dry heat ') && !prepWords) score += 3;
    if (d.hay.includes(' whole ') && !qtext.includes(' whole ')) score -= 3;
    if (!prepWords) {
      if (RAW_GROUPS.has(grp) && d.hay.includes(' raw ')) score -= 2.5;
      if (COOKED_GROUPS.has(grp) && / (cooked|roasted|grilled|boiled|baked|broiled) /.test(d.hay)) score -= 2.5;
      if (COOKED_GROUPS.has(grp) && d.hay.includes(' meat only ')) score -= 2;
    }
    hits.push([score, d]);
  }
  hits.sort((a, b) => a[0] - b[0]);
  return hits.slice(0, limit).map(h => h[1]);
}
function dbToFood(d) {
  return {
    key: 'usda_' + d.id, code: '', source: 'usda', group: FOODGROUPS[d.g] || '', name: d.name, brand: '', quantity: '', ul: 'g', img: '',
    servingG: null, servingLabel: '', packageG: null, portions: (d.portions || []).map(([g, label]) => ({ g, label })),
    per100: { kcal: d.kcal, p: d.p, c: d.c, f: d.f, sugar: d.sugar, fiber: d.fiber, sat: d.sat, salt: d.salt },
  };
}

/* ---------- add-food sheet: search as you type, recent, quick add ---------- */
function openAddSheet(ctx, replace = false) {
  const meal = ctx.meal || mealNow();
  const results = new Map();
  const recent = Object.values(S.foods).filter(f => f.lastUsed).sort((a, b) => b.lastUsed - a.lastUsed);
  const el = sheetEl(`
    ${sheetHead('Add food', `${MEAL_NAME[meal]} · ${dayLabel(ctx.date)}`)}
    <div class="row-btns">
      <button type="button" class="btn primary" data-a="snap">${I.camera} Snap a meal</button>
      <button type="button" class="btn" data-a="say">${I.mic} Say it</button>
    </div>
    <div class="quick-actions">
      <button type="button" class="qa" data-a="scan" aria-label="Scan a barcode">${I.scan}Scan</button>
      <button type="button" class="qa" data-a="quick">${I.bolt}Quick add</button>
      <button type="button" class="qa" data-a="create" aria-label="Create a food">${I.pen}New food</button>
      <button type="button" class="qa" data-a="recipes">${I.utensils}Recipes</button>
    </div>
    <form class="search-form" data-a-form>
      <label class="search-box"><span class="sr">Search foods</span>${I.search}<input class="input" id="a-q" type="search" enterkeyhint="search" autocomplete="off" placeholder="Search foods"></label>
    </form>
    <div id="a-results"></div>
    <div id="a-online"></div>
    <div class="sheet-end"></div>`);
  const box = el.querySelector('#a-results'), online = el.querySelector('#a-online'), input = el.querySelector('#a-q');
  const row = (f, withAdd) => {
    results.set(f.key, f);
    const per = f.per100?.kcal != null ? `${fmtE(f.per100.kcal)} ${eUnit()} per 100 ${f.ul || 'g'}` : 'No energy value';
    const sub = withAdd && f.lastQty ? `${amountLabel(f, f.lastQty, f.lastUnit || 'g')} · ${fmtE(nutrFor(f.per100, gramsFor(f, f.lastQty, f.lastUnit || 'g')).kcal || 0)} ${eUnit()}`
      : f.source === 'usda' ? `${f.group} · ${per}` : [f.brand, per].filter(Boolean).join(' · ');
    return `<li class="food-row"><button type="button" class="fr-main" data-a="open" data-k="${esc(f.key)}"><span class="fr-name">${esc(f.name)}</span><span class="fr-sub">${nsBadge(f, true)}${warnBadge(f)}${esc(sub)}</span></button>
      ${withAdd && f.per100?.kcal != null ? `<button type="button" class="icon-btn fr-add" data-a="again" data-k="${esc(f.key)}" aria-label="Add ${esc(f.name)} again">${I.plus}</button>` : ''}</li>`;
  };
  const mineMatch = q => {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean).map(stem);
    return recent.filter(f => { const h = `${f.name} ${f.brand || ''}`.toLowerCase(); return toks.every(t => h.includes(t)); });
  };
  let lastQ = null, dbLimit = 15;
  const render = () => {
    const q = input.value.trim();
    if (q === lastQ) return;
    if (q !== (lastQ || '').replace(/\u0000$/, '')) dbLimit = 15;
    lastQ = q;
    online.innerHTML = q.length >= 2
      ? `<button type="button" class="btn block" data-a="online">${I.search} Search packaged products for “${esc(q)}”</button>
         <p class="hint" style="margin-top:6px">Branded products come from Open Food Facts and need internet. For packaged food, scanning the barcode is usually quicker.</p>`
      : '';
    const ql = q.toLowerCase();
    const sms = (S.meals || []).filter(sm => !ql || sm.name.toLowerCase().includes(ql)).sort((a, b) => (b.used || 0) - (a.used || 0));
    const smHtml = sms.length ? `<p class="list-title">Saved meals</p><ul class="food-list">${sms.slice(0, 10).map(sm => `<li class="food-row"><button type="button" class="fr-main" data-a="sm-open" data-id="${esc(sm.id)}"><span class="fr-name">${I.bookmark.replace('class="i ', 'class="i inline ')}${esc(sm.name)}</span><span class="fr-sub">${plural(sm.items.length, 'food')} · ${fmtE(mealSum(sm.items))} ${eUnit()}</span></button><button type="button" class="icon-btn fr-add" data-a="sm-log" data-id="${esc(sm.id)}" aria-label="Log ${esc(sm.name)}">${I.plus}</button></li>`).join('')}</ul>` : '';
    if (!q) {
      box.innerHTML = smHtml + (recent.length
        ? `<p class="list-title">Recent</p><ul class="food-list">${recent.slice(0, 25).map(f => row(f, true)).join('')}</ul>`
        : `<div class="state">${I.apple}<span>Type to search over 6,000 everyday foods, from apples to chicken breast. It works offline. Foods you add show up here next time.</span></div>`);
      return;
    }
    const mine = mineMatch(q).slice(0, 6);
    let html = smHtml + (mine.length ? `<p class="list-title">Your foods</p><ul class="food-list">${mine.map(f => row(f, true)).join('')}</ul>` : '');
    if (!FOODDB) {
      box.innerHTML = html + `<div class="state"><span class="spinner"></span><span>Loading everyday foods…</span></div>`;
      loadFoodDb().then(() => { lastQ = null; render(); })
        .catch(() => { box.innerHTML = html + `<p class="hint">The everyday foods list didn’t load. Close this and try again.</p>`; });
      return;
    }
    const all = searchDb(q, 60), hits = all.slice(0, dbLimit).map(dbToFood);
    html += hits.length
      ? `<p class="list-title">Everyday foods</p><ul class="food-list">${hits.map(f => row(f, false)).join('')}</ul>`
        + (all.length > hits.length ? `<button type="button" class="link" data-a="more" style="margin-top:6px">Show more everyday foods</button>` : '')
      : `<p class="hint">No everyday foods match “${esc(q)}”. Try one simple word (like “yoghurt” or “bread”), search packaged products below, or create the food yourself.</p>`;
    box.innerHTML = html;
  };
  let timer = 0;
  input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(render, 120); });
  el.querySelector('[data-a-form]').addEventListener('submit', e => { e.preventDefault(); clearTimeout(timer); render(); input.blur(); });
  let searchId = 0;
  const searchOnline = async () => {
    const q = input.value.trim(); if (q.length < 2) return;
    const my = ++searchId;
    online.innerHTML = `<div class="state"><span class="spinner"></span><span>Searching Open Food Facts…</span></div>`;
    try {
      const list = await searchOFF(q);
      if (my !== searchId) return;
      online.innerHTML = list.length
        ? `<p class="list-title">Packaged products · Open Food Facts</p><ul class="food-list">${list.map(f => row(f, false)).join('')}</ul>`
        : `<div class="state"><span>No packaged products found for “${esc(q)}”. Try fewer words, or scan the barcode.</span></div>`;
    } catch (err) {
      if (my !== searchId) return;
      online.innerHTML = `<div class="notice">${I.search}<div><strong>Product search isn’t available right now</strong>
        <p>Open Food Facts is limiting name searches from apps at the moment. Scanning a barcode still works, and so do the everyday foods above.</p></div>
        <div class="actions"><button type="button" class="btn sm primary" data-a="scan">Scan a barcode</button><button type="button" class="btn sm" data-a="online">Try again</button></div></div>`;
    }
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'scan') openScanner({ ...ctx, meal }, true);
    else if (a === 'snap') openSnap({ ...ctx, meal }, true);
    else if (a === 'say') { if (aiKey() || S.settings.voiceBasic) openSay({ ...ctx, meal }, true); else openSay({ ...ctx, meal }); }
    else if (a === 'sm-log') { const sm = (S.meals || []).find(x => x.id === b.dataset.id); if (sm) logSavedMeal(sm, ctx.date, meal); }
    else if (a === 'sm-open') { const sm = (S.meals || []).find(x => x.id === b.dataset.id); if (sm) openSavedMeal(sm, { ...ctx, meal }); }
    else if (a === 'quick') openQuickAdd({ ...ctx, meal });
    else if (a === 'create') openCreateFood({ ...ctx, meal }, { name: input.value.trim() });
    else if (a === 'recipes') openRecipes({ ...ctx, meal });
    else if (a === 'online') searchOnline();
    else if (a === 'more') { dbLimit = 60; lastQ = input.value.trim() + '\u0000'; render(); }
    else if (a === 'open') { const f = results.get(b.dataset.k); if (f) openFoodSheet(f, { ...ctx, meal }); }
    else if (a === 'again') {
      const f = results.get(b.dataset.k); if (!f) return;
      const entry = makeEntry(f, f.lastQty, f.lastUnit || 'g', meal);
      addEntry(ctx.date, entry); touchFood(f, f.lastQty, f.lastUnit || 'g'); save();
      afterLog(ctx.date, entry);
    }
  });
  render();
  loadFoodDb().catch(() => {});
  return replace ? replaceLayer(el) : pushLayer(el);
}

/* ---------- food detail: amount, meal, nutrition label ---------- */
function openFoodSheet(food0, ctx, entry, replace = false) {
  const food = JSON.parse(JSON.stringify(food0));
  food.per100 = food.per100 || {};
  const st = {
    unit: entry?.unit || food.lastUnit || (food.servingG ? 'serving' : food.portions?.length ? 'p0' : 'g'),
    qty: entry?.qty ?? food.lastQty ?? null,
    meal: entry?.meal || ctx.meal || mealNow(),
    editNutri: food.per100.kcal == null,
  };
  if (st.unit === 'serving' && !food.servingG) st.unit = 'g';
  if (st.unit === 'package' && !food.packageG) st.unit = 'g';
  if (/^p\d+$/.test(st.unit) && !food.portions?.[+st.unit.slice(1)]) st.unit = 'g';
  if (st.qty == null || !(st.qty > 0)) st.qty = st.unit === 'g' ? 100 : 1;
  const u = food.ul || 'g';

  const unitOptions = () => [
    `<option value="g" ${st.unit === 'g' ? 'selected' : ''}>${u === 'ml' ? 'millilitres (ml)' : 'grams (g)'}</option>`,
    food.servingG ? `<option value="serving" ${st.unit === 'serving' ? 'selected' : ''}>servings (${n0(food.servingG)} ${u})</option>` : '',
    food.packageG ? `<option value="package" ${st.unit === 'package' ? 'selected' : ''}>whole pack (${n0(food.packageG)} ${u})</option>` : '',
    ...(food.portions || []).map((p, i) => `<option value="p${i}" ${st.unit === 'p' + i ? 'selected' : ''}>${esc(p.label)} (${n0(p.g)} ${u})</option>`),
  ].join('');
  const chipVals = () => st.unit === 'g' ? [50, 100, 150, 200, 250] : st.unit === 'package' ? [0.25, 0.5, 1] : [0.5, 1, 1.5, 2, 3];
  const chips = () => chipVals().map(v => `<button type="button" class="chip ${Math.abs(v - st.qty) < 1e-6 ? 'on' : ''}" data-f="chip" data-v="${v}">${st.unit === 'g' ? `${v} ${u}` : trimNum(v)}</button>`).join('');
  const nf = (v, unit = 'g') => v == null ? '–' : `${n1(v)} ${unit}`;
  const table = () => {
    const g = gramsFor(food, st.qty || 0, st.unit), p = food.per100, v = nutrFor(p, g);
    const eRow = (val) => val == null ? '–' : `${n0(toE(val))} ${eUnit()}`;
    const rows = [
      ['Energy', eRow(p.kcal), eRow(v.kcal), ''],
      ['Protein', nf(p.p), nf(v.p), 'm-p'],
      ['Carbohydrate', nf(p.c), nf(v.c), 'm-c'],
      ['of which sugars', nf(p.sugar), nf(v.sugar), 'sub'],
      ['Fat', nf(p.f), nf(v.f), 'm-f'],
      ['of which saturates', nf(p.sat), nf(v.sat), 'sub'],
      ['Dietary fibre', nf(p.fiber), nf(v.fiber), ''],
      ['Salt', nf(p.salt), nf(v.salt), ''],
    ];
    return `<table class="nutri"><caption>Nutrition information</caption>
      <thead><tr><th scope="col">Typical values</th><th scope="col">Per 100 ${u}</th><th scope="col">Your ${n0(g)} ${u}</th></tr></thead>
      <tbody>${rows.map(([l, a, b, cls]) => `<tr class="${cls === 'sub' ? 'sub' : ''}"><td>${cls.startsWith('m-') ? `<span class="${cls}"><i class="dot"></i></span>` : ''}${l}</td><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table>`;
  };
  const nutriForm = () => `
    <div class="panel tight" style="box-shadow:none">
      <strong>${food.per100.kcal == null ? 'This product has no nutrition info on file' : 'Correct the nutrition values'}</strong>
      <p class="hint">Copy the “per 100 ${u}” column from the label. Saved on this phone for next time.</p>
      <div class="grid2">
        <label class="field"><span>Energy (${eUnit()})</span><input class="input" data-n="kcal" inputmode="decimal" value="${food.per100.kcal == null ? '' : Math.round(toE(food.per100.kcal))}"></label>
        <label class="field"><span>Protein (g)</span><input class="input" data-n="p" inputmode="decimal" value="${food.per100.p ?? ''}"></label>
        <label class="field"><span>Carbohydrate (g)</span><input class="input" data-n="c" inputmode="decimal" value="${food.per100.c ?? ''}"></label>
        <label class="field"><span>Fat (g)</span><input class="input" data-n="f" inputmode="decimal" value="${food.per100.f ?? ''}"></label>
      </div>
    </div>`;
  const saveLabel = () => {
    const kcal = nutrFor(food.per100, gramsFor(food, st.qty || 0, st.unit)).kcal;
    return `${entry ? 'Save' : `Add to ${MEAL_NAME[st.meal]}`}${kcal != null ? ` · ${fmtE(kcal)} ${eUnit()}` : ''}`;
  };
  const el = sheetEl(`
    ${sheetHead(entry ? 'Edit food' : 'Add food', entry ? `${MEAL_NAME[st.meal]} · ${dayLabel(ctx.date)}` : dayLabel(ctx.date))}
    <div class="food-head">
      ${food.img ? `<img class="food-img" src="${esc(food.img)}" alt="" loading="lazy">` : `<div class="food-img ph">${I.apple}</div>`}
      <div class="fh-text"><h3>${esc(food.name)}</h3><p>${esc([food.brand, food.quantity].filter(Boolean).join(' · ') || (food.custom ? 'Your own food' : food.source === 'usda' ? `${food.group} · everyday food` : ''))}</p>${food.code ? `<p class="code num muted">${esc(food.code)}</p>` : ''}${nsBadge(food)}</div>
    </div>
    ${warnNotice(food)}
    <div class="form">
      <div class="field"><span id="f-amt-l">How much?</span>
        <div class="amount-row">
          <div class="stepper"><button type="button" data-f="dec" aria-label="Less">${I.minus}</button><input id="f-qty" inputmode="decimal" aria-labelledby="f-amt-l" value="${trimNum(st.qty)}"><button type="button" data-f="inc" aria-label="More">${I.plus}</button></div>
          <select id="f-unit" class="input" aria-label="Unit">${unitOptions()}</select>
        </div>
        <div class="chips" id="f-chips">${chips()}</div>
      </div>
      <div class="field"><span>Meal</span><div class="seg" id="f-meal">${MEALS.map(([m, l]) => `<button type="button" class="${m === st.meal ? 'on' : ''}" data-f="meal" data-v="${m}">${l}</button>`).join('')}</div></div>
      <div id="f-nform">${st.editNutri ? nutriForm() : ''}</div>
      <div id="f-table">${table()}</div>
      <p class="error" id="f-err" hidden></p>
      ${!st.editNutri ? '<button type="button" class="link" data-f="fix">Values look wrong? Correct them</button>' : ''}
    </div>
    <div class="sheet-foot">
      ${entry ? `<button type="button" class="btn danger" data-f="remove" aria-label="Remove from log">${I.trash}</button>` : ''}
      <button type="button" class="btn primary xl grow" data-f="save" id="f-save">${esc(saveLabel())}</button>
    </div>`);
  let nutriEdited = false;
  const refresh = (chipsToo = true) => {
    el.querySelector('#f-table').innerHTML = table();
    el.querySelector('#f-save').textContent = saveLabel();
    if (chipsToo) el.querySelector('#f-chips').innerHTML = chips();
  };
  const setQty = (v, writeInput = true) => {
    st.qty = clamp(Math.round(v * 100) / 100, 0, 100000);
    if (writeInput) el.querySelector('#f-qty').value = trimNum(st.qty);
    refresh();
  };
  el.addEventListener('input', e => {
    if (e.target.id === 'f-qty') { const v = parseNum(e.target.value); st.qty = v == null ? 0 : Math.max(0, v); refresh(); }
    if (e.target.dataset.n) {
      const k = e.target.dataset.n, v = parseNum(e.target.value);
      food.per100[k] = v == null ? null : (k === 'kcal' ? fromE(v) : v);
      nutriEdited = true; refresh(false);
    }
  });
  el.addEventListener('change', e => {
    if (e.target.id !== 'f-unit') return;
    const grams = gramsFor(food, st.qty || 0, st.unit);
    st.unit = e.target.value;
    const per = unitGrams(food, st.unit);
    let q = per ? grams / per : 1;
    q = st.unit === 'g' ? Math.round(q) : Math.round(q * 4) / 4;
    if (!(q > 0)) q = st.unit === 'g' ? 100 : 1;
    setQty(q);
  });
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    const f = b.dataset.f;
    if (f === 'chip') setQty(Number(b.dataset.v));
    else if (f === 'inc' || f === 'dec') {
      const step = st.unit === 'g' ? (st.qty >= 100 ? 25 : 10) : (st.unit === 'package' ? 0.25 : 0.5);
      setQty(Math.max(0, (st.qty || 0) + (f === 'inc' ? step : -step)));
    } else if (f === 'meal') {
      st.meal = b.dataset.v;
      $$('[data-f="meal"]', el).forEach(x => x.classList.toggle('on', x === b));
      refresh(false);
    } else if (f === 'fix') { st.editNutri = true; el.querySelector('#f-nform').innerHTML = nutriForm(); b.remove(); el.querySelector('[data-n="kcal"]').focus(); }
    else if (f === 'remove') {
      const r = removeEntry(ctx.date, entry.id);
      closeAll(() => { rerender(); if (r) toast('Removed', { label: 'Undo', fn: () => { (S.log[ctx.date] = S.log[ctx.date] || []).splice(r.i, 0, r.e); save(); rerender(); } }); });
    } else if (f === 'save') {
      const err = el.querySelector('#f-err');
      const grams = gramsFor(food, st.qty || 0, st.unit);
      if (!(grams > 0)) { err.textContent = 'Enter how much you had.'; err.hidden = false; return; }
      if (food.per100.kcal == null) { err.textContent = `Enter the energy value from the label (per 100 ${u}).`; err.hidden = false; return; }
      if (nutriEdited) food.edited = true;
      const newEntry = makeEntry(food, st.qty, st.unit, st.meal, entry?.id);
      if (entry) {
        const list = S.log[ctx.date] || [];
        const i = list.findIndex(x => x.id === entry.id);
        if (i >= 0) list[i] = { ...newEntry, ts: entry.ts }; else list.push(newEntry);
        touchFood(food, st.qty, st.unit); save();
        afterLog(ctx.date, newEntry, 'Saved');
      } else {
        addEntry(ctx.date, newEntry); touchFood(food, st.qty, st.unit); save();
        afterLog(ctx.date, newEntry);
      }
    }
  });
  return replace ? replaceLayer(el) : pushLayer(el);
}

function openQuickAdd(ctx, entry) {
  const st = { meal: entry?.meal || ctx.meal || mealNow() };
  const el = sheetEl(`
    ${sheetHead(entry ? 'Edit quick add' : 'Quick add', 'For when you just know the numbers')}
    <form class="form" data-q-form>
      <label class="field"><span>Description (optional)</span><input class="input" id="q-name" maxlength="60" placeholder="e.g. Lunch at work" value="${esc(entry && entry.name !== 'Quick add' ? entry.name : '')}"></label>
      <label class="field"><span>Energy (${eUnit()})</span><input class="input" id="q-kcal" inputmode="decimal" ${entry ? '' : 'autofocus'} value="${entry ? Math.round(toE(entry.kcal)) : ''}"></label>
      <div class="grid3">
        <label class="field"><span><span class="m-p"><i class="dot"></i></span>Protein g</span><input class="input" id="q-p" inputmode="decimal" value="${entry?.p ? trimNum(entry.p) : ''}"></label>
        <label class="field"><span><span class="m-c"><i class="dot"></i></span>Carbs g</span><input class="input" id="q-c" inputmode="decimal" value="${entry?.c ? trimNum(entry.c) : ''}"></label>
        <label class="field"><span><span class="m-f"><i class="dot"></i></span>Fat g</span><input class="input" id="q-f" inputmode="decimal" value="${entry?.f ? trimNum(entry.f) : ''}"></label>
      </div>
      <div class="field"><span>Meal</span><div class="seg">${MEALS.map(([m, l]) => `<button type="button" class="${m === st.meal ? 'on' : ''}" data-q="meal" data-v="${m}">${l}</button>`).join('')}</div></div>
      <p class="error" id="q-err" hidden></p>
      <div class="sheet-foot">
        ${entry ? `<button type="button" class="btn danger" data-q="remove" aria-label="Remove from log">${I.trash}</button>` : ''}
        <button class="btn primary xl grow">${entry ? 'Save' : 'Add'}</button>
      </div>
    </form>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b) return;
    if (b.dataset.q === 'meal') { st.meal = b.dataset.v; $$('[data-q="meal"]', el).forEach(x => x.classList.toggle('on', x === b)); }
    if (b.dataset.q === 'remove') { const r = removeEntry(ctx.date, entry.id); closeAll(() => { rerender(); if (r) toast('Removed', { label: 'Undo', fn: () => { (S.log[ctx.date] = S.log[ctx.date] || []).splice(r.i, 0, r.e); save(); rerender(); } }); }); }
  });
  el.querySelector('[data-q-form]').addEventListener('submit', e => {
    e.preventDefault();
    const v = parseNum(el.querySelector('#q-kcal').value);
    if (v == null || v <= 0) { const err = el.querySelector('#q-err'); err.textContent = `Enter the energy in ${eUnit()}.`; err.hidden = false; return; }
    const g = id => Math.max(0, parseNum(el.querySelector(id).value) || 0);
    const name = el.querySelector('#q-name').value.trim() || 'Quick add';
    const e2 = { id: entry?.id || uid(), quick: true, meal: st.meal, key: '', name, brand: '', amountLabel: 'Quick add', kcal: fromE(v), p: g('#q-p'), c: g('#q-c'), f: g('#q-f'), ts: entry?.ts || Date.now() };
    if (entry) { const list = S.log[ctx.date] || []; const i = list.findIndex(x => x.id === entry.id); if (i >= 0) list[i] = e2; save(); afterLog(ctx.date, e2, 'Saved'); }
    else { addEntry(ctx.date, e2); afterLog(ctx.date, e2); }
  });
  return pushLayer(el);
}

function openCreateFood(ctx, preset = {}, replace = false) {
  const st = { per: 'g' };
  const el = sheetEl(`
    ${sheetHead('Create food', 'Copy the numbers from the nutrition label')}
    <form class="form" data-c-form>
      <button type="button" class="btn block" data-c="label">${I.camera} Read the label from a photo</button>
      <input type="file" id="c-label" accept="image/*" capture="environment" hidden>
      <div id="c-label-msg" aria-live="polite"></div>
      <label class="field"><span>Name</span><input class="input" id="c-name" maxlength="80" value="${esc(preset.name || '')}" ${preset.name ? '' : 'autofocus'}></label>
      <div class="grid2">
        <label class="field"><span>Brand (optional)</span><input class="input" id="c-brand" maxlength="60"></label>
        <label class="field"><span>Barcode (optional)</span><input class="input" id="c-code" inputmode="numeric" value="${esc(preset.code || '')}"></label>
      </div>
      <div class="field"><span>The label gives values</span><div class="seg"><button type="button" class="on" data-c="per" data-v="g">Per 100 g</button><button type="button" data-c="per" data-v="serving">Per serving</button></div></div>
      <label class="field"><span>Serving size in grams <span id="c-sv-opt">(optional)</span></span><input class="input" id="c-serving" inputmode="decimal" placeholder="e.g. 30"></label>
      <div class="grid2">
        <label class="field"><span>Energy (${eUnit()})</span><input class="input" id="c-kcal" inputmode="decimal"></label>
        <label class="field"><span>Protein (g)</span><input class="input" id="c-p" inputmode="decimal"></label>
        <label class="field"><span>Carbohydrate (g)</span><input class="input" id="c-c" inputmode="decimal"></label>
        <label class="field"><span>of which sugars (g)</span><input class="input" id="c-sugar" inputmode="decimal"></label>
        <label class="field"><span>Fat (g)</span><input class="input" id="c-f" inputmode="decimal"></label>
        <label class="field"><span>Dietary fibre (g)</span><input class="input" id="c-fiber" inputmode="decimal"></label>
      </div>
      <p class="error" id="c-err" hidden></p>
      <div class="sheet-foot"><button class="btn primary xl grow">Save food</button></div>
    </form>`);
  const setPer = v => { st.per = v; $$('[data-c="per"]', el).forEach(x => x.classList.toggle('on', x.dataset.v === v)); el.querySelector('#c-sv-opt').textContent = v === 'serving' ? '(needed)' : '(optional)'; };
  const labelMsg = el.querySelector('#c-label-msg');
  el.querySelector('#c-label').addEventListener('change', async e => {
    const file = e.target.files[0]; e.target.value = ''; if (!file) return;
    labelMsg.innerHTML = '<div class="state"><span class="spinner"></span><span>Reading the label…</span></div>';
    try {
      const L = await readLabel(file);
      if (!L.readable) { labelMsg.innerHTML = `<p class="error">Couldn’t read the numbers. Take the photo straight on, close up, with the table in focus.</p>`; return; }
      const put = (id, v, conv = x => x) => { if (v != null) el.querySelector(id).value = trimNum(Math.round(conv(v) * 10) / 10); };
      if (L.name && !el.querySelector('#c-name').value.trim()) el.querySelector('#c-name').value = L.name;
      if (L.brand && !el.querySelector('#c-brand').value.trim()) el.querySelector('#c-brand').value = L.brand;
      setPer('g');
      put('#c-kcal', L.kcal, v => Math.round(toE(v))); put('#c-p', L.p); put('#c-c', L.c); put('#c-sugar', L.sugar); put('#c-f', L.f); put('#c-fiber', L.fiber); put('#c-serving', L.servingG);
      labelMsg.innerHTML = `<div class="notice ok">${I.check}<div><strong>Filled in from the label</strong><p>Per 100 g. Check the numbers${L.name ? '' : ' and add a name'}, then tap Save food.${L.note ? ' ' + esc(L.note) : ''}</p></div></div>`;
    } catch (x) { labelMsg.innerHTML = `<p class="error">${esc(aiMsg(x))}</p>`; }
  });
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (b.dataset.c === 'label') { if (!aiKey()) { openAiSetupPrompt('label'); return; } el.querySelector('#c-label').click(); return; }
    st.per = b.dataset.v;
    $$('[data-c="per"]', el).forEach(x => x.classList.toggle('on', x === b));
    el.querySelector('#c-sv-opt').textContent = st.per === 'serving' ? '(needed)' : '(optional)';
  });
  el.querySelector('[data-c-form]').addEventListener('submit', e => {
    e.preventDefault();
    const val = id => parseNum(el.querySelector(id).value);
    const err = el.querySelector('#c-err');
    const name = el.querySelector('#c-name').value.trim();
    const serving = val('#c-serving');
    const energy = val('#c-kcal');
    if (!name) { err.textContent = 'Give the food a name.'; err.hidden = false; return; }
    if (energy == null || energy < 0) { err.textContent = `Enter the energy (${eUnit()}).`; err.hidden = false; return; }
    if (st.per === 'serving' && !(serving > 0)) { err.textContent = 'Enter the serving size in grams so RepPlate can work out other amounts.'; err.hidden = false; return; }
    const factor = st.per === 'serving' ? 100 / serving : 1;
    const nz = v => v == null ? null : v * factor;
    const code = (el.querySelector('#c-code').value || '').replace(/\D/g, '');
    const food = {
      key: code || 'c_' + uid(), code, custom: true, name, brand: el.querySelector('#c-brand').value.trim(), quantity: '', ul: 'g', img: '',
      servingG: serving > 0 ? serving : null, servingLabel: serving > 0 ? `${serving} g` : '', packageG: null,
      per100: { kcal: fromE(energy) * factor, p: nz(val('#c-p')), c: nz(val('#c-c')), sugar: nz(val('#c-sugar')), f: nz(val('#c-f')), fiber: nz(val('#c-fiber')), sat: null, salt: null },
    };
    S.foods[food.key] = { ...food, lastUsed: Date.now() };
    save();
    openFoodSheet(food, ctx, null, true);
  });
  const layer = replace ? replaceLayer(el) : pushLayer(el);
  if (preset.label && aiKey()) el.querySelector('#c-label').click();
  return layer;
}

function openEntry(id) {
  const e = (S.log[foodDate] || []).find(x => x.id === id);
  if (!e) return;
  const ctx = { date: foodDate, meal: e.meal };
  if (e.quick) openQuickAdd(ctx, e); else openFoodSheet(foodFromEntry(e), ctx, e);
}

/* ============================== MEAL IDEAS (sample day sized to the goal) ============================== */
// key: [USDA id, plain name, unit]. Units: g / dry (dry weight before cooking) / ml / {n: grams per piece} / {tbsp|tsp|cup: grams}
const PF = {
  maize: [20322, 'Maize meal (dry, for pap)', { dry: 1 }],
  oats: [8120, 'Oats (dry, e.g. Jungle Oats)', { dry: 1 }],
  sorghum: [20648, 'Maltabella / mabele (dry)', { dry: 1 }],
  granola: [8037, 'Granola or muesli', {}],
  maas: [1230, 'Maas (amasi)', { ml: 1 }],
  milk: [1077, 'Full cream milk', { ml: 1 }],
  yoghurt: [1116, 'Plain yoghurt, full cream', {}],
  cottage: [1012, 'Cottage cheese', {}],
  cheddar: [1009, 'Cheddar cheese', {}],
  bread: [18075, 'Brown bread', { n: 32, one: 'slice', many: 'slices', max: 8 }],
  whiteBread: [18069, 'White bread', { n: 29, one: 'slice', many: 'slices', max: 8 }],
  wrap: [18364, 'Flour wraps (tortillas)', { n: 48, one: 'wrap', many: 'wraps', max: 4 }],
  crackers: [18235, 'Whole-wheat crackers', {}],
  pb: [16098, 'Peanut butter', { tbsp: 16, max: 3 }],
  honey: [19296, 'Honey', { tsp: 7, max: 3 }],
  sugar: [19335, 'Sugar', { tsp: 4.2 }],
  marg: [4610, 'Margarine or butter', { tsp: 5 }],
  oil: [4060, 'Sunflower oil', { tsp: 4.5 }],
  mayo: [4025, 'Mayonnaise', { tbsp: 13.8, max: 2 }],
  eggScr: [1132, 'Scrambled eggs', { n: 61, one: 'egg', many: 'eggs', max: 5 }],
  eggBoil: [1129, 'Boiled eggs', { n: 50, one: 'egg', many: 'eggs', max: 5 }],
  eggFry: [1128, 'Fried eggs', { n: 46, one: 'egg', many: 'eggs', max: 4 }],
  omelette: [1130, 'Omelette', { n: 61, one: 'egg', many: 'eggs', max: 5 }],
  thigh: [5098, 'Chicken thighs, skinless, cooked', { n: 116, one: 'thigh', many: 'thighs', max: 4 }],
  drum: [5069, 'Chicken drumsticks, cooked', { n: 105, one: 'drumstick', many: 'drumsticks', max: 4 }],
  breast: [5064, 'Chicken breast, cooked', {}],
  liver: [5661, 'Chicken livers, pan-fried', {}],
  mince: [23570, 'Beef mince, cooked', {}],
  stew: [23090, 'Beef stew meat, cooked', {}],
  steak: [13930, 'Rump or sirloin steak, cooked', {}],
  lamb: [17024, 'Lamb chops, cooked (meat only)', {}],
  pork: [10033, 'Pork chop, lean, cooked', {}],
  wors: [7956, 'Boerewors', {}],
  viennas: [7945, 'Viennas', { n: 48, one: 'vienna', many: 'viennas', max: 4 }],
  polony: [7008, 'Polony', { n: 28, one: 'slice', many: 'slices', max: 4 }],
  ham: [7029, 'Ham', { n: 28, one: 'slice', many: 'slices', max: 4 }],
  fish: [15016, 'White fish (e.g. hake), cooked', {}],
  pilchards: [15089, 'Pilchards in tomato sauce', {}],
  tuna: [15121, 'Tuna in water, drained', {}],
  sugarbeans: [16020, 'Sugar beans, cooked', {}],
  samp: [20030, 'Samp, cooked', {}],
  lentils: [16070, 'Lentils, cooked', {}],
  chickpeas: [16057, 'Chickpeas, cooked', {}],
  bakedbeans: [16006, 'Baked beans', {}],
  rice: [20045, 'White rice, cooked', { cup: 158 }],
  brownRice: [20037, 'Brown rice, cooked', { cup: 202 }],
  pasta: [20121, 'Pasta, cooked', {}],
  potato: [11365, 'Potatoes, boiled', {}],
  bakedPotato: [11674, 'Baked potato', {}],
  mash: [11371, 'Mashed potato', {}],
  chips: [11841, 'Oven chips', {}],
  potatoSalad: [11414, 'Potato salad', {}],
  corn: [11168, 'Mielie (corn on the cob)', { n: 103, one: 'mielie', many: 'mielies', step: 0.5, max: 3 }],
  butternut: [11486, 'Butternut, cooked', {}],
  pumpkin: [11423, 'Pumpkin, cooked', {}],
  cabbage: [11110, 'Cabbage, cooked', {}],
  spinach: [11458, 'Spinach, cooked', {}],
  carrots: [11125, 'Carrots, cooked', {}],
  peas: [11313, 'Peas, cooked', {}],
  greenbeans: [11053, 'Green beans, cooked', {}],
  mixedveg: [11584, 'Mixed vegetables, cooked', {}],
  beetroot: [11081, 'Beetroot, cooked', {}],
  tomato: [11529, 'Tomato', {}],
  onion: [11282, 'Onion', {}],
  lettuce: [11252, 'Lettuce', {}],
  cucumber: [11205, 'Cucumber', {}],
  pepper: [11333, 'Green pepper', {}],
  banana: [9040, 'Banana', { n: 118, one: 'banana', many: 'bananas', step: 0.5, max: 2 }],
  apple: [9003, 'Apple', { n: 182, one: 'apple', many: 'apples', step: 0.5, max: 2 }],
  orange: [9200, 'Orange', { n: 140, one: 'orange', many: 'oranges', step: 0.5, max: 2 }],
  pear: [9252, 'Pear', { n: 178, one: 'pear', many: 'pears', step: 0.5, max: 2 }],
  avo: [9037, 'Avocado', { n: 150, one: 'avocado', many: 'avocados', step: 0.5, max: 1 }],
  grapes: [9132, 'Grapes', {}],
  pineapple: [9266, 'Pineapple', {}],
  mango: [9176, 'Mango', {}],
  raisins: [9298, 'Raisins', {}],
  peanuts: [16090, 'Peanuts, salted', {}],
};
// items: [food key, grams at the starting size, scales with your goal? (default yes)]
const MEAL_IDEAS = {
  breakfast: [
    { name: 'Jungle Oats with banana & peanut butter', tags: ['Budget', 'Meat-free'], items: [['oats', 60], ['milk', 200], ['banana', 118], ['pb', 16]] },
    { name: 'Scrambled eggs on toast', tags: ['High protein', 'Meat-free'], items: [['eggScr', 183], ['bread', 64], ['marg', 5, false], ['tomato', 100, false]] },
    { name: 'Soft maize porridge with maas', tags: ['Budget', 'Meat-free'], items: [['maize', 60], ['maas', 250], ['sugar', 8, false]] },
    { name: 'Peanut butter & banana sandwiches', tags: ['Budget', 'No cooking'], items: [['bread', 64], ['pb', 32], ['banana', 118], ['milk', 250]] },
    { name: 'Yoghurt with oats & fruit', tags: ['No cooking', 'Meat-free'], items: [['yoghurt', 250], ['oats', 40], ['banana', 118], ['peanuts', 15, false]] },
    { name: 'Maltabella with milk & honey', tags: ['Budget', 'Meat-free'], items: [['sorghum', 60], ['milk', 250], ['honey', 7, false]] },
    { name: 'Fried eggs, wors & toast', tags: ['High protein', 'Weekend'], items: [['eggFry', 92], ['wors', 80], ['bread', 64], ['tomato', 100, false]] },
    { name: 'Cheese & tomato omelette', tags: ['High protein', 'Meat-free'], items: [['omelette', 183], ['cheddar', 30], ['bread', 32], ['tomato', 80, false]] },
    { name: 'Avo & egg on toast', tags: ['Meat-free'], items: [['bread', 64], ['avo', 75], ['eggBoil', 100]] },
    { name: 'Baked beans & egg on toast', tags: ['Budget', 'Meat-free'], items: [['bread', 64], ['bakedbeans', 130], ['eggFry', 46]] },
    { name: 'Banana & oat smoothie', tags: ['No cooking', 'Meat-free'], items: [['milk', 300], ['banana', 118], ['oats', 30], ['pb', 16]] },
    { name: 'Cheese & tomato toasties', tags: ['Meat-free'], items: [['whiteBread', 58], ['cheddar', 40], ['tomato', 60, false], ['marg', 5, false]] },
  ],
  lunch: [
    { name: 'Tuna & avo sandwiches', tags: ['High protein', 'No cooking'], items: [['bread', 64], ['tuna', 120], ['avo', 75], ['tomato', 60, false]] },
    { name: 'Pilchards & pap', tags: ['Budget', 'High protein'], items: [['pilchards', 155], ['maize', 80], ['onion', 50, false], ['tomato', 80, false]] },
    { name: 'Samp & beans with chicken', tags: ['Budget'], items: [['samp', 200], ['sugarbeans', 150], ['drum', 105]] },
    { name: 'Chicken & rice with cabbage', tags: ['High protein'], items: [['thigh', 150], ['rice', 200], ['cabbage', 100, false], ['oil', 5, false]] },
    { name: 'Boiled egg & cheese sandwiches', tags: ['Meat-free'], items: [['bread', 64], ['eggBoil', 100], ['cheddar', 25], ['tomato', 60, false]] },
    { name: 'Chicken mayo wraps', tags: ['High protein'], items: [['wrap', 96], ['breast', 120], ['mayo', 14], ['lettuce', 30, false], ['tomato', 60, false]] },
    { name: 'Polony & cheese sandwiches', tags: ['Budget', 'No cooking'], items: [['whiteBread', 58], ['polony', 56], ['cheddar', 20], ['tomato', 60, false]] },
    { name: 'Sugar bean curry & rice', tags: ['Budget', 'Meat-free'], items: [['sugarbeans', 200], ['rice', 158], ['onion', 50, false], ['tomato', 80, false], ['oil', 5, false]] },
    { name: 'Tuna pasta salad', tags: ['High protein'], items: [['pasta', 200], ['tuna', 100], ['mayo', 14], ['cucumber', 60, false], ['pepper', 40, false]] },
    { name: 'Mince & mash with peas', tags: ['High protein'], items: [['mince', 120], ['mash', 200], ['peas', 80, false]] },
    { name: 'Chicken, potato salad & mielie', tags: ['Braai'], items: [['drum', 105], ['potatoSalad', 150], ['corn', 103]] },
    { name: 'Viennas, pap & baked beans', tags: ['Budget'], items: [['viennas', 96], ['maize', 70], ['bakedbeans', 130]] },
  ],
  dinner: [
    { name: 'Chicken, pap & spinach', tags: ['Budget', 'High protein'], items: [['thigh', 232], ['maize', 100], ['spinach', 150, false], ['oil', 5, false]] },
    { name: 'Mince & rice with butternut', tags: ['High protein'], items: [['mince', 150], ['rice', 237], ['butternut', 150, false], ['tomato', 80, false], ['onion', 40, false]] },
    { name: 'Boerewors, pap & baked beans', tags: ['Braai'], items: [['wors', 150], ['maize', 100], ['bakedbeans', 130]] },
    { name: 'Spaghetti bolognaise', tags: ['High protein'], items: [['pasta', 220], ['mince', 120], ['tomato', 150, false], ['onion', 50, false], ['cheddar', 20, false]] },
    { name: 'Pork chop, potatoes & carrots', tags: ['High protein'], items: [['pork', 150], ['potato', 300], ['carrots', 100, false], ['marg', 10, false]] },
    { name: 'Lentil curry & rice', tags: ['Budget', 'Meat-free'], items: [['lentils', 200], ['rice', 200], ['tomato', 100, false], ['onion', 60, false], ['oil', 10, false]] },
    { name: 'Beef stew with pap', tags: ['High protein'], items: [['stew', 150], ['maize', 90], ['potato', 100, false], ['carrots', 80, false], ['onion', 40, false]] },
    { name: 'Chicken curry & rice', tags: ['High protein'], items: [['thigh', 200], ['rice', 200], ['onion', 50, false], ['tomato', 80, false], ['oil', 5, false]] },
    { name: 'Grilled fish, rice & veg', tags: ['High protein'], items: [['fish', 180], ['rice', 200], ['mixedveg', 120, false], ['marg', 5, false]] },
    { name: 'Steak, baked potato & salad', tags: ['High protein'], items: [['steak', 180], ['bakedPotato', 250], ['lettuce', 50, false], ['tomato', 80, false], ['cucumber', 50, false]] },
    { name: 'Lamb chops, pap & green beans', tags: ['Braai', 'High protein'], items: [['lamb', 150], ['maize', 90], ['greenbeans', 100, false]] },
    { name: 'Chicken livers & pap', tags: ['Budget', 'High protein'], items: [['liver', 150], ['maize', 90], ['onion', 50, false], ['tomato', 80, false]] },
    { name: 'Cottage pie', tags: ['High protein'], items: [['mince', 150], ['mash', 250], ['peas', 80, false]] },
    { name: 'Chicken stir-fry with brown rice', tags: ['High protein'], items: [['breast', 160], ['brownRice', 202], ['mixedveg', 150, false], ['oil', 5, false]] },
    { name: 'Fish & oven chips', tags: ['High protein'], items: [['fish', 180], ['chips', 200], ['peas', 80, false]] },
    { name: 'Chickpea & butternut curry', tags: ['Meat-free'], items: [['chickpeas', 200], ['rice', 158], ['butternut', 150, false], ['onion', 50, false], ['oil', 5, false]] },
  ],
  snack: [
    { name: 'Peanuts & a banana', tags: ['Budget', 'No cooking'], items: [['peanuts', 30], ['banana', 118]] },
    { name: 'Yoghurt & an apple', tags: ['No cooking'], items: [['yoghurt', 175], ['apple', 182]] },
    { name: 'Peanut butter sandwich', tags: ['Budget', 'No cooking'], items: [['bread', 64], ['pb', 16]] },
    { name: 'Glass of maas & an orange', tags: ['Budget', 'No cooking'], items: [['maas', 250], ['orange', 140]] },
    { name: 'Boiled eggs & cheese', tags: ['High protein'], items: [['eggBoil', 100], ['cheddar', 30]] },
    { name: 'Mielie with butter', tags: ['Budget'], items: [['corn', 103], ['marg', 5]] },
    { name: 'Raisins & peanuts', tags: ['No cooking'], items: [['raisins', 30], ['peanuts', 25]] },
    { name: 'Cottage cheese & crackers', tags: ['High protein', 'No cooking'], items: [['cottage', 100], ['crackers', 28]] },
    { name: 'Apple & peanut butter', tags: ['No cooking'], items: [['apple', 182], ['pb', 16]] },
    { name: 'Fruit salad with yoghurt', tags: ['No cooking'], items: [['yoghurt', 150], ['pineapple', 100], ['grapes', 80]] },
    { name: 'Ham & cheese on crackers', tags: ['No cooking'], items: [['crackers', 28], ['ham', 28], ['cheddar', 20]] },
    { name: 'Granola & yoghurt', tags: ['No cooking'], items: [['granola', 40], ['yoghurt', 150]] },
  ],
};
/* ---------- food needs: allergies, intolerances and how you eat ---------- */
// Swap-in foods (same nutrition source where the swap is nutritionally close) and extra everyday foods.
Object.assign(PF, {
  lfMilk: [1077, 'Lactose-free milk', { ml: 1 }],
  soyMilk: [16139, 'Soya milk', { ml: 1 }],
  riceMilk: [14639, 'Rice milk', { ml: 1 }],
  lfYoghurt: [1116, 'Lactose-free yoghurt', {}],
  dfMarg: [4610, 'Dairy-free margarine', { tsp: 5 }],
  dfMash: [11365, 'Mashed potato, no milk or butter', {}],
  gfBread: [28342, 'Gluten-free bread', { n: 35, one: 'slice', many: 'slices', max: 8 }],
  gfWrap: [18363, 'Corn tortillas (gluten-free)', { n: 26, one: 'tortilla', many: 'tortillas', max: 6 }],
  gfCrackers: [19816, 'Rice cakes', { n: 9, one: 'rice cake', many: 'rice cakes', max: 6 }],
  gfPasta: [20092, 'Gluten-free pasta, cooked', {}],
  gfOats: [8120, 'Gluten-free oats (dry)', { dry: 1 }],
  efMayo: [4025, 'Egg-free mayonnaise', { tbsp: 13.8, max: 2 }],
  efPotatoSalad: [11414, 'Potato salad (egg-free mayo)', {}],
  halaalWors: [7956, 'Halaal beef boerewors', {}],
  chickenViennas: [7024, 'Chicken viennas', { n: 45, one: 'vienna', many: 'viennas', max: 4 }],
  chickenPolony: [7008, 'Chicken polony', { n: 28, one: 'slice', many: 'slices', max: 4 }],
  chickenSlices: [7961, 'Sliced chicken breast', { n: 20, one: 'slice', many: 'slices', max: 5 }],
  chickenMince: [5333, 'Chicken mince, cooked', {}],
  soyaMince: [16106, 'Soya mince (dry, e.g. Imana)', { dry: 1 }],
  kidneyBeans: [16028, 'Kidney beans, cooked', {}],
  sweetPotato: [11876, 'Sweet potato, boiled', {}],
  sunSeeds: [12036, 'Sunflower seeds', {}],
  popcorn: [19034, 'Popcorn, air-popped', {}],
  riceCakes: [19816, 'Rice cakes', { n: 9, one: 'rice cake', many: 'rice cakes', max: 6 }],
});
// More meals so every way of eating still gets plenty of choice.
MEAL_IDEAS.breakfast.push(
  { name: 'Avo & tomato toast', tags: ['No cooking', 'Meat-free'], items: [['bread', 64], ['avo', 75], ['tomato', 80, false]] },
  { name: 'Fruit salad with seeds', tags: ['No cooking', 'Meat-free'], items: [['banana', 118], ['apple', 182], ['raisins', 20], ['sunSeeds', 20]] },
  { name: 'Rice cakes with peanut butter & banana', tags: ['No cooking', 'Meat-free'], items: [['riceCakes', 27], ['pb', 16], ['banana', 118]] },
  { name: 'Sweet potato & beans', tags: ['Budget', 'Meat-free'], items: [['sweetPotato', 200], ['bakedbeans', 130], ['spinach', 60, false]] },
);
MEAL_IDEAS.lunch.push(
  { name: 'Chakalaka & pap', tags: ['Budget', 'Meat-free'], items: [['maize', 80], ['bakedbeans', 150], ['carrots', 60, false], ['pepper', 40, false], ['onion', 40, false], ['oil', 5, false]] },
  { name: 'Bean & avo wraps', tags: ['Meat-free'], items: [['wrap', 96], ['kidneyBeans', 120], ['avo', 75], ['tomato', 60, false], ['lettuce', 30, false]] },
  { name: 'Lentil & veg soup with bread', tags: ['Budget', 'Meat-free'], items: [['lentils', 200], ['bread', 64], ['carrots', 80, false], ['onion', 50, false], ['tomato', 100, false]] },
  { name: 'Sweet potato & bean bowl', tags: ['Meat-free'], items: [['sweetPotato', 250], ['kidneyBeans', 120], ['spinach', 80, false], ['oil', 5, false]] },
  { name: 'Chicken, rice & bean salad', tags: ['High protein'], items: [['breast', 120], ['rice', 158], ['kidneyBeans', 80], ['tomato', 60, false], ['cucumber', 50, false]] },
);
MEAL_IDEAS.dinner.push(
  { name: 'Umngqusho (samp & beans) with spinach', tags: ['Budget', 'Meat-free'], items: [['samp', 220], ['sugarbeans', 150], ['spinach', 120, false], ['onion', 40, false], ['oil', 5, false]] },
  { name: 'Potato & pea curry with rice', tags: ['Budget', 'Meat-free'], items: [['potato', 200], ['peas', 100], ['rice', 158], ['onion', 50, false], ['tomato', 80, false], ['oil', 10, false]] },
  { name: 'Soya mince bolognaise', tags: ['Budget', 'Meat-free'], items: [['pasta', 220], ['soyaMince', 50], ['tomato', 150, false], ['onion', 50, false], ['oil', 5, false]] },
  { name: 'Bean & veg stew with pap', tags: ['Budget', 'Meat-free'], items: [['kidneyBeans', 180], ['maize', 90], ['carrots', 80, false], ['potato', 100, false], ['onion', 40, false], ['tomato', 80, false]] },
  { name: 'Grilled chicken, sweet potato & green beans', tags: ['High protein'], items: [['breast', 180], ['sweetPotato', 250], ['greenbeans', 100, false], ['oil', 5, false]] },
);
MEAL_IDEAS.snack.push(
  { name: 'Popcorn & an apple', tags: ['Budget'], items: [['popcorn', 25], ['apple', 182]] },
  { name: 'Banana & sunflower seeds', tags: ['No cooking'], items: [['banana', 118], ['sunSeeds', 20]] },
  { name: 'Rice cakes with avo', tags: ['No cooking'], items: [['riceCakes', 18], ['avo', 75], ['tomato', 40, false]] },
  { name: 'Orange & raisins', tags: ['Budget', 'No cooking'], items: [['orange', 140], ['raisins', 30]] },
);
// What each meal-idea food contains.
const FOOD_TAGS = {
  milk: 'dairy lactose', maas: 'dairy lactose', yoghurt: 'dairy lactose', cottage: 'dairy lactose', cheddar: 'dairy', marg: 'dairy', mash: 'dairy lactose',
  lfMilk: 'dairy', lfYoghurt: 'dairy', soyMilk: 'soy', soyaMince: 'soy',
  oats: 'gluten', granola: 'gluten treenut', bread: 'gluten', whiteBread: 'gluten', wrap: 'gluten', crackers: 'gluten', pasta: 'gluten',
  pb: 'peanut', peanuts: 'peanut', honey: 'honey',
  eggScr: 'egg', eggBoil: 'egg', eggFry: 'egg', omelette: 'egg', mayo: 'egg', potatoSalad: 'egg',
  thigh: 'meat', drum: 'meat', breast: 'meat', liver: 'meat', lamb: 'meat', chickenMince: 'meat', chickenSlices: 'meat',
  mince: 'meat beef', stew: 'meat beef', steak: 'meat beef', pork: 'meat pork', ham: 'meat pork',
  wors: 'meat beef pork gluten', viennas: 'meat beef pork gluten', polony: 'meat beef pork gluten',
  halaalWors: 'meat beef gluten', chickenViennas: 'meat gluten', chickenPolony: 'meat gluten',
  fish: 'fish', pilchards: 'fish', tuna: 'fish',
};
// Swaps, tried in order: [swap-in food, part of the meal name to change, new words, amount factor]
const SUBS = {
  milk: [['lfMilk', /\bmilk\b/i, 'lactose-free milk'], ['soyMilk', /\bmilk\b/i, 'soya milk'], ['riceMilk', /\bmilk\b/i, 'rice milk']],
  maas: [['lfMilk', /\bmaas\b/i, 'lactose-free milk'], ['soyMilk', /\bmaas\b/i, 'soya milk'], ['riceMilk', /\bmaas\b/i, 'rice milk']],
  yoghurt: [['lfYoghurt', /\byoghurt\b/i, 'lactose-free yoghurt']],
  marg: [['dfMarg', /\bwith butter\b/i, 'with dairy-free spread']],
  mash: [['dfMash']],
  mayo: [['efMayo', /\bmayo\b/i, 'egg-free mayo']],
  potatoSalad: [['efPotatoSalad']],
  bread: [['gfBread']], whiteBread: [['gfBread']],
  wrap: [['gfWrap', /\bwraps\b/i, 'tortillas']],
  crackers: [['gfCrackers', /\bcrackers\b/i, 'rice cakes']],
  pasta: [['gfPasta']],
  oats: [['gfOats', /\bJungle Oats\b/, 'Gluten-free oats']],
  wors: [['halaalWors']],
  viennas: [['chickenViennas', /\bviennas\b/i, 'chicken viennas']],
  polony: [['chickenPolony', /\bpolony\b/i, 'chicken polony']],
  ham: [['chickenSlices', /\bham\b/i, 'chicken']],
  mince: [['chickenMince', /\bmince\b/i, 'chicken mince'], ['soyaMince', /\bmince\b/i, 'soya mince', 0.4]],
};
const DROP_NAME = { honey: /\s*&\s*honey\b/i };
const NEEDS = [
  ['lactose', 'Lactose intolerant', 'lactose'], ['dairy', 'Milk / dairy allergy', 'dairy'], ['egg', 'Eggs', 'eggs'], ['peanut', 'Peanuts', 'peanuts'],
  ['treenut', 'Tree nuts', 'tree nuts'], ['gluten', 'Gluten / wheat', 'gluten'], ['soy', 'Soya', 'soya'], ['fish', 'Fish', 'fish'],
  ['shellfish', 'Shellfish', 'shellfish'], ['sesame', 'Sesame', 'sesame'],
];
const NEEDS_ALSO = [['pork', 'Halaal (no pork)', 'pork'], ['beef', 'No beef', 'beef']];
const EAT_STYLES = [['all', 'Everything', ''], ['pescatarian', 'Pescatarian', 'Fish and seafood, but no other meat'], ['vegetarian', 'Vegetarian', 'No meat or fish'], ['vegan', 'Vegan', 'No animal products: no meat, fish, dairy, eggs or honey']];
const TAG_WORD = Object.fromEntries([...NEEDS, ...NEEDS_ALSO].map(([k, , w]) => [k, w]).concat([['meat', 'meat'], ['honey', 'honey'], ['animal', 'animal products']]));
function diet() {
  const d = S.settings.diet && typeof S.settings.diet === 'object' ? S.settings.diet : (S.settings.diet = {});
  if (!Array.isArray(d.avoid)) d.avoid = [];
  if (!EAT_STYLES.some(([k]) => k === d.style)) d.style = 'all';
  if (typeof d.other !== 'string') d.other = '';
  return d;
}
function dietTags() {
  const d = diet(), t = new Set(d.avoid);
  if (t.has('dairy')) t.add('lactose');
  if (d.style === 'pescatarian') t.add('meat');
  if (d.style === 'vegetarian') ['meat', 'fish', 'shellfish'].forEach(x => t.add(x));
  if (d.style === 'vegan') ['meat', 'fish', 'shellfish', 'dairy', 'lactose', 'egg', 'honey', 'animal'].forEach(x => t.add(x));
  if (t.has('meat')) { t.add('pork'); t.add('beef'); }
  return t;
}
function dietWords() {
  return diet().other.toLowerCase().split(/[,;\n/]+|\band\b/).map(w => w.trim().replace(/[^a-z0-9ëé' -]/g, '').trim()).filter(w => w.length >= 3).slice(0, 20);
}
function hasWord(text, w) {
  const t = String(text).toLowerCase(), base = w.replace(/(es|s)$/, '');
  return new RegExp(`\\b${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(e?s)?\\b`).test(t);
}
function dietActive() { const d = diet(); return d.style !== 'all' || d.avoid.length > 0 || dietWords().length > 0; }
function dietSummary() {
  const d = diet(), parts = [];
  if (d.style !== 'all') parts.push(EAT_STYLES.find(([k]) => k === d.style)[1]);
  for (const [k, l] of [...NEEDS, ...NEEDS_ALSO]) if (d.avoid.includes(k)) parts.push(k === 'lactose' ? 'lactose-free' : k === 'pork' ? 'halaal' : k === 'beef' ? 'no beef' : `no ${TAG_WORD[k]}`);
  const w = dietWords(); if (w.length) parts.push(`no ${w.join(', ')}`);
  return parts.join(' · ');
}
const pfShort = k => PF[k][1].replace(/\s*\((dry|for pap|e\.g\.)[^)]*\)/gi, '').replace(/, (cooked|boiled|pan-fried|drained|salted|skinless, cooked|lean, cooked)$/i, '').trim();
const tagsOf = k => (FOOD_TAGS[k] || '').split(' ').filter(Boolean);
const clashes = (k, avoid) => tagsOf(k).some(t => avoid.has(t));
// Returns the meal changed to fit the person's food needs, or null when it can't be made to fit.
function adaptMeal(opt, avoid = dietTags(), words = dietWords()) {
  if (!avoid.size && !words.length) return opt;
  let name = opt.name, changed = false;
  const items = [], swaps = [];
  for (const it of opt.items) {
    const [k, g, sc] = it;
    if (!clashes(k, avoid)) { items.push(it); continue; }
    const sub = (SUBS[k] || []).find(([to]) => !clashes(to, avoid));
    if (sub) {
      const [to, re, words2, factor = 1] = sub;
      items.push([to, g * factor, sc]); changed = true;
      if (re) name = name.replace(re, words2);
      swaps.push(`${pfShort(to)} instead of ${pfShort(k).toLowerCase()}`);
      continue;
    }
    if (sc === false) { if (DROP_NAME[k]) name = name.replace(DROP_NAME[k], ''); swaps.push(`no ${pfShort(k).toLowerCase()}`); changed = true; continue; }
    return null;
  }
  if (words.length) {
    const text = `${name} ${items.map(([k]) => PF[k][1]).join(' ')}`;
    if (words.some(w => hasWord(text, w))) return null;
  }
  if (!changed) return opt;
  return { ...opt, name: name[0].toUpperCase() + name.slice(1), items, swaps };
}
let DIET_MEMO = { key: null };
function dietMemo() {
  const d = diet(), key = JSON.stringify([[...d.avoid].sort(), d.style, d.other]);
  if (DIET_MEMO.key !== key) DIET_MEMO = { key, ok: {}, meals: {} };
  return DIET_MEMO;
}
function allowedIdx(pool) {
  const M = dietMemo();
  if (!M.ok[pool]) { const avoid = dietTags(), words = dietWords(); M.ok[pool] = MEAL_IDEAS[pool].map((o, i) => (adaptMeal(o, avoid, words) ? i : -1)).filter(i => i >= 0); }
  return M.ok[pool];
}
function ideaFor(pool, i) {
  const M = dietMemo(), k = pool + i;
  if (!(k in M.meals)) M.meals[k] = adaptMeal(MEAL_IDEAS[pool][i]) || MEAL_IDEAS[pool][i];
  return M.meals[k];
}
function fitPick(pool, i, taken = []) {
  const ok = allowedIdx(pool); if (!ok.length) return null;
  const n = MEAL_IDEAS[pool].length, start = Number.isInteger(i) ? ((i % n) + n) % n : 0;
  if (ok.includes(start) && !taken.includes(start)) return start;
  for (let s = 1; s <= n; s++) { const j = (start + s) % n; if (ok.includes(j) && !taken.includes(j)) return j; }
  return ok.includes(start) ? start : ok[0];
}
// Same picks, with any meal that no longer fits replaced by the next one that does (always the same answer for the same picks).
function fitPicks(picks = {}) {
  const out = {}, taken = [];
  for (const slot of ['breakfast', 'lunch', 'dinner']) out[slot] = fitPick(slot, picks[slot]);
  for (const s of SNACK_SLOTS) { const v = fitPick('snack', picks[s], taken); out[s] = v; if (v != null) taken.push(v); }
  return out;
}

/* ---------- spotting allergens in foods: label data first, then the food's name and ingredients ---------- */
const TAG_RX = {
  dairy: /\b(milk|milks|cheese|cheeses|cheddar|gouda|mozzarella|feta|parmesan|ricotta|yogh?urts?|maas|amasi|butter|buttermilk|cream|creamer|whey|casein|ghee|custard|lactose|curds?|milkshakes?)\b/,
  lactose: /\b(milk|milks|yogh?urts?|maas|amasi|cream|creamer|whey|custard|lactose|buttermilk|cottage|ricotta|cream cheese|condensed|evaporated|milkshakes?|ice ?cream)\b/,
  egg: /\b(eggs?|mayo|mayonnaise|omelett?es?|meringues?|quiche|albumen?)\b/,
  gluten: /\b(wheat|breads?|flour|pasta|spaghetti|macaroni|noodles?|barley|rye|couscous|semolina|bran|biscuits?|crackers?|cookies?|cakes?|muffins?|rusks?|pizzas?|wraps?|tortillas?|pies?|pastry|pastries|crumbed|breaded|beer|oats?|oatmeal|malt|weet-?bix|buns?|rolls?|scones?|pancakes?|waffles?|crumpets?|vetkoek|samoosas?|croissants?|bagels?|pretzels?)\b/,
  peanut: /\b(peanuts?|groundnuts?|satay)\b/,
  treenut: /\b(almonds?|cashews?|walnuts?|pecans?|hazelnuts?|macadamias?|pistachios?|brazil nuts?|pine nuts?|nutella|marzipan|praline|mixed nuts|nuts)\b/,
  soy: /\b(soy|soya|soybeans?|soymilk|tofu|edamame|tempeh|miso)\b/,
  fish: /\b(fish|tuna|salmon|hake|pilchards?|sardines?|snoek|anchov(y|ies)|cod|haddock|trout|kingklip|mackerel|tilapia|yellowtail|kippers?)\b/,
  shellfish: /\b(prawns?|shrimps?|crabs?|lobsters?|crayfish|mussels?|oysters?|clams?|calamari|squid|octopus|scallops?|seafood|crustaceans?|molluscs?)\b/,
  sesame: /\b(sesame|tahini|hummus)\b/,
  pork: /\b(pork|ham|bacon|gammon|lard|salami|chorizo|pepperoni|prosciutto|pancetta|gelatine?|polony|viennas?|frankfurters?|bologna)\b/,
  beef: /\b(beef|steak|biltong|boerewors|oxtail|brisket|rump|sirloin|mince|dro[eë]wors|corned)\b/,
  meat: /\b(chicken|beef|pork|lamb|mutton|veal|ham|bacon|sausages?|wors|boerewors|polony|viennas?|salami|mince|steak|steaks|livers?|turkey|duck|venison|biltong|frankfurters?|bologna|gelatine?|lard|burgers?|meat|meats|meatballs?|ribs|chops?|gammon|oxtail|giblets|gizzards|kidneys)\b/,
  honey: /\bhoney\b/,
};
const TAG_NOT = {
  dairy: /peanut butter|nut butter|butternut|butter ?beans?|cocoa butter|shea butter|(coconut|soy|soya|almond|rice|oat|plant|cashew)[ -]?(milk|cream|yogh?urt)s?|soymilk|cream of tartar|cream crackers?|dairy[- ]free|non[- ]dairy|milk[- ]free/g,
  lactose: /peanut butter|butternut|(coconut|soy|soya|almond|rice|oat|plant|cashew)[ -]?(milk|cream|yogh?urt)s?|soymilk|cream of tartar|cream crackers?|dairy[- ]free|non[- ]dairy|milk[- ]free/g,
  egg: /egg[- ]free|eggplants?|eggless|vegan mayo(nnaise)?/g,
  gluten: /gluten[- ]free|rice (cakes?|noodles?|crackers?)|corn (tortillas?|cakes?)|buckwheat|sweet ?breads?|wheat[- ]free/g,
  treenut: /nuts, coconut|nutmeg|doughnuts?|coconuts?|peanuts?|nut[- ]free|butternut/g,
  peanut: /peanut[- ]free/g,
  meat: /(veggie|soya?|bean|vegetarian) ?burgers?|veggie|vegetarian|vegan|soya mince|meat[- ]free|meatless|meat extender|meat substitute|plant[- ]based|(chicken|beef|bacon|meaty)[- ]flavou?r(ed)?|imitation/g,
  pork: /veggie|vegetarian|vegan|(chicken|beef|turkey) (viennas?|polony|frankfurters?|bologna|ham)|(frankfurters?|bologna|polony|viennas?), (chicken|beef|turkey)|halaa?l|(pork|ham)[- ]free|bacon[- ]flavou?r(ed)?/g,
  beef: /veggie|vegetarian|vegan|soya mince|(chicken|turkey|pork|lamb) mince|beef[- ]flavou?r(ed)?/g,
  fish: /fish[- ]free/g,
  soy: /soy(a|bean)? oil|soya?[- ]free/g,
};
const GROUP_TAGS = { 'Poultry': ['meat'], 'Pork': ['meat', 'pork'], 'Beef': ['meat', 'beef'], 'Lamb, veal & game': ['meat'], 'Sausages & cold meats': ['meat'], 'Fish & seafood': [], 'Baked goods': ['gluten'] };
function textTags(text, group = '') {
  const t = String(text || '').toLowerCase(), out = new Set();
  for (const [tag, rx] of Object.entries(TAG_RX)) {
    const s = TAG_NOT[tag] ? t.replace(TAG_NOT[tag], ' ') : t;
    if (rx.test(s)) out.add(tag);
  }
  if (/lactose[- ]?(free|reduced)/.test(t)) out.delete('lactose');
  for (const g of GROUP_TAGS[group] || []) if (!(g === 'gluten' && /gluten[- ]free/.test(t))) out.add(g);
  if (group === 'Fish & seafood' && !out.has('shellfish')) out.add('fish');
  if (out.has('fish') || out.has('shellfish')) out.add('animal');
  if (out.has('meat') || out.has('dairy') || out.has('egg') || out.has('honey')) out.add('animal');
  return out;
}
const OFF_ALLERGEN = { 'en:milk': ['dairy', 'lactose'], 'en:eggs': ['egg'], 'en:gluten': ['gluten'], 'en:peanuts': ['peanut'], 'en:nuts': ['treenut'], 'en:soybeans': ['soy'], 'en:fish': ['fish'], 'en:crustaceans': ['shellfish'], 'en:molluscs': ['shellfish'], 'en:sesame-seeds': ['sesame'] };
// Which of the person's needs this food clashes with. level: 'label' (on the product's allergen list), 'likely' (from its name or ingredients), 'traces'.
function foodWarnings(food) {
  if (!food) return [];
  const avoid = dietTags(), words = dietWords();
  if (!avoid.size && !words.length) return [];
  const found = new Map();
  const add = (tag, level) => { const rank = { label: 3, likely: 2, traces: 1 }; if (!found.has(tag) || rank[level] > rank[found.get(tag)]) found.set(tag, level); };
  const lactoseFree = /lactose[- ]?(free|reduced)/i.test(food.name || '') || (food.labels || []).some(l => /lactose-free|no-lactose/.test(l));
  for (const a of food.allergens || []) for (const t of OFF_ALLERGEN[a] || []) add(t, 'label');
  for (const a of food.traces || []) for (const t of OFF_ALLERGEN[a] || []) add(t, 'traces');
  const text = [food.name, food.ingredients].filter(Boolean).join(' ');
  for (const t of textTags(text, food.group)) add(t, 'likely');
  if (food.vegan === 'no') add('animal', 'label');
  if (food.vegetarian === 'no') add('meat', 'label');
  if (lactoseFree) found.delete('lactose');
  const out = [];
  for (const [tag, level] of found) {
    if (!avoid.has(tag)) continue;
    if (tag === 'animal' && [...found].some(([t, l]) => t !== 'animal' && l !== 'traces' && avoid.has(t))) continue;   // the specific reason is clearer
    if ((tag === 'pork' || tag === 'beef') && found.has('meat') && avoid.has('meat')) continue;
    if (tag === 'dairy' && found.has('lactose') && avoid.has('lactose') && !avoid.has('dairy')) continue;
    out.push({ tag, level, what: TAG_WORD[tag] || tag });
  }
  if (out.some(o => o.tag === 'dairy')) { const i = out.findIndex(o => o.tag === 'lactose'); if (i >= 0) out.splice(i, 1); }
  for (const w of words) if (hasWord(text, w)) out.push({ tag: 'word:' + w, level: 'likely', what: w });
  return out.sort((a, b) => (b.level === 'label') - (a.level === 'label'));
}

const PLAN_SLOTS = goal => {
  if (goal < 1600) return [['breakfast', 'Breakfast', 'breakfast', 0.26], ['lunch', 'Lunch', 'lunch', 0.31], ['dinner', 'Dinner', 'dinner', 0.31], ['snack1', 'Snack', 'snack', 0.12]];
  if (goal < 2600) return [['breakfast', 'Breakfast', 'breakfast', 0.25], ['lunch', 'Lunch', 'lunch', 0.30], ['dinner', 'Dinner', 'dinner', 0.32], ['snack1', 'Snack', 'snack', 0.13]];
  if (goal < 3600) return [['breakfast', 'Breakfast', 'breakfast', 0.23], ['lunch', 'Lunch', 'lunch', 0.27], ['dinner', 'Dinner', 'dinner', 0.30], ['snack1', 'Snack', 'snack', 0.10], ['snack2', 'Second snack', 'snack', 0.10]];
  return [['breakfast', 'Breakfast', 'breakfast', 0.21], ['lunch', 'Lunch', 'lunch', 0.25], ['dinner', 'Dinner', 'dinner', 0.27], ['snack1', 'Snack', 'snack', 0.09], ['snack2', 'Second snack', 'snack', 0.09], ['snack3', 'Third snack', 'snack', 0.09]];
};
const FRAC = ['', '¼', '½', '¾'];
function fracText(x) {
  const q = Math.round(x * 4), whole = Math.floor(q / 4), part = FRAC[q % 4];
  return whole && part ? `${whole}${part}` : whole ? String(whole) : part || '0';
}
function planItem(key, grams) {
  const [id, name, u] = PF[key];
  const d = FOODMAP && FOODMAP.get(id);
  let g = grams, amount;
  if (u.n) {
    const step = u.step || 1;
    let c = Math.max(step, Math.round(grams / u.n / step) * step);
    if (u.max) c = Math.min(c, u.max);
    g = c * u.n;
    amount = `${fracText(c)} ${c > 1 ? u.many : u.one}`;
  } else if (u.tbsp || u.tsp) {
    const per = u.tbsp || u.tsp;
    let c = Math.max(0.5, Math.round(grams / per * 2) / 2);
    if (u.max) c = Math.min(c, u.max);
    g = c * per;
    amount = `${fracText(c)} ${u.tbsp ? 'tbsp' : 'tsp'}`;
  } else if (u.cup) {
    const c = Math.max(0.25, Math.round(grams / u.cup * 4) / 4);
    g = c * u.cup;
    amount = `${fracText(c)} cup${c > 1 ? 's' : ''} (${Math.round(g)} g)`;
  } else if (u.ml) {
    g = Math.max(50, Math.round(grams / 50) * 50);
    amount = `${g} ml`;
  } else {
    const step = grams < 60 ? 5 : 10;
    g = Math.max(step, Math.round(grams / step) * step);
    amount = u.dry ? `${g} g dry` : `${g} g`;
  }
  const p = d || {};
  const f = g / 100;
  return { key, id, name, grams: g, amount, kcal: (p.kcal || 0) * f, p: (p.p || 0) * f, c: (p.c || 0) * f, f: (p.f || 0) * f };
}
function buildMeal(opt, target) {
  const base = opt.items.map(([k, g, sc]) => ({ k, g, sc: sc !== false }));
  const kc = (k, g) => ((FOODMAP.get(PF[k][0]) || {}).kcal || 0) * g / 100;
  const fixed = base.filter(x => !x.sc).reduce((s, x) => s + kc(x.k, x.g), 0);
  const vari = base.filter(x => x.sc).reduce((s, x) => s + kc(x.k, x.g), 0) || 1;
  const factor = clamp((target - fixed) / vari, 0.35, 3);
  const items = base.map(x => planItem(x.k, x.sc ? x.g * factor : x.g));
  const t = items.reduce((s, it) => ({ kcal: s.kcal + it.kcal, p: s.p + it.p, c: s.c + it.c, f: s.f + it.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  return { ...opt, items, ...t };
}
const SNACK_SLOTS = ['snack1', 'snack2', 'snack3'];
// Picks one option per meal, avoiding what was shown in the last few days where possible.
function freshPicks(recent = {}) {
  const pick = (pool, slot, taken) => {
    const all = allowedIdx(pool); if (!all.length) return null;
    const avoid = new Set([...(recent[slot] || []), ...taken]);
    let list = all.filter(i => !avoid.has(i));
    if (!list.length) list = all.filter(i => !taken.includes(i));
    if (!list.length) list = all;
    return list[Math.floor(Math.random() * list.length)];
  };
  const p = { breakfast: pick('breakfast', 'breakfast', []), lunch: pick('lunch', 'lunch', []), dinner: pick('dinner', 'dinner', []) };
  const used = [];
  for (const s of SNACK_SLOTS) { p[s] = pick('snack', s, used); if (p[s] != null) used.push(p[s]); }
  return p;
}
function rememberPicks(P) {
  P.recent = P.recent && typeof P.recent === 'object' ? P.recent : {};
  for (const [slot, i] of Object.entries(P.picks)) {
    const r = (P.recent[slot] || []).filter(x => x !== i);
    r.unshift(i); P.recent[slot] = r.slice(0, 4);
  }
}
function planState() {
  if (!S.plan || typeof S.plan !== 'object') S.plan = {};
  const P = S.plan, today = dkey(), ws = weekState();
  if (ws) { P.picks = ws.W.days[ws.idx]; P.day = today; }
  else if (!P.picks || P.day !== today) {           // every new day brings a fresh set of ideas
    if (P.picks) rememberPicks(P);
    P.picks = freshPicks(P.recent || {});
    P.day = today;
  }
  Object.assign(P.picks, fitPicks(P.picks));
  if (!P.logged || typeof P.logged !== 'object') P.logged = {};
  for (const d of Object.keys(P.logged)) if (d < addDays(today, -7)) delete P.logged[d];
  return P;
}
function buildPlan() {
  const goal = S.settings.kcal, P = planState();
  return PLAN_SLOTS(goal).map(([slot, label, pool, share]) => {
    const i = P.picks[slot], meal = pool === 'snack' ? 'snacks' : pool;
    if (i == null) return { slot, label, meal, empty: true, kcal: 0, p: 0, c: 0, f: 0, items: [] };
    return { slot, label, count: allowedIdx(pool).length, meal, ...buildMeal(ideaFor(pool, i), goal * share) };
  });
}
function viewPlan() {
  if (!FOODMAP) return `<header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/food" aria-label="Back">${I.chevL}</button></header>
    <div class="empty"><strong>Meal ideas didn’t load</strong><span>Check your connection and open this page again.</span></div>`;
  const st = S.settings, plan = buildPlan(), today = dkey(), logged = S.plan.logged[today] || {};
  const tot = plan.reduce((s, m) => ({ kcal: s.kcal + m.kcal, p: s.p + m.p, c: s.c + m.c, f: s.f + m.f }), { kcal: 0, p: 0, c: 0, f: 0 });
  const protShort = tot.p < st.protein * 0.85;
  return `
  <header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/food" aria-label="Back">${I.chevL}</button></header>
  <div><p class="eyebrow">A sample day for ${fmtE(st.kcal)} ${eUnit()}</p><h1 class="h-display">Meal ideas</h1></div>
  ${planTabs('day')}
  ${dietBar()}
  <p class="lead">Everyday South African food, sized to your daily goal. You get a new set of ideas every day. Tap “Another option” to swap a meal, and log a meal once you’ve eaten it.</p>
  <section class="panel pulse-hero solo" aria-label="Plan totals">
    <div class="pulse-rings">${pulseRings([{ id: 'k', pct: tot.kcal / (st.kcal || 1), label: `This plan: ${fmtE(tot.kcal)} of ${fmtE(st.kcal)} ${eUnit()}` }], firstVisit('plan'))}</div>
    <div class="pulse-legend">
      <div class="pl pl-k"><span class="pl-lab">This plan</span><span class="pl-val pl-big num plan-total">${fmtE(tot.kcal)}<small> ${eUnit()}</small></span></div>
      <div class="pl pl-n"><span class="pl-lab">Your goal</span><span class="pl-val num">${fmtE(st.kcal)}<small> ${eUnit()}</small></span></div>
      <div class="pl pl-n"><span class="pl-lab">Meals</span><span class="pl-val num">${plan.filter(m => !m.empty).length}</span></div>
    </div>
    ${protShort ? `<p class="hint hero-foot">This plan is a bit low on protein for your goal. Swap in meals marked “High protein”, or add ${proteinIdeas()}.</p>` : ''}
  </section>
  ${macroTiles(tot)}
  ${plan.map(m => m.empty ? `
  <section class="panel tight plan-meal" aria-label="${esc(m.label)}"><div class="plan-head"><span class="eyebrow" style="margin:0">${esc(m.label)}</span></div>
    <p class="muted">None of the built-in ${esc(m.label.toLowerCase())} ideas fit your food needs. Try “What can I eat?” on Today, or <button type="button" class="link" data-act="diet">change your food needs</button>.</p></section>` : `
  <section class="panel tight plan-meal" aria-label="${esc(m.label)}">
    <div class="plan-head"><span class="eyebrow" style="margin:0">${esc(m.label)} · ${m.count} ideas</span><span class="plan-kcal num">${fmtE(m.kcal)} <small>${eUnit()}</small></span></div>
    <h2 class="plan-name">${esc(m.name)}</h2>
    ${m.tags?.length ? `<div class="tags">${m.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
    ${m.swaps?.length ? `<p class="swaps">${I.shuffle}<span>Changed for you: ${esc(m.swaps.join(' · '))}</span></p>` : ''}
    <ul class="plan-items">${m.items.map(it => `<li><span>${esc(it.name)}</span><b class="num">${esc(it.amount)}</b></li>`).join('')}</ul>
    <p class="plan-macros num">Protein ${n0(m.p)} g · Carbs ${n0(m.c)} g · Fat ${n0(m.f)} g</p>
    <div class="row-btns">
      <button type="button" class="btn" data-act="plan-swap" data-slot="${m.slot}" aria-label="Another ${esc(m.label.toLowerCase())} option (${m.count} to choose from)">${I.shuffle} ${lbl('Another option', 'Another')}</button>
      ${logged[m.slot]
        ? `<button type="button" class="btn" disabled>${I.check} Logged</button>`
        : `<button type="button" class="btn primary" data-act="plan-log" data-slot="${m.slot}">${I.plus} ${lbl('Log ' + esc(MEAL_NAME[m.meal].toLowerCase()), 'Log it')}</button>`}
    </div>
  </section>`).join('')}
  <button type="button" class="btn block" data-act="plan-new">${I.shuffle} New day of ideas</button>
  <p class="credit">A guideline from general nutrition data (USDA), not medical advice. Cooked foods are weighed cooked; pap and oats by dry weight. Adjust portions to your hunger and how your weight changes.${dietNote()}</p>`;
}
function logPlanMeal(slot) {
  const m = buildPlan().find(x => x.slot === slot); if (!m || m.empty) return;
  const date = dkey(), ids = [];
  for (const it of m.items) {
    const d = FOODMAP.get(it.id); if (!d) continue;
    const food = { ...dbToFood(d), key: 'plan_' + it.key, name: it.name, group: '' };
    const e = makeEntry(food, it.grams, 'g', m.meal);
    e.amountLabel = it.amount;
    addEntry(date, e); touchFood(food, it.grams, 'g'); ids.push(e.id);
  }
  S.plan.logged[date] = { ...(S.plan.logged[date] || {}), [slot]: true };
  save(); rerender();
  toast(`Logged to ${MEAL_NAME[m.meal]}`, { label: 'Undo', fn: () => {
    for (const id of ids) removeEntry(date, id);
    if (S.plan.logged[date]) delete S.plan.logged[date][slot];
    save(); rerender();
  } });
}

/* ---------- food needs: settings sheet, banners and warnings ---------- */
function openDiet(after) {
  const d = diet(), st = { style: d.style, avoid: new Set(d.avoid) };
  const chip = ([k, l]) => `<button type="button" class="chip ${st.avoid.has(k) ? 'on' : ''}" data-d="avoid" data-v="${k}" aria-pressed="${st.avoid.has(k)}">${esc(l)}</button>`;
  const el = sheetEl(`${sheetHead('Food needs', 'Allergies, intolerances and how you eat')}
    <div class="form">
      <div class="field"><span>How I eat</span>
        <div class="seg wrap4" id="d-style">${EAT_STYLES.map(([k, l]) => `<button type="button" class="${st.style === k ? 'on' : ''}" data-d="style" data-v="${k}">${l}</button>`).join('')}</div>
        <p class="hint" id="d-style-hint">${esc(EAT_STYLES.find(([k]) => k === st.style)[2])}</p></div>
      <div class="field"><span>I’m allergic to or can’t have</span><div class="chips" id="d-avoid">${NEEDS.map(chip).join('')}</div></div>
      <div class="field"><span>Also</span><div class="chips">${NEEDS_ALSO.map(chip).join('')}</div></div>
      <label class="field"><span>Anything else you don’t eat? (optional)</span><input class="input" id="d-other" maxlength="120" value="${esc(d.other)}" placeholder="e.g. mushrooms, liver, coriander"></label>
      <p class="hint">Meal ideas, your week plan, the shopping list and “What can I eat?” leave these out or swap them, like lactose-free milk or gluten-free bread. Scanned products and foods you search for show a warning when they look like a match.</p>
      <div class="notice">${I.alert}<div><strong>Always read the label</strong><p>Recipes and brands differ, and products can change. RepPlate can help you spot problem foods, but it can’t promise a food is safe for a serious allergy.</p></div></div>
    </div>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="d-save">Save food needs</button></div>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-d]'); if (!b) return;
    if (b.dataset.d === 'style') {
      st.style = b.dataset.v;
      $$('[data-d="style"]', el).forEach(x => x.classList.toggle('on', x === b));
      el.querySelector('#d-style-hint').textContent = EAT_STYLES.find(([k]) => k === st.style)[2];
    } else {
      const v = b.dataset.v; st.avoid.has(v) ? st.avoid.delete(v) : st.avoid.add(v);
      b.classList.toggle('on', st.avoid.has(v)); b.setAttribute('aria-pressed', String(st.avoid.has(v)));
    }
  });
  el.querySelector('#d-save').addEventListener('click', () => {
    S.settings.diet = { avoid: [...st.avoid], style: st.style, other: el.querySelector('#d-other').value.trim().slice(0, 120), asked: true };
    save();
    closeAll(() => { rerender(); toast(dietActive() ? 'Saved. Meal ideas now fit your food needs.' : 'Saved'); if (after) after(); });
  });
  return pushLayer(el);
}
function dietBar() {
  if (dietActive()) return `<div class="diet-bar">${I.check}<span><b>Fits your food needs:</b> ${esc(dietSummary())}</span><button type="button" class="link" data-act="diet">Change</button></div>`;
  if (!diet().asked) return `<div class="notice">${I.alert}<div><strong>Allergies or foods you don’t eat?</strong><p>Lactose-free, gluten-free, halaal, vegetarian… Tell RepPlate and every meal idea will fit you.</p></div>
    <div class="actions"><button type="button" class="btn sm primary" data-act="diet">Set food needs</button><button type="button" class="btn sm" data-act="diet-none">I eat everything</button></div></div>`;
  return '';
}
function proteinIdeas() {
  const t = dietTags(), words = dietWords();
  const list = [['eggs', 'egg'], ['maas', 'lactose'], ['tuna', 'fish'], ['chicken', 'meat'], ['lactose-free yoghurt', 'dairy'], ['beans or lentils', ''], ['soya mince', 'soy'], ['peanut butter', 'peanut']]
    .filter(([w, tag]) => !(tag && t.has(tag)) && !words.some(x => hasWord(w, x))).map(([w]) => w).slice(0, 4);
  return list.length > 1 ? `${list.slice(0, -1).join(', ')} or ${list[list.length - 1]}` : list[0] || 'beans or lentils';
}
function dietNote() {
  const t = dietTags(); if (!dietActive()) return '';
  return `${t.has('pork') && !t.has('meat') ? ' Choose halaal-certified meat and products.' : ''} If you have an allergy, always check the label.`;
}
function warnText(w) {
  if (w.tag.startsWith('word:')) return `Contains ${w.what}`;
  if (w.tag === 'animal') return 'Not vegan';
  return w.level === 'label' ? `Contains ${w.what}` : w.level === 'traces' ? `May contain traces of ${w.what}` : `Likely contains ${w.what}`;
}
// Big notice for the food sheet.
function warnNotice(food) {
  const ws = foodWarnings(food); if (!ws.length) return '';
  const fromLabel = ws.some(w => w.level === 'label' || w.level === 'traces');
  return `<div class="notice warn" role="alert">${I.alert}<div><strong>Doesn’t fit your food needs</strong>
    <p>${ws.map(w => esc(warnText(w))).join(' · ')}.</p>
    <p class="muted" style="font-size:13px">${fromLabel ? 'From the product’s allergen list.' : 'Going by the name, so check the label.'}</p></div></div>`;
}
// Small badge for lists.
function warnBadge(food) {
  const ws = foodWarnings(food); if (!ws.length) return '';
  const w = ws[0], more = ws.length > 1 ? ` +${ws.length - 1}` : '';
  return `<span class="warn-tag">${I.alert}${esc(w.tag === 'animal' ? 'not vegan' : w.what)}${more}</span>`;
}
function dietPrompt() {
  if (!dietActive()) return '';
  const d = diet(), t = dietTags(), parts = [];
  if (d.style !== 'all') parts.push(`they are ${d.style} (${EAT_STYLES.find(([k]) => k === d.style)[2].toLowerCase()})`);
  const al = NEEDS.filter(([k]) => d.avoid.includes(k)).map(([, l]) => l.toLowerCase());
  if (al.length) parts.push(`they must avoid: ${al.join(', ')}`);
  if (t.has('pork') && !t.has('meat')) parts.push('they eat halaal: no pork or pork products');
  if (d.avoid.includes('beef')) parts.push('no beef');
  const w = dietWords(); if (w.length) parts.push(`they don't eat: ${w.join(', ')}`);
  return `Food needs (follow strictly, never suggest anything that breaks them; use swaps like lactose-free or gluten-free versions where it helps): ${parts.join('; ')}.`;
}

/* ============================== WORKOUT TOOLS: plates & warm-ups, programs, interval timer ============================== */
const PLATE_SETS = { kg: [25, 20, 15, 10, 5, 2.5, 1.25], lb: [45, 35, 25, 10, 5, 2.5] };
const PLATE_COL = { kg: { 25: '#E5383B', 20: '#2F6BFF', 15: '#F2C230', 10: '#2DBE60', 5: '#E9ECF0', 2.5: '#3A3D44', 1.25: '#B9BEC5' }, lb: { 45: '#2F6BFF', 35: '#F2C230', 25: '#2DBE60', 10: '#E9ECF0', 5: '#3A3D44', 2.5: '#B9BEC5' } };
const PLATE_H = { 25: 100, 20: 100, 15: 94, 10: 86, 5: 62, 2.5: 48, 1.25: 40, 45: 100, 35: 94 };
const BARS = { kg: [[20, 'Olympic 20 kg'], [15, '15 kg'], [10, 'EZ / light 10 kg']], lb: [[45, '45 lb'], [35, '35 lb'], [25, '25 lb']] };
const wu = () => (S.settings.weight === 'lb' ? 'lb' : 'kg');
const barW = () => { const b = Number(S.settings.bar); return BARS[wu()].some(([v]) => v === b) ? b : BARS[wu()][0][0]; };
const isBarbell = id => /barbell|e-z curl bar/.test(EXMAP.get(id)?.e || '');
function platesFor(total, bar) {
  let side = (total - bar) / 2;
  if (side < -1e-9) return null;
  const out = [];
  for (const p of PLATE_SETS[wu()]) while (side >= p - 1e-9) { out.push(p); side -= p; }
  return { plates: out, short: Math.round(side * 2 * 100) / 100 };
}
const plateStep = () => PLATE_SETS[wu()][PLATE_SETS[wu()].length - 1] * 2;
const loadable = (w, bar) => Math.max(bar, Math.round((w - bar) / plateStep()) * plateStep() + bar);
function warmups(target, bar) {
  if (!(target > bar)) return [];
  const out = [[bar, 10, 'Empty bar']];
  for (const [pct, reps] of [[0.4, 8], [0.6, 5], [0.8, 3]]) {
    const w = loadable(target * pct, bar);
    if (w > out[out.length - 1][0] && w < target) out.push([w, reps, `${Math.round(pct * 100)}%`]);
  }
  return out;
}
const plateText = r => !r ? 'Lighter than the bar' : r.plates.length ? r.plates.map(p => wN(p)).join(' + ') : 'Just the bar';
function plateSVG(r) {
  const col = PLATE_COL[wu()];
  let x = 74;
  const thick = p => (p >= 15 ? 16 : p >= 10 ? 13 : p >= 5 ? 10 : 7);
  const plates = (r?.plates || []).map(p => { const w = thick(p), h = PLATE_H[p] || 50, s = `<rect x="${x}" y="${60 - h / 2}" width="${w}" height="${h}" rx="3" fill="${col[p]}" stroke="rgba(0,0,0,.25)"/>`; x += w + 2; return s; }).join('');
  return `<svg class="plates" viewBox="0 0 300 120" role="img" aria-label="Plates on each side: ${esc(plateText(r))}">
    <rect x="6" y="56" width="62" height="8" rx="3" class="bar-shaft"/><rect x="62" y="48" width="10" height="24" rx="2" class="bar-collar"/>
    <rect x="72" y="54" width="222" height="12" rx="4" class="bar-sleeve"/>${plates}</svg>`;
}
function openPlates(start, onUse) {
  const bar0 = barW();
  const st = { w: start > 0 ? start : bar0 + plateStep() * 8, bar: bar0 };
  const el = sheetEl(`${sheetHead('Plates & warm-up', 'What to load on each side of the bar')}
    <div class="field"><span>Weight on the bar (${wUnit()})</span><div class="stepper big-step"><button type="button" data-pl="dec" aria-label="Less">${I.minus}</button><input id="pl-w" inputmode="decimal" value="${trimNum(st.w)}" aria-label="Total weight"><button type="button" data-pl="inc" aria-label="More">${I.plus}</button></div></div>
    <div class="field"><span>Bar</span><div class="seg" id="pl-bar">${BARS[wu()].map(([v, l]) => `<button type="button" class="${v === st.bar ? 'on' : ''}" data-pl="bar" data-v="${v}">${lbl(l, `${v} ${wUnit()}`)}</button>`).join('')}</div></div>
    <div id="pl-out"></div>
    ${onUse ? '<div class="sheet-foot"><button type="button" class="btn primary xl grow" id="pl-use">Use this weight</button></div>' : '<div class="sheet-end"></div>'}`);
  const out = el.querySelector('#pl-out'), inp = el.querySelector('#pl-w');
  const draw = () => {
    const r = platesFor(st.w, st.bar), wu2 = warmups(st.w, st.bar);
    out.innerHTML = `<div class="panel tight plate-box">${plateSVG(r)}
        <p class="plate-line"><b>Each side:</b> ${esc(plateText(r))}${r && r.short > 0 ? ` <span class="muted">(${wN(r.short)} ${wUnit()} can’t be made with standard plates)</span>` : ''}</p>
        <div class="plate-key">${[...new Set(r?.plates || [])].map(p => `<span><i style="background:${PLATE_COL[wu()][p]}"></i>${wN(p)} × ${(r.plates.filter(x => x === p).length)}</span>`).join('')}</div></div>
      ${wu2.length ? `<h3 class="list-title">Warm-up sets</h3><ul class="warm-list">${wu2.map(([w, reps, why]) => `<li><span class="num"><b>${wN(w)} ${wUnit()}</b> × ${reps}</span><span class="muted">${esc(why)} · ${esc(plateText(platesFor(w, st.bar)))}</span></li>`).join('')}
        <li class="warm-work"><span class="num"><b>${wN(st.w)} ${wUnit()}</b></span><span>Your working sets</span></li></ul>
        <p class="hint">Rest about a minute between warm-up sets. They get your joints ready without tiring you out.</p>` : ''}`;
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-pl]'); if (!b) return;
    if (b.dataset.pl === 'bar') { st.bar = Number(b.dataset.v); S.settings.bar = st.bar; save(); $$('[data-pl="bar"]', el).forEach(x => x.classList.toggle('on', x === b)); }
    else { st.w = Math.max(st.bar, Math.round(((parseNum(inp.value) || st.bar) + (b.dataset.pl === 'inc' ? plateStep() : -plateStep())) * 100) / 100); inp.value = trimNum(st.w); }
    draw();
  });
  inp.addEventListener('input', () => { const v = parseNum(inp.value); if (v > 0) { st.w = v; draw(); } });
  el.querySelector('#pl-use')?.addEventListener('click', () => { onUse(st.w); popLayer(); });
  draw();
  return pushLayer(el);
}

/* ---------- supersets & drop sets: where to go after each set ---------- */
function pairStartOf(a, i) { if (a.items[i]?.ss && a.items[i + 1]) return i; if (i > 0 && a.items[i - 1]?.ss) return i - 1; return -1; }
function nextPos(a) {
  const i = a.i, n = a.set, it = a.items[i], ps = pairStartOf(a, i);
  if (ps >= 0) {
    const A = a.items[ps], B = a.items[ps + 1], rounds = Math.max(A.sets, B.sets), rest = B.rest || A.rest;
    if (i === ps && n <= B.sets) return { i: ps + 1, set: n, rest: 0 };
    if (n < rounds) { const nx = n + 1; return nx <= A.sets ? { i: ps, set: nx, rest } : { i: ps + 1, set: nx, rest }; }
    return ps + 2 < a.items.length ? { i: ps + 2, set: 1, rest } : null;
  }
  if (n < it.sets) return { i, set: n + 1, rest: it.rest };
  return i + 1 < a.items.length ? { i: i + 1, set: 1, rest: it.rest } : null;
}
function setLabel(a) {
  const it = a.items[a.i], ps = pairStartOf(a, a.i);
  if (a.dropping) return 'Drop set · lighter, no rest';
  return `${ps >= 0 ? `Superset ${a.i === ps ? 'A' : 'B'} · ` : ''}Set ${a.set} of ${it.sets}`;
}
const RPE = [[6, 'Easy'], [7, ''], [8, 'Hard'], [9, ''], [10, 'Max']];
function rpeHTML(a) {
  const last = a.sets[a.sets.length - 1]; if (!last || last.secs) return '';
  return `<div class="rpe"><span class="field-label">How hard was that set?</span><div class="rpe-row" role="group" aria-label="Effort, 6 easy to 10 max">${RPE.map(([v, l]) => `<button type="button" class="${last.rpe === v ? 'on' : ''}" data-p="rpe" data-v="${v}" aria-pressed="${last.rpe === v}"><b>${v}</b>${l ? `<small>${l}</small>` : ''}</button>`).join('')}</div></div>`;
}

/* ---------- ready-made programs ---------- */
const PROGRAMS = [
  { id: 'beginner', name: 'Beginner Full Body', weeks: 8, level: 'Beginner', kit: 'Gym or dumbbells', alt: ['A', 'B'],
    desc: 'Three full-body workouts a week. Learn the main moves, then add a little weight when you hit all your reps.',
    plan: { 1: 'A', 3: 'B', 5: 'A' },
    routines: [
      { key: 'A', name: 'Full Body A', rest: 75, items: [['Goblet_Squat', 3, 10], ['Dumbbell_Bench_Press', 3, 10], ['Seated_Cable_Rows', 3, 10], ['Dumbbell_Shoulder_Press', 3, 10], ['Plank', 3, 0, 30]] },
      { key: 'B', name: 'Full Body B', rest: 75, items: [['Romanian_Deadlift', 3, 10], ['Incline_Dumbbell_Press', 3, 10], ['Wide-Grip_Lat_Pulldown', 3, 10], ['Dumbbell_Lunges', 3, 10], ['Hanging_Leg_Raise', 3, 10]] }],
    tips: ['Start light and learn each move. Stop each set with 2–3 reps still in the tank.', 'When you finish all your reps, RepPlate suggests a little more weight next time. Take it.', 'Last week: aim for a personal best on each lift, then repeat the program heavier or move on to 5×5.'] },
  { id: '5x5', name: '5×5 Strength', weeks: 12, level: 'Beginner to intermediate', kit: 'Barbell & squat rack', alt: ['A', 'B'],
    desc: 'The big barbell lifts, five sets of five, three days a week. Add 2.5 kg every time you finish all 25 reps.',
    plan: { 1: 'A', 3: 'B', 5: 'A' },
    routines: [
      { key: 'A', name: '5×5 Workout A', rest: 150, items: [['Barbell_Squat', 5, 5], ['Barbell_Bench_Press_-_Medium_Grip', 5, 5], ['Bent_Over_Barbell_Row', 5, 5]] },
      { key: 'B', name: '5×5 Workout B', rest: 150, items: [['Barbell_Squat', 5, 5], ['Standing_Military_Press', 5, 5], ['Barbell_Deadlift', 1, 5]] }],
    tips: ['Start at about half of what you could lift for 5. It feels easy on purpose: the weight climbs fast.', 'Add 2.5 kg each session when you get all 5×5. Miss twice in a row? Drop the weight 10% and build back up.', 'Final week: test yourself. Most people finish with a much heavier squat than they started.'] },
  { id: 'ppl', name: 'Push / Pull / Legs', weeks: 10, level: 'Intermediate', kit: 'Gym',
    desc: 'Each muscle twice a week over six days: push (chest, shoulders, triceps), pull (back, biceps) and legs.',
    plan: { 1: 'P', 2: 'U', 3: 'L', 4: 'P', 5: 'U', 6: 'L' },
    routines: [
      { key: 'P', name: 'Push', rest: 90, items: [['Barbell_Bench_Press_-_Medium_Grip', 4, 8], ['Incline_Dumbbell_Press', 3, 10], ['Standing_Military_Press', 3, 8], ['Side_Lateral_Raise', 3, 12], ['Triceps_Pushdown', 3, 12]] },
      { key: 'U', name: 'Pull', rest: 90, items: [['Pullups', 4, 8], ['Bent_Over_Barbell_Row', 3, 8], ['Seated_Cable_Rows', 3, 10], ['Face_Pull', 3, 15], ['Barbell_Curl', 3, 10]] },
      { key: 'L', name: 'Legs', rest: 120, items: [['Barbell_Squat', 4, 8], ['Romanian_Deadlift', 3, 10], ['Leg_Press', 3, 12], ['Lying_Leg_Curls', 3, 12], ['Standing_Calf_Raises', 4, 15]] }],
    tips: ['Find working weights you can do with 2 reps to spare. Six days is a lot: sleep and eat enough protein.', 'Add reps first, then weight. Feeling run down? Take an extra rest day; the plan picks up where you left off.', 'Last week: push for personal bests, then take an easy week before starting again.'] },
  { id: 'ppl3', name: 'Push / Pull / Legs (3 days)', weeks: 10, level: 'Beginner to intermediate', kit: 'Gym',
    desc: 'The same split on Monday, Wednesday and Friday. Each muscle once a week with more rest days.',
    plan: { 1: 'P', 3: 'U', 5: 'L' }, same: 'ppl', tips: null },
  { id: 'home', name: 'Home Fat Burn', weeks: 6, level: 'All levels', kit: 'No equipment',
    desc: 'Four short bodyweight sessions a week: full body and core, plus a 4-minute Tabata finisher from Train.',
    plan: { 1: 'H', 2: 'C', 4: 'H', 6: 'C' },
    routines: [
      { key: 'H', name: 'Home Full Body', rest: 45, items: [['Bodyweight_Squat', 3, 15], ['Pushups', 3, 10], ['Bodyweight_Walking_Lunge', 3, 10], ['Butt_Lift_Bridge', 3, 15], ['Mountain_Climbers', 3, 0, 30], ['Plank', 3, 0, 30]] },
      { key: 'C', name: 'Core & Cardio', rest: 30, items: [['Crunches', 3, 15], ['Russian_Twist', 3, 20], ['Mountain_Climbers', 3, 0, 30], ['Star_Jump', 3, 12], ['Side_Bridge', 2, 0, 30], ['Plank', 3, 0, 40]] }],
    tips: ['Move well before you move fast. Finish with a Tabata (Train > Interval timer) if you have energy left.', 'Add 2–3 reps or 5 seconds to holds each week.', 'Last week: beat your first week on every exercise.'] },
  { id: 'db', name: 'Dumbbell Builder', weeks: 8, level: 'Beginner to intermediate', kit: 'A pair of dumbbells', alt: ['A', 'B'],
    desc: 'Three workouts a week with just dumbbells, at home or in a small gym.',
    plan: { 1: 'A', 3: 'B', 5: 'A' },
    routines: [
      { key: 'A', name: 'Dumbbell A', rest: 60, items: [['Goblet_Squat', 3, 12], ['Dumbbell_Bench_Press', 3, 10], ['One-Arm_Dumbbell_Row', 3, 10], ['Dumbbell_Shoulder_Press', 3, 10], ['Hammer_Curls', 3, 12]] },
      { key: 'B', name: 'Dumbbell B', rest: 60, items: [['Dumbbell_Lunges', 3, 10], ['Romanian_Deadlift', 3, 10], ['Incline_Dumbbell_Press', 3, 10], ['Bent_Over_Two-Dumbbell_Row', 3, 10], ['Side_Lateral_Raise', 3, 12]] }],
    tips: ['Pick dumbbells you can lift for all reps with good form.', 'Hit the top of the rep range on every set? Go up to the next dumbbell.', 'Last week: aim for personal bests, then repeat with heavier dumbbells.'] },
];
const programOf = id => { const p = PROGRAMS.find(x => x.id === id); if (!p) return null; if (p.same) { const b = PROGRAMS.find(x => x.id === p.same); return { ...b, ...p, routines: b.routines, tips: p.tips || b.tips, rid: b.id }; } return { ...p, rid: p.id }; };
const progRid = (p, key) => `p-${p.rid}-${key}`;
function ensureProgramRoutines(p) {
  for (const r of p.routines) {
    const id = progRid(p, r.key);
    if (!S.routines.some(x => x.id === id)) S.routines.push({ id, name: r.name, note: p.name, program: p.rid, items: r.items.map(([ex, sets, reps, secs]) => ({ ex, sets, reps: reps || 0, secs: secs || 0, rest: r.rest })) });
  }
}
const programWeek = P => Math.floor((fromKey(dkey()) - fromKey(P.start)) / (7 * 864e5)) + 1;
function programDays(p, week) {   // weekday -> routine key for that week (A/B programs alternate)
  const out = {}, order = [1, 2, 3, 4, 5, 6, 0].filter(wd => p.plan[wd]), per = order.length;
  order.forEach((wd, n) => { out[wd] = p.alt ? p.alt[((week - 1) * per + n) % p.alt.length] : p.plan[wd]; });
  return out;
}
function syncProgram() {
  const P = S.program; if (!P) return;
  const p = programOf(P.id); if (!p) { S.program = null; return; }
  const week = Math.min(programWeek(P), p.weeks), days = programDays(p, week), sc = schedule();
  let changed = false;
  for (const wd of [0, 1, 2, 3, 4, 5, 6]) {
    const want = days[wd] ? progRid(p, days[wd]) : '';
    if ((sc[wd] || '') !== want) { if (want) sc[wd] = want; else delete sc[wd]; changed = true; }
  }
  if (changed) save();
}
function startProgram(id) {
  const p = programOf(id); if (!p) return;
  ensureProgramRoutines(p);
  S.program = { id, start: mondayOf(dkey()) };
  syncProgram(); save();
}
function programStats(P) {
  const p = programOf(P.id), ids = new Set(p.routines.map(r => progRid(p, r.key)));
  const done = S.workouts.filter(w => ids.has(w.rid) && dkey(new Date(w.start)) >= P.start).length;
  const per = Object.keys(p.plan).length;
  return { p, week: programWeek(P), done, total: per * p.weeks, per };
}
function programPanel() {
  const P = S.program;
  if (!P) return '';
  const { p, week, done, total } = programStats(P), over = week > p.weeks;
  const tip = p.tips[week <= 2 ? 0 : week >= p.weeks ? 2 : 1];
  const days = programDays(p, Math.min(week, p.weeks));
  return `<section class="panel tight prog-now" aria-label="Program">
    <div class="section-row">${secHead(I.target, 'workout', esc(p.name))}<span class="muted num" style="font-size:13px">${over ? 'Finished' : `Week ${week} of ${p.weeks}`}</span></div>
    <div class="mbar prog-bar" role="img" aria-label="${done} of ${total} workouts done"><i style="width:${clamp(done / total * 100, 0, 100)}%"></i></div>
    <p class="muted" style="font-size:14px">${done} of ${total} workouts done · this week: ${[1, 2, 3, 4, 5, 6, 0].filter(wd => days[wd]).map(wd => `${DAYS.find(d => d[1] === wd)[0]} ${esc(p.routines.find(r => r.key === days[wd]).name)}`).join(', ')}</p>
    <p class="hint">${esc(over ? 'Program complete. Well done! Start it again with heavier weights, or pick a new one.' : tip)}</p>
    <div class="row-btns"><a class="btn" href="#/programs">${lbl('All programs', 'Programs')}</a><button type="button" class="btn ghost danger" data-act="prog-end">${lbl('End program', 'End')}</button></div>
  </section>`;
}
function viewPrograms() {
  const cur = S.program?.id;
  return `<header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/train" aria-label="Back">${I.chevL}</button></header>
  <div><p class="eyebrow">Plans that fill in your week</p><h1 class="h-display">Programs</h1></div>
  <p class="lead">Pick a plan and RepPlate sets your training days, makes the routines and tells you when to go heavier. You can still edit any routine.</p>
  ${PROGRAMS.map(x => {
    const p = programOf(x.id), days = programDays(p, 1);
    return `<section class="panel tight prog-card" aria-label="${esc(p.name)}">
      <div class="section-row"><h2 class="section">${esc(p.name)}</h2>${cur === p.id ? '<span class="tag on-tag">Current</span>' : ''}</div>
      <div class="tags"><span class="tag">${Object.keys(p.plan).length} days a week</span><span class="tag">${p.weeks} weeks</span><span class="tag">${esc(p.kit)}</span><span class="tag">${esc(p.level)}</span></div>
      <p>${esc(p.desc)}</p>
      <p class="muted" style="font-size:14px">${[1, 2, 3, 4, 5, 6, 0].filter(wd => days[wd]).map(wd => `${DAYS.find(d => d[1] === wd)[0]}: ${esc(p.routines.find(r => r.key === days[wd]).name)}`).join(' · ')}</p>
      <details class="prog-ex"><summary>What’s in it</summary>${p.routines.map(r => `<p><b>${esc(r.name)}:</b> ${r.items.map(([ex, s, reps, secs]) => `${esc(exName(ex))} ${s}×${secs ? `${secs} s` : reps}`).join(', ')}</p>`).join('')}</details>
      ${cur === p.id ? '<button type="button" class="btn block" disabled>You’re on this program</button>' : `<button type="button" class="btn primary block" data-act="prog-start" data-id="${p.id}">${I.play} Start this program</button>`}
    </section>`;
  }).join('')}`;
}

/* ---------- interval timer: Tabata, EMOM, AMRAP, custom ---------- */
const HIIT_MOVES = ['Mountain climbers', 'Squat jumps', 'Push-ups', 'High knees', 'Jumping jacks', 'Burpees', 'Lunges', 'Skaters', 'Sit-ups', 'Plank jacks'];
const HIIT_MODES = [['tabata', 'Tabata'], ['emom', 'EMOM'], ['amrap', 'AMRAP'], ['custom', 'Custom']];
const HIIT_HELP = { tabata: '20 s all-out, 10 s rest, 8 rounds: 4 minutes.', emom: 'Every minute on the minute: do your reps, rest for what’s left of the minute.', amrap: 'As many rounds as possible before the clock runs out. Tap +1 each round.', custom: 'Your own work and rest times.' };
let hiit = null;
function hiitSegments(c) {
  const segs = [{ kind: 'ready', dur: 10, label: 'Get ready' }];
  if (c.mode === 'emom') for (let m = 1; m <= c.mins; m++) segs.push({ kind: 'work', dur: 60, label: c.what || `Minute ${m}`, round: m, rounds: c.mins });
  else if (c.mode === 'amrap') segs.push({ kind: 'work', dur: c.mins * 60, label: c.what || 'As many rounds as possible', round: 1, rounds: 1 });
  else for (let r = 1; r <= c.rounds; r++) {
    segs.push({ kind: 'work', dur: c.work, label: c.moves.length ? c.moves[(r - 1) % c.moves.length] : 'Work', round: r, rounds: c.rounds });
    if (r < c.rounds && c.rest > 0) segs.push({ kind: 'rest', dur: c.rest, label: 'Rest', next: c.moves.length ? c.moves[r % c.moves.length] : '', round: r, rounds: c.rounds });
  }
  return segs;
}
const hiitTotal = c => hiitSegments(c).slice(1).reduce((s, x) => s + x.dur, 0);
function openHiit() {
  const c = Object.assign({ mode: 'tabata', work: 20, rest: 10, rounds: 8, mins: 10, moves: ['Mountain climbers', 'Squat jumps', 'Push-ups', 'High knees'], what: '' }, S.settings.hiit || {});
  const step = (k, label, v, unit) => `<div class="ed-ctl"><span class="field-label">${label}</span><div class="stepper sm"><button type="button" data-h="dec" data-k="${k}" aria-label="Less">${I.minus}</button><output data-out="${k}">${v}${unit}</output><button type="button" data-h="inc" data-k="${k}" aria-label="More">${I.plus}</button></div></div>`;
  const el = sheetEl(`${sheetHead('Interval timer', 'The coach calls out work, rest and the countdown')}
    <div class="seg" id="h-mode">${HIIT_MODES.map(([k, l]) => `<button type="button" class="${c.mode === k ? 'on' : ''}" data-h="mode" data-v="${k}">${l}</button>`).join('')}</div>
    <p class="hint" id="h-help"></p>
    <div class="ed-controls" id="h-steps"></div>
    <div class="field" id="h-moves-f"><span>Moves (they take turns each round)</span><div class="chips" id="h-moves">${HIIT_MOVES.map(m => `<button type="button" class="chip ${c.moves.includes(m) ? 'on' : ''}" data-h="move" data-v="${esc(m)}">${esc(m)}</button>`).join('')}</div></div>
    <label class="field" id="h-what-f"><span>What you’ll do (optional)</span><input class="input" id="h-what" maxlength="60" value="${esc(c.what)}" placeholder="e.g. 10 burpees + 15 squats"></label>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="h-go">${I.play} Start · <span id="h-total"></span></button></div>`);
  const draw = () => {
    $$('[data-h="mode"]', el).forEach(x => x.classList.toggle('on', x.dataset.v === c.mode));
    el.querySelector('#h-help').textContent = HIIT_HELP[c.mode];
    el.querySelector('#h-steps').innerHTML = c.mode === 'emom' || c.mode === 'amrap' ? step('mins', 'Minutes', c.mins, '') : `${c.mode === 'custom' ? step('work', 'Work', c.work, ' s') + step('rest', 'Rest', c.rest, ' s') : ''}${step('rounds', 'Rounds', c.rounds, '')}`;
    el.querySelector('#h-moves-f').hidden = c.mode === 'emom' || c.mode === 'amrap';
    el.querySelector('#h-what-f').hidden = !(c.mode === 'emom' || c.mode === 'amrap');
    el.querySelector('#h-total').textContent = clock(hiitTotal(c));
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-h]'); if (!b) return;
    const h = b.dataset.h;
    if (h === 'mode') { c.mode = b.dataset.v; if (c.mode === 'tabata') { c.work = 20; c.rest = 10; } }
    else if (h === 'move') { const v = b.dataset.v; c.moves = c.moves.includes(v) ? c.moves.filter(x => x !== v) : [...c.moves, v]; b.classList.toggle('on', c.moves.includes(v)); }
    else if (h === 'inc' || h === 'dec') {
      const k = b.dataset.k, d = h === 'inc' ? 1 : -1, lim = { mins: [1, 60, 1], work: [5, 300, 5], rest: [0, 300, 5], rounds: [1, 50, 1] }[k];
      c[k] = clamp(c[k] + d * lim[2], lim[0], lim[1]);
    }
    draw();
  });
  el.querySelector('#h-go').addEventListener('click', () => {
    c.what = el.querySelector('#h-what').value.trim();
    S.settings.hiit = { ...c }; save();
    audio(); unlockSpeech();
    closeAll(() => runHiit({ ...c, moves: c.moves.slice() }));
  });
  draw();
  return pushLayer(el);
}
function runHiit(c) {
  hiit = { c, segs: hiitSegments(c), t0: Date.now(), paused: 0, pausedAt: 0, seg: -1, said: '', rounds: 0, ending: false, done: false };
  const el = overlayEl('<div class="player hiit" id="hiit"></div>');
  el.addEventListener('click', onHiitClick);
  pushLayer(el, { onClose: () => { clearInterval(hiit?.timer); hiit = null; keepAwake(false); hush(); }, guard: () => { if (!hiit || hiit.done) return true; hiitPause(true); hiit.ending = true; drawHiit(); return false; } });
  hiit.el = el; hiit.timer = setInterval(hiitTick, 200);
  keepAwake(true);
  drawHiit(); hiitTick();
}
const hiitNow = () => (hiit.pausedAt || Date.now()) - hiit.t0 - hiit.paused;
function hiitWhere() {
  let t = hiitNow() / 1000;
  for (let i = 0; i < hiit.segs.length; i++) { const s = hiit.segs[i]; if (t < s.dur) return { i, s, left: s.dur - t }; t -= s.dur; }
  return null;
}
function hiitPause(on) {
  if (!hiit) return;
  if (on && !hiit.pausedAt) { hiit.pausedAt = Date.now(); hush(); }
  else if (!on && hiit.pausedAt) { hiit.paused += Date.now() - hiit.pausedAt; hiit.pausedAt = 0; unlockSpeech(); }
}
function hiitTick() {
  if (!hiit || hiit.done) return;
  const w = hiitWhere();
  if (!w) { hiitFinish(); return; }
  if (!hiit.pausedAt) {
    if (w.i !== hiit.seg) {
      hiit.seg = w.i; const s = w.s;
      if (s.kind === 'work') { beep(990, 0.25); buzz(150); say(s.round === s.rounds && s.rounds > 1 ? `Last round. ${s.label}. Go!` : `${s.label}. Go!`); }
      else if (s.kind === 'rest') { beep(600, 0.25); buzz([80, 60, 80]); say(`Rest.${s.next ? ` Next, ${s.next}.` : ''}`); }
      else say(`Get ready. ${hiit.c.mode === 'tabata' ? 'Tabata' : hiit.c.mode === 'emom' ? 'Every minute on the minute' : hiit.c.mode === 'amrap' ? 'As many rounds as possible' : 'Intervals'} starting in 10 seconds.`);
      drawHiit();
    }
    const sec = Math.ceil(w.left), key = `${w.i}:${sec}`;
    if (sec <= 3 && sec >= 1 && hiit.said !== key) { hiit.said = key; if (coachOn()) say(String(sec)); else beep(700, 0.1); }
    if (hiit.c.mode === 'amrap' && w.s.kind === 'work' && Math.abs(w.left - w.s.dur / 2) < 0.25 && hiit.said !== 'half') { hiit.said = 'half'; say('Halfway'); }
  }
  const big = hiit.el.querySelector('#h-big'); if (big) big.textContent = clock(Math.ceil(w.left));
  const ring = hiit.el.querySelector('#h-ring'); if (ring) ring.style.strokeDashoffset = (REST_C * (1 - clamp(w.left / w.s.dur, 0, 1))).toFixed(2);
  const tot = hiit.el.querySelector('#h-left'); if (tot) tot.textContent = clock(Math.max(0, Math.ceil(hiitTotal(hiit.c) + 10 - hiitNow() / 1000)));
}
function drawHiit() {
  const box = hiit?.el.querySelector('#hiit'); if (!box) return;
  const c = hiit.c, w = hiitWhere();
  if (hiit.done) {
    const mins = Math.round(hiitTotal(c) / 60);
    box.innerHTML = `<div class="p-done"><div><p class="eyebrow">${esc(HIIT_MODES.find(m => m[0] === c.mode)[1])}</p><h2 class="h-display">Intervals done</h2></div>
      <dl class="stats"><div><dt>Time</dt><dd>${clock(hiitTotal(c))}</dd></div><div><dt>${c.mode === 'amrap' ? 'Rounds' : 'Intervals'}</dt><dd>${c.mode === 'amrap' ? hiit.rounds : c.mode === 'emom' ? c.mins : c.rounds}</dd></div>
      <div><dt>Burned</dt><dd>${fmtE(metKcal(8, mins))}<small style="font-size:16px"> ${eUnit()}</small></dd></div><div><dt>Saved to</dt><dd style="font-size:18px">History</dd></div></dl>
      <button type="button" class="btn primary xl block" data-hh="close">Finish</button></div>`;
    return;
  }
  if (!w) return;
  const s = w.s;
  box.innerHTML = `<header class="p-top"><button type="button" class="icon-btn" data-hh="end" aria-label="End">${I.close}</button>
      <div class="p-prog"><span>${esc(HIIT_MODES.find(m => m[0] === c.mode)[1])} · <b id="h-left" class="num"></b> left</span></div></header>
    ${hiit.ending ? `<div class="panel p-end"><h2 class="section">End the timer?</h2>
        <button type="button" class="btn primary block" data-hh="save">${I.check} Save what I did</button><button type="button" class="btn block" data-hh="resume">Keep going</button><button type="button" class="btn ghost danger block" data-hh="discard">Discard</button></div>` : `
    <div class="p-rest hiit-${s.kind}">
      <p class="hiit-phase">${s.kind === 'work' ? 'Work' : s.kind === 'rest' ? 'Rest' : 'Get ready'}</p>
      <div class="rest-ring"><svg class="ring" viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="${REST_R}" class="ring-track" stroke-width="16" fill="none"/>
        <circle id="h-ring" cx="120" cy="120" r="${REST_R}" class="ring-fill" stroke-width="16" fill="none" stroke-linecap="round" stroke-dasharray="${REST_C.toFixed(2)}" transform="rotate(-90 120 120)" style="transition:stroke-dashoffset .2s linear"/></svg>
        <div class="ring-center"><span class="huge" id="h-big" role="timer"></span></div></div>
      <h2 class="p-name" style="text-align:center">${esc(s.kind === 'rest' ? (s.next ? `Next: ${s.next}` : 'Breathe') : s.label)}</h2>
      ${s.rounds > 1 ? `<p class="p-set">Round ${s.round} of ${s.rounds}</p>` : ''}
      ${c.mode === 'amrap' && s.kind === 'work' ? `<div class="amrap"><span class="huge num">${hiit.rounds}</span><span class="p-unit">rounds</span><button type="button" class="btn primary" data-hh="round">${I.plus} 1 round</button></div>` : ''}
      <div class="rest-btns"><button type="button" class="btn" data-hh="back15">−10 s</button><button type="button" class="btn primary" data-hh="${hiit.pausedAt ? 'resume' : 'pause'}">${hiit.pausedAt ? `${I.play} Resume` : `${I.pause} Pause`}</button><button type="button" class="btn" data-hh="skip">Skip ${I.chevR}</button></div>
    </div>`}`;
  hiitTick();
}
function onHiitClick(e) {
  const b = e.target.closest('[data-hh]'); if (!b || !hiit) return;
  const h = b.dataset.hh;
  if (h === 'close') { const l = layers.find(x => x.el === hiit.el); if (l) l.guard = null; closeAll(() => rerender()); return; }
  if (h === 'end') { hiitPause(true); hiit.ending = true; }
  else if (h === 'resume') { hiit.ending = false; hiitPause(false); }
  else if (h === 'pause') hiitPause(true);
  else if (h === 'save') { hiit.ending = false; hiitFinish(true); return; }
  else if (h === 'discard') { const l = layers.find(x => x.el === hiit.el); if (l) l.guard = null; closeAll(() => { rerender(); toast('Timer discarded'); }); return; }
  else if (h === 'round') { hiit.rounds++; buzz(40); beep(880, 0.08); }
  else if (h === 'skip') { const w = hiitWhere(); if (w) hiit.t0 -= w.left * 1000; }
  else if (h === 'back15') { hiit.t0 = Math.min(hiit.t0 + 10000, Date.now() - hiit.paused); }
  drawHiit();
}
function hiitFinish(early = false) {
  if (!hiit || hiit.done) return;
  const c = hiit.c, end = Date.now(), secs = Math.min(hiitTotal(c), Math.max(0, hiitNow() / 1000 - 10));
  hiit.done = true; clearInterval(hiit.timer);
  if (secs >= 30) {
    const name = c.mode === 'tabata' ? `Tabata · ${clock(hiitTotal(c))}` : c.mode === 'emom' ? `EMOM · ${c.mins} min` : c.mode === 'amrap' ? `AMRAP · ${c.mins} min` : `Intervals · ${c.rounds} rounds`;
    S.workouts.unshift({ id: uid(), type: 'hiit', name, start: end - secs * 1000, end, sets: [], hiit: { mode: c.mode, rounds: c.mode === 'amrap' ? hiit.rounds : c.rounds, mins: c.mins, work: c.work, rest: c.rest, early } });
    save();
  }
  beep(880, 0.15); setTimeout(() => beep(1175, 0.25), 180); buzz([100, 60, 100]);
  say(early ? 'Saved. Nice work.' : 'Done. Great work!', false);
  drawHiit();
}

/* ============================== ACTIVITY: calories burned, cardio, steps ============================== */
// [key, name, MET easy / moderate / hard, has distance]
const CARDIO = [['walk', 'Walk', [3.0, 3.8, 4.8], true], ['run', 'Run', [7.0, 9.8, 11.5], true], ['cycle', 'Cycle', [4.0, 7.0, 10.0], true], ['hike', 'Hike', [5.0, 6.0, 7.5], true],
  ['swim', 'Swim', [6.0, 8.0, 10.0], true], ['sport', 'Sport', [6.0, 7.5, 9.0], false], ['dance', 'Dance', [4.5, 5.5, 7.0], false], ['class', 'Gym class', [5.0, 6.5, 8.0], false], ['other', 'Other', [4.0, 5.5, 7.0], false]];
const INTENS = [['easy', 'Easy'], ['moderate', 'Moderate'], ['hard', 'Hard']];
const cardioType = k => CARDIO.find(x => x[0] === k) || CARDIO[CARDIO.length - 1];
const bodyKg = () => { const ws = weights(); return ws.length ? ws[ws.length - 1].kg : (S.settings.profile?.weightKg || 75); };
const metKcal = (met, mins, kg = bodyKg()) => Math.max(0, (met - 1) * kg * mins / 60);   // calories on top of resting
function cardioMet(c) {
  const t = cardioType(c.type), base = t[2][{ easy: 0, moderate: 1, hard: 2 }[c.int] ?? 1];
  if (c.km > 0 && c.mins > 0) {
    const kmh = c.km / (c.mins / 60), mmin = kmh * 1000 / 60;
    if (c.type === 'run' && kmh >= 6) return clamp((0.2 * mmin + 3.5) / 3.5, 6, 18);
    if ((c.type === 'walk' || c.type === 'hike') && kmh < 8) return clamp((0.1 * mmin + 3.5) / 3.5 + (c.type === 'hike' ? 1.5 : 0), 2, 9);
    if (c.type === 'cycle') return kmh < 16 ? 4 : kmh < 19 ? 6.8 : kmh < 22 ? 8 : kmh < 25 ? 10 : 12;
  }
  return base;
}
const cardioKcal = c => metKcal(cardioMet(c), c.mins);
const workoutKcal = w => metKcal(w.type === 'hiit' ? 8 : 5, Math.min(180, Math.max(0, (w.end - w.start) / 60000)));
const STEP_BASE = 3000;
const stepsKcal = n => Math.max(0, (n || 0) - STEP_BASE) * 0.0005 * bodyKg();
const cardioList = () => (Array.isArray(S.cardio) ? S.cardio : (S.cardio = []));
const stepsMap = () => (S.steps && typeof S.steps === 'object' ? S.steps : (S.steps = {}));
function burnedOn(k) {
  const wk = S.workouts.filter(w => dkey(new Date(w.start)) === k).reduce((s, w) => s + workoutKcal(w), 0);
  const ca = cardioList().filter(c => c.d === k).reduce((s, c) => s + (c.kcal ?? cardioKcal(c)), 0);
  const st = stepsKcal(stepsMap()[k]);
  return { total: wk + ca + st, workouts: wk, cardio: ca, steps: st };
}
const EAT_BACK = [['off', 'Off', 0], ['half', 'Half', 0.5], ['all', 'All', 1]];
const eatBack = () => (EAT_BACK.find(x => x[0] === S.settings.eatBack) || EAT_BACK[1]);
const bonusOn = k => Math.round(burnedOn(k).total * eatBack()[2]);
const goalOn = k => S.settings.kcal + bonusOn(k);
function activityCard() {
  const k = dkey(), b = burnedOn(k), steps = stepsMap()[k] || 0;
  return `<section class="panel tight mini-card" aria-label="Activity">
    <div class="mc-head"><span class="eyebrow" style="margin:0">Activity</span><span class="muted num" style="font-size:12px">${steps ? `${n0(steps)} steps` : ''}</span></div>
    <div class="mc-val"><b class="num">${fmtE(b.total)}</b><span class="muted">${eUnit()}</span></div>
    <p class="muted mc-sub">${bonusOn(k) ? `+${fmtE(bonusOn(k))} added to your goal` : b.total ? 'burned today' : 'Workouts, cardio, steps'}</p>
    <div class="mc-btns"><button type="button" class="btn sm grow" data-act="activity">${I.plus} ${lbl('Add activity', 'Add')}</button></div>
  </section>`;
}
function openActivity() {
  const k = dkey();
  const el = sheetEl(`${sheetHead('Activity', 'Calories you burn on top of resting')}<div id="act-body"></div><div class="sheet-end"></div>`);
  const body = el.querySelector('#act-body');
  const draw = () => {
    const b = burnedOn(k), steps = stepsMap()[k] || 0;
    const items = [
      ...S.workouts.filter(w => dkey(new Date(w.start)) === k).map(w => `<li><span><b>${esc(w.name)}</b><small class="muted">${clock((w.end - w.start) / 1000)}</small></span><span class="num">${fmtE(workoutKcal(w))} ${eUnit()}</span></li>`),
      ...cardioList().filter(c => c.d === k).map(c => `<li><span><b>${esc(cardioType(c.type)[1])}${c.gps ? ' · GPS' : ''}</b><small class="muted">${c.mins} min${c.km ? ` · ${n1(c.km)} km` : ''}</small></span><span class="num">${fmtE(c.kcal ?? cardioKcal(c))} ${eUnit()}<button type="button" class="icon-btn" data-ac="del" data-id="${esc(c.id)}" aria-label="Delete">${I.trash}</button></span></li>`),
      ...(b.steps ? [`<li><span><b>Steps</b><small class="muted">${n0(steps)} (over ${n0(STEP_BASE)})</small></span><span class="num">${fmtE(b.steps)} ${eUnit()}</span></li>`] : [])];
    body.innerHTML = `
      <dl class="eq" style="border-top:0;padding-top:0"><div><dt>Burned today</dt><dd>${fmtE(b.total)}</dd></div><div class="op" aria-hidden="true">·</div><div><dt>Added to goal</dt><dd>${fmtE(bonusOn(k))}</dd></div></dl>
      <div class="row-btns"><button type="button" class="btn primary" data-ac="cardio">${I.plus} ${lbl('Log cardio', 'Cardio')}</button><button type="button" class="btn" data-ac="gps">${I.target} ${lbl('Track with GPS', 'GPS')}</button></div>
      <div class="field"><span>Steps today</span><div class="steps-row"><div class="stepper"><button type="button" data-ac="sdec" aria-label="1000 fewer">${I.minus}</button><input id="act-steps" inputmode="numeric" value="${steps || ''}" placeholder="0" aria-label="Steps today"><button type="button" data-ac="sinc" aria-label="1000 more">${I.plus}</button></div></div>
        <p class="hint">Copy it from your phone’s Health or Fit app. Steps over ${n0(STEP_BASE)} count: everyday moving is already in your goal.</p></div>
      ${items.length ? `<ul class="act-list">${items.join('')}</ul>` : '<p class="muted">Nothing yet today. Workouts you do in RepPlate show up here by themselves.</p>'}
      <div class="pref"><span class="pref-label">Add exercise calories to my goal</span><div class="seg">${EAT_BACK.map(([v, l]) => `<button type="button" class="${eatBack()[0] === v ? 'on' : ''}" data-ac="eb" data-v="${v}">${l}</button>`).join('')}</div></div>
      <p class="hint">Burn estimates are rough, so “Half” is a safe middle ground. Turn it off if you set your goal with a high activity level.</p>`;
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-ac]'); if (!b) return;
    const a = b.dataset.ac, inp = el.querySelector('#act-steps');
    if (a === 'cardio') { openCardio(k); return; }
    if (a === 'gps') { openGpsPick(); return; }
    if (a === 'eb') { S.settings.eatBack = b.dataset.v; save(); draw(); return; }
    if (a === 'del') { S.cardio = cardioList().filter(c => c.id !== b.dataset.id); save(); draw(); return; }
    if (a === 'sinc' || a === 'sdec') { const v = Math.max(0, (parseNum(inp.value) || 0) + (a === 'sinc' ? 1000 : -1000)); setSteps(k, v); draw(); }
  });
  el.addEventListener('change', e => { if (e.target.id === 'act-steps') { setSteps(k, Math.max(0, Math.round(parseNum(e.target.value) || 0))); draw(); } });
  draw();
  return pushLayer(el, { onClose: () => { if (/^(today|food)/.test(currentRoute || 'today')) rerender(); } });
}
function setSteps(k, v) { const m = stepsMap(); if (v > 0) m[k] = Math.min(100000, v); else delete m[k]; save(); }
function openCardio(k = dkey(), preset = {}) {
  const c = { type: preset.type || 'walk', mins: preset.mins || 30, km: preset.km || '', int: 'moderate' };
  const el = sheetEl(`${sheetHead('Log cardio', dayLabel(k))}
    <div class="chips" id="cd-type">${CARDIO.map(([key, l]) => `<button type="button" class="chip ${c.type === key ? 'on' : ''}" data-cd="type" data-v="${key}">${l}</button>`).join('')}</div>
    <div class="grid2">
      <label class="field"><span>Minutes</span><input class="input num" id="cd-min" inputmode="numeric" value="${c.mins}"></label>
      <label class="field" id="cd-km-f"><span>Distance km (optional)</span><input class="input num" id="cd-km" inputmode="decimal" value="${c.km}" placeholder="e.g. 5"></label>
    </div>
    <div class="field"><span>How hard?</span><div class="seg">${INTENS.map(([v, l]) => `<button type="button" class="${c.int === v ? 'on' : ''}" data-cd="int" data-v="${v}">${l}</button>`).join('')}</div></div>
    <p class="cd-est" id="cd-est"></p>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="cd-save">Save</button></div>`);
  const est = () => {
    c.mins = Math.max(0, Math.round(parseNum(el.querySelector('#cd-min').value) || 0)); c.km = parseNum(el.querySelector('#cd-km').value) || 0;
    el.querySelector('#cd-km-f').hidden = !cardioType(c.type)[3];
    el.querySelector('#cd-est').innerHTML = c.mins ? `About <b>${fmtE(cardioKcal(c))} ${eUnit()}</b> burned${c.km && cardioType(c.type)[3] ? ` · ${n1(c.km / (c.mins / 60))} km/h` : ''}` : 'Enter how long you went for.';
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-cd]'); if (!b) return;
    c[b.dataset.cd] = b.dataset.v;
    $$(`[data-cd="${b.dataset.cd}"]`, el).forEach(x => x.classList.toggle('on', x === b));
    est();
  });
  el.addEventListener('input', est);
  el.querySelector('#cd-save').addEventListener('click', () => {
    est(); if (!(c.mins > 0)) return;
    const rec = { id: uid(), d: k, type: c.type, mins: c.mins, km: cardioType(c.type)[3] && c.km > 0 ? Math.round(c.km * 100) / 100 : 0, int: c.int, t: Date.now() };
    rec.kcal = Math.round(cardioKcal(rec));
    cardioList().push(rec); save();
    closeAll(() => { rerender(); toast(`${cardioType(c.type)[1]} saved · ${fmtE(rec.kcal)} ${eUnit()}`); });
  });
  est();
  return pushLayer(el);
}
function openGpsPick() {
  const el = sheetEl(`${sheetHead('Track with GPS', 'Distance and pace while the app is open')}
    <div class="chips">${CARDIO.filter(x => x[3] && x[0] !== 'swim').map(([k, l]) => `<button type="button" class="chip" data-gp="${k}">${l}</button>`).join('')}</div>
    <div class="notice">${I.alert}<div><strong>Keep RepPlate open</strong><p>Phones stop web apps from using GPS in the background, so keep the screen on (RepPlate tries to keep it awake). Your route isn’t saved or sent anywhere, only the distance.</p></div></div>
    <div class="sheet-end"></div>`);
  el.addEventListener('click', e => { const b = e.target.closest('[data-gp]'); if (b) closeAll(() => runGps(b.dataset.gp)); });
  return pushLayer(el);
}
let gps = null;
const hav = (a, b) => { const R = 6371000, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLo = r(b.lon - a.lon); const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
function runGps(type) {
  gps = { type, t0: Date.now(), paused: 0, pausedAt: 0, m: 0, last: null, fix: false, err: '', watch: null };
  const el = overlayEl('<div class="player gps" id="gps"></div>');
  el.addEventListener('click', onGpsClick);
  pushLayer(el, { onClose: () => { if (gps?.watch != null) navigator.geolocation.clearWatch(gps.watch); clearInterval(gps?.timer); gps = null; keepAwake(false); } });
  gps.el = el; keepAwake(true);
  if (!('geolocation' in navigator)) gps.err = 'This phone or browser can’t share its location.';
  else gps.watch = navigator.geolocation.watchPosition(pos => {
    if (!gps) return;
    const c = pos.coords, p = { lat: c.latitude, lon: c.longitude };
    gps.fix = true; gps.acc = c.accuracy; gps.err = '';
    if (c.accuracy > 35 || gps.pausedAt) { gps.last = gps.pausedAt ? null : gps.last; return; }
    if (gps.last) { const d = hav(gps.last, p); if (d >= 3 && d < 200) { gps.m += d; gps.last = p; } } else gps.last = p;
  }, err => { if (gps) gps.err = err.code === 1 ? 'Location is turned off for RepPlate. Allow it in your phone’s settings (Safari or Chrome > Location), then try again.' : 'Waiting for a GPS signal. Head outside for a clearer view of the sky.'; drawGps(); }, { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 });
  gps.timer = setInterval(drawGps, 1000);
  drawGps();
}
const gpsSecs = () => ((gps.pausedAt || Date.now()) - gps.t0 - gps.paused) / 1000;
function drawGps() {
  const box = gps?.el.querySelector('#gps'); if (!box) return;
  const secs = gpsSecs(), km = gps.m / 1000, pace = km > 0.05 ? secs / 60 / km : 0;
  box.innerHTML = `<header class="p-top"><button type="button" class="icon-btn" data-gs="cancel" aria-label="Cancel">${I.close}</button><div class="p-prog"><span>${esc(cardioType(gps.type)[1])} · GPS ${gps.fix ? `<b class="gps-ok">● signal${gps.acc ? ` ±${Math.round(gps.acc)} m` : ''}</b>` : '<em class="muted">finding you…</em>'}</span></div></header>
    <div class="gps-stats">
      <div><span class="huge num">${n1(km)}</span><span class="p-unit">km</span></div>
      <dl class="stats"><div><dt>Time</dt><dd>${clock(secs)}</dd></div><div><dt>${gps.type === 'cycle' ? 'Speed' : 'Pace'}</dt><dd>${gps.type === 'cycle' ? (secs > 30 ? `${n1(km / (secs / 3600))}<small style="font-size:14px"> km/h</small>` : '–') : pace ? `${clock(pace * 60)}<small style="font-size:14px"> /km</small>` : '–'}</dd></div>
      <div><dt>Burned</dt><dd>${fmtE(metKcal(cardioMet({ type: gps.type, mins: secs / 60, km, int: 'moderate' }), secs / 60))}</dd></div><div><dt>Status</dt><dd style="font-size:17px">${gps.pausedAt ? 'Paused' : 'Moving'}</dd></div></dl>
      ${gps.err ? `<p class="error">${esc(gps.err)}</p>` : ''}
    </div>
    <div class="rest-btns gps-btns"><button type="button" class="btn" data-gs="${gps.pausedAt ? 'resume' : 'pause'}">${gps.pausedAt ? `${I.play} Resume` : `${I.pause} Pause`}</button><button type="button" class="btn primary" data-gs="finish">${I.check} Finish</button></div>`;
}
function onGpsClick(e) {
  const b = e.target.closest('[data-gs]'); if (!b || !gps) return;
  const a = b.dataset.gs;
  if (a === 'pause' && !gps.pausedAt) { gps.pausedAt = Date.now(); gps.last = null; }
  else if (a === 'resume' && gps.pausedAt) { gps.paused += Date.now() - gps.pausedAt; gps.pausedAt = 0; }
  else if (a === 'cancel') { closeAll(); return; }
  else if (a === 'finish') {
    const mins = Math.round(gpsSecs() / 60), km = Math.round(gps.m / 10) / 100;
    if (mins >= 1) { const rec = { id: uid(), d: dkey(), type: gps.type, mins, km, int: 'moderate', gps: true, t: Date.now() }; rec.kcal = Math.round(cardioKcal(rec)); cardioList().push(rec); save(); closeAll(() => { rerender(); toast(`Saved: ${n1(km)} km in ${mins} min`); }); }
    else closeAll(() => toast('Too short to save'));
    return;
  }
  drawGps();
}

/* ============================== FASTING ============================== */
const FAST_PLANS = [[12, '12:12'], [14, '14:10'], [16, '16:8'], [18, '18:6'], [20, '20:4'], [23, 'OMAD']];
function fastState() { const F = S.fast && typeof S.fast === 'object' ? S.fast : (S.fast = {}); F.plan = F.plan || 16; F.log = Array.isArray(F.log) ? F.log : []; return F; }
const hm = ms => { const m = Math.max(0, Math.floor(ms / 60000)); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };
const timeOf = ts => new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
function fastStreak() {
  const F = fastState(); let n = 0, k = dkey();
  const done = new Set(F.log.filter(f => (f.end - f.start) / 36e5 >= f.goal - 0.01).map(f => dkey(new Date(f.end))));
  if (!done.has(k)) k = addDays(k, -1);
  while (done.has(k)) { n++; k = addDays(k, -1); }
  return n;
}
function fastCard() {
  const F = fastState(), A = F.active;
  if (A) {
    const pct = clamp((Date.now() - A.start) / (A.goal * 36e5), 0, 1);
    return `<section class="panel tight mini-card fast-on" aria-label="Fasting">
      <div class="mc-head"><span class="eyebrow" style="margin:0">Fasting</span><span class="muted num" style="font-size:12px">${A.goal} h goal</span></div>
      <div class="mc-val"><b class="num" data-fast-since="${A.start}">${hm(Date.now() - A.start)}</b><span class="muted">h</span></div>
      <div class="mbar fast-bar"><i style="width:${(pct * 100).toFixed(1)}%"></i></div>
      <div class="mc-btns"><button type="button" class="btn sm grow" data-act="fast">${pct >= 1 ? `${I.check} Done · end` : 'End or edit'}</button></div>
    </section>`;
  }
  const last = F.log[F.log.length - 1];
  return `<section class="panel tight mini-card" aria-label="Fasting">
    <div class="mc-head"><span class="eyebrow" style="margin:0">Fasting</span><span class="muted num" style="font-size:12px">${FAST_PLANS.find(p => p[0] === F.plan)?.[1] || ''}</span></div>
    <div class="mc-val">${last ? `<b class="num">${hm(last.end - last.start)}</b><span class="muted">h last</span>` : '<span class="muted">Not fasting</span>'}</div>
    <p class="muted mc-sub">${fastStreak() >= 2 ? `${fastStreak()}-day streak` : last ? esc(ago(last.end)) : 'Intermittent fasting'}</p>
    <div class="mc-btns"><button type="button" class="btn sm grow" data-act="fast">${I.clock} ${lbl('Start fast', 'Start')}</button></div>
  </section>`;
}
function openFast() {
  const F = fastState();
  const el = sheetEl(`${sheetHead('Fasting', 'Intermittent fasting timer')}<div id="fs-body" class="form"></div><div class="sheet-end"></div>`);
  const body = el.querySelector('#fs-body');
  const draw = () => {
    const A = F.active, hist = F.log.slice(-7).reverse();
    const avg = F.log.length ? F.log.slice(-14).reduce((s, f) => s + (f.end - f.start), 0) / Math.min(14, F.log.length) : 0;
    body.innerHTML = A ? `
      <div class="fast-ring"><div class="rest-ring">${ringSVG((Date.now() - A.start) / (A.goal * 36e5), 240, 16)}<div class="ring-center"><span class="huge num" data-fast-since="${A.start}">${hm(Date.now() - A.start)}</span><span class="lbl">of ${A.goal} hours</span></div></div></div>
      <p style="text-align:center">Started ${esc(timeOf(A.start))}${dkey(new Date(A.start)) !== dkey() ? ' yesterday' : ''} · eating window opens <b>${esc(timeOf(A.start + A.goal * 36e5))}</b></p>
      <button type="button" class="btn primary xl block" data-fs="end">${I.check} End fast</button>
      <div class="row-btns"><button type="button" class="btn" data-fs="earlier">${lbl('Started 1 h earlier', '−1 hour')}</button><button type="button" class="btn ghost danger" data-fs="cancel">${lbl('Cancel this fast', 'Cancel')}</button></div>`
      : `
      <div class="field"><span>Plan (hours fasting : hours eating)</span><div class="seg wrap3">${FAST_PLANS.map(([h, l]) => `<button type="button" class="${F.plan === h ? 'on' : ''}" data-fs="plan" data-v="${h}">${l}</button>`).join('')}</div></div>
      <div class="field"><span>I stopped eating</span><div class="seg wrap3">${[[0, 'Just now'], [1, '1 h ago'], [2, '2 h ago'], [3, '3 h ago'], [4, '4 h ago'], [6, '6 h ago']].map(([h, l]) => `<button type="button" class="${h === 0 ? 'on' : ''}" data-fs="ago" data-v="${h}">${l}</button>`).join('')}</div></div>
      <button type="button" class="btn primary xl block" data-fs="start">${I.clock} Start ${F.plan}-hour fast</button>
      <p class="hint">Water, black coffee and plain tea are fine while fasting. Fasting isn’t right for everyone: skip it if you’re pregnant, diabetic or have had an eating disorder, and check with a doctor if unsure.</p>`;
    body.innerHTML += `${F.log.length ? `<dl class="eq"><div><dt>Fasts</dt><dd>${F.log.length}</dd></div><div class="op">·</div><div><dt>Average</dt><dd>${hm(avg)}</dd></div><div class="op">·</div><div><dt>Streak</dt><dd>${fastStreak()}</dd></div></dl>
      <ul class="act-list">${hist.map(f => `<li><span><b>${hm(f.end - f.start)} h</b><small class="muted">${esc(shortDay(dkey(new Date(f.end))))} · goal ${f.goal} h</small></span><span>${(f.end - f.start) / 36e5 >= f.goal - 0.01 ? `<span class="tag ok-tag">${I.check} Done</span>` : '<span class="tag">Short</span>'}</span></li>`).join('')}</ul>` : ''}`;
  };
  let agoH = 0;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-fs]'); if (!b) return;
    const a = b.dataset.fs;
    if (a === 'plan') { F.plan = Number(b.dataset.v); save(); }
    else if (a === 'ago') { agoH = Number(b.dataset.v); $$('[data-fs="ago"]', el).forEach(x => x.classList.toggle('on', x === b)); return; }
    else if (a === 'start') { F.active = { start: Date.now() - agoH * 36e5, goal: F.plan }; save(); say(`Fast started. ${F.plan} hours.`); }
    else if (a === 'earlier' && F.active) { F.active.start -= 36e5; save(); }
    else if (a === 'cancel') { if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = 'Tap again to cancel'; return; } F.active = null; save(); }
    else if (a === 'end' && F.active) {
      const f = { start: F.active.start, end: Date.now(), goal: F.active.goal };
      F.active = null; if (f.end - f.start >= 30 * 60000) F.log.push(f); F.log = F.log.slice(-200); save();
      closeAll(() => { rerender(); toast((f.end - f.start) / 36e5 >= f.goal ? `Fast complete: ${hm(f.end - f.start)} h. Well done!` : `Fast ended at ${hm(f.end - f.start)} h`); });
      return;
    }
    draw();
  });
  draw();
  return pushLayer(el, { onClose: () => { if (/^today/.test(currentRoute || 'today')) rerender(); } });
}
setInterval(() => {
  for (const n of $$('[data-fast-since]')) { const t = hm(Date.now() - Number(n.dataset.fastSince)); if (n.textContent !== t) n.textContent = t; }
}, 15000);

/* ============================== RECIPES ============================== */
const recipes = () => (Array.isArray(S.recipes) ? S.recipes : (S.recipes = []));
function recipeTotals(r) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, sugar: 0, fiber: 0, sat: 0, salt: 0, g: 0 };
  for (const it of r.items) { const v = nutrFor(it.per100, it.grams); t.g += it.grams; for (const k of Object.keys(v)) t[k] += v[k] || 0; }
  return t;
}
function recipeFood(r) {
  const t = recipeTotals(r), g = t.g || 1, per = k => t[k] / g * 100;
  return { key: 'recipe_' + r.id, code: '', custom: true, recipe: r.id, source: 'recipe', name: r.name, brand: 'My recipe', quantity: '', ul: 'g', img: '',
    servingG: Math.round(g / Math.max(1, r.servings)), servingLabel: '1 serving', packageG: null,
    per100: { kcal: per('kcal'), p: per('p'), c: per('c'), f: per('f'), sugar: per('sugar'), fiber: per('fiber'), sat: per('sat'), salt: per('salt') } };
}
function openRecipes(ctx) {
  const list = recipes().slice().sort((a, b) => (b.updated || 0) - (a.updated || 0));
  const el = sheetEl(`${sheetHead('My recipes', 'Cook once, log a serving with one tap')}
    <button type="button" class="btn primary block" data-rl="new">${I.plus} New recipe</button>
    ${list.length ? `<ul class="food-list">${list.map(r => { const t = recipeTotals(r); return `<li class="food-row"><button type="button" class="fr-main" data-rl="log" data-id="${esc(r.id)}"><span class="fr-name">${esc(r.name)}</span><span class="fr-sub">${fmtE(t.kcal / Math.max(1, r.servings))} ${eUnit()} a serving · ${plural(r.servings, 'serving')} · ${plural(r.items.length, 'ingredient')}</span></button><button type="button" class="icon-btn" data-rl="edit" data-id="${esc(r.id)}" aria-label="Edit ${esc(r.name)}">${I.pen}</button></li>`; }).join('')}</ul>`
      : '<div class="state">' + I.utensils + '<span>Add the ingredients of something you cook often, like a pot of stew or a batch of muffins. RepPlate works out the calories in each serving.</span></div>'}
    <div class="sheet-end"></div>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-rl]'); if (!b) return;
    const r = recipes().find(x => x.id === b.dataset.id);
    if (b.dataset.rl === 'new') openRecipe(ctx, null, true);
    else if (b.dataset.rl === 'edit' && r) openRecipe(ctx, r, true);
    else if (b.dataset.rl === 'log' && r) openFoodSheet({ ...recipeFood(r), lastUnit: 'serving', lastQty: 1 }, ctx, null, true);
  });
  return pushLayer(el);
}
function openRecipe(ctx, r0, replace = false) {
  const r = r0 ? JSON.parse(JSON.stringify(r0)) : { id: uid(), name: '', servings: 4, items: [] };
  const el = sheetEl(`${sheetHead(r0 ? 'Edit recipe' : 'New recipe', 'Ingredients for the whole pot or batch')}
    <div class="form">
      <label class="field"><span>Name</span><input class="input" id="rc-name" maxlength="60" value="${esc(r.name)}" placeholder="e.g. Mom’s chicken curry"></label>
      <div class="field"><span>Makes how many servings?</span><div class="stepper"><button type="button" data-rc="sdec" aria-label="Fewer">${I.minus}</button><input id="rc-serv" inputmode="numeric" value="${r.servings}" aria-label="Servings"><button type="button" data-rc="sinc" aria-label="More">${I.plus}</button></div></div>
      <div id="rc-items"></div>
      <label class="search-box"><span class="sr">Add an ingredient</span>${I.search}<input class="input" id="rc-q" type="search" autocomplete="off" placeholder="Add an ingredient, e.g. chicken, rice, onion"></label>
      <ul class="food-list" id="rc-res"></ul>
      ${aiKey() ? `<details class="calc"><summary>Paste a recipe instead</summary><div class="form" style="margin-top:10px"><textarea class="input say-text" id="rc-paste" rows="5" placeholder="Paste the ingredient list, e.g. 1 kg chicken thighs, 2 onions, 2 cups rice…"></textarea><button type="button" class="btn" data-rc="ai">${I.bolt} Read the ingredients</button><div id="rc-ai-msg"></div></div></details>` : ''}
      <p class="error" id="rc-err" hidden></p>
    </div>
    <div class="sheet-foot">${r0 ? `<button type="button" class="btn danger" data-rc="del" aria-label="Delete recipe">${I.trash}</button>` : ''}<button type="button" class="btn primary xl grow" id="rc-save">Save &amp; log a serving</button></div>`);
  const box = el.querySelector('#rc-items'), res = el.querySelector('#rc-res'), q = el.querySelector('#rc-q');
  let found = [];
  const draw = () => {
    const t = recipeTotals(r), sv = Math.max(1, r.servings);
    box.innerHTML = r.items.length ? `<ul class="rc-list">${r.items.map((it, i) => `<li><span class="rc-n">${esc(it.name)}</span><span class="rc-g"><input class="input num" data-rc-g="${i}" inputmode="decimal" value="${Math.round(it.grams)}" aria-label="Grams of ${esc(it.name)}"><small>g</small></span><span class="num rc-k">${fmtE(nutrFor(it.per100, it.grams).kcal || 0)}</span><button type="button" class="icon-btn" data-rc="rm" data-i="${i}" aria-label="Remove ${esc(it.name)}">${I.close}</button></li>`).join('')}</ul>
      <div class="rc-sum"><div><span class="muted">Whole recipe</span><b class="num">${fmtE(t.kcal)} ${eUnit()}</b></div><div><span class="muted">Each serving</span><b class="num">${fmtE(t.kcal / sv)} ${eUnit()}</b></div><div><span class="muted">Protein / serving</span><b class="num">${n0(t.p / sv)} g</b></div></div>`
      : '<p class="muted">No ingredients yet. Search below to add them.</p>';
  };
  const search = () => {
    const s = q.value.trim().toLowerCase();
    if (s.length < 2) { res.innerHTML = ''; return; }
    const mine = Object.values(S.foods).filter(f => f.per100?.kcal != null && !f.recipe && f.name.toLowerCase().includes(s)).slice(0, 4).map(f => ({ name: f.name, g: f.servingG || 100, per100: f.per100 }));
    const db = FOODDB ? searchDb(s, 8).map(d => ({ name: d.name, g: d.portions?.[0]?.[0] || 100, per100: dbToFood(d).per100 })) : [];
    found = [...mine, ...db];
    res.innerHTML = found.map((f, i) => `<li class="food-row"><button type="button" class="fr-main" data-rc="add" data-i="${i}"><span class="fr-name">${esc(f.name)}</span><span class="fr-sub">${fmtE(f.per100.kcal)} ${eUnit()} per 100 g</span></button><span class="fr-add">${I.plus}</span></li>`).join('') || '<li class="muted" style="padding:8px 2px">No match. Try a simpler word.</li>';
  };
  loadFoodDb().then(search).catch(() => {});
  q.addEventListener('input', search);
  el.addEventListener('input', e => { const i = e.target.dataset.rcG; if (i != null) { r.items[+i].grams = Math.max(0, parseNum(e.target.value) || 0); const t = recipeTotals(r), sv = Math.max(1, r.servings); const sum = el.querySelector('.rc-sum'); if (sum) sum.innerHTML = `<div><span class="muted">Whole recipe</span><b class="num">${fmtE(t.kcal)} ${eUnit()}</b></div><div><span class="muted">Each serving</span><b class="num">${fmtE(t.kcal / sv)} ${eUnit()}</b></div><div><span class="muted">Protein / serving</span><b class="num">${n0(t.p / sv)} g</b></div>`; } if (e.target.id === 'rc-serv') { r.servings = clamp(Math.round(parseNum(e.target.value) || 1), 1, 100); draw(); } });
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-rc]'); if (!b) return;
    const a = b.dataset.rc;
    if (a === 'add') { const f = found[+b.dataset.i]; if (f) { r.items.push({ name: f.name, grams: f.g, per100: { ...f.per100 } }); q.value = ''; res.innerHTML = ''; draw(); } }
    else if (a === 'rm') { r.items.splice(+b.dataset.i, 1); draw(); }
    else if (a === 'sinc' || a === 'sdec') { r.servings = clamp(r.servings + (a === 'sinc' ? 1 : -1), 1, 100); el.querySelector('#rc-serv').value = r.servings; draw(); }
    else if (a === 'del') { if (!b.dataset.sure) { b.dataset.sure = '1'; b.innerHTML = 'Delete?'; return; } S.recipes = recipes().filter(x => x.id !== r.id); delete S.foods['recipe_' + r.id]; save(); closeAll(() => toast('Recipe deleted')); }
    else if (a === 'ai') {
      const txt = el.querySelector('#rc-paste').value.trim(), msg = el.querySelector('#rc-ai-msg'); if (!txt) return;
      b.disabled = true; msg.innerHTML = '<div class="state"><span class="spinner"></span><span>Reading the recipe…</span></div>';
      try {
        const out = await aiGenerate([{ text: `${AI_RULES}\nThis is a RECIPE. List every ingredient with grams for the WHOLE recipe (all servings together), raw weights as bought, and kcal/protein/carbs/fat for that amount. Skip water and salt.\nRecipe:\n${txt.slice(0, 3000)}` }]);
        for (const it of out.items) r.items.push({ name: it.name, grams: it.grams, per100: { kcal: it.kcal / it.grams * 100, p: it.p / it.grams * 100, c: it.c / it.grams * 100, f: it.f / it.grams * 100 } });
        const m = txt.match(/serves\s*(\d+)|(\d+)\s*servings?|makes\s*(\d+)/i); if (m) { r.servings = Number(m[1] || m[2] || m[3]); el.querySelector('#rc-serv').value = r.servings; }
        msg.innerHTML = `<p class="hint">Added ${plural(out.items.length, 'ingredient')}. Check the amounts.</p>`; draw();
      } catch (x) { msg.innerHTML = `<p class="error">${esc(aiMsg(x))}</p>`; }
      b.disabled = false;
    }
  });
  el.querySelector('#rc-save').addEventListener('click', () => {
    r.name = el.querySelector('#rc-name').value.trim(); r.servings = clamp(Math.round(parseNum(el.querySelector('#rc-serv').value) || 1), 1, 100);
    const err = el.querySelector('#rc-err');
    if (!r.name) { err.textContent = 'Give the recipe a name.'; err.hidden = false; return; }
    if (!r.items.length) { err.textContent = 'Add at least one ingredient.'; err.hidden = false; return; }
    r.updated = Date.now();
    const list = recipes(), i = list.findIndex(x => x.id === r.id); if (i >= 0) list[i] = r; else list.push(r);
    const food = recipeFood(r); S.foods[food.key] = { ...(S.foods[food.key] || {}), ...food, lastUsed: Date.now(), lastUnit: 'serving', lastQty: 1 };
    save();
    openFoodSheet({ ...food, lastUnit: 'serving', lastQty: 1 }, ctx, null, true);
  });
  draw();
  return replace ? replaceLayer(el) : pushLayer(el);
}

/* ============================== NUTRIENT DETAIL & NUTRI-SCORE ============================== */
function nutrientTotals(k) {
  const t = { fiber: 0, sugar: 0, sat: 0, salt: 0 }, list = S.log[k] || [];
  let have = 0;
  for (const e of list) {
    const v = nutrFor(e.per100, e.grams || 0); let any = false;
    for (const n of Object.keys(t)) if (v[n] != null) { t[n] += v[n]; any = true; }
    if (any) have++;
  }
  return { t, have, n: list.length };
}
function nutrientsPanel(k) {
  const { t, have, n } = nutrientTotals(k); if (!n) return '';
  const goal = goalOn(k);
  const rows = [['fiber', 'Fibre', 30, 'min', 'aim for at least'], ['sugar', 'Sugar', Math.round(90 * goal / 2000), 'max', 'keep under'], ['sat', 'Saturated fat', Math.round(goal * 0.1 / 9), 'max', 'keep under'], ['salt', 'Salt', 5, 'max', 'keep under']];
  return `<section class="panel tight" aria-label="Nutrients">
    <div class="section-row">${secHead(I.leaf, 'protein', 'Nutrients')}<span class="muted" style="font-size:13px">${have < n ? `from ${have} of ${n} foods` : 'all foods'}</span></div>
    <ul class="nut-list">${rows.map(([key, l, target, kind, word]) => {
      const v = t[key], pct = v / target, cls = kind === 'min' ? (pct >= 1 ? 'good' : pct >= 0.6 ? 'mid' : 'low') : (pct > 1 ? 'bad' : pct > 0.8 ? 'mid' : 'good');
      return `<li class="nut ${cls}"><div class="macro-head"><span>${l}</span><span class="num">${n1(v)}<small> / ${word} ${target} g</small></span></div><div class="mbar"><i style="width:${clamp(pct * 100, 2, 100)}%"></i></div></li>`;
    }).join('')}</ul>
    ${have < n ? '<p class="hint">Quick adds and some photo or voice entries don’t include these details.</p>' : ''}
  </section>`;
}
const NS_COL = { a: '#038141', b: '#85BB2F', c: '#FECB02', d: '#EE8100', e: '#E63E11' };
const nsBadge = (f, mini) => /^[a-e]$/.test(f?.ns || '') ? (mini ? `<span class="ns-mini" style="--ns:${NS_COL[f.ns]}" title="Nutri-Score ${f.ns.toUpperCase()}">${f.ns.toUpperCase()}</span>`
  : `<span class="ns" aria-label="Nutri-Score ${f.ns.toUpperCase()}"><small>Nutri-Score</small>${'abcde'.split('').map(g => `<b class="${g === f.ns ? 'on' : ''}" style="--ns:${NS_COL[g]}">${g.toUpperCase()}</b>`).join('')}</span>`) : '';

/* ============================== PROGRESS: measurements, photos, strength, recovery, export ============================== */
// small reusable line chart: points [{d: 'YYYY-MM-DD', v}], formatted labels
function lineChart(pts, fmt = v => n1(v), label = '') {
  if (pts.length < 2) return '';
  const W = 320, H = 140, pad = { l: 40, r: 10, t: 10, b: 22 };
  const t0 = fromKey(pts[0].d), t1 = fromKey(pts[pts.length - 1].d), span = Math.max(1, (t1 - t0) / 864e5);
  let lo = Math.min(...pts.map(p => p.v)), hi = Math.max(...pts.map(p => p.v));
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const padV = (hi - lo) * 0.12; lo -= padV; hi += padV;
  const X = d => pad.l + ((fromKey(d) - t0) / 864e5) / span * (W - pad.l - pad.r), Y = v => pad.t + (hi - v) / (hi - lo) * (H - pad.t - pad.b);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.d).toFixed(1)},${Y(p.v).toFixed(1)}`).join('');
  const area = `${path}L${X(pts[pts.length - 1].d).toFixed(1)},${H - pad.b}L${X(pts[0].d).toFixed(1)},${H - pad.b}Z`;
  const day = d => esc(fromKey(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }));
  return `<svg class="wchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
    ${[hi - padV, lo + padV].map(v => `<line class="wc-grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="wc-lab" x="${pad.l - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`).join('')}
    <path class="wc-area" d="${area}"/><path class="wc-line" d="${path}"/>
    ${pts.map(p => `<circle class="wc-dot" cx="${X(p.d).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="2.8"/>`).join('')}
    <circle class="wc-end" cx="${X(pts[pts.length - 1].d).toFixed(1)}" cy="${Y(pts[pts.length - 1].v).toFixed(1)}" r="4.5"/>
    <text class="wc-lab" x="${pad.l}" y="${H - 4}">${day(pts[0].d)}</text><text class="wc-lab" x="${W - pad.r}" y="${H - 4}" text-anchor="end">${day(pts[pts.length - 1].d)}</text>
  </svg>`;
}

/* ---------- body measurements ---------- */
const MEASURES = [['waist', 'Waist'], ['chest', 'Chest'], ['hips', 'Hips'], ['arm', 'Arm'], ['thigh', 'Thigh'], ['neck', 'Neck']];
const lenU = () => (S.settings.weight === 'lb' ? 'in' : 'cm');
const toL = cm => (lenU() === 'in' ? cm / 2.54 : cm);
const fromL = v => (lenU() === 'in' ? v * 2.54 : v);
const bodyLog = () => (Array.isArray(S.body) ? S.body : (S.body = []));
function navyBF(sex, h, neck, waist, hips) {   // US Navy formula, centimetres
  if (!(h > 0 && neck > 0 && waist > neck)) return null;
  const v = sex === 'f' ? (hips > 0 ? 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.221 * Math.log10(h)) - 450 : null)
    : 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(h)) - 450;
  return v == null || !Number.isFinite(v) ? null : clamp(Math.round(v * 10) / 10, 3, 60);
}
const latestBody = key => { const l = bodyLog().filter(b => b[key] != null); return l.length ? l[l.length - 1] : null; };
function openMeasure() {
  const P = S.settings.profile || {}, today = bodyLog().find(b => b.d === dkey()) || {};
  const el = sheetEl(`${sheetHead('Body measurements', `${dayLabel(dkey())} · in ${lenU()}`)}
    <div class="grid2">${MEASURES.map(([k, l]) => { const last = latestBody(k); return `<label class="field"><span>${l}</span><input class="input num" data-ms="${k}" inputmode="decimal" value="${today[k] != null ? trimNum(Math.round(toL(today[k]) * 10) / 10) : ''}" placeholder="${last ? trimNum(Math.round(toL(last[k]) * 10) / 10) : ''}"></label>`; }).join('')}</div>
    <label class="field"><span>Body fat % (optional)</span><div class="bf-row"><input class="input num" id="ms-bf" inputmode="decimal" value="${today.bf ?? ''}" placeholder="${latestBody('bf')?.bf ?? 'e.g. 20'}"><button type="button" class="btn" data-ms-calc>${lbl('Work it out', 'Estimate')}</button></div></label>
    <p class="hint" id="ms-hint">Measure first thing in the morning, relaxed, tape snug but not tight. Waist: at your belly button. “Work it out” uses the US Navy formula with your neck, waist${P.sex === 'f' ? ', hips' : ''} and height.</p>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="ms-save">Save</button></div>`);
  const val = k => { const v = parseNum(el.querySelector(`[data-ms="${k}"]`).value); return v > 0 ? fromL(v) : null; };
  el.querySelector('[data-ms-calc]').addEventListener('click', () => {
    const h = Number(P.height), sex = P.sex || 'm', bf = navyBF(sex, h, val('neck') ?? latestBody('neck')?.neck, val('waist') ?? latestBody('waist')?.waist, val('hips') ?? latestBody('hips')?.hips);
    const hint = el.querySelector('#ms-hint');
    if (!h) { hint.textContent = 'Add your height first: Me > Daily goals > TDEE & goal calculator.'; return; }
    if (bf == null) { hint.textContent = `Fill in your neck and waist${sex === 'f' ? ' and hips' : ''} to work it out.`; return; }
    el.querySelector('#ms-bf').value = bf; hint.textContent = `About ${bf}% body fat. Tape estimates can be a few % off, but they’re good for tracking change.`;
  });
  el.querySelector('#ms-save').addEventListener('click', () => {
    const rec = { d: dkey() };
    for (const [k] of MEASURES) { const v = val(k); if (v != null) rec[k] = Math.round(v * 10) / 10; }
    const bf = parseNum(el.querySelector('#ms-bf').value); if (bf > 2 && bf < 70) rec.bf = Math.round(bf * 10) / 10;
    if (Object.keys(rec).length === 1) { closeAll(); return; }
    const log = bodyLog(), i = log.findIndex(b => b.d === rec.d);
    if (i >= 0) log[i] = { ...log[i], ...rec }; else { log.push(rec); log.sort((a, b) => (a.d < b.d ? -1 : 1)); }
    save(); closeAll(() => { rerender(); toast('Measurements saved'); });
  });
  return pushLayer(el);
}
function bodyPanel() {
  const log = bodyLog();
  const rows = [...MEASURES, ['bf', 'Body fat']].map(([k, l]) => {
    const pts = log.filter(b => b[k] != null); if (!pts.length) return '';
    const last = pts[pts.length - 1][k], first = pts[0][k], d = last - first, isBf = k === 'bf';
    const fmt = v => isBf ? `${n1(v)}%` : `${n1(toL(v))} ${lenU()}`;
    return `<li><span>${l}</span><b class="num">${fmt(last)}</b><span class="num ${d < 0 ? 'down' : d > 0 ? 'up' : ''}">${pts.length > 1 ? `${d > 0 ? '+' : d < 0 ? '−' : ''}${isBf ? n1(Math.abs(d)) : n1(Math.abs(toL(d)))}${isBf ? '%' : ''}` : '–'}</span></li>`;
  }).join('');
  const waist = log.filter(b => b.waist != null).map(b => ({ d: b.d, v: toL(b.waist) }));
  return `<section class="panel tight" aria-label="Body measurements">
    <div class="section-row">${secHead(I.target, 'weight', 'Measurements')}${log.length ? `<span class="muted" style="font-size:13px">change since ${esc(shortDay(log[0].d))}</span>` : ''}</div>
    ${rows ? `<ul class="ms-list">${rows}</ul>${waist.length > 1 ? `<p class="list-title">Waist</p>${lineChart(waist, v => n1(v), 'Waist over time')}` : ''}` : '<p class="muted">The scale doesn’t tell the whole story. If your waist shrinks while your weight stays put, you’re losing fat and building muscle.</p>'}
    <button type="button" class="btn block" data-act="measure">${I.plus} Add measurements</button>
  </section>`;
}

/* ---------- progress photos (kept on this phone only, in IndexedDB) ---------- */
let photoUrls = [];
function photoDb() {
  return new Promise((res, rej) => {
    if (!('indexedDB' in window)) { rej(new Error('no idb')); return; }
    const r = indexedDB.open('repplate-photos', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos', { keyPath: 'id' });
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  });
}
async function photoTx(mode, fn) {
  const db = await photoDb();
  return new Promise((res, rej) => { const tx = db.transaction('photos', mode), st = tx.objectStore('photos'), q = fn(st); tx.oncomplete = () => res(q?.result); tx.onerror = () => rej(tx.error); });
}
const photoAll = async () => ((await photoTx('readonly', st => st.getAll())) || []).sort((a, b) => a.t - b.t);
async function photoBlob(file, max = 1280) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85));
  } finally { URL.revokeObjectURL(url); }
}
function photosPanel() {
  setTimeout(fillPhotos, 0);
  return `<section class="panel tight" aria-label="Progress photos">
    <div class="section-row">${secHead(I.camera, 'weight', 'Progress photos')}<span class="muted" style="font-size:13px">only on this phone</span></div>
    <div id="photo-grid" class="photo-grid"><div class="state"><span class="spinner"></span></div></div>
    <input type="file" id="photo-file" accept="image/*" hidden>
    <div class="row-btns"><button type="button" class="btn primary" data-act="photo-add">${I.camera} ${lbl('Add photo', 'Add')}</button><button type="button" class="btn" data-act="photo-compare" id="photo-cmp" disabled>${lbl('Compare', 'Compare')}</button></div>
  </section>`;
}
async function fillPhotos() {
  const grid = $('#photo-grid'); if (!grid) return;
  for (const u of photoUrls) URL.revokeObjectURL(u);
  photoUrls = [];
  let list = [];
  try { list = await photoAll(); } catch (e) { grid.innerHTML = '<p class="muted">Photos can’t be stored in this browser (private mode?).</p>'; return; }
  const cmp = $('#photo-cmp'); if (cmp) cmp.disabled = list.length < 2;
  grid.innerHTML = list.length ? list.slice().reverse().map(p => { const u = URL.createObjectURL(p.blob); photoUrls.push(u); return `<button type="button" class="ph" data-act="photo-view" data-id="${esc(p.id)}"><img src="${u}" alt="Progress photo, ${esc(p.pose)}, ${esc(shortDay(p.d))}"><span>${esc(shortDay(p.d))}</span></button>`; }).join('')
    : '<p class="muted">Take a front and side photo every few weeks in the same spot and light. Comparing them shows changes the mirror misses.</p>';
}
function openPhotoAdd(file) {
  const st = { pose: 'front' };
  const prev = URL.createObjectURL(file);
  const el = sheetEl(`${sheetHead('New progress photo', dayLabel(dkey()))}
    <img class="ph-big" src="${prev}" alt="">
    <div class="seg">${[['front', 'Front'], ['side', 'Side'], ['back', 'Back']].map(([v, l]) => `<button type="button" class="${v === st.pose ? 'on' : ''}" data-pp="${v}">${l}</button>`).join('')}</div>
    <p class="hint">Saved only on this phone. It isn’t uploaded and isn’t included in backups.</p>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="pp-save">Save photo</button></div>`);
  el.addEventListener('click', e => { const b = e.target.closest('[data-pp]'); if (!b) return; st.pose = b.dataset.pp; $$('[data-pp]', el).forEach(x => x.classList.toggle('on', x === b)); });
  el.querySelector('#pp-save').addEventListener('click', async () => {
    try { const blob = await photoBlob(file); await photoTx('readwrite', s => s.put({ id: uid(), d: dkey(), t: Date.now(), pose: st.pose, blob })); closeAll(() => { fillPhotos(); toast('Photo saved'); }); }
    catch (x) { toast('Couldn’t save the photo on this phone'); }
  });
  return pushLayer(el, { onClose: () => URL.revokeObjectURL(prev) });
}
async function openPhotoView(id) {
  const list = await photoAll(), p = list.find(x => x.id === id); if (!p) return;
  const u = URL.createObjectURL(p.blob);
  const el = sheetEl(`${sheetHead(`${p.pose[0].toUpperCase()}${p.pose.slice(1)} photo`, longDate(p.d))}<img class="ph-big" src="${u}" alt="">
    <div class="sheet-foot"><button type="button" class="btn danger grow" id="pv-del">${I.trash} Delete photo</button></div>`);
  el.querySelector('#pv-del').addEventListener('click', async e => {
    if (!e.currentTarget.dataset.sure) { e.currentTarget.dataset.sure = '1'; e.currentTarget.textContent = 'Tap again to delete'; return; }
    await photoTx('readwrite', s => s.delete(id)); closeAll(() => { fillPhotos(); toast('Photo deleted'); });
  });
  return pushLayer(el, { onClose: () => URL.revokeObjectURL(u) });
}
async function openPhotoCompare() {
  const list = await photoAll(); if (list.length < 2) return;
  const urls = list.map(p => URL.createObjectURL(p.blob));
  const opt = sel => list.map((p, i) => `<option value="${i}" ${i === sel ? 'selected' : ''}>${esc(shortDay(p.d))} · ${esc(p.pose)}</option>`).join('');
  const pose = list[list.length - 1].pose, same = list.map((p, i) => [p, i]).filter(([p]) => p.pose === pose);
  const a0 = same.length > 1 ? same[0][1] : 0, b0 = list.length - 1;
  const el = sheetEl(`${sheetHead('Compare', 'Before and after')}
    <div class="ph-cmp"><figure><img id="pc-a" src="${urls[a0]}" alt="Earlier photo"><select class="input" id="pc-sa" aria-label="Earlier photo">${opt(a0)}</select></figure>
      <figure><img id="pc-b" src="${urls[b0]}" alt="Later photo"><select class="input" id="pc-sb" aria-label="Later photo">${opt(b0)}</select></figure></div>
    <p class="hint" id="pc-gap"></p><div class="sheet-end"></div>`);
  const gap = () => { const a = list[+el.querySelector('#pc-sa').value], b = list[+el.querySelector('#pc-sb').value]; const days = Math.round(Math.abs(fromKey(b.d) - fromKey(a.d)) / 864e5); el.querySelector('#pc-gap').textContent = days ? `${plural(days, 'day')} apart` : 'Same day'; };
  el.addEventListener('change', e => { if (e.target.id === 'pc-sa') el.querySelector('#pc-a').src = urls[+e.target.value]; if (e.target.id === 'pc-sb') el.querySelector('#pc-b').src = urls[+e.target.value]; gap(); });
  gap();
  return pushLayer(el, { onClose: () => urls.forEach(u => URL.revokeObjectURL(u)) });
}

/* ---------- strength: estimated 1-rep max, volume, calendar ---------- */
const e1rm = (w, reps) => (reps >= 1 && reps <= 12 && w > 0 ? (reps === 1 ? w : w * (1 + reps / 30)) : 0);
function liftHistory(ex) {   // oldest first: best set per workout
  const out = [];
  for (const w of S.workouts.slice().reverse()) {
    const sets = (w.sets || []).filter(s => s.ex === ex && s.w > 0 && !s.drop); if (!sets.length) continue;
    const best = sets.reduce((a, s) => (e1rm(s.w, s.reps) > e1rm(a.w, a.reps) ? s : a));
    out.push({ d: dkey(new Date(w.start)), e: e1rm(best.w, best.reps), best, vol: sets.reduce((v, s) => v + s.w * s.reps, 0), sets: sets.length });
  }
  return out;
}
function liftList() {
  const seen = new Map();
  for (const w of S.workouts) for (const s of w.sets || []) if (s.w > 0 && !seen.has(s.ex)) seen.set(s.ex, w.start);
  return [...seen.keys()].map(ex => { const h = liftHistory(ex); return { ex, h, best: Math.max(...h.map(x => x.e)), last: h[h.length - 1] }; }).filter(x => x.h.length);
}
let calMonth = 0;
function calendarHTML() {
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + calMonth);
  const y = base.getFullYear(), m = base.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
  const kinds = {};
  for (const w of S.workouts) { const k = dkey(new Date(w.start)); (kinds[k] = kinds[k] || new Set()).add(w.type === 'hiit' ? 'hiit' : 'lift'); }
  for (const c of cardioList()) (kinds[c.d] = kinds[c.d] || new Set()).add('cardio');
  let count = 0; const cells = [];
  for (let i = 0; i < first; i++) cells.push('<span></span>');
  for (let d = 1; d <= days; d++) {
    const k = dkey(new Date(y, m, d)), ks = kinds[k]; if (ks) count++;
    cells.push(`<span class="cal-d ${k === dkey() ? 'today' : ''} ${ks ? 'has' : ''}"><b>${d}</b><i>${ks ? [...ks].map(x => `<em class="cal-${x}"></em>`).join('') : ''}</i></span>`);
  }
  return `<div class="cal-head"><button type="button" class="icon-btn" data-act="cal" data-d="-1" aria-label="Previous month">${I.chevL}</button><strong>${esc(base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))}</strong><button type="button" class="icon-btn" data-act="cal" data-d="1" aria-label="Next month" ${calMonth >= 0 ? 'disabled' : ''}>${I.chevR}</button></div>
    <div class="cal">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => `<span class="cal-w">${d}</span>`).join('')}${cells.join('')}</div>
    <p class="cal-key"><span><em class="cal-lift"></em>Weights</span><span><em class="cal-hiit"></em>Intervals</span><span><em class="cal-cardio"></em>Cardio</span><b>${plural(count, 'active day')}</b></p>`;
}
function weeklySetsChart() {
  const mon = mondayOf(dkey()), weeks = [];
  for (let i = 7; i >= 0; i--) {
    const from = addDays(mon, -7 * i), to = addDays(from, 6);
    const n = S.workouts.filter(w => { const k = dkey(new Date(w.start)); return k >= from && k <= to; }).reduce((s, w) => s + (w.sets || []).length, 0);
    weeks.push([from, n]);
  }
  const max = Math.max(1, ...weeks.map(x => x[1]));
  return `<div class="wk-bars" role="img" aria-label="Sets per week, last 8 weeks">${weeks.map(([k, n], i) => `<div><i style="height:${(n / max * 100).toFixed(0)}%" class="${i === 7 ? 'now' : ''}"></i><b class="num">${n || ''}</b><span>${esc(fromKey(k).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).replace(' ', ' '))}</span></div>`).join('')}</div>`;
}
function viewStrength() {
  const lifts = liftList().sort((a, b) => b.h.length - a.h.length);
  const u = wUnit(), fw = kg => `${wN(roundW(toW(kg)))} ${u}`;
  return `<header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/train" aria-label="Back">${I.chevL}</button></header>
  <div><p class="eyebrow">Your training over time</p><h1 class="h-display">Strength</h1></div>
  <section class="panel tight" aria-label="Calendar">${calendarHTML()}</section>
  <section class="panel tight" aria-label="Sets per week">${secHead(I.chart, 'workout', 'Sets per week')}${weeklySetsChart()}</section>
  <section class="panel tight" aria-label="Lifts">
    <div class="section-row">${secHead(I.dumbbell, 'workout', 'Lifts')}<span class="muted" style="font-size:13px">estimated 1-rep max</span></div>
    ${lifts.length ? `<ul class="lift-list">${lifts.map(l => {
      const prev = l.h.length > 1 ? l.h[l.h.length - 2].e : null, d = prev ? l.last.e - prev : 0;
      return `<li><a href="#/ex/${encodeURIComponent(l.ex)}#progress"><span><b>${esc(exName(l.ex))}</b><small class="muted">best ${fw(l.best)} · ${plural(l.h.length, 'session')}</small></span><span class="num">${fw(l.last.e)}${prev ? `<small class="${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${d > 0 ? '▲' : d < 0 ? '▼' : '='}</small>` : ''}</span>${I.chevR}</a></li>`;
    }).join('')}</ul><p class="hint">Estimated 1-rep max is worked out from your best set (weight × reps), so you never have to test a true max.</p>` : '<p class="muted">Log weights in your workouts and your lifts show up here with charts.</p>'}
  </section>`;
}
function exProgressPanel(id) {
  const h = liftHistory(id); if (!h.length) return '';
  const u = wUnit(), fw = kg => `${wN(roundW(toW(kg)))} ${u}`;
  const best = h.reduce((a, x) => (x.e > a.e ? x : a));
  return `<section class="panel tight" id="progress" aria-label="Your progress">
    <div class="section-row">${secHead(I.chart, 'workout', 'Your progress')}<span class="muted" style="font-size:13px">${plural(h.length, 'session')}</span></div>
    <dl class="eq" style="border-top:0;padding-top:0"><div><dt>Best 1RM (est.)</dt><dd>${fw(best.e)}</dd></div><div class="op">·</div><div><dt>Best set</dt><dd style="font-size:18px">${best.best.reps} × ${fw(best.best.w)}</dd></div></dl>
    ${lineChart(h.map(x => ({ d: x.d, v: toW(x.e) })), v => wN(Math.round(v)), 'Estimated 1-rep max over time') || '<p class="hint">Do this exercise again to see a chart.</p>'}
    <ul class="sum-list">${h.slice(-5).reverse().map(x => `<li><strong>${esc(shortDay(x.d))}</strong><span>${x.sets} sets · best ${x.best.reps} × ${fw(x.best.w)} · volume ${n0(toW(x.vol))} ${u}</span></li>`).join('')}</ul>
  </section>`;
}

/* ---------- the body figure: which muscles an exercise works, and recovery ----------
   Muscle shapes: react-body-highlighter by GV79 (MIT licence). Front view = f, back view = b, 100 × 200 each. */
const BODY = {"f":[["chest","51.8,41.6 51,55.1 58,58.0 67.8,55.5 70.6,47.3 62,41.6|29.8,46.5 31.4,55.5 40.8,58.0 48.2,55.1 47.8,42.0 37.6,42.0"],["obliques","68.6,63.3 67.3,57.1 58.8,59.6 60,64.1 60.4,83.3 65.7,78.8 66.5,69.8|33.9,78.4 33.1,71.8 31,63.3 32.2,57.1 40.8,59.2 39.2,63.3 39.2,83.7"],["abs","56.3,59.2 58,64.1 58.4,78.0 58.4,92.7 56.3,98.4 55.1,104.1 51.4,107.8 51,84.5 50.6,67.3 51,57.1|43.7,58.8 48.6,57.1 49,67.3 48.6,84.5 48.2,107.3 44.5,103.7 40.8,91.4 40.8,78.4 41.2,64.5"],["biceps","16.7,68.2 18,71.4 22.9,66.1 29,53.9 27.8,49.4 20.4,55.9|71.4,49.4 70.2,54.7 76.3,66.1 81.6,71.8 82.9,69.0 78.8,55.5"],["triceps","69.4,55.5 69.4,61.6 75.9,72.7 77.6,70.2 75.5,67.3|22.4,69.4 29.8,55.5 29.8,60.8 22.9,73.1"],["neck","55.5,23.7 50.6,33.5 50.6,39.2 61.6,40.0 70.6,44.9 69.4,36.7 63.3,35.1 58.4,30.6|29,44.9 30.2,37.1 36.3,35.1 41.2,30.2 44.5,24.5 49,33.9 48.6,39.2 38,39.6"],["front-deltoids","78.4,53.1 79.6,47.8 79.2,41.2 75.9,38.0 71,36.3 72.2,42.9 71.4,47.3|28.2,47.3 21.2,53.1 20,47.8 20.4,40.8 24.5,37.1 28.6,37.1 26.9,43.3"],["head","42.4,2.9 40,11.8 42,19.6 46.1,23.3 49.8,25.3 54.7,22.4 57.6,19.2 59.2,10.2 57.1,2.4 49.8,0.0"],["abductors","52.7,110.2 54.3,124.9 60,110.2 62,100.0 64.9,94.3 60,92.7 56.7,104.5|47.8,110.6 44.9,125.3 42,115.9 40.4,113.1 39.6,107.3 38,102.4 34.7,93.9 39.6,92.2 41.6,99.2 43.7,105.3"],["quadriceps","34.7,98.8 37.1,108.2 37.1,127.8 34.3,137.1 31,132.7 29.4,120.0 28.2,111.4 29.4,100.8 32.2,94.7|63.3,105.7 64.5,100.0 66.9,94.7 70.2,101.2 71,111.8 68.2,133.1 65.3,137.6 62.4,128.6 62,111.4|38.8,129.4 38.4,112.2 41.2,118.4 44.5,129.4 42.9,135.1 40,146.1 36.3,146.5 35.5,140.0|59.6,145.7 55.5,129.0 60.8,113.9 61.2,130.2 64.1,139.6 62.9,146.5|32.7,138.4 26.5,145.7 25.7,136.7 25.7,127.3 26.9,114.3 29.4,133.5|71.8,113.1 73.9,124.1 73.9,140.4 72.7,145.7 66.5,138.4 70.2,133.5"],["knees","33.9,140.0 34.7,143.3 35.5,147.3 36.3,151.0 35.1,156.7 29.8,156.7 27.3,152.7 27.3,147.3 30.2,144.1|65.7,140.0 72.2,147.8 72.2,152.2 69.8,157.1 64.9,156.7 62.9,151.0"],["calves","71.4,160.4 73.5,153.5 76.7,161.2 79.6,167.8 78.4,187.8 79.6,195.5 74.7,195.5|24.9,194.7 27.8,164.9 28.2,160.4 26.1,154.3 24.9,157.6 22.4,161.6 20.8,167.8 22,188.2 20.8,195.5|72.7,195.1 69.8,159.2 65.3,158.4 64.1,162.4 64.1,165.3 65.7,177.1|35.5,158.4 35.9,162.4 35.9,166.9 35.1,172.2 35.1,176.7 32.2,182.0 30.6,187.3 26.9,194.7 27.3,187.8 28.2,180.4 28.6,175.5 29,169.8 29.8,164.1 30.2,158.8"],["forearm","6.1,88.6 10.2,75.1 14.7,70.2 16.3,74.3 19.2,73.5 4.5,97.6 0,100.0|84.5,69.8 83.3,73.5 80,73.1 95.1,98.4 100,100.4 93.5,89.4 89.8,76.3|77.6,72.2 77.6,77.6 80.4,84.1 85.3,89.8 92.2,101.2 94.7,99.6|6.9,101.2 13.5,90.6 18.8,84.1 21.6,77.1 21.2,71.8 4.9,98.8"]],"b":[["head","50.6,0.0 46,0.9 40.9,5.5 40.4,12.8 45.1,20.0 55.7,20.0 59.1,13.6 59.6,4.7 55.7,1.3"],["trapezius","44.7,21.7 47.7,21.7 47.2,38.3 47.7,64.7 38.3,53.2 35.3,40.9 31.1,36.6 39.1,33.2 43.8,27.2|52.3,21.7 55.7,21.7 56.6,27.2 60.9,32.8 68.9,36.6 64.7,40.4 61.7,53.2 52.3,64.7 53.2,38.3"],["back-deltoids","29.4,37.0 23,39.1 17.4,44.3 18.3,53.6 24.3,49.4 27.2,46.4|71.1,37.0 78.3,39.6 82.6,44.7 81.7,53.6 74.9,48.9 72.3,45.1"],["upper-back","31.1,38.7 28.1,48.9 28.5,55.3 34,75.3 47.2,71.1 47.2,66.4 36.6,54.0 33.6,41.3|68.9,38.7 71.9,49.4 71.5,56.2 66,75.3 52.8,71.1 52.8,66.4 63.4,54.5 66.4,41.7"],["triceps","26.8,49.8 17.9,55.7 14.5,72.3 16.6,81.7 21.7,63.8 26.8,55.7|73.6,50.2 82.1,55.7 86,73.2 83.4,82.1 77.9,63.0 73.2,55.7|26.8,58.3 26.8,68.5 23,75.3 19.1,77.4 22.6,65.5|72.8,58.3 77,64.7 80.4,77.4 76.6,75.3 72.8,68.9"],["lower-back","47.7,72.8 34.5,77.0 35.3,83.4 49.4,102.1 46.8,83.0|52.3,72.8 65.5,77.0 64.7,83.4 50.6,102.1 53.2,83.8"],["forearm","86.4,75.7 91.1,83.4 93.2,94.0 100,106.4 96.2,104.3 88.1,89.4 84.3,83.8|13.6,75.7 8.9,83.8 6.8,93.6 0,106.4 3.8,104.3 12.3,88.5 15.7,83.0|81.3,79.6 77.4,77.9 79.1,84.7 91.1,103.8 93.2,108.9 94.5,104.7|18.7,79.6 22.1,77.9 20.9,84.3 9.4,103.0 6.8,108.5 5.1,104.7"],["gluteal","44.7,99.6 30.2,108.5 29.8,118.7 31.5,126.0 47.2,121.3 49.4,114.9|55.3,99.1 51.1,114.5 52.3,120.9 68.1,126.0 69.8,119.1 69.4,108.5"],["adductor","48.1,123.0 44.7,123.0 41.3,125.5 45.1,144.3 48.5,135.7 48.9,129.4|51.9,122.6 55.7,123.4 59.1,126.0 54.9,144.3 51.9,136.2 51.1,129.4"],["hamstring","28.9,122.1 31.1,129.4 36.6,126.0 35.3,135.3 34.5,150.2 29.4,158.3 28.9,146.8 27.7,141.3 27.2,131.5|71.5,121.7 69.4,128.9 63.8,126.0 65.5,136.6 66.4,150.2 71.1,158.3 71.5,147.7 72.8,142.1 73.6,131.9|38.7,125.5 44.3,146.0 40.4,166.8 36.2,152.8 37,135.3|61.7,125.5 63.4,136.2 64.3,153.2 60,166.8 56.2,146.4"],["knees","34.5,153.2 31.1,159.1 33.6,166.4 37.4,162.6|66.4,153.6 63,163.0 66.8,166.4 69.4,159.1"],["calves","29.4,160.4 28.5,167.2 24.7,179.6 23.8,192.8 25.5,197.0 28.5,193.2 29.8,180.0 31.9,171.1 31.9,166.8|37.4,165.1 35.3,167.7 33.2,171.9 31.1,180.4 30.2,191.9 34,200.0 38.7,190.6 39.1,168.9|63,165.1 61.3,168.5 61.7,190.6 66.4,199.6 70.6,191.9 68.9,179.6 66.8,170.2|70.6,160.4 72.3,168.5 75.7,179.1 76.6,192.8 74.5,196.6 72.3,193.6 70.6,179.6 68.1,168.1"],["left-soleus","28.5,195.7 30.2,195.7 33.6,201.7 30.6,220.0 28.5,213.6 26.8,198.3"],["right-soleus","69.8,195.7 71.9,195.7 73.6,198.3 71.9,213.2 70.2,219.6 67.2,202.1"]]};
const BODY_NAMES = { f: new Set(BODY.f.map(x => x[0])), b: new Set(BODY.b.map(x => x[0])) };
const FEM_W = [[0, .9], [30, .9], [45, .86], [62, .86], [82, .9], [95, 1.04], [112, 1.1], [135, 1.04], [160, .98], [200, .96]];
const femX = y => { for (let k = 0; k < FEM_W.length - 1; k++) { const [y0, f0] = FEM_W[k], [y1, f1] = FEM_W[k + 1]; if (y >= y0 && y <= y1) return f0 + (f1 - f0) * (y - y0) / (y1 - y0); } return 1; };
const BODY_FEM = Object.fromEntries(['f', 'b'].map(sd => [sd, BODY[sd].map(([n, pts]) => [n, pts.split('|').map(pp => pp.split(' ').map(q => { const [x, y] = q.split(',').map(Number); return `${(50 + (x - 50) * femX(y)).toFixed(1)},${y}`; }).join(' ')).join('|')])]));
const isFemale = () => S.settings.profile?.sex === 'f';
// exercise-library muscle names → body shapes
const MUSCLE_SHAPES = {
  chest: ['chest'], shoulders: ['front-deltoids', 'back-deltoids'], triceps: ['triceps'], biceps: ['biceps'], forearms: ['forearm'],
  lats: ['upper-back'], 'middle back': ['upper-back', 'trapezius'], 'lower back': ['lower-back'], traps: ['trapezius'], neck: ['neck'],
  abdominals: ['abs', 'obliques'], glutes: ['gluteal'], abductors: ['gluteal'], adductors: ['abductors', 'adductor'],
  quadriceps: ['quadriceps'], hamstrings: ['hamstring'], calves: ['calves', 'left-soleus', 'right-soleus'],
};
const MUSCLE_WORD = { abdominals: 'abs', quadriceps: 'quads', adductors: 'inner thighs', abductors: 'outer hips' };
const muscleWord = m => MUSCLE_WORD[m] || m;
const andList = a => a.length < 2 ? (a[0] || '') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`;
function bodyFig(classOf, { sides = 'fb', label = '', cls = '' } = {}) {
  const list = [...sides];
  const SH = isFemale() ? BODY_FEM : BODY;
  const one = (sd, dx) => `<g transform="translate(${dx} 0)">${SH[sd].map(([name, pts]) => pts.split('|').map(pp => `<polygon class="bf ${classOf(name) || ''}" data-m="${name}" points="${pp}"/>`).join('')).join('')}</g>`;
  const w = list.length * 100 + (list.length - 1) * 14;
  return `<svg class="bodyfig ${cls}" viewBox="-3 -3 ${w + 6} 206" role="img" aria-label="${esc(label)}">${list.map((sd, i) => one(sd, i * 114)).join('')}</svg>`;
}
function exTargets(e) {
  const main = [...new Set(e.m || [])], help = [...new Set(e.s || [])].filter(m => !main.includes(m));
  const mainS = new Set(main.flatMap(m => MUSCLE_SHAPES[m] || [])), helpS = new Set(help.flatMap(m => MUSCLE_SHAPES[m] || []));
  return { main, help, mainS, cls: name => mainS.has(name) ? 'bf-main' : helpS.has(name) ? 'bf-help' : '' };
}
function musclesCard(e) {
  if (!e || !(e.m || []).length) return '';
  const t = exTargets(e), main = andList(t.main.map(muscleWord)), help = andList(t.help.map(muscleWord));
  return `<section class="panel tight muscles-card" aria-label="Muscles worked">
    ${secHead(I.user, 'workout', 'Muscles worked')}
    ${bodyFig(t.cls, { label: `Main: ${main}.${help ? ` Also works: ${help}.` : ''}` })}
    <div class="mw-key"><p><i class="k-main"></i><span>Feel it in your <b>${esc(main)}</b></span></p>${help ? `<p><i class="k-help"></i><span>Also works your ${esc(help)}</span></p>` : ''}</div>
  </section>`;
}
function musclePip(id) {
  const e = EXMAP.get(id); if (!e || !(e.m || []).length) return '';
  const t = exTargets(e), shapes = [...t.mainS];
  // triceps show on both views: count them for the back unless the front already has something
  const f = shapes.some(n => BODY_NAMES.f.has(n) && n !== 'triceps');
  const b = shapes.some(n => BODY_NAMES.b.has(n) && n !== 'triceps') || (shapes.includes('triceps') && !f);
  return `<div class="mus-pip" aria-hidden="true">${bodyFig(t.cls, { sides: (f ? 'f' : '') + (b ? 'b' : '') || 'f' })}</div>`;
}
const feelLine = id => { const e = EXMAP.get(id); return e && (e.m || []).length ? `<p class="p-feel"><i></i>Feel it in your ${esc(andList([...new Set(e.m)].map(muscleWord)))}</p>` : ''; };

/* ---------- muscle recovery map ---------- */
function muscleLoad() {
  const now = Date.now(), out = {};
  for (const w of S.workouts) {
    if (now - w.start > 4 * 864e5) continue;
    for (const s of w.sets || []) {
      const e = EXMAP.get(s.ex); if (!e) continue;
      const decay = Math.max(0, 1 - (now - (s.t || w.start)) / (72 * 36e5)); if (!decay) continue;
      for (const m of e.m) out[m] = (out[m] || 0) + decay;
      for (const m of e.s || []) out[m] = (out[m] || 0) + decay * 0.5;
    }
  }
  return out;
}
const recState = v => (!v ? 'fresh' : v >= 6 ? 'tired' : v >= 2.5 ? 'mid' : 'ok');
function bodyMapSVG(load) {
  const shapeLoad = {};
  for (const [m, shapes] of Object.entries(MUSCLE_SHAPES)) for (const sh of shapes) shapeLoad[sh] = Math.max(shapeLoad[sh] || 0, load[m] || 0);
  const skip = new Set(['head', 'knees']);
  return `<div class="bodymap">${bodyFig(n => skip.has(n) ? '' : `rec-${recState(shapeLoad[n] || 0)}`, { label: 'Muscle recovery map, front and back' })}
    <p class="bm-labs"><span>Front</span><span>Back</span></p></div>`;
}
const MUSCLE_ORDER = ['chest', 'shoulders', 'triceps', 'biceps', 'forearms', 'lats', 'middle back', 'lower back', 'traps', 'abdominals', 'glutes', 'quadriceps', 'hamstrings', 'calves', 'adductors', 'abductors'];
function recoveryPanel() {
  if (!S.workouts.some(w => (w.sets || []).length)) return '';
  const load = muscleLoad(), tired = MUSCLE_ORDER.filter(m => (load[m] || 0) >= 2.5), fresh = MUSCLE_ORDER.filter(m => !(load[m] > 0.5));
  return `<section class="panel tight" aria-label="Muscle recovery">
    <div class="section-row">${secHead(I.user, 'workout', 'Muscle recovery')}<a class="link" href="#/strength" style="font-size:14px">Strength</a></div>
    ${bodyMapSVG(load)}
    <p class="rec-key"><span><i class="rec-fresh"></i>Fresh</span><span><i class="rec-ok"></i>Nearly</span><span><i class="rec-mid"></i>Recovering</span><span><i class="rec-tired"></i>Worked hard</span></p>
    <p class="hint">${tired.length ? `Give <b>${esc(tired.slice(0, 4).join(', '))}</b> a rest today. ` : ''}${fresh.length ? `Ready to train: ${esc(fresh.slice(0, 5).join(', '))}.` : 'Everything has had a workout recently. A rest day or light cardio is a good idea.'}</p>
  </section>`;
}

/* ---------- export: spreadsheet files and calendar reminders ---------- */
const csvCell = v => { const s = v == null ? '' : String(v); return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = rows => rows.map(r => r.map(csvCell).join(',')).join('\r\n');
async function shareOrDownload(name, text, mime, preferShare = true) {
  const blob = new Blob([text], { type: mime });
  try {
    const file = new File([blob], name, { type: mime });
    if (preferShare && navigator.canShare?.({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) { await navigator.share({ files: [file], title: name }); return 'shared'; }
  } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return 'downloaded';
}
function exportCsv(kind) {
  const r1 = v => (v == null ? '' : Math.round(v * 10) / 10);
  if (kind === 'food') {
    const rows = [['Date', 'Meal', 'Food', 'Brand', 'Amount', 'Grams', 'kcal', 'Protein g', 'Carbs g', 'Fat g', 'Sugar g', 'Fibre g', 'Sat fat g', 'Salt g']];
    for (const k of Object.keys(S.log).sort()) for (const e of S.log[k]) { const v = nutrFor(e.per100, e.grams || 0); rows.push([k, MEAL_NAME[e.meal] || e.meal, e.name, e.brand || '', e.amountLabel || '', r1(e.grams), Math.round(e.kcal || 0), r1(e.p), r1(e.c), r1(e.f), r1(v.sugar), r1(v.fiber), r1(v.sat), r1(v.salt)]); }
    return ['repplate-food-log.csv', csv(rows)];
  }
  if (kind === 'workouts') {
    const rows = [['Date', 'Workout', 'Exercise', 'Set', 'Reps', `Weight ${wUnit()}`, 'Seconds', 'Effort (RPE)', 'Drop set', 'Minutes']];
    for (const w of S.workouts.slice().reverse()) {
      const d = dkey(new Date(w.start)), mins = Math.round((w.end - w.start) / 60000);
      if (!(w.sets || []).length) rows.push([d, w.name, '', '', '', '', '', '', '', mins]);
      for (const s of w.sets || []) rows.push([d, w.name, exName(s.ex), s.set, s.reps || '', s.w ? wN(roundW(toW(s.w))) : '', s.secs || '', s.rpe || '', s.drop ? 'yes' : '', mins]);
    }
    for (const c of cardioList()) rows.push([c.d, `Cardio: ${cardioType(c.type)[1]}`, c.km ? `${c.km} km` : '', '', '', '', '', '', '', c.mins]);
    return ['repplate-workouts.csv', csv(rows.sort((a, b) => (a[0] === 'Date' ? -1 : b[0] === 'Date' ? 1 : a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)))];
  }
  const days = new Set([...weights().map(w => w.d), ...bodyLog().map(b => b.d), ...Object.keys(stepsMap()), ...Object.keys(S.water || {})]);
  const rows = [['Date', `Weight ${wUnit()}`, ...MEASURES.map(([, l]) => `${l} ${lenU()}`), 'Body fat %', 'Steps', 'Water glasses', 'Food kcal', 'Burned kcal']];
  for (const d of [...days].sort()) {
    const w = weights().find(x => x.d === d), b = bodyLog().find(x => x.d === d) || {};
    rows.push([d, w ? wN(roundW10(toW(w.kg))) : '', ...MEASURES.map(([k]) => (b[k] != null ? r1(toL(b[k])) : '')), b.bf ?? '', stepsMap()[d] || '', (S.water || {})[d] || '', Math.round(dayTotals(d).kcal) || '', Math.round(burnedOn(d).total) || '']);
  }
  return ['repplate-body-and-activity.csv', csv(rows)];
}
const icsDate = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
function buildIcs(opts) {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RepPlate//Workout reminders//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:RepPlate'];
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const BY = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const nextDay = (wd, hh, mm) => { const d = new Date(); d.setHours(hh, mm, 0, 0); let add = (wd - d.getDay() + 7) % 7; if (add === 0 && d < new Date()) add = 7; d.setDate(d.getDate() + add); return d; };
  const ev = (uidPart, start, mins, rule, title, desc, alarm) => lines.push('BEGIN:VEVENT', `UID:repplate-${uidPart}-${stamp}@repplate.app`, `DTSTAMP:${stamp}`, `DTSTART:${icsDate(start)}`, `DURATION:PT${mins}M`, `RRULE:${rule}`, `SUMMARY:${title}`, `DESCRIPTION:${desc}`,
    ...(alarm ? ['BEGIN:VALARM', `TRIGGER:-PT${alarm}M`, 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'END:VALARM'] : ['BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'END:VALARM']), 'END:VEVENT');
  const [hh, mm] = opts.time.split(':').map(Number), url = location.origin + location.pathname;
  if (opts.workouts) {
    const prog = S.program && programOf(S.program.id);
    for (const [wd, rid] of Object.entries(schedule())) {
      const r = S.routines.find(x => x.id === rid); if (!r) continue;
      const title = prog?.alt ? `RepPlate: ${prog.name} workout` : `RepPlate: ${r.name}`;
      ev(`w${wd}`, nextDay(Number(wd), hh, mm), routineMinutes(r), `FREQ=WEEKLY;BYDAY=${BY[wd]}`, title.replace(/[,;]/g, ' '), `Open RepPlate and tap Start. ${url}#/train`, 15);
    }
  }
  if (opts.food) { const d = new Date(); d.setHours(19, 30, 0, 0); if (d < new Date()) d.setDate(d.getDate() + 1); ev('food', d, 5, 'FREQ=DAILY', 'RepPlate: log today’s food', `${url}#/food`, 0); }
  if (opts.weigh) ev('weigh', nextDay(1, 7, 0), 5, 'FREQ=WEEKLY;BYDAY=MO', 'RepPlate: weigh in', `Same time each week, before breakfast. ${url}#/today`, 0);
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
function openExport() {
  const has = hasSchedule();
  const el = sheetEl(`${sheetHead('Export & reminders', 'Your data, your calendar')}
    <h3 class="list-title">Spreadsheets (CSV)</h3>
    <p class="hint">Opens in Excel, Google Sheets or Numbers. On a phone you can save it to Files or send it on.</p>
    <div class="exp-btns"><button type="button" class="btn" data-ex="food">${I.apple} Food log</button><button type="button" class="btn" data-ex="workouts">${I.dumbbell} Workouts</button><button type="button" class="btn" data-ex="body" aria-label="Body and activity">${I.target} Body stats</button></div>
    <h3 class="list-title">Calendar reminders</h3>
    <p class="hint">Web apps can’t send reminders by themselves, so RepPlate adds repeating events to your phone’s calendar, and the calendar reminds you.</p>
    <label class="check"><input type="checkbox" id="ics-w" ${has ? 'checked' : 'disabled'}><span>My workout days${has ? '' : ' (set them on the Train tab first)'}</span></label>
    <label class="field"><span>Workout time</span><input class="input" type="time" id="ics-t" value="${esc(S.settings.icsTime || '17:30')}"></label>
    <label class="check"><input type="checkbox" id="ics-f"><span>Every evening at 19:30: log today’s food</span></label>
    <label class="check"><input type="checkbox" id="ics-m"><span>Mondays at 07:00: weigh in</span></label>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="ics-go">${I.clock} Add to my calendar</button></div>`);
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-ex]'); if (!b) return;
    const [name, text] = exportCsv(b.dataset.ex);
    const how = await shareOrDownload(name, '﻿' + text, 'text/csv');
    if (how !== 'cancelled') toast(how === 'shared' ? 'Shared' : `${name} saved to your downloads`);
  });
  el.querySelector('#ics-go').addEventListener('click', async () => {
    const opts = { workouts: el.querySelector('#ics-w').checked, food: el.querySelector('#ics-f').checked, weigh: el.querySelector('#ics-m').checked, time: el.querySelector('#ics-t').value || '17:30' };
    if (!opts.workouts && !opts.food && !opts.weigh) { toast('Tick at least one reminder'); return; }
    S.settings.icsTime = opts.time; save();
    await shareOrDownload('repplate-reminders.ics', buildIcs(opts), 'text/calendar', false);
    toast('Open the downloaded file and tap “Add all”');
  });
  return pushLayer(el);
}

/* ============================== AI COACH CHAT ============================== */
async function aiChat(history, system) {
  const key = aiKey(); if (!key) throw new AiError('nokey');
  const models = aiOrder(await aiModelList(key)), started = Date.now();
  let last = null;
  for (const model of models) {
    if (Date.now() - started > 80000) break;
    if (last) aiSwitching(last);
    const body = { systemInstruction: { parts: [{ text: system }] }, contents: history.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })), generationConfig: { temperature: 0.6, maxOutputTokens: 2048 } };
    let res;
    try { res = await aiCall(model, key, body, 25000); }
    catch (e) { if (e.code === 'timeout' || e.code === 'network') { last = e; cool(model); continue; } throw e; }
    if (res.ok) {
      const j = await res.json(), cand = j.candidates?.[0];
      const text = (cand?.content?.parts || []).filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('').trim();
      if (text) { promoteModel(model, last); aiLastModel = model; return text; }
      last = new AiError(cand?.finishReason === 'SAFETY' ? 'other' : 'empty'); continue;
    }
    const err = await aiErrorFrom(res);
    if (err.code === 'badkey' || err.code === 'region' || err.code === 'blocked') throw err;
    if (err.code === 'busy' || err.code === 'quota') cool(model, err.code === 'quota' ? 60 : 15);
    last = err;
  }
  throw last || new AiError('other');
}
function coachContext() {
  const st = S.settings, P = st.profile || {}, k = dkey(), t = dayTotals(k);
  const days = []; for (let i = 1; i <= 7; i++) { const d = addDays(k, -i); if ((S.log[d] || []).length) days.push(dayTotals(d)); }
  const avg = f => days.length ? Math.round(days.reduce((s, x) => s + x[f], 0) / days.length) : null;
  const tr = weightTrend(), sg = smartGoal();
  const recent = S.workouts.filter(w => Date.now() - w.start < 14 * 864e5);
  const lifts = liftList().slice(0, 6).map(l => `${exName(l.ex)} est. 1RM ${Math.round(l.last.e)} kg`).join('; ');
  const foods = {}; for (let i = 0; i < 7; i++) for (const e of S.log[addDays(k, -i)] || []) foods[e.name] = (foods[e.name] || 0) + 1;
  const top = Object.entries(foods).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n]) => n).join(', ');
  const prog = S.program && programOf(S.program.id);
  const F = fastState(), hab = habitState();
  return [
    `Today: ${longDate(k)}. Units: ${st.energy === 'kJ' ? 'kJ (show kcal too)' : 'kcal'}, ${wUnit()}.`,
    `Person: ${P.sex === 'f' ? 'female' : P.sex === 'm' ? 'male' : 'sex not given'}${P.age ? `, ${P.age} years` : ''}${P.height ? `, ${P.height} cm` : ''}${tr ? `, weight trend ${n1(tr.trend)} kg (${tr.week != null ? `${tr.week > 0 ? '+' : ''}${n1(tr.week)} kg this week` : 'not enough weigh-ins for a weekly change'})` : ', no weigh-ins yet'}.`,
    `Goals: ${st.kcal} kcal a day, protein ${st.protein} g, carbs ${st.carbs} g, fat ${st.fat} g.${energyNeeds()?.tdee ? ` Formula estimate: BMR about ${Math.round(energyNeeds().bmr)} kcal, TDEE (maintenance) about ${Math.round(energyNeeds().tdee)} kcal.` : ''}${sg.ready ? ` From their logs their real TDEE is about ${Math.round(sg.tdee)} kcal a day.` : ''}`,
    `Food needs: ${dietActive() ? dietSummary() : 'none set'}.`,
    `Today so far: ${Math.round(t.kcal)} kcal, protein ${Math.round(t.p)} g. Burned through exercise today: ${Math.round(burnedOn(k).total)} kcal.`,
    `Last 7 days: logged on ${days.length} days${days.length ? `, average ${avg('kcal')} kcal and ${avg('p')} g protein` : ''}. Foods they log most: ${top || 'none yet'}.`,
    `Training (last 14 days): ${recent.length} sessions${recent.length ? ` (${[...new Set(recent.map(w => w.name))].slice(0, 6).join(', ')})` : ''}. ${prog ? `On the program ${prog.name}, week ${programWeek(S.program)} of ${prog.weeks}.` : hasSchedule() ? 'Has a weekly schedule.' : 'No schedule set.'} ${lifts ? `Lifts: ${lifts}.` : ''}`,
    `Other: water today ${waterToday()} of ${st.waterGoal || 8} glasses; steps today ${stepsMap()[k] || 'not entered'}; ${F.active ? `fasting now (${hm(Date.now() - F.active.start)} h of ${F.active.goal})` : 'not fasting'}${hab.list.length ? `; habits: ${hab.list.map(h => h.name).join(', ')}` : ''}.`,
  ].join('\n');
}
const COACH_RULES = `You are the friendly, practical coach inside RepPlate, a free fitness and calorie app used in South Africa. You can see a summary of the person's own data below.
Rules:
- Be specific to their numbers and foods. Be encouraging but honest.
- Keep answers short: usually under 120 words, a few sentences or up to 5 short bullet points. Use "- " for bullets and **bold** sparingly. No headings, no tables.
- Use everyday South African foods and terms where it helps (pap, maas, chakalaka, boerewors, Woolworths, Checkers, Pick n Pay).
- Respect their food needs strictly.
- You are not a doctor or dietitian. Don't diagnose. For pain, injuries, eating disorders, pregnancy, diabetes, medication or anything worrying, suggest they see a professional.
- Never suggest eating under 1,200 kcal (women) or 1,500 kcal (men) a day, crash diets, or extreme fasting. Don't push supplements.
- If something is missing from their data, say what to log in RepPlate to get a better answer.`;
const COACH_STARTERS = ['How am I doing this week?', 'Why isn’t my weight changing?', 'How can I get more protein?', 'What should I eat for supper tonight?', 'What should I train next?', 'Help me stay motivated'];
const coachLog = () => (Array.isArray(S.coach) ? S.coach : (S.coach = []));
function mdLite(text) {
  const blocks = esc(text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split(/\n{2,}/);
  return blocks.map(b => {
    const lines = b.split('\n');
    if (lines.every(l => /^\s*([-*•]|\d+[.)])\s+/.test(l))) return `<ul>${lines.map(l => `<li>${l.replace(/^\s*([-*•]|\d+[.)])\s+/, '')}</li>`).join('')}</ul>`;
    return `<p>${lines.map(l => /^\s*[-*•]\s+/.test(l) ? `• ${l.replace(/^\s*[-*•]\s+/, '')}` : l).join('<br>')}</p>`;
  }).join('');
}
function openCoach() {
  if (!aiKey()) return openAiSetupPrompt('coach');
  const el = sheetEl(`${sheetHead('Coach', 'Ask anything about your eating and training')}
    <div class="chat" id="chat" aria-live="polite"></div>
    <div class="sheet-foot chat-foot"><textarea class="input chat-in" id="chat-in" rows="1" maxlength="600" placeholder="Ask your coach…" aria-label="Your question"></textarea><button type="button" class="btn primary chat-send" id="chat-send" aria-label="Send">${I.up}</button></div>`, 'tall');
  const box = el.querySelector('#chat'), inp = el.querySelector('#chat-in'), send = el.querySelector('#chat-send');
  let busy = false;
  const draw = () => {
    const log = coachLog();
    box.innerHTML = (log.length ? log.map(m => `<div class="msg ${m.role === 'user' ? 'me' : 'ai'}">${m.role === 'user' ? `<p>${esc(m.text)}</p>` : mdLite(m.text)}</div>`).join('')
      : `<div class="msg ai">${mdLite(`Hi! I can see your goals, food logs, weigh-ins and workouts in RepPlate. Ask me anything, or tap a question below.`)}</div>`)
      + (busy ? '<div class="msg ai typing"><i></i><i></i><i></i></div>' : '')
      + (!busy ? `<div class="chips chat-starters">${COACH_STARTERS.filter(q => !log.some(m => m.text === q)).slice(0, 4).map(q => `<button type="button" class="chip" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div>` : '')
      + (log.length && !busy ? '<button type="button" class="link chat-clear" data-clear>Start a new chat</button>' : '');
    const sc = el.querySelector('.sheet'); if (sc) sc.scrollTop = sc.scrollHeight;
  };
  const ask = async q => {
    q = q.trim(); if (!q || busy) return;
    coachLog().push({ role: 'user', text: q.slice(0, 600), t: Date.now() }); S.coach = coachLog().slice(-30); save();
    busy = true; inp.value = ''; draw();
    try {
      const answer = await aiChat(coachLog().slice(-12), `${COACH_RULES}\n\nTheir data:\n${coachContext()}`);
      coachLog().push({ role: 'model', text: answer.slice(0, 4000), t: Date.now() });
    } catch (x) { coachLog().push({ role: 'model', text: aiMsg(x), t: Date.now(), err: true }); }
    S.coach = coachLog().filter(m => !m.err || m === coachLog()[coachLog().length - 1]).slice(-30); save();
    busy = false; draw();
  };
  el.addEventListener('click', e => {
    const c = e.target.closest('[data-q]'); if (c) { ask(c.dataset.q); return; }
    if (e.target.closest('[data-clear]')) { S.coach = []; save(); draw(); }
  });
  send.addEventListener('click', () => ask(inp.value));
  inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(inp.value); } });
  inp.addEventListener('input', () => { inp.style.height = 'auto'; inp.style.height = Math.min(120, inp.scrollHeight) + 'px'; });
  draw();
  return pushLayer(el);
}

/* ============================== MACRO STYLES ============================== */
const MACRO_STYLES = [['balanced', 'Balanced', 'Even split. Good for most people.'], ['protein', 'High protein', 'About 2 g protein per kg. Helps keep muscle while losing fat and builds it when training.'], ['lowcarb', 'Low carb', 'Fewer starches, more protein and fat.'], ['keto', 'Keto', 'Very low carb (about 25 g). Hard to stick to; check with a doctor if you have a medical condition.']];
function macrosFor(style, kcal, kg) {
  let p, c, f;
  if (style === 'protein') { p = clamp(2 * kg, kcal * 0.25 / 4, kcal * 0.35 / 4); f = kcal * 0.27 / 9; c = (kcal - p * 4 - f * 9) / 4; }
  else if (style === 'lowcarb') { p = kcal * 0.3 / 4; c = kcal * 0.2 / 4; f = (kcal - p * 4 - c * 4) / 9; }
  else if (style === 'keto') { c = 25; p = kcal * 0.25 / 4; f = (kcal - p * 4 - c * 4) / 9; }
  else { p = kcal * 0.25 / 4; f = kcal * 0.28 / 9; c = (kcal - p * 4 - f * 9) / 4; }
  const r5 = v => Math.max(0, Math.round(v / 5) * 5);
  return { p: r5(p), c: r5(c), f: r5(f) };
}

/* ============================== DAILY HABITS ============================== */
const HABIT_IDEAS = ['Veg with lunch and supper', '7–8 hours of sleep', 'A 20-minute walk', 'No sugary drinks', 'Protein at every meal', '5 minutes of stretching', '2 pieces of fruit', 'No alcohol', 'Water before each meal', 'No screens in bed', 'Cook at home', 'Stop eating 3 h before bed'];
function habitState() { const H = S.habits && typeof S.habits === 'object' ? S.habits : (S.habits = {}); H.list = Array.isArray(H.list) ? H.list : []; H.done = H.done && typeof H.done === 'object' ? H.done : {}; return H; }
const habitDone = (id, k) => (habitState().done[k] || []).includes(id);
function habitStreak(id) { let k = dkey(), n = 0; if (!habitDone(id, k)) k = addDays(k, -1); while (habitDone(id, k)) { n++; k = addDays(k, -1); } return n; }
function habitsCard() {
  const H = habitState(), k = dkey();
  if (!H.list.length) return H.dismissed ? '' : `<section class="panel tight" aria-label="Habits">
    <div class="section-row">${secHead(I.check, 'protein', 'Daily habits')}</div>
    <p class="muted" style="font-size:15px">Small daily wins add up. Pick a few habits, like veg with every meal or a 20-minute walk, and tick them off.</p>
    <div class="row-btns"><button type="button" class="btn primary" data-act="habits">${I.plus} ${lbl('Choose habits', 'Choose')}</button><button type="button" class="btn ghost" data-act="habits-later">Not now</button></div></section>`;
  const done = H.list.filter(h => habitDone(h.id, k)).length;
  return `<section class="panel tight" aria-label="Habits">
    <div class="section-row">${secHead(I.check, 'protein', 'Daily habits')}<span class="muted num" style="font-size:13px">${done} of ${H.list.length} today · <button type="button" class="link" data-act="habits" style="font-size:13px;padding:0">Edit</button></span></div>
    <ul class="habit-list">${H.list.map(h => { const on = habitDone(h.id, k), sk = habitStreak(h.id); return `<li><button type="button" class="habit ${on ? 'on' : ''}" data-act="habit" data-id="${esc(h.id)}" aria-pressed="${on}"><span class="hb-box">${on ? I.check : ''}</span><span class="hb-name">${esc(h.name)}</span>${sk >= 2 ? `<span class="hb-streak">${I.bolt}${sk}</span>` : ''}</button></li>`; }).join('')}</ul>
  </section>`;
}
function openHabits() {
  const H = habitState();
  const el = sheetEl(`${sheetHead('Daily habits', 'Pick up to 8 small things to tick off each day')}
    <div class="chips" id="hb-ideas"></div>
    <div class="search-form"><input class="input" id="hb-new" maxlength="40" placeholder="Your own, e.g. Pack lunch for work"><button type="button" class="btn" id="hb-add">${I.plus} Add</button></div>
    <div id="hb-mine"></div>
    <div class="sheet-end"></div>`);
  const draw = () => {
    const names = new Set(H.list.map(h => h.name));
    el.querySelector('#hb-ideas').innerHTML = HABIT_IDEAS.map(n => `<button type="button" class="chip ${names.has(n) ? 'on' : ''}" data-hb="toggle" data-n="${esc(n)}">${names.has(n) ? '' : '+ '}${esc(n)}</button>`).join('');
    el.querySelector('#hb-mine').innerHTML = H.list.length ? `<p class="list-title">Your habits (${H.list.length}/8)</p><ul class="act-list">${H.list.map(h => `<li><span><b>${esc(h.name)}</b><small class="muted">${habitStreak(h.id) ? `${habitStreak(h.id)}-day streak` : 'new'}</small></span><span><button type="button" class="icon-btn" data-hb="rm" data-id="${esc(h.id)}" aria-label="Remove ${esc(h.name)}">${I.trash}</button></span></li>`).join('')}</ul>` : '';
  };
  const add = n => { n = n.trim(); if (!n || H.list.length >= 8 || H.list.some(h => h.name.toLowerCase() === n.toLowerCase())) { if (H.list.length >= 8) toast('8 habits is plenty. Remove one first.'); return; } H.list.push({ id: uid(), name: n.slice(0, 40) }); save(); draw(); };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-hb]');
    if (e.target.closest('#hb-add')) { add(el.querySelector('#hb-new').value); el.querySelector('#hb-new').value = ''; return; }
    if (!b) return;
    if (b.dataset.hb === 'toggle') { const h = H.list.find(x => x.name === b.dataset.n); if (h) H.list = H.list.filter(x => x !== h); else add(b.dataset.n); save(); draw(); }
    if (b.dataset.hb === 'rm') { H.list = H.list.filter(x => x.id !== b.dataset.id); save(); draw(); }
  });
  el.querySelector('#hb-new').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); add(e.target.value); e.target.value = ''; } });
  draw();
  return pushLayer(el, { onClose: () => { if (/^today/.test(currentRoute || 'today')) rerender(); } });
}

/* ============================== AI LOGGING: snap a meal, say what you ate (Google Gemini, user's own free key) ============================== */
const AI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const aiKey = () => String(S.settings.aiKey || '').trim();
class AiError extends Error { constructor(code, msg) { super(msg || code); this.code = code; } }
// Picks the best "Flash" models this key can use: newest stable Flash first, then the -latest alias, then Flash-Lite.
function rankModels(names) {
  const scored = [];
  for (const full of names) {
    const n = full.replace(/^models\//, '');
    if (/image|tts|live|audio|embed|thinking|transcribe|robotics|computer|omni/i.test(n)) continue;
    let m = n.match(/^gemini-(\d+(?:\.\d+)?)-flash(-lite)?(?:-(preview[\w-]*|\d{3}|exp[\w-]*))?$/);
    if (m) { scored.push([n, parseFloat(m[1]) * 10 - (m[2] ? 100 : 0) - (m[3] ? 3 : 0)]); continue; }
    if (n === 'gemini-flash-latest') scored.push([n, 5]);
    else if (n === 'gemini-flash-lite-latest') scored.push([n, -96]);
  }
  return scored.sort((a, b) => b[1] - a[1]).map(x => x[0]);
}
async function aiFetch(url, opts = {}, ms = 45000) {
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { ...opts, signal: ctl.signal }); }
  catch (e) { throw new AiError(navigator.onLine === false ? 'offline' : e.name === 'AbortError' ? 'timeout' : 'network'); }
  finally { clearTimeout(timer); }
}
async function aiErrorFrom(res) {
  let msg = '', reason = '';
  try { const j = await res.json(); msg = j.error?.message || ''; reason = JSON.stringify(j.error?.details || '') + ' ' + (j.error?.status || ''); } catch (e) { /* not json */ }
  const all = (msg + ' ' + reason).toLowerCase();
  if (/api[_ ]key[_ ](not valid|invalid)|api key expired|api_key_invalid/.test(all) || res.status === 401) return new AiError('badkey', msg);
  if (res.status === 429 || /quota|resource_exhausted|rate limit/.test(all)) return new AiError('quota', msg);
  if (/location|region|country|not supported in your/.test(all)) return new AiError('region', msg);
  if (res.status === 403) return new AiError('blocked', msg);
  if (res.status === 404 || /not found|not supported for generatecontent|unsupported model/.test(all)) return new AiError('model', msg);
  if (res.status >= 500) return new AiError('busy', msg);
  return new AiError('other', msg);
}
async function aiConnect(key) {
  const res = await aiFetch(`${AI_BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } }, 20000);
  if (!res.ok) throw await aiErrorFrom(res);
  const j = await res.json();
  const names = (j.models || []).filter(m => (m.supportedGenerationMethods || []).includes('generateContent')).map(m => m.name);
  const ranked = rankModels(names);
  if (!ranked.length) ranked.push('gemini-flash-latest', 'gemini-flash-lite-latest');
  // Fast Flash-Lite first (Google's free Flash is often overloaded), then the full Flash models as back-up.
  const full = ranked.filter(n => !/lite/.test(n)), lite = ranked.filter(n => /lite/.test(n));
  return [...lite.slice(0, 1), ...full.slice(0, 2), ...lite.slice(1, 2), ...full.slice(2, 3)].slice(0, 4);
}
// How much the model may "think" before answering. Little thinking = fast answers; food estimates don't need more.
function thinkingFor(model) {
  const m = model.match(/^gemini-(\d+(?:\.\d+)?)-(flash|pro)(-lite)?/);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (v >= 3) return { thinkingLevel: m[3] && v < 3.8 ? 'minimal' : 'low' };
  if (v >= 2.5 && m[2] === 'flash' && !m[3]) return { thinkingBudget: 0 };
  return null;
}
const noThink = new Set();
// One request to one model. Retries once without the thinking setting if the model refuses it.
async function aiCall(model, key, body, ms) {
  const th = noThink.has(model) ? null : thinkingFor(model);
  const send = b => aiFetch(`${AI_BASE}/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify(b) }, ms);
  let res = await send(th ? { ...body, generationConfig: { ...(body.generationConfig || {}), thinkingConfig: th } } : body);
  if (th && res.status === 400) {
    const peek = await res.clone().json().catch(() => ({}));
    if (/thinking/i.test(peek.error?.message || '')) { noThink.add(model); res = await send(body); }
  }
  return res;
}
const AI_MODELS_V = 3;
const aiCool = {};   // model -> until when it goes to the back of the queue (it was slow, busy or out of quota)
const cool = (model, mins = 15) => { aiCool[model] = Date.now() + mins * 60000; };
const aiOrder = models => [...models].sort((a, b) => ((aiCool[a] || 0) > Date.now()) - ((aiCool[b] || 0) > Date.now()));
let aiSlowToast = 0, aiLastModel = '';
function aiSwitching(e) { if (e && e.code === 'timeout' && Date.now() - aiSlowToast > 20000) { aiSlowToast = Date.now(); toast('Google is slow. Trying another AI model…'); } }
async function aiModelList(key) {
  let models = Array.isArray(S.settings.aiModels) && S.settings.aiModels.length && S.settings.aiModelsV === AI_MODELS_V ? S.settings.aiModels : null;
  if (!models) { models = await aiConnect(key); S.settings.aiModels = models; S.settings.aiModelsV = AI_MODELS_V; save(); }
  return models;
}
// Move a model that answered to the front, unless the ones before it only failed for a passing reason (slow, busy, quota).
const promoteModel = (model, last) => { if (last && ['timeout', 'network', 'busy', 'quota'].includes(last.code)) return; if (S.settings.aiModels[0] !== model) { S.settings.aiModels = [model, ...S.settings.aiModels.filter(x => x !== model)]; save(); } };
const AI_SCHEMA = {
  type: 'OBJECT',
  properties: {
    items: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
      name: { type: 'STRING' }, grams: { type: 'NUMBER' }, kcal: { type: 'NUMBER' }, protein: { type: 'NUMBER' }, carbs: { type: 'NUMBER' }, fat: { type: 'NUMBER' },
      confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    }, required: ['name', 'grams', 'kcal', 'protein', 'carbs', 'fat'] } },
    note: { type: 'STRING' },
  },
  required: ['items'],
};
const AI_RULES = `You are the nutrition assistant in a calorie-counting app used in South Africa.
Return JSON only: {"items":[{"name","grams","kcal","protein","carbs","fat","confidence"}],"note"}.
- One item per distinct food or drink. Keep names short and plain, using South African names where they fit (pap, boerewors, chakalaka, samp and beans, morogo, vetkoek, bunny chow, biltong, maas, rusks, viennas, polony, slap chips).
- grams = estimated weight of that food as served (cooked weight). kcal, protein, carbs and fat (grams) are for that amount, not per 100 g.
- Include visible sauces, oil, butter, dressings and drinks, with realistic amounts.
- confidence = high, medium or low. If unsure, give your best estimate and use low.
- note = one short sentence only if something important was unclear, otherwise "".`;
async function aiGenerate(parts, { schema = AI_SCHEMA, parse = parseAiJson } = {}) {
  const key = aiKey(); if (!key) throw new AiError('nokey');
  const models = aiOrder(await aiModelList(key));
  const hasImage = parts.some(p => p.inline_data || p.inlineData), started = Date.now();
  let last = null;
  for (const model of models) {
    if (Date.now() - started > 80000) break;             // don't keep someone waiting for ever
    if (last) aiSwitching(last);
    for (const withSchema of [true, false]) {
      const body = { contents: [{ role: 'user', parts }], generationConfig: { temperature: 0.2, maxOutputTokens: 4096, responseMimeType: 'application/json', ...(withSchema ? { responseSchema: schema } : {}) } };
      let res;
      try { res = await aiCall(model, key, body, hasImage ? 30000 : 20000); }
      catch (e) { if (e.code === 'timeout' || e.code === 'network') { last = e; cool(model); break; } throw e; }   // slow or dropped: try the next model
      if (res.ok) {
        const j = await res.json();
        const cand = j.candidates?.[0];
        const text = (cand?.content?.parts || []).filter(p => !p.thought && typeof p.text === 'string').map(p => p.text).join('').trim();
        if (!text) { last = new AiError(cand?.finishReason === 'SAFETY' ? 'other' : 'empty'); break; }
        const parsed = parse(text);
        if (!parsed) { last = new AiError('parse'); if (withSchema) continue; break; }
        promoteModel(model, last); aiLastModel = model;
        return parsed;
      }
      const err = await aiErrorFrom(res);
      if (err.code === 'badkey' || err.code === 'region' || err.code === 'blocked') throw err;
      if (err.code === 'other' && withSchema) { last = err; continue; }   // maybe the schema was refused: try plain JSON
      if (err.code === 'busy' || err.code === 'quota') cool(model, err.code === 'quota' ? 60 : 15);
      last = err; break;                                                   // quota / model / busy: try the next model
    }
  }
  throw last || new AiError('other');
}
function parseAiJson(text) {
  const t = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let j = null;
  try { j = JSON.parse(t); } catch (e) { const m = t.match(/\{[\s\S]*\}/); if (m) { try { j = JSON.parse(m[0]); } catch (e2) { j = null; } } }
  if (Array.isArray(j)) j = { items: j };
  if (!j || !Array.isArray(j.items)) return null;
  j.items = j.items.map(it => ({
    name: String(it.name || '').trim().slice(0, 60) || 'Food', grams: Math.max(1, Math.round(Number(it.grams) || 100)),
    kcal: Math.max(0, Number(it.kcal) || 0), p: Math.max(0, Number(it.protein) || 0), c: Math.max(0, Number(it.carbs) || 0), f: Math.max(0, Number(it.fat) || 0),
    conf: ['low', 'medium', 'high'].includes(it.confidence) ? it.confidence : 'medium',
  })).filter(it => it.grams > 0).slice(0, 15);
  j.note = typeof j.note === 'string' ? j.note.slice(0, 200) : '';
  return j;
}
const AI_ERR = {
  nokey: 'Set up the free AI first.',
  badkey: 'Google says your AI key isn’t valid. Check you copied all of it, or make a new key.',
  quota: 'You’ve used Google’s free AI allowance for now. It resets later (usually by tomorrow). Until then, search or scan instead.',
  region: 'Google’s free AI isn’t available for your account or country.',
  blocked: 'Google refused the request. Check the key in Google AI Studio, or make a new one.',
  offline: 'You’re offline. Photo and voice logging need internet.',
  network: 'Couldn’t reach Google. Check your connection and try again.',
  timeout: 'Google’s free AI is very slow right now and didn’t answer in time. Try again in a minute. If it keeps happening, tap Me > Check it works.',
  busy: 'Google’s AI is busy right now. Try again in a minute.',
  model: 'Google couldn’t find a suitable AI model for your key. Remove and add the key again.',
  parse: 'The AI’s answer didn’t make sense. Try again, maybe with a clearer photo.',
  empty: 'The AI didn’t return anything. Try again.',
  other: 'Something went wrong with the AI. Try again.',
};
const aiMsg = e => AI_ERR[e && e.code] || AI_ERR.other;

/* ---------- photo helpers ---------- */
async function shrinkPhoto(file, max = 1024) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new AiError('photo')); i.src = url; });
    const s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.naturalWidth * s)); c.height = Math.max(1, Math.round(img.naturalHeight * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const dataUrl = c.toDataURL('image/jpeg', 0.82);
    const thumb = (() => { const t = document.createElement('canvas'), ts = Math.min(1, 240 / Math.max(c.width, c.height)); t.width = Math.round(c.width * ts); t.height = Math.round(c.height * ts); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); return t.toDataURL('image/jpeg', 0.7); })();
    return { b64: dataUrl.split(',')[1], preview: dataUrl, thumb };
  } finally { URL.revokeObjectURL(url); }
}

/* ---------- set-up prompt when there is no key ---------- */
function openAiSetupPrompt(kind) {
  const el = sheetEl(`${sheetHead(kind === 'photo' ? 'Snap a meal' : kind === 'label' ? 'Read a label' : kind === 'coach' ? 'Your coach' : 'Say what you ate')}
    <div class="ai-hero">${kind === 'voice' ? I.mic : kind === 'coach' ? I.chat : I.camera}</div>
    <p>${kind === 'coach' ? 'Ask anything about your eating and training, like “why isn’t my weight dropping?” The coach answers using your own logs, goals and workouts.' : kind === 'photo' ? 'Take a photo of your plate and RepPlate works out what’s on it and roughly how much, then you check it and log it.' : kind === 'label' ? 'Take a photo of the nutrition table on a pack and RepPlate reads the numbers in for you.' : 'Say or type what you ate and RepPlate works out the foods and amounts for you.'}</p>
    <p class="muted" style="font-size:14px">This uses Google’s free AI. It needs a free key from your Google account, which takes about 2 minutes to set up once.</p>
    <a class="btn primary xl block" href="#/me#ai" data-goto="#/me#ai">Set up the free AI</a>
    ${kind === 'voice' ? '<button type="button" class="btn block" data-k="basic">Use the basic version without AI</button>' : ''}
    <div class="sheet-end"></div>`);
  el.addEventListener('click', e => { if (e.target.closest('[data-k="basic"]')) { S.settings.voiceBasic = true; save(); openSay({ date: dkey(), meal: mealNow() }, true); } });
  return pushLayer(el);
}

/* ---------- snap a meal ---------- */
function openSnap(ctx, replace = false) {
  if (!aiKey()) return openAiSetupPrompt('photo');
  const el = sheetEl(`${sheetHead('Snap a meal', `${MEAL_NAME[ctx.meal]} · ${dayLabel(ctx.date)}`)}
    <div id="snap-body">
      <div class="ai-hero">${I.camera}</div>
      <p>Take the photo from above with the whole plate in the picture, in good light. Something for scale, like a fork, helps.</p>
      <div class="form">
        <button type="button" class="btn primary xl block" data-k="camera">${I.camera} Take a photo</button>
        <button type="button" class="btn block" data-k="gallery">${I.image} Choose a photo</button>
      </div>
    </div>
    <input type="file" id="snap-cam" accept="image/*" capture="environment" hidden>
    <input type="file" id="snap-file" accept="image/*" hidden>
    <div class="sheet-end"></div>`);
  let busy = false, closed = false;
  const body = el.querySelector('#snap-body');
  const run = async file => {
    if (!file || busy) return; busy = true;
    let photo;
    try { photo = await shrinkPhoto(file); }
    catch (e) { busy = false; body.insertAdjacentHTML('beforeend', `<p class="error">That photo couldn’t be opened. Try another one.</p>`); return; }
    body.innerHTML = `<div class="snap-wait"><img src="${photo.preview}" alt="Your meal"><div class="snap-veil"><span class="spinner"></span><strong>Working out what’s on your plate…</strong><span>This takes a few seconds.</span></div></div>`;
    try {
      const out = await aiGenerate([
        { text: AI_RULES + '\nList the food and drinks in this photo of a meal. Estimate portions using the plate (usually 25–27 cm across), cutlery and hands for scale.' },
        { inline_data: { mime_type: 'image/jpeg', data: photo.b64 } },
      ]);
      if (closed) return;
      if (!out.items.length) {
        busy = false;
        body.innerHTML = `<div class="notice">${I.camera}<div><strong>No food found in that photo</strong><p>${esc(out.note || 'Try again with the plate filling most of the picture.')}</p></div></div>
          <div class="form"><button type="button" class="btn primary block" data-k="camera">${I.camera} Try another photo</button></div>`;
        return;
      }
      openAiReview(out.items, ctx, { source: 'photo', thumb: photo.thumb, note: out.note }, true);
    } catch (e) {
      if (closed) return;
      busy = false;
      body.innerHTML = `<div class="snap-wait small"><img src="${photo.preview}" alt="Your meal"></div>
        <div class="notice">${I.camera}<div><strong>Couldn’t read the photo</strong><p>${esc(aiMsg(e))}</p></div></div>
        <div class="form">
          ${['quota', 'offline', 'region', 'badkey', 'blocked'].includes(e.code) ? '' : '<button type="button" class="btn primary block" data-k="retry">Try again</button>'}
          ${['badkey', 'blocked', 'model'].includes(e.code) ? '<a class="btn block" href="#/me#ai" data-goto="#/me#ai">Check the AI key</a>' : ''}
          <button type="button" class="btn block" data-k="search">${I.search} Search instead</button>
        </div>`;
      body.dataset.file = '1'; lastFile = file;
    }
  };
  let lastFile = null;
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    const k = b.dataset.k;
    if (k === 'camera') el.querySelector('#snap-cam').click();
    else if (k === 'gallery') el.querySelector('#snap-file').click();
    else if (k === 'retry' && lastFile) run(lastFile);
    else if (k === 'search') openAddSheet(ctx, true);
  });
  for (const id of ['#snap-cam', '#snap-file']) el.querySelector(id).addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; lastFile = f; run(f); });
  const opts = { onClose: () => { closed = true; } };
  return replace ? replaceLayer(el, opts) : pushLayer(el, opts);
}

/* ---------- say what you ate ---------- */
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
function openSay(ctx, replace = false) {
  if (!aiKey() && !S.settings.voiceBasic) return openAiSetupPrompt('voice');
  const canListen = !!SpeechRec;
  const el = sheetEl(`${sheetHead('Say what you ate', `${MEAL_NAME[ctx.meal]} · ${dayLabel(ctx.date)}`)}
    ${canListen ? `<button type="button" class="mic" id="say-mic" aria-pressed="false">${I.mic}<span id="say-mic-l">Tap and speak</span></button>` : ''}
    <label class="field"><span>${canListen ? 'Or type it' : 'Type what you ate'}</span>
      <textarea class="input say-text" id="say-text" rows="3" placeholder="e.g. two fried eggs, two slices of brown toast with butter and a coffee with milk"></textarea></label>
    <p class="hint">${aiKey() ? 'Amounts help (“a big plate of pap”, “200 g chicken”), but the AI will estimate normal portions if you leave them out.' : 'Basic version: keep it simple, like “2 eggs, 2 slices brown bread, 1 banana”. Set up the free AI on the Me tab for better results.'}</p>
    <p class="error" id="say-err" hidden></p>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="say-go">Work it out</button></div>`);
  const ta = el.querySelector('#say-text'), err = el.querySelector('#say-err'), go = el.querySelector('#say-go');
  let rec = null, listening = false, base = '';
  const stop = () => { try { rec && rec.stop(); } catch (e) { /* ignore */ } };
  const setMic = on => {
    listening = on;
    const b = el.querySelector('#say-mic'); if (!b) return;
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    el.querySelector('#say-mic-l').textContent = on ? 'Listening… tap to stop' : 'Tap and speak';
  };
  el.addEventListener('click', async e => {
    if (e.target.closest('#say-mic')) {
      if (listening) { stop(); return; }
      hush();
      try {
        rec = new SpeechRec();
        rec.lang = /^en/i.test(navigator.language) ? navigator.language : 'en-ZA';
        rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
        base = ta.value.trim() ? ta.value.trim() + ', ' : '';
        rec.onresult = ev => { let t = ''; for (const r of ev.results) t += r[0].transcript; ta.value = base + t.trim(); };
        rec.onerror = ev => {
          err.hidden = false;
          err.textContent = ev.error === 'not-allowed' || ev.error === 'service-not-allowed' ? 'Microphone access is off for RepPlate. Allow it in your browser settings, or type instead.'
            : ev.error === 'no-speech' ? 'Didn’t hear anything. Tap the mic and try again.' : ev.error === 'network' ? 'Speech-to-text needs internet. Type it instead.' : 'Couldn’t listen just now. Type it instead.';
        };
        rec.onend = () => setMic(false);
        err.hidden = true; rec.start(); setMic(true);
      } catch (x) { setMic(false); err.hidden = false; err.textContent = 'Couldn’t start the microphone. Type it instead.'; }
      return;
    }
    if (e.target.closest('#say-go')) {
      stop();
      const text = ta.value.trim();
      if (text.length < 2) { err.hidden = false; err.textContent = 'Say or type what you ate first.'; return; }
      err.hidden = true; go.disabled = true; go.textContent = 'Working it out…';
      try {
        let items, note = '';
        if (aiKey()) {
          const out = await aiGenerate([{ text: AI_RULES + `\nThe user said what they ate: """${text.slice(0, 600)}""". List each food. Use the amounts they gave; if none, assume a normal adult portion.` }]);
          items = out.items; note = out.note;
        } else {
          await loadFoodDb(); items = parseBasic(text);
        }
        if (!items.length) { err.hidden = false; err.textContent = 'Couldn’t find any foods in that. Try naming them simply, like “2 eggs and a banana”.'; go.disabled = false; go.textContent = 'Work it out'; return; }
        openAiReview(items, ctx, { source: 'voice', note, said: text }, true);
      } catch (x) {
        err.hidden = false; err.textContent = aiMsg(x); go.disabled = false; go.textContent = 'Work it out';
      }
    }
  });
  const opts = { onClose: stop };
  const layer = replace ? replaceLayer(el, opts) : pushLayer(el, opts);
  return layer;
}
// No-AI fallback: "2 eggs, 2 slices brown bread and a banana" -> foods from the built-in list
const NUMW = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, half: 0.5, couple: 2, few: 3 };
const UNITW = [[/^(kg|kilograms?)$/, 'kg'], [/^(g|grams?|gram)$/, 'g'], [/^(ml|millilit(re|er)s?)$/, 'ml'], [/^(l|lit(re|er)s?)$/, 'l'], [/^cups?$/, 'cup'], [/^(slices?|pieces?|pcs)$/, 'slice'],
  [/^(tbsp|tablespoons?|spoons?)$/, 'tbsp'], [/^(tsp|teaspoons?)$/, 'tsp'], [/^(glass(es)?|mugs?)$/, 'glass'], [/^(bowls?|plates?)$/, 'bowl'], [/^(cans?|tins?)$/, 'can']];
function parseBasic(text) {
  const out = [];
  for (let chunk of text.toLowerCase().split(/,|;|\n|\+|\band\b|\bwith\b|\bplus\b/)) {
    chunk = chunk.replace(/[^a-z0-9.%\s½¼]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!chunk) continue;
    let words = chunk.split(' '), qty = null, unit = null;
    if (words[0] === 'half' && (words[1] === 'a' || words[1] === 'an')) { qty = 0.5; words = words.slice(2); }
    const m = words[0] && words[0].match(/^(\d+(?:\.\d+)?|½|¼)(kg|g|ml|l)?$/);
    if (qty == null && m) { qty = m[1] === '½' ? 0.5 : m[1] === '¼' ? 0.25 : parseFloat(m[1]); if (m[2]) unit = m[2]; words = words.slice(1); }
    else if (qty == null && NUMW[words[0]] != null) { qty = NUMW[words[0]]; words = words.slice(1); }
    if (!unit && words[0]) { const u = UNITW.find(([re]) => re.test(words[0])); if (u) { unit = u[1]; words = words.slice(1); } }
    words = words.filter(w => !['of', 'a', 'an', 'some', 'my', 'the', 'small', 'big', 'large', 'medium'].includes(w));
    const name = words.join(' ').trim(); if (name.length < 2) continue;
    const hit = searchDb(name, 1)[0]; if (!hit) continue;
    const q = qty ?? 1, por = hit.portions || [];
    const find = re => por.find(([, l]) => re.test(l));
    let grams;
    if (unit === 'g' || unit === 'ml') grams = q;
    else if (unit === 'kg' || unit === 'l') grams = q * 1000;
    else if (unit === 'cup') grams = q * ((find(/cup/) || [240])[0]);
    else if (unit === 'slice') grams = q * ((find(/slice|piece/) || [30])[0]);
    else if (unit === 'tbsp') grams = q * ((find(/tbsp|tablespoon/) || [15])[0]);
    else if (unit === 'tsp') grams = q * ((find(/tsp|teaspoon/) || [5])[0]);
    else if (unit === 'glass') grams = q * 250;
    else if (unit === 'bowl') grams = q * 250;
    else if (unit === 'can') grams = q * 400;
    else grams = q * ((find(/medium|large|^1 (egg|slice|piece|fruit)|each/) || por[0] || [qty == null ? 150 : 100])[0]);
    grams = Math.max(1, Math.round(grams));
    const f = grams / 100;
    out.push({ name: hit.name, grams, kcal: hit.kcal * f, p: (hit.p || 0) * f, c: (hit.c || 0) * f, f: (hit.f || 0) * f, conf: qty == null && !unit ? 'low' : 'medium', usda: hit.id });
  }
  return out.slice(0, 15);
}

/* ---------- review what the AI found, adjust, log ---------- */
function openAiReview(found, ctx, info = {}, replace = false) {
  const items = found.map(it => ({ ...it, on: true, per: it.grams ? { kcal: it.kcal / it.grams * 100, p: it.p / it.grams * 100, c: it.c / it.grams * 100, f: it.f / it.grams * 100 } : { kcal: 0, p: 0, c: 0, f: 0 } }));
  const st = { meal: ctx.meal };
  const kc = it => it.per.kcal * it.grams / 100;
  const el = sheetEl(`${sheetHead('Check your meal', info.source === 'photo' ? 'Estimated from your photo' : 'Worked out from what you said')}
    ${info.thumb ? `<img class="review-thumb" src="${info.thumb}" alt="Your meal">` : ''}
    ${info.said ? `<p class="review-said">“${esc(info.said)}”</p>` : ''}
    ${info.note ? `<p class="hint">${esc(info.note)}</p>` : ''}
    <p class="hint">These are estimates. Fix anything that looks off: change the grams, rename a food, or untick it.</p>
    <ul class="review-list" id="rv-list"></ul>
    <div class="field"><span>Meal</span><div class="seg">${MEALS.map(([m, l]) => `<button type="button" class="${m === st.meal ? 'on' : ''}" data-r="meal" data-v="${m}">${l}</button>`).join('')}</div></div>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="rv-go"></button></div>`);
  const list = el.querySelector('#rv-list'), goBtn = el.querySelector('#rv-go');
  const totals = () => {
    const on = items.filter(it => it.on);
    const k = on.reduce((s, it) => s + kc(it), 0);
    goBtn.textContent = on.length ? `Log ${plural(on.length, 'food')} · ${fmtE(k)} ${eUnit()}` : 'Tick at least one food';
    goBtn.disabled = !on.length;
  };
  const rowKcal = i => { const r = list.querySelector(`[data-i="${i}"] .rv-kcal`); if (r) r.textContent = `${fmtE(kc(items[i]))} ${eUnit()}`; };
  list.innerHTML = items.map((it, i) => `<li class="rv ${it.on ? '' : 'off'}" data-i="${i}">
    <label class="rv-check"><input type="checkbox" ${it.on ? 'checked' : ''} data-r="on" aria-label="Include ${esc(it.name)}"></label>
    <div class="rv-main">
      <input class="rv-name" value="${esc(it.name)}" data-r="name" aria-label="Food name" maxlength="60">
      <div class="rv-amt">
        <div class="stepper sm"><button type="button" data-r="dec" aria-label="Less">${I.minus}</button><input class="rv-g" inputmode="decimal" value="${it.grams}" data-r="g" aria-label="Grams"><button type="button" data-r="inc" aria-label="More">${I.plus}</button></div>
        <span class="muted">g</span>
        ${it.conf === 'low' ? '<span class="tag">rough guess</span>' : ''}
        ${warnBadge({ name: it.name })}
        <span class="rv-kcal num">${fmtE(kc(it))} ${eUnit()}</span>
      </div>
    </div></li>`).join('');
  totals();
  const setG = (i, g) => { items[i].grams = clamp(Math.round(g), 0, 5000); list.querySelector(`[data-i="${i}"] .rv-g`).value = items[i].grams; rowKcal(i); totals(); };
  el.addEventListener('input', e => {
    const li = e.target.closest('[data-i]'); if (!li) return;
    const i = +li.dataset.i, r = e.target.dataset.r;
    if (r === 'g') { const v = parseNum(e.target.value); items[i].grams = v == null ? 0 : clamp(v, 0, 5000); rowKcal(i); totals(); }
    if (r === 'name') items[i].name = e.target.value;
  });
  el.addEventListener('change', e => {
    const li = e.target.closest('[data-i]'); if (!li || e.target.dataset.r !== 'on') return;
    const i = +li.dataset.i; items[i].on = e.target.checked; li.classList.toggle('off', !items[i].on); totals();
  });
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    const r = b.dataset.r, li = b.closest('[data-i]'), i = li ? +li.dataset.i : -1;
    if (r === 'inc' || r === 'dec') { const g = items[i].grams, step = g >= 100 ? 25 : 10; setG(i, Math.max(0, g + (r === 'inc' ? step : -step))); }
    if (r === 'meal') { st.meal = b.dataset.v; $$('[data-r="meal"]', el).forEach(x => x.classList.toggle('on', x === b)); }
  });
  goBtn.addEventListener('click', () => {
    const on = items.filter(it => it.on && it.grams > 0); if (!on.length) return;
    const ids = [];
    for (const it of on) {
      const name = (it.name || 'Food').trim() || 'Food';
      const food = it.usda && FOODMAP && FOODMAP.get(it.usda) ? dbToFood(FOODMAP.get(it.usda))
        : { key: 'ai_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40), code: '', source: 'ai', name, brand: '', ul: 'g', img: '', servingG: null, packageG: null, per100: { kcal: it.per.kcal, p: it.per.p, c: it.per.c, f: it.per.f } };
      if (food.source === 'ai') food.name = name;
      const entry = makeEntry(food, Math.round(it.grams), 'g', st.meal);
      if (food.source === 'ai') entry.amountLabel = `${Math.round(it.grams)} g · estimated`;
      addEntry(ctx.date, entry); touchFood(food, Math.round(it.grams), 'g'); ids.push(entry.id);
    }
    save();
    closeAll(() => {
      if (/^(today|food)/.test(currentRoute || 'today')) rerender();
      toast(`Logged ${plural(ids.length, 'food')} to ${MEAL_NAME[st.meal]}`, { label: 'Undo', fn: () => { for (const id of ids) removeEntry(ctx.date, id); rerender(); } });
    });
  });
  return replace ? replaceLayer(el) : pushLayer(el);
}

/* ---------- repeat yesterday & saved meals ---------- */
const mealSum = list => list.reduce((s, e) => s + (e.kcal || 0), 0);
function copyEntries(list, date, meal) {
  const ids = [];
  for (const e of list) {
    const n = { ...JSON.parse(JSON.stringify(e)), id: uid(), meal, ts: Date.now() };
    addEntry(date, n); ids.push(n.id);
  }
  save();
  return ids;
}
function logSavedMeal(sm, date, meal) {
  const ids = copyEntries(sm.items, date, meal);
  sm.used = Date.now(); save();
  closeAll(() => {
    if (/^(today|food)/.test(currentRoute || 'today')) rerender();
    toast(`Logged “${sm.name}”`, { label: 'Undo', fn: () => { for (const id of ids) removeEntry(date, id); rerender(); } });
  });
}
function openSaveMeal(date, meal) {
  const list = (S.log[date] || []).filter(e => e.meal === meal);
  if (!list.length) return;
  const el = sheetEl(`${sheetHead('Save this meal', `${plural(list.length, 'food')} · ${fmtE(mealSum(list))} ${eUnit()}`)}
    <ul class="plan-items">${list.map(e => `<li><span>${esc(e.name)}</span><b>${esc(e.amountLabel || '')}</b></li>`).join('')}</ul>
    <label class="field"><span>Name</span><input class="input" id="sm-name" maxlength="40" value="My ${esc(MEAL_NAME[meal].toLowerCase())}" autofocus></label>
    <p class="hint">Saved meals appear at the top of Add food, so you can log the whole meal with one tap.</p>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="sm-save">Save meal</button></div>`);
  el.querySelector('#sm-save').addEventListener('click', () => {
    const name = el.querySelector('#sm-name').value.trim() || `My ${MEAL_NAME[meal].toLowerCase()}`;
    const items = list.map(e => { const c = JSON.parse(JSON.stringify(e)); delete c.id; delete c.ts; return c; });
    S.meals = Array.isArray(S.meals) ? S.meals : [];
    S.meals.unshift({ id: uid(), name, meal, items, used: Date.now() });
    save();
    closeAll(() => toast(`Saved “${name}”. Find it under Add food.`));
  });
  return pushLayer(el);
}
function openSavedMeal(sm, ctx) {
  const el = sheetEl(`${sheetHead(sm.name, `${plural(sm.items.length, 'food')} · ${fmtE(mealSum(sm.items))} ${eUnit()}`)}
    <ul class="plan-items">${sm.items.map(e => `<li><span>${esc(e.name)}</span><b>${esc(e.amountLabel || '')}</b></li>`).join('')}</ul>
    <div class="row-btns"><button type="button" class="btn danger" data-k="del">${I.trash} Delete</button><button type="button" class="btn primary" data-k="log">${I.plus} Log to ${esc(MEAL_NAME[ctx.meal].toLowerCase())}</button></div>
    <div class="sheet-end"></div>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    if (b.dataset.k === 'log') logSavedMeal(sm, ctx.date, ctx.meal);
    if (b.dataset.k === 'del') {
      if (!b.dataset.armed) { b.dataset.armed = '1'; b.textContent = 'Tap again to delete'; return; }
      S.meals = (S.meals || []).filter(x => x.id !== sm.id); save();
      closeAll(() => toast(`Deleted “${sm.name}”`));
    }
  });
  return pushLayer(el);
}

/* ---------- AI key settings (Me tab) ---------- */
function aiPanel() {
  const has = !!aiKey(), model = (S.settings.aiModels || [])[0];
  return `<section class="panel" id="ai" aria-label="Photo and voice logging">
    ${secHead(I.sparkle, 'accent', 'Photo &amp; voice logging')}
    ${has ? `<div class="notice ok">${I.check}<div><strong>Free AI is set up</strong><p>Snap a meal, Say what you ate and the coach are ready${model ? ` (using <span id="ai-model">${esc(model)}</span>)` : ''}. Photos and text you send go to Google to be analysed.</p></div></div>
      <button type="button" class="btn primary block" data-act="coach">${I.chat} Ask your coach</button>
      <div class="row-btns"><button type="button" class="btn" data-act="ai-test">Check it works</button><button type="button" class="btn danger" data-act="ai-remove">${I.trash} Remove key</button></div>
      <p class="hint" id="ai-msg"></p>`
    : `<p>Let RepPlate read your plate from a photo, or work out foods from what you say. It uses Google’s free Gemini AI with your own free key.</p>
      <ol class="steps ai-steps">
        <li>Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> and sign in with your Google account.</li>
        <li>Tap <b>Create API key</b> and copy it. No card is needed.</li>
        <li>Paste it below and tap Save.</li>
      </ol>
      <form class="search-form" data-form="ai-key">
        <input class="input" id="ai-key" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Paste your key (starts with AIza…)" aria-label="Google AI key">
        <button class="btn primary">Save</button>
      </form>
      <p class="hint" id="ai-msg"></p>
      <p class="hint">Your key stays on this phone and is never put in backups. Google’s free AI has daily limits and Google may use free-tier photos and text to improve its products, so don’t photograph anything private.</p>`}
  </section>`;
}
async function aiSaveKey(key) {
  const msg = $('#ai-msg');
  key = key.trim().replace(/\s+/g, '');
  if (key.length < 20) { if (msg) msg.textContent = 'That doesn’t look like a full key. Copy it again from Google AI Studio.'; return; }
  if (msg) msg.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:-3px"></span> Checking your key with Google…';
  try {
    const models = await aiConnect(key);
    S.settings.aiKey = key; S.settings.aiModels = models; S.settings.aiModelsV = AI_MODELS_V; S.settings.voiceBasic = false; save();
    rerender(); toast('Free AI is set up');
  } catch (e) {
    if (msg) msg.textContent = aiMsg(e);
  }
}

/* ============================== CONVENIENCE FEATURES ============================== */
const mondayOf = k => { const d = fromKey(k); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return dkey(d); };
const shortDay = k => fromKey(k).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const lbl = (long, short) => `<span class="l-long">${long}</span><span class="l-short">${short}</span>`;

/* ---------- your usuals (learned from the last 4 weeks) ---------- */
let USUALS = null;
function usualsFor(meal, days = 28) {
  const today = dkey(), sigs = new Map(), foods = new Map();
  for (let i = 1; i <= days; i++) {
    const k = addDays(today, -i), list = (S.log[k] || []).filter(e => e.meal === meal);
    if (!list.length) continue;
    const sig = list.map(e => e.name.toLowerCase()).sort().join('|');
    const g = sigs.get(sig) || { count: 0, list };      // first seen = most recent copy
    g.count++; sigs.set(sig, g);
    const seen = new Set();
    for (const e of list) {
      const n = e.name.toLowerCase(); if (seen.has(n)) continue; seen.add(n);
      const f = foods.get(n) || { count: 0, e }; f.count++; foods.set(n, f);
    }
  }
  const usual = [...sigs.values()].filter(g => g.count >= 2 && g.list.length >= 1).sort((a, b) => b.count - a.count || b.list.length - a.list.length)[0] || null;
  const inUsual = new Set(usual ? usual.list.map(e => e.name.toLowerCase()) : []);
  const top = [...foods.values()].filter(f => f.count >= 3 && !(usual && usual.list.length === 1 && inUsual.has(f.e.name.toLowerCase()))).sort((a, b) => b.count - a.count).slice(0, 4).map(f => f.e);
  return { usual, top };
}
function usualsCard() {
  const meal = mealNow(), today = (S.log[dkey()] || []).filter(e => e.meal === meal);
  const u = usualsFor(meal);
  const loggedNames = new Set(today.map(e => e.name.toLowerCase()));
  const usual = u.usual && !u.usual.list.every(e => loggedNames.has(e.name.toLowerCase())) ? u.usual : null;
  const top = u.top.filter(e => !loggedNames.has(e.name.toLowerCase()));
  USUALS = { meal, usual, top };
  if (!usual && !top.length) return '';
  return `<section class="panel tight" aria-label="Your usuals">
    <div class="section-row">${secHead(I.repeat, 'kcal', `Your usual ${esc(MEAL_NAME[meal].toLowerCase())}`)}<span class="muted" style="font-size:13px">One tap to log</span></div>
    ${usual ? `<div class="usual">
      <div class="usual-text"><strong>${esc(usual.list.map(e => e.name).join(', '))}</strong><span class="muted">${plural(usual.count, 'time')} in the last 4 weeks · ${fmtE(mealSum(usual.list))} ${eUnit()}</span></div>
      <button type="button" class="btn primary" data-act="usual-log">${I.plus} Log</button></div>` : ''}
    ${top.length ? `<div class="chips">${top.map((e, i) => `<button type="button" class="chip add" data-act="usual-food" data-i="${i}">${I.plus}${esc(e.name)}</button>`).join('')}</div>` : ''}
  </section>`;
}

/* ---------- what can I eat now? ---------- */
const SUGGEST_SCHEMA = { type: 'OBJECT', properties: { suggestions: { type: 'ARRAY', items: { type: 'OBJECT', properties: {
  title: { type: 'STRING' }, why: { type: 'STRING' }, items: AI_SCHEMA.properties.items }, required: ['title', 'items'] } } }, required: ['suggestions'] };
function parseSuggest(text) {
  const t = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let j = null; try { j = JSON.parse(t); } catch (e) { const m = t.match(/\{[\s\S]*\}/); if (m) try { j = JSON.parse(m[0]); } catch (e2) { j = null; } }
  if (!j || !Array.isArray(j.suggestions)) return null;
  return { suggestions: j.suggestions.slice(0, 4).map(sg => ({ title: String(sg.title || 'Meal idea').slice(0, 60), why: String(sg.why || '').slice(0, 160), items: (parseAiJson(JSON.stringify({ items: sg.items || [] })) || { items: [] }).items })).filter(sg => sg.items.length) };
}
function eatNowTarget(meal, left) {
  const share = { breakfast: 0.3, lunch: 0.45, dinner: 0.85, snacks: 0.5 }[meal] || 0.5;
  return clamp(Math.round(left * share / 10) * 10, 150, 1400);
}
function offlineSuggestions(meal, target, prefs) {
  const pk = MEAL_IDEAS[meal === 'snacks' ? 'snack' : meal] ? (meal === 'snacks' ? 'snack' : meal) : 'dinner';
  const want = { quick: 'No cooking', budget: 'Budget', protein: 'High protein', meatfree: 'Meat-free' };
  let opts = allowedIdx(pk).map(i => ideaFor(pk, i)).map((o, i) => ({ o, i, score: Math.random() + (prefs.filter(p => want[p] && (o.tags || []).includes(want[p])).length * 2) }));
  opts.sort((a, b) => b.score - a.score);
  return opts.slice(0, 3).map(({ o }) => {
    const m = buildMeal(o, target);
    return { title: o.name, why: (o.tags || []).join(' · '), items: m.items.map(it => ({ name: it.name, grams: Math.round(it.grams), kcal: it.kcal, p: it.p, c: it.c, f: it.f, conf: 'high', usda: it.id })) };
  });
}
function openEatNow(ctx) {
  const t = dayTotals(ctx.date), st = S.settings;
  const left = Math.round(goalOn(ctx.date) - t.kcal), pLeft = Math.max(0, Math.round(st.protein - t.p));
  const meal = ctx.meal, target = eatNowTarget(meal, Math.max(left, 0));
  const prefs = new Set();
  const el = sheetEl(`${sheetHead('What can I eat now?', `${MEAL_NAME[meal]} · ${left > 0 ? `${fmtE(left)} ${eUnit()} left today` : 'You’ve reached today’s goal'}`)}
    <dl class="eq" style="border-top:0;padding-top:0">
      <div><dt>Aim for</dt><dd>${fmtE(left > 150 ? target : 150)}</dd></div><div class="op" aria-hidden="true">·</div>
      <div><dt>Protein left</dt><dd>${pLeft}<small style="font-size:14px"> g</small></dd></div>
    </dl>
    ${dietActive() ? `<p class="diet-bar">${I.check}<span><b>Fits your food needs:</b> ${esc(dietSummary())}</span></p>` : ''}
    <div class="field"><span>Anything in particular?</span>
      <div class="chips" id="en-prefs">${[['quick', 'No cooking'], ['budget', 'Budget'], ['protein', 'High protein'], ['meatfree', 'Meat-free'], ['takeaway', 'Takeaway']].map(([k, l]) => `<button type="button" class="chip" data-k="pref" data-v="${k}">${l}</button>`).join('')}</div></div>
    ${aiKey() ? `<label class="field"><span>What do you have or feel like? (optional)</span><input class="input" id="en-have" maxlength="120" placeholder="e.g. chicken, rice and some veg"></label>` : ''}
    <div id="en-out"></div>
    <button type="button" class="link en-plan" data-k="plan">See a full day of meal ideas</button>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="en-go">${I.utensils} Suggest meals</button></div>`);
  const out = el.querySelector('#en-out'), goBtn = el.querySelector('#en-go');
  let found = [];
  const show = (list, note) => {
    found = list;
    out.innerHTML = (note ? `<p class="hint">${esc(note)}</p>` : '') + list.map((sg, i) => {
      const k = sg.items.reduce((s, it) => s + it.kcal, 0), p = sg.items.reduce((s, it) => s + it.p, 0);
      return `<div class="idea"><div class="plan-head"><strong class="idea-t">${esc(sg.title)}</strong><span class="plan-kcal num">${fmtE(k)} <small>${eUnit()}</small></span></div>
        ${sg.why ? `<p class="muted" style="font-size:13px">${esc(sg.why)}</p>` : ''}
        <ul class="plan-items">${sg.items.map(it => `<li><span>${esc(it.name)}</span><b class="num">${Math.round(it.grams)} g</b></li>`).join('')}</ul>
        <div class="idea-foot"><span class="muted num">Protein ${n0(p)} g</span><button type="button" class="btn sm primary" data-k="pick" data-i="${i}">${I.plus} Log this</button></div></div>`;
    }).join('');
  };
  el.addEventListener('click', async e => {
    const b = e.target.closest('[data-k]'); if (!b) return;
    if (b.dataset.k === 'pref') { const v = b.dataset.v; prefs.has(v) ? prefs.delete(v) : prefs.add(v); b.classList.toggle('on', prefs.has(v)); return; }
    if (b.dataset.k === 'pick') { const sg = found[+b.dataset.i]; if (sg) openAiReview(sg.items, ctx, { source: 'idea', note: sg.title }); return; }
    if (b.dataset.k === 'plan') { closeAll(() => { location.hash = '#/plan'; }); return; }
  });
  goBtn.addEventListener('click', async () => {
    const aim = left > 150 ? target : 150;
    if (!aiKey()) { show(offlineSuggestions(meal, aim, [...prefs]), 'From the built-in South African meal ideas. Set up the free AI on the Me tab for ideas based on what you have at home.'); return; }
    goBtn.disabled = true; goBtn.textContent = 'Thinking…';
    out.innerHTML = '<div class="state"><span class="spinner"></span><span>Finding meals that fit…</span></div>';
    const have = (el.querySelector('#en-have')?.value || '').trim();
    const prefText = [...prefs].map(p => ({ quick: 'no cooking or under 10 minutes', budget: 'cheap, budget-friendly', protein: 'high in protein', meatfree: 'no meat', takeaway: 'from a common South African takeaway or restaurant (e.g. Nando’s, Steers, KFC, Spur, Woolworths ready meals)' })[p]).join('; ');
    try {
      const res = await aiGenerate([{ text: `${AI_RULES}
Instead of a single list, return {"suggestions":[{"title","why","items":[...]}]} with exactly 3 different meal suggestions.
The user wants ${MEAL_NAME[meal].toLowerCase()}. They have ${Math.max(left, 0)} kcal and ${pLeft} g protein left for today. Each suggestion should be about ${aim} kcal (within 10%) and as high in protein as reasonable.
${prefText ? 'Preferences: ' + prefText + '.' : ''} ${have ? 'They have or feel like: ' + have.slice(0, 120) + '.' : ''}
Use everyday South African foods and portions. "why" is one short sentence.
${dietPrompt()}` }], { schema: SUGGEST_SCHEMA, parse: parseSuggest });
      show(res.suggestions, '');
      if (!res.suggestions.length) show(offlineSuggestions(meal, aim, [...prefs]), 'The AI had no ideas, so here are built-in ones.');
    } catch (x) {
      show(offlineSuggestions(meal, aim, [...prefs]), `${aiMsg(x)} Here are built-in ideas instead.`);
    }
    goBtn.disabled = false; goBtn.innerHTML = `${I.shuffle} Other ideas`;
  });
  return pushLayer(el);
}

/* ---------- plan my week + shopping list ---------- */
function weekState() {
  const W = S.week; if (!W || !W.start || !Array.isArray(W.days)) return null;
  const idx = Math.round((fromKey(dkey()) - fromKey(W.start)) / 864e5);
  return idx >= 0 && idx < W.days.length ? { W, idx } : null;
}
function makeWeek() {
  const P = S.plan && typeof S.plan === 'object' ? S.plan : (S.plan = {});
  P.recent = P.recent || {};
  const days = [];
  for (let i = 0; i < 7; i++) {
    const picks = freshPicks(P.recent);
    days.push(picks);
    for (const [slot, v] of Object.entries(picks)) { const r = (P.recent[slot] || []).filter(x => x !== v); r.unshift(v); P.recent[slot] = r.slice(0, 5); }
  }
  S.week = { start: dkey(), days, ticks: {} };
  P.picks = days[0]; P.day = dkey();
  save();
}
function planForPicks(picks) {
  const goal = S.settings.kcal, fit = fitPicks(picks || {});
  return PLAN_SLOTS(goal).filter(([slot]) => fit[slot] != null).map(([slot, label, pool, share]) =>
    ({ slot, label, meal: pool === 'snack' ? 'snacks' : pool, ...buildMeal(ideaFor(pool, fit[slot]), goal * share) }));
}
function planTabs(on) {
  return `<nav class="seg" aria-label="Meal ideas"><a href="#/plan" data-nav="replace" class="${on === 'day' ? 'on' : ''}">Today</a><a href="#/plan/week" data-nav="replace" class="${on === 'week' ? 'on' : ''}">This week</a><a href="#/plan/shop" data-nav="replace" class="${on === 'shop' ? 'on' : ''}">${lbl('Shopping list', 'Shopping')}</a></nav>`;
}
function viewWeekPlan() {
  const ws = weekState();
  const head = `<header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/food" aria-label="Back">${I.chevL}</button></header>
  <div><p class="eyebrow">This week · ${fmtE(S.settings.kcal)} ${eUnit()} a day</p><h1 class="h-display">Meal ideas</h1></div>${planTabs('week')}${dietBar()}`;
  if (!ws) return `${head}<div class="empty"><strong>Plan 7 days of meals in one tap</strong><span>Different meals every day, sized to your goal, plus a shopping list for all of it.</span></div>
    <button type="button" class="btn primary xl block" data-act="week-make">${I.utensils} Plan my week</button>`;
  const { W, idx } = ws;
  return `${head}
  ${W.days.map((picks, i) => {
    const k = addDays(W.start, i), plan = planForPicks(picks), tot = plan.reduce((s, m) => s + m.kcal, 0), past = i < idx;
    return `<section class="panel tight day-card ${past ? 'past' : ''}" aria-label="${esc(shortDay(k))}">
      <div class="plan-head"><strong>${i === idx ? 'Today' : i === idx + 1 ? 'Tomorrow' : esc(shortDay(k))}</strong><span class="plan-kcal num">${fmtE(tot)} <small>${eUnit()}</small></span></div>
      <ul class="plan-items day-meals">${plan.map(m => `<li><span class="muted">${esc(m.label)}</span><b>${esc(m.name)}</b></li>`).join('')}</ul>
      ${past ? '' : `<button type="button" class="link" data-act="week-day-new" data-i="${i}">${I.shuffle} New ideas for this day</button>`}
    </section>`;
  }).join('')}
  <a class="btn primary block" href="#/plan/shop" data-nav="replace">${I.check} Shopping list</a>
  <button type="button" class="btn block" data-act="week-make">${I.shuffle} Plan a new week</button>`;
}
// What to buy for each food (cooked weights are turned into raw or dry amounts)
const SHOP = {
  maize: ['Bread & grains', 1, 'g'], oats: ['Bread & grains', 1, 'g'], sorghum: ['Bread & grains', 1, 'g'], granola: ['Bread & grains', 1, 'g'],
  bread: ['Bread & grains', 1, 'loaf', 700], whiteBread: ['Bread & grains', 1, 'loaf', 700], wrap: ['Bread & grains', 1, 'n', 48, 'wraps'], crackers: ['Bread & grains', 1, 'g'],
  rice: ['Bread & grains', 0.4, 'g', 0, 'White rice (dry)'], brownRice: ['Bread & grains', 0.4, 'g', 0, 'Brown rice (dry)'], pasta: ['Bread & grains', 0.45, 'g', 0, 'Pasta (dry)'],
  samp: ['Bread & grains', 0.4, 'g', 0, 'Samp (dry)'], sugarbeans: ['Tins & dry goods', 0.45, 'g', 0, 'Sugar beans (dry)'], lentils: ['Tins & dry goods', 0.45, 'g', 0, 'Lentils (dry)'],
  chickpeas: ['Tins & dry goods', 1, 'can', 240, 'Chickpeas (400 g tins)'], bakedbeans: ['Tins & dry goods', 1, 'can', 410, 'Baked beans (410 g tins)'],
  pilchards: ['Tins & dry goods', 1, 'can', 300, 'Pilchards in tomato sauce (400 g tins)'], tuna: ['Tins & dry goods', 1, 'can', 120, 'Tuna in water (170 g tins)'],
  maas: ['Dairy & eggs', 1, 'ml'], milk: ['Dairy & eggs', 1, 'ml'], yoghurt: ['Dairy & eggs', 1, 'g'], cottage: ['Dairy & eggs', 1, 'g'], cheddar: ['Dairy & eggs', 1, 'g'],
  eggScr: ['Dairy & eggs', 1, 'egg', 61], eggBoil: ['Dairy & eggs', 1, 'egg', 50], eggFry: ['Dairy & eggs', 1, 'egg', 46], omelette: ['Dairy & eggs', 1, 'egg', 61],
  marg: ['Pantry', 1, 'g'], oil: ['Pantry', 1, 'g'], mayo: ['Pantry', 1, 'g'], pb: ['Pantry', 1, 'g'], honey: ['Pantry', 1, 'g'], sugar: ['Pantry', 1, 'g'], raisins: ['Pantry', 1, 'g'], peanuts: ['Pantry', 1, 'g'],
  thigh: ['Meat & fish', 1.6, 'g', 0, 'Chicken thighs (bone-in)'], drum: ['Meat & fish', 1, 'n', 105, 'drumsticks'], breast: ['Meat & fish', 1.3, 'g', 0, 'Chicken breast fillets'], liver: ['Meat & fish', 1.2, 'g', 0, 'Chicken livers'],
  mince: ['Meat & fish', 1.3, 'g', 0, 'Beef mince'], stew: ['Meat & fish', 1.4, 'g', 0, 'Beef stewing meat'], steak: ['Meat & fish', 1.3, 'g', 0, 'Rump or sirloin steak'], lamb: ['Meat & fish', 1.8, 'g', 0, 'Lamb chops'],
  pork: ['Meat & fish', 1.5, 'g', 0, 'Pork chops'], wors: ['Meat & fish', 1.15, 'g', 0, 'Boerewors'], viennas: ['Meat & fish', 1, 'n', 48, 'viennas'], polony: ['Meat & fish', 1, 'g'], ham: ['Meat & fish', 1, 'g'], fish: ['Meat & fish', 1.25, 'g', 0, 'White fish fillets (e.g. hake)'],
  potato: ['Fruit & veg', 1.05, 'g', 0, 'Potatoes'], bakedPotato: ['Fruit & veg', 1, 'g', 0, 'Potatoes'], mash: ['Fruit & veg', 0.9, 'g', 0, 'Potatoes'], potatoSalad: ['Fruit & veg', 0.75, 'g', 0, 'Potatoes'], chips: ['Fruit & veg', 1, 'g', 0, 'Frozen oven chips'],
  corn: ['Fruit & veg', 1, 'n', 103, 'mielies'], butternut: ['Fruit & veg', 1.2, 'g'], pumpkin: ['Fruit & veg', 1.2, 'g'], cabbage: ['Fruit & veg', 1.1, 'g'], spinach: ['Fruit & veg', 1.6, 'g', 0, 'Spinach'],
  carrots: ['Fruit & veg', 1.1, 'g'], peas: ['Fruit & veg', 1, 'g', 0, 'Frozen peas'], greenbeans: ['Fruit & veg', 1, 'g'], mixedveg: ['Fruit & veg', 1, 'g', 0, 'Frozen mixed vegetables'], beetroot: ['Fruit & veg', 1.1, 'g'],
  tomato: ['Fruit & veg', 1, 'n', 120, 'tomatoes'], onion: ['Fruit & veg', 1, 'n', 150, 'onions'], lettuce: ['Fruit & veg', 1, 'n', 400, 'lettuce'], cucumber: ['Fruit & veg', 1, 'n', 300, 'cucumbers'], pepper: ['Fruit & veg', 1, 'n', 150, 'green peppers'],
  banana: ['Fruit & veg', 1, 'n', 118, 'bananas'], apple: ['Fruit & veg', 1, 'n', 182, 'apples'], orange: ['Fruit & veg', 1, 'n', 140, 'oranges'], pear: ['Fruit & veg', 1, 'n', 178, 'pears'],
  lfMilk: ['Dairy & eggs', 1, 'ml'], soyMilk: ['Dairy & eggs', 1, 'ml'], riceMilk: ['Dairy & eggs', 1, 'ml'], lfYoghurt: ['Dairy & eggs', 1, 'g'],
  dfMarg: ['Pantry', 1, 'g'], dfMash: ['Fruit & veg', 0.9, 'g', 0, 'Potatoes'], efMayo: ['Pantry', 1, 'g'], efPotatoSalad: ['Fruit & veg', 0.75, 'g', 0, 'Potatoes'],
  gfBread: ['Bread & grains', 1, 'loaf', 450, 'Gluten-free bread'], gfWrap: ['Bread & grains', 1, 'n', 26, 'corn tortillas'], gfCrackers: ['Bread & grains', 1, 'g'], riceCakes: ['Bread & grains', 1, 'g'],
  gfPasta: ['Bread & grains', 0.45, 'g', 0, 'Gluten-free pasta (dry)'], gfOats: ['Bread & grains', 1, 'g'],
  halaalWors: ['Meat & fish', 1.15, 'g', 0, 'Halaal beef boerewors'], chickenViennas: ['Meat & fish', 1, 'n', 45, 'chicken viennas'], chickenPolony: ['Meat & fish', 1, 'g'], chickenSlices: ['Meat & fish', 1, 'g'],
  chickenMince: ['Meat & fish', 1.3, 'g', 0, 'Chicken mince'], soyaMince: ['Tins & dry goods', 1, 'g'], kidneyBeans: ['Tins & dry goods', 1, 'can', 240, 'Kidney beans (400 g tins)'],
  sweetPotato: ['Fruit & veg', 1.1, 'g', 0, 'Sweet potatoes'], sunSeeds: ['Pantry', 1, 'g'], popcorn: ['Pantry', 1, 'g', 0, 'Popcorn kernels'],
  avo: ['Fruit & veg', 1, 'n', 150, 'avocados'], grapes: ['Fruit & veg', 1, 'g'], pineapple: ['Fruit & veg', 1, 'n', 900, 'pineapple'], mango: ['Fruit & veg', 1, 'n', 300, 'mangoes'],
};
const AISLES = ['Meat & fish', 'Fruit & veg', 'Dairy & eggs', 'Bread & grains', 'Tins & dry goods', 'Pantry'];
function shoppingList(fromIdx) {
  const ws = weekState(); if (!ws) return [];
  const sums = {};
  ws.W.days.forEach((picks, i) => { if (i < fromIdx) return; for (const m of planForPicks(picks)) for (const it of m.items) sums[it.key] = (sums[it.key] || 0) + it.grams; });
  const merged = {};
  for (const [key, g] of Object.entries(sums)) {
    const spec = SHOP[key] || ['Pantry', 1, 'g'], [aisle, f, unit, per, nm] = spec;
    const base = (PF[key] || [0, key])[1].replace(/\s*\((dry|for pap|e\.g\.[^)]*)[^)]*\)/gi, '').replace(/, (cooked|pan-fried|drained|boiled|skinless, cooked|lean, cooked|cooked \(meat only\))$/i, '');
    const id = unit === 'egg' ? 'eggs' : (nm && unit === 'g' ? nm : (unit === 'n' && nm) ? nm : base);
    const row = merged[id] || (merged[id] = { id, aisle, unit, per, nm, name: unit === 'egg' ? 'Eggs' : (nm && unit !== 'n' ? nm : base), qty: 0 });
    row.qty += unit === 'egg' ? g / per : g * f;
  }
  return Object.values(merged).map(r => {
    let amt;
    if (r.unit === 'g') amt = r.qty >= 1000 ? `${(Math.ceil(r.qty / 100) / 10).toFixed(1).replace('.0', '')} kg` : `${Math.max(50, Math.ceil(r.qty / 50) * 50)} g`;
    else if (r.unit === 'ml') amt = r.qty >= 1000 ? `${(Math.ceil(r.qty / 500) / 2).toString()} L` : `${Math.ceil(r.qty / 250) * 250} ml`;
    else if (r.unit === 'egg') amt = `${Math.ceil(r.qty)}`;
    else if (r.unit === 'loaf') { const n = Math.ceil(r.qty / r.per); amt = plural(n, 'loaf').replace('loafs', 'loaves'); }
    else if (r.unit === 'can') amt = plural(Math.ceil(r.qty / r.per), 'tin');
    else { const n = Math.ceil(r.qty / r.per); amt = `${n}`; if (/lettuce|pineapple/.test(r.nm)) amt = `${n} ${r.nm === 'lettuce' ? (n > 1 ? 'heads' : 'head') : ''}`.trim(); }
    const name = r.unit === 'n' ? r.nm[0].toUpperCase() + r.nm.slice(1) : r.name;
    return { id: r.id, aisle: r.aisle, name, amt };
  }).sort((a, b) => AISLES.indexOf(a.aisle) - AISLES.indexOf(b.aisle) || a.name.localeCompare(b.name));
}
function viewShop() {
  const ws = weekState();
  const head = `<header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/food" aria-label="Back">${I.chevL}</button></header>
  <div><p class="eyebrow">Shopping list for your week</p><h1 class="h-display">Meal ideas</h1></div>${planTabs('shop')}`;
  if (!ws) return `${head}<div class="empty"><strong>No week planned yet</strong><span>Plan your week first and the shopping list adds itself up.</span></div>
    <button type="button" class="btn primary xl block" data-act="week-make">${I.utensils} Plan my week</button>`;
  const from = S.week.shopAll ? 0 : ws.idx;
  const list = shoppingList(from), ticks = S.week.ticks || {};
  const left = list.filter(r => !ticks[r.id]).length;
  return `${head}
  <div class="seg" role="group" aria-label="Which days"><button type="button" class="${S.week.shopAll ? '' : 'on'}" data-act="shop-range" data-v="from">${lbl('From today', 'From today')}</button><button type="button" class="${S.week.shopAll ? 'on' : ''}" data-act="shop-range" data-v="all">${lbl('Whole week', 'Whole week')}</button></div>
  <p class="muted" style="font-size:14px">${plural(list.length, 'item')} · ${left} still to get. Meat, rice, pasta and beans are shown as raw or dry amounts to buy.${dietActive() ? ' Includes the swaps for your food needs.' + dietNote() : ''}</p>
  ${AISLES.filter(a => list.some(r => r.aisle === a)).map(a => `<section class="panel tight shop" aria-label="${esc(a)}"><h2 class="section">${esc(a)}</h2>
    <ul class="shop-list">${list.filter(r => r.aisle === a).map(r => `<li><label class="${ticks[r.id] ? 'got' : ''}"><input type="checkbox" data-shop="${esc(r.id)}" ${ticks[r.id] ? 'checked' : ''}><span class="shop-n">${esc(r.name)}</span><b class="num">${esc(r.amt)}</b></label></li>`).join('')}</ul></section>`).join('')}
  <div class="row-btns"><button type="button" class="btn primary" data-act="shop-copy">${I.check} Copy list</button><button type="button" class="btn" data-act="shop-clear">Untick all</button></div>
  <p class="credit">Amounts are rounded up and approximate. Leave out anything you already have.</p>`;
}

/* ---------- read a nutrition label ---------- */
const LABEL_SCHEMA = { type: 'OBJECT', properties: {
  name: { type: 'STRING' }, brand: { type: 'STRING' }, servingGrams: { type: 'NUMBER' }, per100: { type: 'OBJECT', properties: {
    kj: { type: 'NUMBER' }, kcal: { type: 'NUMBER' }, protein: { type: 'NUMBER' }, carbs: { type: 'NUMBER' }, sugar: { type: 'NUMBER' }, fat: { type: 'NUMBER' }, saturates: { type: 'NUMBER' }, fibre: { type: 'NUMBER' }, salt: { type: 'NUMBER' } } },
  readable: { type: 'BOOLEAN' }, note: { type: 'STRING' } }, required: ['per100', 'readable'] };
function parseLabel(text) {
  const t = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
  let j = null; try { j = JSON.parse(t); } catch (e) { const m = t.match(/\{[\s\S]*\}/); if (m) try { j = JSON.parse(m[0]); } catch (e2) { j = null; } }
  if (!j || typeof j !== 'object') return null;
  const p = j.per100 || {}, num = v => { if (v == null || v === '') return null; const n = Number(v); return Number.isFinite(n) && n >= 0 ? n : null; };
  let kcal = num(p.kcal); const kj = num(p.kj);
  if ((kcal == null || (kcal === 0 && kj > 0)) && kj != null) kcal = kj / KJ;
  return { readable: j.readable !== false && kcal != null, name: String(j.name || '').slice(0, 80), brand: String(j.brand || '').slice(0, 60), servingG: num(j.servingGrams),
    kcal, p: num(p.protein), c: num(p.carbs), sugar: num(p.sugar), f: num(p.fat), sat: num(p.saturates), fiber: num(p.fibre), salt: num(p.salt), note: String(j.note || '').slice(0, 160) };
}
async function readLabel(file) {
  const photo = await shrinkPhoto(file, 1600);
  return aiGenerate([
    { text: `Read the nutrition information table on this food package (South African labels usually show energy in kJ, per 100 g or 100 ml, and per serving).
Return JSON: {"name","brand","servingGrams","per100":{"kj","kcal","protein","carbs","sugar","fat","saturates","fibre","salt"},"readable","note"}.
Use the per 100 g / 100 ml column. If only per-serving values are shown, convert to per 100 g using the serving size. Carbs means total available carbohydrate. If there is sodium in mg but no salt, salt = sodium mg × 2.5 / 1000.
Use null for anything not on the label. readable = false if you cannot read the table.` },
    { inline_data: { mime_type: 'image/jpeg', data: photo.b64 } },
  ], { schema: LABEL_SCHEMA, parse: parseLabel });
}

/* ---------- weight & smart goal ---------- */
function weights() { return (Array.isArray(S.weights) ? S.weights : []).slice().sort((a, b) => a.d < b.d ? -1 : 1); }
function setWeight(d, kg) {
  S.weights = weights().filter(w => w.d !== d);
  if (kg > 0) S.weights.push({ d, kg: Math.round(kg * 10) / 10 });
  S.weights.sort((a, b) => a.d < b.d ? -1 : 1);
  if (S.settings.profile) S.settings.profile.weightKg = S.weights[S.weights.length - 1]?.kg || S.settings.profile.weightKg;
  save();
}
function weightTrend() {
  const ws = weights(); if (!ws.length) return null;
  const avgAround = k => { const from = addDays(k, -6), pts = ws.filter(w => w.d >= from && w.d <= k); return pts.length ? pts.reduce((s, w) => s + w.kg, 0) / pts.length : null; };
  const last = ws[ws.length - 1], trend = avgAround(last.d);
  const weekAgo = avgAround(addDays(last.d, -7));
  return { last, trend, week: weekAgo != null && ws.some(w => w.d <= addDays(last.d, -7)) ? trend - weekAgo : null, first: ws[0], count: ws.length };
}
const RATE_DEFAULT = () => { const g = Number(S.settings.profile?.goal ?? 0); return g <= -500 ? -0.5 : g < 0 ? -0.25 : g > 0 ? 0.25 : 0; };
function smartGoal() {
  const today = dkey(), from = addDays(today, -28);
  const ws = weights().filter(w => w.d >= from);
  const days = [];
  for (let i = 1; i <= 28; i++) { const k = addDays(today, -i), t = dayTotals(k); if ((S.log[k] || []).length >= 2 && t.kcal >= 800) days.push(t.kcal); }
  const span = ws.length >= 2 ? Math.round((fromKey(ws[ws.length - 1].d) - fromKey(ws[0].d)) / 864e5) : 0;
  if (ws.length < 4 || span < 14 || days.length < 10) {
    return { ready: false, need: `Needs about 2 weeks of weigh-ins (${ws.length} so far${span ? `, over ${span} days` : ''}) and 10 days of food logs (${days.length} so far).` };
  }
  const x = ws.map(w => (fromKey(w.d) - fromKey(ws[0].d)) / 864e5), y = ws.map(w => w.kg);
  const mx = x.reduce((a, b) => a + b, 0) / x.length, my = y.reduce((a, b) => a + b, 0) / y.length;
  const slope = x.reduce((s, xi, i) => s + (xi - mx) * (y[i] - my), 0) / (x.reduce((s, xi) => s + (xi - mx) ** 2, 0) || 1);   // kg per day
  const intake = days.reduce((a, b) => a + b, 0) / days.length;
  const tdee = intake - slope * 7700;
  const rate = S.settings.rate ?? RATE_DEFAULT();
  const floor = S.settings.profile?.sex === 'm' ? 1500 : 1200;
  const suggested = Math.max(floor, Math.round((tdee + rate * 7700 / 7) / 10) * 10);
  return { ready: true, tdee, intake, slopeWeek: slope * 7, suggested, days: days.length, weighins: ws.length, rate };
}
function weightChart() {
  const ws = weights().filter(w => w.d >= addDays(dkey(), -90)); if (ws.length < 2) return '';
  const W = 320, H = 160, pad = { l: 36, r: 8, t: 10, b: 22 };
  const t0 = fromKey(ws[0].d), t1 = fromKey(ws[ws.length - 1].d), spanD = Math.max(1, (t1 - t0) / 864e5);
  const lo = Math.floor(Math.min(...ws.map(w => w.kg)) - 0.5), hi = Math.ceil(Math.max(...ws.map(w => w.kg)) + 0.5);
  const X = d => pad.l + ((fromKey(d) - t0) / 864e5) / spanD * (W - pad.l - pad.r), Y = kg => pad.t + (hi - kg) / (hi - lo || 1) * (H - pad.t - pad.b);
  const trend = ws.map(w => { const pts = ws.filter(v => v.d >= addDays(w.d, -6) && v.d <= w.d); return [w.d, pts.reduce((s, v) => s + v.kg, 0) / pts.length]; });
  const path = trend.map(([d, v], i) => `${i ? 'L' : 'M'}${X(d).toFixed(1)},${Y(v).toFixed(1)}`).join('');
  const area = `${path}L${X(trend[trend.length - 1][0]).toFixed(1)},${H - pad.b}L${X(trend[0][0]).toFixed(1)},${H - pad.b}Z`;
  const u = wUnit(), lab = kg => wN(roundW(toW(kg)));
  return `<svg class="wchart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight over the last ${Math.round(spanD)} days">
    ${[hi, (hi + lo) / 2, lo].map(v => `<line class="wc-grid" x1="${pad.l}" x2="${W - pad.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/><text class="wc-lab" x="${pad.l - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${lab(v)}</text>`).join('')}
    <path class="wc-area" d="${area}"/><path class="wc-line" d="${path}"/>
    ${ws.map(w => `<circle class="wc-dot" cx="${X(w.d).toFixed(1)}" cy="${Y(w.kg).toFixed(1)}" r="2.6"/>`).join('')}
    <circle class="wc-end" cx="${X(trend[trend.length - 1][0]).toFixed(1)}" cy="${Y(trend[trend.length - 1][1]).toFixed(1)}" r="4.5"/>
    <text class="wc-lab" x="${pad.l}" y="${H - 4}">${esc(fromKey(ws[0].d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))}</text>
    <text class="wc-lab" x="${W - pad.r}" y="${H - 4}" text-anchor="end">${esc(fromKey(ws[ws.length - 1].d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))}</text>
    <text class="wc-lab" x="${W - pad.r}" y="${pad.t - 4}" text-anchor="end">${u}</text>
  </svg>`;
}
function openWeight() {
  const tr = weightTrend(), todayW = weights().find(w => w.d === dkey());
  const start = todayW ? todayW.kg : tr ? tr.last.kg : (S.settings.profile?.weightKg || 75);
  const el = sheetEl(`${sheetHead('Log your weight', dayLabel(dkey()))}
    <div class="stepper big-step"><button type="button" data-w="dec" aria-label="Less">${I.minus}</button><input id="w-in" inputmode="decimal" value="${trimNum(roundW10(toW(start)))}" aria-label="Weight in ${wUnit()}"><button type="button" data-w="inc" aria-label="More">${I.plus}</button></div>
    <p class="hint" style="text-align:center">${wUnit()} · weigh yourself at the same time each day, ideally in the morning</p>
    <p class="error" id="w-err" hidden></p>
    <div class="sheet-foot"><button type="button" class="btn primary xl grow" id="w-save">Save weight</button></div>`);
  const inp = el.querySelector('#w-in');
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    const v = (parseNum(inp.value) || 0) + (b.dataset.w === 'inc' ? 0.1 : -0.1);
    inp.value = n1(Math.max(0, Math.round(v * 10) / 10));
  });
  el.querySelector('#w-save').addEventListener('click', () => {
    const v = parseNum(inp.value), kg = v == null ? null : fromW(v);
    if (!(kg >= 25 && kg <= 350)) { const err = el.querySelector('#w-err'); err.hidden = false; err.textContent = `Enter your weight in ${wUnit()}.`; return; }
    setWeight(dkey(), kg);
    closeAll(() => { rerender(); toast('Weight saved'); });
  });
  return pushLayer(el);
}
const roundW10 = v => Math.round(v * 10) / 10;
function viewProgress() {
  const tr = weightTrend(), sg = smartGoal(), st = S.settings, rate = st.rate ?? RATE_DEFAULT();
  const ws = weights().slice().reverse();
  const fmtW = kg => `${wN(roundW10(toW(kg)))} ${wUnit()}`;
  const chg = v => v == null ? '–' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${n1(Math.abs(roundW10(toW(v))))}`;
  return `
  <header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/me" aria-label="Back">${I.chevL}</button></header>
  <div><p class="eyebrow">Weight &amp; goal</p><h1 class="h-display">Progress</h1></div>
  <div class="cols"><div class="col-a">
  <section class="panel tight weight-hero" aria-label="Weight">
    ${tr ? `<div class="wh-top">
        <div class="pl pl-v"><span class="pl-lab">Trend weight</span><span class="pl-val pl-big num">${wN(roundW10(toW(tr.trend)))}<small> ${wUnit()}</small></span></div>
        <div class="wh-side">
          <div class="pl pl-n"><span class="pl-lab">This week</span><span class="pl-val num">${chg(tr.week)}<small> ${wUnit()}</small></span></div>
          <div class="pl pl-n"><span class="pl-lab">Since start</span><span class="pl-val num">${chg(tr.trend - tr.first.kg)}<small> ${wUnit()}</small></span></div>
        </div></div>
      ${weightChart() || '<p class="hint">Log your weight on a few more days to see the chart.</p>'}` : `${secHead(I.chart, 'weight', 'Weight')}<p class="muted">No weigh-ins yet. Log your weight a few times a week; the trend line smooths out day-to-day ups and downs.</p>`}
    <button type="button" class="btn primary block" data-act="weight">${I.plus} Log today’s weight</button>
  </section>
  <section class="panel tight" aria-label="Smart goal">
    ${secHead(I.target, 'weight', 'Smart goal')}
    <div class="pref"><span class="pref-label">I want to</span><div class="seg wrap4">${[[-0.5, 'Lose ½ kg a week', 'Lose ½ kg/wk'], [-0.25, 'Lose ¼ kg a week', 'Lose ¼ kg/wk'], [0, 'Stay the same', 'Stay the same'], [0.25, 'Gain ¼ kg a week', 'Gain ¼ kg/wk']].map(([v, l, s]) => `<button type="button" class="${Number(rate) === v ? 'on' : ''}" data-act="pref" data-k="rate" data-v="${v}">${lbl(l, s)}</button>`).join('')}</div></div>
    ${sg.ready ? (() => {
      const diff = sg.suggested - st.kcal;
      return `<p>From your last ${sg.days} days of food logs and ${sg.weighins} weigh-ins, your real TDEE (maintenance) is about <b>${fmtE(sg.tdee)} ${eUnit()}</b> a day${energyNeeds()?.tdee ? ` (the formula guessed ${fmtE(energyNeeds().tdee)})` : ''} and your weight is changing by <b>${chg(sg.slopeWeek)} ${wUnit()}</b> a week.</p>
        ${Math.abs(diff) >= 100 ? `<div class="notice"><span>${I.target}</span><div><strong>Suggested goal: ${fmtE(sg.suggested)} ${eUnit()}</strong><p>Your goal is ${fmtE(st.kcal)} ${eUnit()} now. Changing it ${diff < 0 ? 'down' : 'up'} by ${fmtE(Math.abs(diff))} should get you to the rate you picked.</p></div>
          <div class="actions"><button type="button" class="btn sm primary" data-act="smart-apply" data-v="${sg.suggested}">Use ${fmtE(sg.suggested)} ${eUnit()}</button></div></div>`
        : `<p class="hint">Your current goal of ${fmtE(st.kcal)} ${eUnit()} fits what you picked. Keep going.</p>`}`;
    })() : `<p class="hint">Your goal will adjust itself once there’s enough to go on. ${esc(sg.need)} It works best if you log most of what you eat.</p>`}
  </section>
  </div><div class="col-b">
  ${bodyPanel()}
  ${photosPanel()}
  ${ws.length ? `<section class="panel tight" aria-label="Weigh-ins">${secHead(I.clock, 'weight', 'Weigh-ins')}
    <ul class="sum-list">${ws.slice(0, 30).map(w => `<li class="w-row"><span><strong class="num">${fmtW(w.kg)}</strong> <span class="muted">${esc(w.d === dkey() ? 'Today' : shortDay(w.d))}</span></span><button type="button" class="icon-btn" data-act="weight-del" data-d="${w.d}" aria-label="Delete weigh-in">${I.trash}</button></li>`).join('')}</ul></section>` : ''}
  </div></div>`;
}

/* ---------- workout schedule & "try heavier" ---------- */
const DAYS = [['Mon', 1], ['Tue', 2], ['Wed', 3], ['Thu', 4], ['Fri', 5], ['Sat', 6], ['Sun', 0]];
const schedule = () => (S.schedule && typeof S.schedule === 'object' ? S.schedule : (S.schedule = {}));
const hasSchedule = () => Object.values(schedule()).some(Boolean);
function scheduledFor(k) { const rid = schedule()[fromKey(k).getDay()]; return rid ? S.routines.find(r => r.id === rid) || null : null; }
function nextScheduled() {
  for (let i = 1; i <= 7; i++) { const k = addDays(dkey(), i), r = scheduledFor(k); if (r) return { r, k, i }; }
  return null;
}
function workoutsThisWeek() { const mon = mondayOf(dkey()); return S.workouts.filter(w => dkey(new Date(w.start)) >= mon).length; }
function weekTarget() { return hasSchedule() ? Object.values(schedule()).filter(Boolean).length : 3; }
function scheduleStrip() {
  const sc = schedule(), todayWd = new Date().getDay(), mon = mondayOf(dkey());
  const trained = new Set(S.workouts.filter(w => dkey(new Date(w.start)) >= mon).map(w => new Date(w.start).getDay()));
  return `<div class="sched" role="list">${DAYS.map(([d, wd]) => {
    const r = S.routines.find(x => x.id === sc[wd]), did = trained.has(wd);
    return `<button type="button" role="listitem" class="sched-day ${r ? 'on' : ''} ${wd === todayWd ? 'today' : ''} ${did ? 'did' : ''}" data-act="sched-day" data-wd="${wd}" aria-label="${d}: ${r ? esc(r.name) : 'rest'}${did ? ', trained' : ''}"><b>${d}</b><span>${did ? I.check : r ? esc(r.name.replace(/^(Gym|Home|Dumbbell)\s+/, '')) : 'Rest'}</span></button>`;
  }).join('')}</div>`;
}
function openSchedDay(wd) {
  const sc = schedule(), cur = sc[wd] || '', name = DAYS.find(d => d[1] === wd)[0];
  const el = sheetEl(`${sheetHead(`Training on ${name}`, 'Pick a routine or make it a rest day')}
    <ul class="food-list">
      <li class="food-row"><button type="button" class="fr-main" data-r=""><span class="fr-name">${cur ? '' : '✓ '}Rest day</span></button></li>
      ${S.routines.map(r => `<li class="food-row"><button type="button" class="fr-main" data-r="${esc(r.id)}"><span class="fr-name">${cur === r.id ? '✓ ' : ''}${esc(r.name)}</span><span class="fr-sub">${plural(r.items.length, 'exercise')} · about ${routineMinutes(r)} min</span></button></li>`).join('')}
    </ul><div class="sheet-end"></div>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    sc[wd] = b.dataset.r || ''; save();
    closeAll(() => rerender());
  });
  return pushLayer(el);
}
function lastSetsFor(ex) {
  for (const w of S.workouts) { const sets = (w.sets || []).filter(s => s.ex === ex && !s.drop); if (sets.length) return { w, sets }; }
  return null;
}
function suggestFor(ex, item) {
  const last = lastSetsFor(ex); if (!last || !item) return null;
  const sets = last.sets, timed = item.secs > 0;
  if (timed) {
    const best = Math.max(...sets.map(s => s.secs || 0)), all = sets.every(s => (s.secs || 0) >= item.secs);
    return { last, text: `Last time: ${sets.map(s => `${s.secs} s`).join(', ')}`, tip: all ? `try ${best + 5} s` : '', w: null };
  }
  const maxW = Math.max(...sets.map(s => s.w || 0));
  const top = sets.filter(s => (s.w || 0) === maxW);
  const hitAll = top.length >= Math.min(item.sets, sets.length) && top.every(s => (s.reps || 0) >= item.reps);
  const lastText = maxW ? `${top.length} × ${Math.round(top.reduce((s, x) => s + x.reps, 0) / top.length)} at ${wN(roundW(toW(maxW)))} ${wUnit()}` : `${sets.map(s => s.reps).join(', ')} reps`;
  if (maxW) {
    const maxed = top.some(s => (s.rpe || 0) >= 10), up = hitAll && !maxed;
    const next = up ? roundW(toW(maxW)) + wStep() : roundW(toW(maxW));
    return { last, text: `Last time: ${lastText}`, tip: up ? `try ${wN(next)} ${wUnit()}` : hitAll ? 'same weight: last time was a max effort' : 'same weight, aim for all reps', w: next };
  }
  const bestReps = Math.max(...sets.map(s => s.reps || 0));
  return { last, text: `Last time: ${lastText}`, tip: hitAll ? `try ${bestReps + 2} reps` : '', w: null };
}
function lastTimeHTML(it) {
  const s = suggestFor(it.ex, it); if (!s) return '';
  return `<p class="p-last">${esc(s.text)}${s.tip ? ` · <b>${esc(s.tip)}</b>` : ''}</p>`;
}
function personalBests(w) {
  const out = [];
  const byEx = {};
  for (const s of w.sets) (byEx[s.ex] = byEx[s.ex] || []).push(s);
  for (const [ex, sets] of Object.entries(byEx)) {
    const prev = S.workouts.filter(x => x.id !== w.id && x.start < w.start).flatMap(x => x.sets.filter(s => s.ex === ex));
    if (!prev.length) continue;
    const bestW = Math.max(...sets.map(s => s.w || 0)), prevW = Math.max(...prev.map(s => s.w || 0));
    if (bestW > 0 && bestW > prevW) { out.push(`${exName(ex)}: ${wN(roundW(toW(bestW)))} ${wUnit()} (up from ${wN(roundW(toW(prevW)))})`); continue; }
    if (!bestW && !prevW) {
      const r = Math.max(...sets.map(s => s.reps || 0)), pr = Math.max(...prev.map(s => s.reps || 0));
      const t = Math.max(...sets.map(s => s.secs || 0)), pt = Math.max(...prev.map(s => s.secs || 0));
      if (r > pr && r > 0) out.push(`${exName(ex)}: ${r} reps (up from ${pr})`);
      else if (t > pt && t > 0) out.push(`${exName(ex)}: ${t} s (up from ${pt} s)`);
    }
  }
  return out;
}

/* ---------- quick workout builder & swap ---------- */
const POPULAR = ['Pushups', 'Bodyweight_Squat', 'Bodyweight_Walking_Lunge', 'Butt_Lift_Bridge', 'Superman', 'Plank', 'Mountain_Climbers', 'Crunches', 'Cross-Body_Crunch',
  'Flat_Bench_Lying_Leg_Raise', 'Russian_Twist', 'Side_Bridge', 'Goblet_Squat', 'Dumbbell_Bench_Press', 'Bent_Over_Two-Dumbbell_Row', 'Dumbbell_Shoulder_Press', 'Dumbbell_Lunges',
  'Dumbbell_Bicep_Curl', 'Dumbbell_One-Arm_Triceps_Extension', 'Barbell_Bench_Press_-_Medium_Grip', 'Incline_Dumbbell_Press', 'Standing_Military_Press', 'Side_Lateral_Raise',
  'Triceps_Pushdown', 'Dips_-_Triceps_Version', 'Wide-Grip_Lat_Pulldown', 'Seated_Cable_Rows', 'Face_Pull', 'Barbell_Curl', 'Hammer_Curls', 'Barbell_Squat', 'Romanian_Deadlift',
  'Leg_Press', 'Lying_Leg_Curls', 'Leg_Extensions', 'Standing_Calf_Raises', 'Butterfly', 'Machine_Shoulder_Military_Press', 'Leverage_Chest_Press', 'Leverage_Iso_Row', 'Seated_Leg_Curl',
  'Hack_Squat', 'Cable_Crossover', 'Cable_Crunch', 'Bench_Dips', 'Incline_Push-Up', 'Decline_Push-Up', 'Freehand_Jump_Squat', 'Single_Leg_Glute_Bridge', 'Glute_Kickback',
  'Alternate_Hammer_Curl', 'Seated_Side_Lateral_Raise', 'Dumbbell_Squat', 'Stiff-Legged_Dumbbell_Deadlift', 'One-Arm_Dumbbell_Row', 'Dumbbell_Flyes', 'Front_Dumbbell_Raise',
  'Standing_Dumbbell_Calf_Raise', 'Kettlebell_Goblet_Squat', 'Smith_Machine_Squat', 'Smith_Machine_Bench_Press', 'Close-Grip_Front_Lat_Pulldown', 'Thigh_Abductor', 'Thigh_Adductor', 'Seated_Calf_Raise'];
const FOCUS = { full: ['quadriceps', 'chest', 'middle back', 'shoulders', 'glutes', 'lats', 'hamstrings', 'abdominals', 'triceps', 'biceps'],
  upper: ['chest', 'lats', 'shoulders', 'middle back', 'triceps', 'biceps', 'chest', 'shoulders'], lower: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'quadriceps', 'abdominals'],
  core: ['abdominals', 'abdominals', 'lower back', 'abdominals', 'abdominals', 'glutes'] };
const KIT = { none: ['body only'], db: ['dumbbell', 'body only', 'kettlebells'], gym: ['machine', 'cable', 'barbell', 'dumbbell', 'body only'] };
const isTimedEx = e => !!e && (e.c === 'stretching' || /plank|bridge|hold|wall sit|climber/i.test(e.n));
function buildQuick(mins, kit, focus) {
  const n = { 10: 4, 20: 5, 30: 6, 45: 8 }[mins] || 5, sets = mins <= 10 ? 2 : 3, rest = mins <= 10 ? 30 : mins <= 20 ? 45 : 60;
  const pool = POPULAR.map(id => EXMAP.get(id)).filter(e => e && e.g && KIT[kit].includes(e.e));
  const backup = EXV.filter(e => hasMedia(e) && KIT[kit].includes(e.e) && e.l !== 'expert' && (e.c === 'strength' || e.c === 'plyometrics'));
  const used = new Set(), items = [];
  const order = FOCUS[focus];
  for (let i = 0; items.length < n && i < order.length * 3; i++) {
    const m = order[i % order.length];
    const pick = list => { const c = list.filter(e => e.m.includes(m) && !used.has(e.i)); return c.length ? c[Math.floor(Math.random() * Math.min(c.length, 4))] : null; };
    const e = pick(pool) || pick(backup); if (!e) continue;
    used.add(e.i);
    const timed = isTimedEx(e);
    items.push({ ex: e.i, sets, reps: timed ? 0 : (e.e === 'body only' ? 15 : 12), secs: timed ? 30 : 0, rest });
  }
  return { id: 'q-' + uid(), name: `Quick ${mins}-minute ${{ full: 'full body', upper: 'upper body', lower: 'lower body', core: 'core' }[focus]}`, note: { none: 'No equipment', db: 'Dumbbells', gym: 'Gym' }[kit], items };
}
function openQuick() {
  const st = { mins: 20, kit: S.settings.quickKit || 'none', focus: 'full', r: null };
  const chipRow = (k, opts) => `<div class="chips" data-q="${k}">${opts.map(([v, l]) => `<button type="button" class="chip ${String(st[k]) === String(v) ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>`;
  const el = sheetEl(`${sheetHead('Quick workout', 'Built for the time and kit you have')}
    <div class="field"><span>Time</span>${chipRow('mins', [[10, '10 min'], [20, '20 min'], [30, '30 min'], [45, '45 min']])}</div>
    <div class="field"><span>Equipment</span>${chipRow('kit', [['none', 'None'], ['db', 'Dumbbells'], ['gym', 'Full gym']])}</div>
    <div class="field"><span>Focus</span>${chipRow('focus', [['full', 'Full body'], ['upper', 'Upper body'], ['lower', 'Legs & glutes'], ['core', 'Core']])}</div>
    <div id="qw-out"></div>
    <div class="sheet-foot" id="qw-foot"><button type="button" class="btn primary xl grow" data-k="build">${I.dumbbell} Build my workout</button></div>`);
  const out = el.querySelector('#qw-out'), foot = el.querySelector('#qw-foot');
  const preview = () => {
    const r = st.r;
    out.innerHTML = r.items.length ? `<ol class="r-items">${r.items.map(it => `<li><div class="ri">${imgTag(it.ex, 0, 'thumb')}<div><strong>${esc(exName(it.ex))}</strong><span>${it.sets} × ${it.secs ? `${it.secs} s` : `${it.reps} reps`} · ${it.rest} s rest</span></div><span></span></div></li>`).join('')}</ol>`
      : '<p class="hint">Couldn’t find enough exercises for that. Try other options.</p>';
    foot.innerHTML = `<button type="button" class="btn" data-k="build">${I.shuffle} ${lbl('Shuffle', 'Shuffle')}</button><button type="button" class="btn" data-k="save">${I.bookmark} Save</button><button type="button" class="btn primary grow" data-k="start" ${r.items.length ? '' : 'disabled'}>${I.play} Start</button>`;
  };
  el.addEventListener('click', e => {
    const chip = e.target.closest('[data-q] .chip');
    if (chip) { const k = chip.parentElement.dataset.q; st[k] = k === 'mins' ? +chip.dataset.v : chip.dataset.v; $$('.chip', chip.parentElement).forEach(c => c.classList.toggle('on', c === chip)); if (k === 'kit') { S.settings.quickKit = st.kit; save(); } if (st.r) { st.r = buildQuick(st.mins, st.kit, st.focus); preview(); } return; }
    const b = e.target.closest('[data-k]'); if (!b) return;
    if (b.dataset.k === 'build') { st.r = buildQuick(st.mins, st.kit, st.focus); preview(); }
    if (b.dataset.k === 'save') { const r = { ...st.r, id: 'r-' + uid() }; S.routines.push(r); save(); closeAll(() => { rerender(); toast(`Saved “${r.name}” to your routines`); }); }
    if (b.dataset.k === 'start') {
      const r = { ...st.r, id: 'r-' + uid() }; S.routines.push(r); save();
      closeAll(() => { rerender(); startWorkout(r.id); });
    }
  });
  return pushLayer(el);
}
function similarTo(exId) {
  const e = EXMAP.get(exId); if (!e) return [];
  const m = e.m[0], pop = new Set(POPULAR);
  return EXV.filter(x => x.i !== exId && hasMedia(x) && x.m.includes(m) && x.l !== 'expert' && x.c === e.c)
    .map(x => ({ x, s: (pop.has(x.i) ? 4 : 0) + (x.e === e.e ? 2 : 0) + (LOCAL_IMG.has(x.i) ? 1 : 0) + (x.l === 'beginner' ? 0.5 : 0) - x.n.length / 60 }))
    .sort((a, b) => b.s - a.s).slice(0, 14).map(o => o.x);
}
function openSwap(exId, onPick) {
  const list = similarTo(exId);
  const el = sheetEl(`${sheetHead('Swap exercise', `Instead of ${exName(exId)} · same muscles`)}
    ${list.length ? `<ul class="ex-list">${list.map(x => `<li class="ex-row"><button type="button" class="ex-link swap-pick" data-id="${esc(x.i)}">${imgTag(x.i, 0, 'thumb')}<span class="ex-text"><span class="ex-name">${esc(x.n)}</span><span class="ex-meta">${esc(x.m.join(', '))} · ${esc(x.e)}</span></span></button></li>`).join('')}</ul>` : '<p class="muted">No similar exercises found.</p>'}
    <div class="sheet-end"></div>`);
  el.addEventListener('click', e => { const b = e.target.closest('.swap-pick'); if (!b) return; onPick(b.dataset.id); popLayer(); });
  return pushLayer(el);
}

/* ---------- water ---------- */
const waterToday = () => ((S.water && S.water[dkey()]) || 0);
function waterCard() {
  const n = waterToday(), goal = S.settings.waterGoal || 8;
  return `<section class="panel tight mini-card" aria-label="Water">
    <div class="mc-head"><span class="eyebrow" style="margin:0">Water</span><span class="muted num" style="font-size:12px">250 ml</span></div>
    <div class="mc-val"><b class="num">${n}</b><span class="muted">/ ${goal}</span></div>
    <div class="glasses" aria-hidden="true">${Array.from({ length: Math.max(goal, n) }, (_, i) => `<i class="${i < n ? 'full' : ''}"></i>`).join('')}</div>
    <div class="mc-btns"><button type="button" class="icon-btn mc-b" data-act="water" data-d="-1" aria-label="Remove a glass" ${n ? '' : 'disabled'}>${I.minus}</button><button type="button" class="btn sm primary grow" data-act="water" data-d="1">${I.plus} Glass</button></div>
  </section>`;
}
function sparkline(vals) {
  if (vals.length < 2) return '';
  const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1, W = 120, H = 28;
  const pts = vals.map((v, i) => `${(2 + i * (W - 4) / (vals.length - 1)).toFixed(1)},${(3 + (hi - v) / span * (H - 6)).toFixed(1)}`).join(' ');
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" vector-effect="non-scaling-stroke"/></svg>`;
}
function weightCard() {
  const tr = weightTrend(), todayW = weights().find(w => w.d === dkey());
  return `<section class="panel tight mini-card" aria-label="Weight">
    <div class="mc-head"><span class="eyebrow" style="margin:0">Weight</span><a class="link" href="#/progress" style="font-size:12px;padding:0">Progress</a></div>
    <div class="mc-val">${tr ? `<b class="num">${wN(roundW10(toW(tr.last.kg)))}</b><span class="muted">${wUnit()}</span>` : '<span class="muted">Not logged yet</span>'}</div>
    ${sparkline(weights().slice(-10).map(w => w.kg))}
    <p class="muted mc-sub num">${tr && tr.week != null ? `${tr.week > 0 ? '+' : tr.week < 0 ? '−' : ''}${n1(Math.abs(roundW10(toW(tr.week))))} ${wUnit()} this week` : '&nbsp;'}</p>
    <div class="mc-btns"><button type="button" class="btn sm ${todayW ? '' : 'primary'} grow" data-act="weight">${todayW ? `${I.check} Logged` : `${I.plus} Weigh in`}</button></div>
  </section>`;
}

/* ---------- streaks & weekly summary ---------- */
function logStreak() {
  let k = dkey(), n = 0;
  if (!(S.log[k] || []).length) k = addDays(k, -1);
  while ((S.log[k] || []).length) { n++; k = addDays(k, -1); }
  return n;
}
function weekStats(mon) {
  const end = addDays(mon, 6), today = dkey(), st = S.settings;
  let logged = 0, kcal = 0, p = 0, onTarget = 0, water = 0, waterDays = 0;
  for (let i = 0; i < 7; i++) {
    const k = addDays(mon, i); if (k > today) break;
    const list = S.log[k] || [];
    if (list.length) { const t = dayTotals(k); logged++; kcal += t.kcal; p += t.p; if (Math.abs(t.kcal - st.kcal) <= st.kcal * 0.1) onTarget++; }
    const w = (S.water || {})[k]; if (w) { water += w; waterDays++; }
  }
  const wos = S.workouts.filter(w => { const k = dkey(new Date(w.start)); return k >= mon && k <= end; });
  const ws = weights().filter(w => w.d >= mon && w.d <= end);
  return { mon, end, logged, avgKcal: logged ? kcal / logged : 0, avgP: logged ? p / logged : 0, onTarget, workouts: wos.length, sets: wos.reduce((s, w) => s + w.sets.length, 0),
    wChange: ws.length >= 2 ? ws[ws.length - 1].kg - ws[0].kg : null, water: waterDays ? water / waterDays : 0 };
}
function summaryCard() {
  const today = dkey(), mon = mondayOf(today), lastMon = addDays(mon, -7), wd = new Date().getDay();
  if (!(wd === 1 || wd === 2) || S.settings.summarySeen === lastMon) return '';
  const s = weekStats(lastMon); if (!s.logged && !s.workouts) return '';
  return `<div class="notice summary-n"><span>${I.target}</span><div><strong>Your week in review</strong><p>${s.logged} days logged · ${s.workouts} workout${s.workouts === 1 ? '' : 's'}${s.wChange != null ? ` · ${s.wChange > 0 ? '+' : s.wChange < 0 ? '−' : ''}${n1(Math.abs(roundW10(toW(s.wChange))))} ${wUnit()}` : ''}</p></div>
    <div class="actions"><a class="btn sm primary" href="#/summary">See summary</a><button type="button" class="btn sm" data-act="summary-hide" data-v="${lastMon}">Hide</button></div></div>`;
}
function viewSummary() {
  const mon = mondayOf(dkey());
  const weeks = [mon, addDays(mon, -7), addDays(mon, -14), addDays(mon, -21)].map(weekStats);
  const st = S.settings;
  const card = (s, i) => `<section class="sum-week" aria-label="Week of ${esc(shortDay(s.mon))}">
    <div class="plan-head"><strong>${i === 0 ? 'This week so far' : i === 1 ? 'Last week' : `Week of ${esc(fromKey(s.mon).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))}`}</strong><span class="muted" style="font-size:13px">${esc(fromKey(s.mon).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))} – ${esc(fromKey(s.end).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))}</span></div>
    <div class="stats stile-grid">
      ${statTile('kcal', 'Days logged', `${s.logged}<small> / 7</small>`)}
      ${statTile('workout', 'Workouts', s.workouts, '', `${plural(s.sets, 'set')}`)}
      ${statTile('kcal', `Avg ${eUnit()}`, s.logged ? fmtE(s.avgKcal) : '–')}
      ${statTile('protein', 'Avg protein', s.logged ? n0(s.avgP) : '–', s.logged ? 'g' : '')}
      ${statTile('kcal', 'On target', s.onTarget, plural(s.onTarget, 'day').replace(/^\d+ /, ''))}
      ${statTile('weight', 'Weight', s.wChange == null ? '–' : `${s.wChange > 0 ? '+' : s.wChange < 0 ? '−' : ''}${n1(Math.abs(roundW10(toW(s.wChange))))}`, s.wChange == null ? '' : wUnit())}
    </div>
    ${i === 1 && s.logged ? `<p class="hint">${s.avgKcal > st.kcal * 1.1 ? `You averaged ${fmtE(s.avgKcal - st.kcal)} ${eUnit()} over your goal.` : s.avgKcal < st.kcal * 0.9 ? `You averaged ${fmtE(st.kcal - s.avgKcal)} ${eUnit()} under your goal.` : 'You stayed close to your goal on average. Nice.'} ${s.avgP < st.protein * 0.85 ? 'Protein was a bit low; meals marked “High protein” in Meal ideas help.' : ''}</p>` : ''}
  </section>`;
  return `<header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/me" aria-label="Back">${I.chevL}</button></header>
  <div><p class="eyebrow">Food, workouts and weight</p><h1 class="h-display">Weekly summary</h1></div>
  <div class="stile-grid sum-top">
    ${statTile('workout', `${I.flame} Streak`, logStreak(), plural(logStreak(), 'day').replace(/^\d+ /, ''))}
    ${statTile('workout', `${I.dumbbell} This week`, `${workoutsThisWeek()}<small> / ${weekTarget()}</small>`, '', 'workouts')}
  </div>
  ${weeks.map(card).join('')}`;
}

/* ---------- the new Today screen ---------- */
let lastRendered = '';
const firstVisit = name => lastRendered !== name;   // true when arriving from another page: the rings draw in
const MACRO = { p: ['Protein', 'protein'], c: ['Carbs', 'carbs'], f: ['Fat', 'fat'] };
const macroTile = (m, v, g = S.settings[MACRO[m][1]]) => `<section class="mtile m-${m}" aria-label="${MACRO[m][0]}"><div class="mt-head"><span>${MACRO[m][0]}</span><span class="num">${n0(g)} g</span></div>
  <div class="mt-val num">${n0(v)}<small class="mt-of"> / ${n0(g)}</small><small> g</small></div><div class="mbar" role="img" aria-label="${MACRO[m][0]}: ${n0(v)} of ${n0(g)} grams"><i style="width:${g ? clamp(v / g * 100, 0, 100) : 0}%"></i></div></section>`;
const macroTiles = (t, keys = 'pcf') => `<div class="macro-tiles n${keys.length}">${[...keys].map(m => macroTile(m, t[m])).join('')}</div>`;
// section heading with a small colour badge, like iOS Settings; cat = kcal | protein | water | workout | weight | fast | accent | grey
const secHead = (icon, cat, title) => `<h2 class="section sec-ico"><span class="ico-badge c-${cat}" aria-hidden="true">${icon}</span>${title}</h2>`;
// one stat tile: coloured label, heavy rounded number
const statTile = (cat, label, val, unit = '', sub = '') => `<div class="stile c-${cat}"><span class="st-lab">${label}</span><span class="st-val num">${val}${unit ? `<small> ${unit}</small>` : ''}</span>${sub ? `<span class="st-sub">${sub}</span>` : ''}</div>`;
function pulseRings(rings, animate) {
  // rings: [{ id, pct, label }] outer to inner; gradient ids live in index.html
  const size = 150, stroke = 16, gap = 3;
  const arcs = rings.map((g, i) => {
    const r = size / 2 - stroke / 2 - i * (stroke + gap), c = 2 * Math.PI * r, off = c * (1 - clamp(g.pct, 0, 1));
    return `<circle class="pr-track pr-${g.id}" cx="75" cy="75" r="${r}" stroke-width="${stroke}" fill="none"/>
      <circle class="pr-arc pr-${g.id}${animate ? ' draw' : ''}" cx="75" cy="75" r="${r}" stroke-width="${stroke}" fill="none" stroke-linecap="round"
        stroke="url(#pr-${g.id})" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" style="--c:${c.toFixed(1)}" transform="rotate(-90 75 75)"/>`;
  }).join('');
  return `<svg class="pulse-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${esc(rings.map(g => g.label).join(', '))}">${arcs}</svg>`;
}
function nextWorkoutRow() {
  const k = dkey();
  const doneToday = S.workouts.filter(w => dkey(new Date(w.start)) === k);
  const last = S.workouts[0];
  let next = S.routines[0];
  if (last) { const i = S.routines.findIndex(r => r.id === last.rid); if (i >= 0) next = S.routines[(i + 1) % S.routines.length]; }
  const sched = hasSchedule(), todays = sched ? scheduledFor(k) : null;
  const minsOf = r => `${plural(r.items.length, 'exercise')} · ${routineMinutes(r)} min`;
  const card = (lab, title, sub, r, cls = '') => `<div class="wk-row ${cls}"><div class="wk-text"><span class="pw-lab">${lab}</span><strong>${title}</strong><span class="muted">${sub}</span></div>
      ${r ? `<button type="button" class="play" data-act="start" data-id="${esc(r.id)}" aria-label="Start ${esc(r.name)}">${I.playF}</button>` : ''}</div>`;
  let workout;
  if (doneToday.length) {
    workout = card(`${I.check} Done today`, esc(doneToday.map(w => w.name).join(' + ')), `${clock(doneToday.reduce((s2, w) => s2 + (w.end - w.start) / 1000, 0))} · ${plural(doneToday.reduce((s2, w) => s2 + w.sets.length, 0), 'set')}`, null, 'done');
  } else if (sched && todays) {
    workout = card(`Today · ${new Date().toLocaleDateString(undefined, { weekday: 'long' })}`, esc(todays.name), minsOf(todays), todays);
  } else if (sched) {
    const nx = nextScheduled();
    workout = nx ? card('Rest day', `Next: ${esc(nx.r.name)}`, `${nx.i === 1 ? 'Tomorrow' : fromKey(nx.k).toLocaleDateString(undefined, { weekday: 'long' })} · ${minsOf(nx.r)}`, nx.r)
      : card('Rest day', 'Nothing planned', 'Pick days on the Train tab', null);
  } else if (next) {
    workout = card('Up next', esc(next.name), minsOf(next), next);
  } else {
    workout = `<p class="muted">You don’t have any routines yet.</p><a class="btn primary block" href="#/edit/new">${I.plus} Make a routine</a>`;
  }
  return workout;
}
function viewToday() {
  const k = dkey(), t = dayTotals(k), st = S.settings, goal = goalOn(k);
  const left = goal - t.kcal;
  const today = new Date();
  const setup = !st.goalsSet ? `
    <div class="notice">${I.target}<div><strong>Set your daily goal</strong><p>${fmtE(st.kcal)} ${eUnit()} is a starting placeholder. Put in your own numbers, or let RepPlate estimate them.</p></div>
      <div class="actions"><a class="btn sm primary" href="#/me">Set goals</a></div></div>` : '';
  const install = (!isStandalone() && !st.installDismissed) ? `
    <div class="notice">${I.phone}<div><strong>Put RepPlate on your home screen</strong><p>${esc(installHowTo())}</p></div>
      <div class="actions">${installPrompt ? '<button type="button" class="btn sm primary" data-act="install">Install</button>' : ''}<button type="button" class="btn sm" data-act="dismiss-install">Got it</button></div></div>` : '';
  const workout = nextWorkoutRow();
  const streak = logStreak(), wk = workoutsThisWeek(), bonus = bonusOn(k);
  const water = waterToday(), wGoal = st.waterGoal || 8;
  const animate = firstVisit('today');
  const rings = pulseRings([
    { id: 'k', pct: t.kcal / (goal || 1), label: `Calories: ${fmtE(t.kcal)} of ${fmtE(goal)} ${eUnit()} eaten` },
    { id: 'p', pct: t.p / (st.protein || 1), label: `Protein: ${n0(t.p)} of ${n0(st.protein)} g` },
    { id: 'w', pct: water / wGoal, label: `Water: ${water} of ${wGoal} glasses` },
  ], animate);
  return `
  <header class="top"><div><p class="eyebrow date">${esc(today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }))}</p><h1 class="h-display">Today</h1></div>
    <div class="top-acts">${streak >= 2 ? `<a class="streak" href="#/summary" aria-label="${streak}-day logging streak">${I.flame}<b class="num">${streak}</b></a>` : ''}<button type="button" class="icon-btn coach-btn" data-act="coach" aria-label="Ask your coach">${I.chat}</button></div></header>
  ${resumeBanner()}
  ${setup}
  ${summaryCard()}
  <div class="today-cols"><div class="today-a">
  <section class="pulse-energy" aria-label="Energy today">
    <div class="panel pulse-hero energy-top">
      <div class="pulse-rings">${rings}</div>
      <div class="pulse-legend">
        <div class="pl pl-k"><span class="pl-lab">${eUnit() === 'kJ' ? 'Kilojoules' : 'Calories'} ${left >= 0 ? 'left' : 'over'}</span><span class="pl-val pl-big num">${fmtE(Math.abs(left))}<small> ${eUnit()}</small></span>
          <span class="pl-sub num">${fmtE(t.kcal)} eaten · goal ${fmtE(goal)}</span>${bonus ? `<span class="pl-sub eq-note">${I.bolt} incl. +${fmtE(bonus)} from exercise</span>` : ''}</div>
        <div class="pl pl-p m-p"><span class="pl-lab">Protein</span><span class="pl-val num">${n0(t.p)}<small> / ${n0(st.protein)} g</small></span></div>
        <div class="pl pl-w"><span class="pl-lab">Water</span><span class="pl-val num">${water}<small> / ${wGoal} glasses</small></span></div>
      </div>
      <button type="button" class="pulse-ideas" data-act="eat-now">${I.target}<span>${lbl(`What can I eat with ${fmtE(Math.max(0, left))} ${eUnit()} left?`, 'What can I eat now?')}</span>${I.chevR}</button>
    </div>
    <div class="pulse-actions">
      <button type="button" class="btn primary log-btn" data-act="add" data-meal="${mealNow()}" data-today="1">${I.plus} Log food</button>
      <button type="button" class="round-btn" data-act="snap" aria-label="Snap a meal">${I.camera}</button>
      <button type="button" class="round-btn" data-act="say" aria-label="Say what you ate">${I.mic}</button>
    </div>
  </section>
  ${macroTiles(t, 'cf')}
  <section class="panel tight week" aria-label="Last 7 days">
    <div class="section-row">${secHead(I.chart, 'kcal', 'Last 7 days')}<span class="muted num" style="font-size:13px">${eUnit()} eaten</span></div>
    ${weekChart()}
    <div class="legend"><span><i class="ln"></i>Goal ${fmtE(st.kcal)} ${eUnit()}</span><span><i class="dt"></i>Workout</span></div>
  </section>
  </div><div class="today-b">
  <section class="panel pulse-workout" aria-label="Workout">
    ${workout}
    <div class="pw-foot"><span class="muted num">${wk} of ${weekTarget()} ${lbl('workouts this week', 'this week')}</span><span class="pw-links"><a class="link" href="#/train">Routines</a><button type="button" class="link" data-act="quick">Quick workout</button></span></div>
  </section>
  <div class="mini-grid">${waterCard()}${weightCard()}${activityCard()}${fastCard()}</div>
  ${usualsCard()}
  ${habitsCard()}
  </div></div>
  ${install}`;
}

/* ============================== BARCODE SCANNER ============================== */
let zxingLoading = null;
function loadZXing() {
  if (window.ZXing) return Promise.resolve();
  if (!zxingLoading) zxingLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'vendor/zxing.min.js';
    s.onload = res; s.onerror = () => { zxingLoading = null; rej(new Error('zxing')); };
    document.head.append(s);
  });
  return zxingLoading;
}
let detectorP = null;
function getDetector() {
  if (!detectorP) detectorP = (async () => {
    if ('BarcodeDetector' in window) {
      try {
        const fm = await window.BarcodeDetector.getSupportedFormats();
        const want = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'itf'].filter(f => fm.includes(f));
        if (want.includes('ean_13')) {
          const d = new window.BarcodeDetector({ formats: want });
          const one = async src => { const r = await d.detect(src); return r[0]?.rawValue || null; };
          return { name: 'native', fromVideo: v => one(v), fromCanvas: c => one(c) };
        }
      } catch (e) { /* fall back */ }
    }
    await loadZXing();
    const Z = window.ZXing;
    const reader = new Z.MultiFormatReader();
    const hints = new Map();
    hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.ITF]);
    hints.set(Z.DecodeHintType.TRY_HARDER, true);
    reader.setHints(hints);
    const fromCanvas = c => {
      try { return reader.decodeWithState(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(c)))).getText(); }
      catch (e) { return null; } finally { try { reader.reset(); } catch (e) { /* ignore */ } }
    };
    const cv = document.createElement('canvas'); const cx = cv.getContext('2d', { willReadFrequently: true });
    const fromVideo = v => {
      const vw = v.videoWidth, vh = v.videoHeight; if (!vw || !vh) return null;
      const sw = vw * 0.9, sh = vh * 0.5, scale = Math.min(1, 900 / sw);
      cv.width = Math.round(sw * scale); cv.height = Math.round(sh * scale);
      cx.drawImage(v, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
      return fromCanvas(cv);
    };
    return { name: 'zxing', fromVideo, fromCanvas };
  })().catch(e => { detectorP = null; throw e; });
  return detectorP;
}
function gtinOK(code) {
  if (!/^\d+$/.test(code) || ![8, 12, 13, 14].includes(code.length)) return false;
  const d = code.split('').map(Number), check = d.pop();
  let sum = 0;
  d.reverse().forEach((n, i) => { sum += n * (i % 2 === 0 ? 3 : 1); });
  return (10 - (sum % 10)) % 10 === check;
}
async function decodeImageFile(file) {
  const det = await getDetector();
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await det.fromCanvas(c);
  } finally { URL.revokeObjectURL(url); }
}

function openScanner(ctx, replace = false) {
  const el = overlayEl(`
    <video playsinline muted autoplay></video>
    <div class="scan-frame" aria-hidden="true"><i class="laser"></i></div>
    <div class="scan-top">
      <button type="button" class="icon-btn on-dark" data-s="close" aria-label="Close scanner">${I.close}</button>
      <strong>Scan a barcode</strong>
      <button type="button" class="icon-btn on-dark" data-s="torch" aria-label="Torch" hidden>${I.flash}</button>
    </div>
    <div class="scan-bottom">
      <p class="scan-hint" id="scan-hint">Starting the camera…</p>
      <form class="scan-type" data-s-form hidden>
        <input class="input" id="scan-code" inputmode="numeric" autocomplete="off" placeholder="Barcode number" aria-label="Barcode number">
        <button class="btn primary">Look up</button>
      </form>
      <div class="scan-actions">
        <button type="button" class="btn" data-s="type">${I.keyboard} Type number</button>
        <button type="button" class="btn" data-s="photo">${I.image} Use a photo</button>
      </div>
      <input type="file" id="scan-file" accept="image/*" hidden>
    </div>
    <div class="scan-msg" id="scan-msg" hidden></div>`, 'scanner');
  let stream = null, running = false, timer = 0, done = false, lastRead = '', torchOn = false, closed = false;
  const stop = () => { running = false; clearTimeout(timer); if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } };
  const opts = { onClose: () => { closed = true; stop(); } };
  if (replace) replaceLayer(el, opts); else pushLayer(el, opts);

  const video = el.querySelector('video'), hint = el.querySelector('#scan-hint'), msg = el.querySelector('#scan-msg');
  const showMsg = html => { msg.innerHTML = html; msg.hidden = false; };
  const found = async code => {
    if (done) return; done = true; stop();
    buzz(60); beep(1320, 0.08, 0.15);
    showMsg(`<span class="spinner"></span><strong>Looking up ${esc(code)}…</strong>`);
    let food = null;
    try { food = await lookupBarcode(code); }
    catch (e) {
      showMsg(`<strong>Couldn’t reach the food database</strong><span>Open Food Facts may be busy, or you’re offline. Try again in a moment, or add it yourself.</span>
        <div class="row-btns" style="width:100%"><button type="button" class="btn" data-s="retry" data-code="${esc(code)}">Try again</button><button type="button" class="btn" data-s="create" data-code="${esc(code)}">Add it myself</button></div>`);
      done = false; return;
    }
    if (closed) return;
    if (food) openFoodSheet(food, ctx, null, true);
    else openNotFound(code, ctx);
  };
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'); if (!b) return;
    const s = b.dataset.s;
    if (s === 'close') popLayer();
    else if (s === 'torch') {
      const track = stream?.getVideoTracks()[0]; if (!track) return;
      torchOn = !torchOn;
      track.applyConstraints({ advanced: [{ torch: torchOn }] }).catch(() => {});
      b.classList.toggle('on', torchOn);
    } else if (s === 'type') {
      const f = el.querySelector('[data-s-form]'); f.hidden = false; el.querySelector('#scan-code').focus();
    } else if (s === 'photo') el.querySelector('#scan-file').click();
    else if (s === 'retry') { msg.hidden = true; found(b.dataset.code); }
    else if (s === 'create') openCreateFood(ctx, { code: b.dataset.code }, true);
  });
  el.querySelector('[data-s-form]').addEventListener('submit', e => {
    e.preventDefault();
    const code = el.querySelector('#scan-code').value.replace(/\D/g, '');
    if (code.length < 6) { hint.textContent = 'That number looks too short. Barcodes usually have 8 or 13 digits.'; return; }
    found(code);
  });
  el.querySelector('#scan-file').addEventListener('change', async e => {
    const file = e.target.files[0]; e.target.value = '';
    if (!file) return;
    hint.textContent = 'Reading the photo…';
    try {
      const code = await decodeImageFile(file);
      if (code) found(code.replace(/\s/g, ''));
      else hint.textContent = 'Couldn’t find a barcode in that photo. Try again closer, with the barcode flat and well lit.';
    } catch (err) { hint.textContent = 'Couldn’t read that photo. Try another one, or type the number.'; }
  });

  (async () => {
    let det = null;
    try { det = await getDetector(); } catch (e) { hint.textContent = 'The scanner didn’t load. Type the number instead.'; }
    if (!navigator.mediaDevices?.getUserMedia) {
      hint.textContent = 'This browser can’t use the camera here. Use a photo or type the number.';
      el.querySelector('.scan-frame').hidden = true; return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
    } catch (err) {
      el.querySelector('.scan-frame').hidden = true;
      hint.textContent = err && err.name === 'NotAllowedError'
        ? 'Camera access is turned off for this site. Allow it in your browser settings, or type the number instead.'
        : 'Couldn’t start the camera. Use a photo or type the number instead.';
      return;
    }
    if (closed || done) { stop(); return; }
    video.srcObject = stream;
    try { await video.play(); } catch (e) { /* autoplay */ }
    hint.textContent = 'Line up the barcode inside the box';
    try { const caps = stream.getVideoTracks()[0].getCapabilities?.() || {}; if (caps.torch) el.querySelector('[data-s="torch"]').hidden = false; } catch (e) { /* ignore */ }
    if (!det) return;
    running = true;
    const loop = async () => {
      if (!running || done) return;
      if (video.readyState >= 2) {
        let code = null;
        try { code = await det.fromVideo(video); } catch (e) { /* frame not ready */ }
        if (code) {
          code = String(code).replace(/\s/g, '');
          if (gtinOK(code) || code === lastRead) return found(code);
          lastRead = code;
        }
      }
      timer = setTimeout(loop, det.name === 'native' ? 120 : 200);
    };
    loop();
  })();
}

function openNotFound(code, ctx) {
  const el = sheetEl(`
    ${sheetHead('Not found yet')}
    <p>Open Food Facts doesn’t have barcode <strong class="num">${esc(code)}</strong> yet. Add it yourself from the label and RepPlate will remember it next time you scan it.</p>
    <div class="form">
      <button type="button" class="btn primary xl block" data-n="label">${I.camera} Photograph the label</button>
      <button type="button" class="btn block" data-n="create">${I.pen} Type it in myself</button>
      <div class="row-btns"><button type="button" class="btn" data-n="scan">${I.scan} Scan again</button><button type="button" class="btn" data-n="search">${I.search} Search</button></div>
      <p class="hint">You can also add it to <a href="https://world.openfoodfacts.org/" target="_blank" rel="noopener">openfoodfacts.org</a> so everyone can scan it.</p>
    </div>
    <div class="sheet-end"></div>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-n]'); if (!b) return;
    if (b.dataset.n === 'create') openCreateFood(ctx, { code }, true);
    if (b.dataset.n === 'label') { if (!aiKey()) openAiSetupPrompt('label'); else openCreateFood(ctx, { code, label: true }, true); }
    if (b.dataset.n === 'scan') openScanner(ctx, true);
    if (b.dataset.n === 'search') openAddSheet(ctx, true);
  });
  replaceLayer(el);
}

/* ============================== TRAIN ============================== */
function trainTabs(on) {
  return `<nav class="seg" aria-label="Train sections"><a href="#/train" class="${on === 'r' ? 'on' : ''}">Routines</a><a href="#/exercises" class="${on === 'e' ? 'on' : ''}">Exercise library</a></nav>`;
}
function viewTrain() {
  const cards = S.routines.map(r => {
    const last = lastDone(r.id);
    return `<li class="routine">
      <a class="r-main" href="#/routine/${encodeURIComponent(r.id)}">
        <h3>${esc(r.name)}</h3>
        <p>${plural(r.items.length, 'exercise')} · about ${routineMinutes(r)} min${r.note ? ` · ${esc(r.note)}` : ''}</p>
        <div class="tags">${routineMuscles(r).slice(0, 4).map(m => `<span class="tag">${esc(m)}</span>`).join('')}</div>
        ${last ? `<p class="r-last">Last done ${ago(last.start)}</p>` : ''}
      </a>
      <button type="button" class="play" data-act="start" data-id="${esc(r.id)}" aria-label="Start ${esc(r.name)}">${I.playF}</button>
    </li>`;
  }).join('');
  const mon = mondayOf(dkey()), wos = S.workouts.filter(w => dkey(new Date(w.start)) >= mon);
  const done = wos.length, target = weekTarget();
  const sets = wos.reduce((n, w) => n + w.sets.length, 0), mins = Math.round(wos.reduce((n, w) => n + (w.end - w.start), 0) / 60000);
  const ring = pulseRings([{ id: 'o', pct: done / (target || 1), label: `Workouts: ${done} of ${target} this week` }], firstVisit('train'));
  return `
  <header class="top"><div><p class="eyebrow date">This week · ${done} of ${target} done</p><h1 class="h-display">Train</h1></div></header>
  ${trainTabs('r')}
  ${resumeBanner()}
  <div class="cols"><div class="col-a">
  <section class="panel pulse-hero solo" aria-label="My training week">
    <div class="pulse-rings">${ring}</div>
    <div class="pulse-legend">
      <div class="pl pl-o"><span class="pl-lab">${lbl('Workouts this week', 'This week')}</span><span class="pl-val pl-big num">${done}<small> / ${target}</small></span></div>
      <div class="pl pl-n"><span class="pl-lab">Sets</span><span class="pl-val num">${sets}</span></div>
      <div class="pl pl-n"><span class="pl-lab">Time</span><span class="pl-val num">${mins >= 60 ? `${Math.floor(mins / 60)}<small> h </small>${mins % 60}` : mins}<small> min</small></span></div>
    </div>
    <div class="hero-foot">
      ${scheduleStrip()}
      <p class="hint">${hasSchedule() ? 'Tap a day to change it. Today’s workout shows on the Today screen.' : 'Tap the days you train and pick a routine for each. Today’s workout then shows on the Today screen.'}</p>
    </div>
  </section>
  <section class="panel pulse-workout" aria-label="Workout">${nextWorkoutRow()}</section>
  <div class="tools">
    <button type="button" class="btn tool" data-act="quick">${I.bolt}<span>${lbl('Quick workout', 'Quick')}</span></button>
    <a class="btn tool" href="#/programs">${I.target}<span>Programs</span></a>
    <button type="button" class="btn tool" data-act="hiit">${I.clock}<span>${lbl('Interval timer', 'Intervals')}</span></button>
    <button type="button" class="btn tool" data-act="plates">${I.dumbbell}<span>${lbl('Plate calculator', 'Plates')}</span></button>
  </div>
  ${programPanel()}
  ${recoveryPanel()}
  </div><div class="col-b">
  <div class="section-row list-head"><h2 class="section">Your routines</h2><span class="muted num" style="font-size:13px">${S.routines.length}</span></div>
  ${S.routines.length ? `<ul class="routines">${cards}</ul>` : `<div class="empty"><strong>No routines yet</strong><span>Make one from the exercise library.</span></div>`}
  <a class="btn block" href="#/edit/new">${I.plus} New routine</a>
  ${S.workouts.length ? `<div class="row-btns"><a class="btn" href="#/strength">${I.chart} Strength</a><a class="btn" href="#/me#history">${I.clock} History</a></div>` : ''}
  </div></div>`;
}

function viewLibrary() {
  if (exError) return `<header class="top"><h1 class="h-display">Exercises</h1></header><div class="empty"><strong>The exercise list didn’t load</strong><span>Open RepPlate from its web address (not as a file on your computer), then try again.</span></div>`;
  const muscles = [...new Set(EXV.flatMap(e => e.m))].sort();
  const equips = [...new Set(EXV.map(e => e.e))].sort();
  const opt = (v, cur) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(v[0].toUpperCase() + v.slice(1))}</option>`;
  return `
  <header class="top"><div><p class="eyebrow">${n0(EXV.length)} exercises in 3D</p><h1 class="h-display">Exercises</h1></div></header>
  ${pickMode && draft ? '' : trainTabs('e')}
  <div class="filters">
    <label class="search-box"><span class="sr">Search exercises</span>${I.search}<input class="input" id="lib-q" type="search" autocomplete="off" placeholder="Search, e.g. squat or chest" value="${esc(lib.q)}"></label>
    <div class="grid2">
      <select class="input" id="lib-muscle" aria-label="Muscle"><option value="">All muscles</option>${muscles.map(m => opt(m, lib.muscle)).join('')}</select>
      <select class="input" id="lib-equip" aria-label="Equipment"><option value="">All equipment</option>${equips.map(m => opt(m, lib.equip)).join('')}</select>
    </div>
  </div>
  <p class="muted" id="lib-count" style="font-size:13px"></p>
  <ul class="ex-list" id="lib-results"></ul>
  ${pickMode && draft ? `<div class="pick-banner"><span>Adding to <strong>${esc(draft.name || 'your new routine')}</strong> · ${plural(draft.items.length, 'exercise')}</span><button type="button" class="btn primary" data-act="pick-done">Done</button></div>` : ''}`;
}
function libMatches() {
  const toks = lib.q.toLowerCase().split(/\s+/).filter(Boolean);
  let list = EXV.filter(e => (!lib.muscle || e.m.includes(lib.muscle)) && (!lib.equip || e.e === lib.equip));
  if (toks.length) {
    list = list.filter(e => { const hay = `${e.n} ${e.m.join(' ')} ${e.s.join(' ')} ${e.e} ${e.c}`.toLowerCase(); return toks.every(t => hay.includes(t)); });
    const q = lib.q.toLowerCase().trim();
    const score = e => { const n = e.n.toLowerCase(); return (n.startsWith(q) ? 0 : n.includes(q) ? 1 : 2) + (e.l === 'beginner' ? 0 : 0.5); };
    list.sort((a, b) => score(a) - score(b) || a.n.localeCompare(b.n));
  } else {
    list.sort((a, b) => (LOCAL_IMG.has(b.i) - LOCAL_IMG.has(a.i)) || a.n.localeCompare(b.n));
  }
  return list;
}
function renderLibResults() {
  const box = $('#lib-results'); if (!box) return;
  const list = libMatches();
  const shown = list.slice(0, lib.limit);
  const inDraft = new Set(pickMode && draft ? draft.items.map(i => i.ex) : []);
  $('#lib-count').textContent = list.length === EXV.length ? 'Popular moves first. Tap one to see how it’s done.' : `${n0(list.length)} ${list.length === 1 ? 'match' : 'matches'}`;
  box.innerHTML = shown.map(e => `<li class="ex-row">
      <a class="ex-link" href="#/ex/${encodeURIComponent(e.i)}">${imgTag(e.i, 0, 'thumb')}<span class="ex-text"><span class="ex-name">${esc(exSplit(e.n)[0])}</span><span class="ex-meta">${exSplit(e.n)[1] ? `${esc(exSplit(e.n)[1])} · ` : ''}${esc(e.m.join(', '))} · ${esc(e.e)}</span></span></a>
      ${pickMode && draft ? `<button type="button" class="icon-btn add-ex ${inDraft.has(e.i) ? 'added' : ''}" data-act="lib-pick" data-id="${esc(e.i)}" aria-label="Add ${esc(e.n)}">${inDraft.has(e.i) ? I.check : I.plus}</button>` : ''}
    </li>`).join('')
    + (list.length > shown.length ? `<li><button type="button" class="btn block" style="margin-top:12px" data-act="lib-more">Show more (${n0(list.length - shown.length)} left)</button></li>` : '')
    + (!list.length ? `<li class="empty"><strong>No exercises match</strong><span>Try a different word or clear the filters.</span></li>` : '');
}

function viewExercise(id) {
  const e = EXMAP.get(id);
  if (!e) return `<header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/exercises" aria-label="Back">${I.chevL}</button></header><div class="empty"><strong>Exercise not found</strong></div>`;
  const hist = [];
  for (const w of S.workouts) {
    const sets = w.sets.filter(s => s.ex === id);
    if (sets.length) hist.push({ w, sets });
    if (hist.length >= 4) break;
  }
  const inDraft = pickMode && draft && draft.items.some(i => i.ex === id);
  const v = S.videos[id];
  return `
  <header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/exercises" aria-label="Back">${I.chevL}</button></header>
  ${demo(id)}
  <div><p class="eyebrow">${[e.c, e.l].filter(Boolean).map(esc).join(' · ')}</p><h1 class="h-display md">${esc(e.n)}</h1></div>
  <div class="tags">${e.m.map(m => `<span class="tag strong">${esc(m)}</span>`).join('')}${e.s.map(m => `<span class="tag">${esc(m)}</span>`).join('')}<span class="tag">${esc(e.e)}</span></div>
  ${pickMode && draft
    ? `<button type="button" class="btn primary block" data-act="lib-pick" data-id="${esc(id)}" ${inDraft ? 'disabled' : ''}>${inDraft ? `${I.check} In ${esc(draft.name || 'your routine')}` : `${I.plus} Add to ${esc(draft.name || 'your routine')}`}</button>`
    : `<div class="row-btns"><button type="button" class="btn primary" data-act="ex-add" data-id="${esc(id)}">${I.plus} Add to routine</button>
       <a class="btn" href="#/ex/${encodeURIComponent(id)}#video">${I.video} ${v ? 'Your video' : 'Add a video'}</a></div>`}
  ${musclesCard(e)}
  ${exProgressPanel(id)}
  <section class="panel tight">${secHead(I.check, 'workout', 'How to do it')}<ol class="steps">${e.t.map(s => `<li>${esc(s)}</li>`).join('')}</ol></section>
  <section class="panel tight" id="video" aria-label="Video">
    ${secHead(I.video, 'workout', 'Video')}
    ${v ? `${videoBox(v, e.n, true)}
      <div class="row-btns"><a class="btn" href="https://www.youtube.com/watch?v=${esc(v.id)}${v.start ? `&t=${v.start}s` : ''}" target="_blank" rel="noopener">Open in YouTube</a><button type="button" class="btn danger" data-act="yt-remove" data-id="${esc(id)}">${I.trash} Remove</button></div>
      <p class="hint">In workout mode this plays on repeat with the sound off, while the coach counts your reps out loud.</p>`
    : `<p class="muted" style="font-size:14px">Want real video for this one? Find a short clip on YouTube, tap Share, then Copy link, and paste it here. In workout mode it plays on repeat with the sound off while the coach counts.</p>
      <a class="btn" href="https://www.youtube.com/results?search_query=${encodeURIComponent(e.n + ' exercise how to')}" target="_blank" rel="noopener">${I.video} Find one on YouTube</a>
      <form class="search-form" data-form="yt" data-ex="${esc(id)}"><input class="input" id="yt-url" inputmode="url" autocomplete="off" placeholder="Paste a YouTube link" aria-label="YouTube link"><button class="btn primary">Save</button></form>`}
  </section>
  ${hist.length ? `<section class="panel tight">${secHead(I.clock, 'workout', 'Your recent sets')}<ul class="sum-list">${hist.map(h => `<li><strong>${esc(new Date(h.w.start).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }))} · ${esc(h.w.name)}</strong><span>${h.sets.map(fmtSet).join(', ')}</span></li>`).join('')}</ul></section>` : ''}`;
}
function fmtSet(s) {
  if (s.secs) return `${s.secs} s`;
  const t = s.w ? `${s.reps} × ${wN(roundW(toW(s.w)))} ${wUnit()}` : `${s.reps} reps`;
  return `${t}${s.rpe ? ` @${s.rpe}` : ''}${s.drop ? ' (drop)' : ''}`;
}

function viewRoutine(id) {
  const r = S.routines.find(x => x.id === id);
  if (!r) return `<header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/train" aria-label="Back">${I.chevL}</button></header><div class="empty"><strong>Routine not found</strong><span>It may have been deleted.</span></div>`;
  const sets = r.items.reduce((s, i) => s + i.sets, 0);
  const last = lastDone(r.id);
  return `
  <header class="top bar"><button type="button" class="icon-btn" data-act="back" data-fallback="#/train" aria-label="Back">${I.chevL}</button><span class="grow"></span><a class="btn sm" href="#/edit/${encodeURIComponent(r.id)}">${I.edit} Edit</a></header>
  <div>${r.note ? `<p class="eyebrow">${esc(r.note)}</p>` : ''}<h1 class="h-display">${esc(r.name)}</h1></div>
  <section class="panel pulse-workout routine-hero" aria-label="Routine summary">
    <div class="rh-stats">${statTile('workout', 'Exercises', r.items.length)}${statTile('workout', 'Sets', sets)}${statTile('workout', 'Minutes', routineMinutes(r))}</div>
    <p class="muted rh-last">${last ? `Last done ${ago(last.start)}` : 'Not done yet'}</p>
  </section>
  ${resumeBanner()}
  ${r.items.length ? `<button type="button" class="btn primary xl block" data-act="start" data-id="${esc(r.id)}">${I.play} Start workout</button>
  <div class="seg" role="group" aria-label="Workout style"><button type="button" class="${S.settings.guided ? 'on' : ''}" data-act="pref" data-k="guided" data-v="true">${lbl('Coach counts reps', 'Coach counts')}</button><button type="button" class="${S.settings.guided ? '' : 'on'}" data-act="pref" data-k="guided" data-v="false">${lbl('I tap when done', 'I tap')}</button></div>` : ''}
  ${r.items.length ? `<ol class="r-items">${r.items.map((it, i) => `<li class="${it.ss ? 'ss-a' : r.items[i - 1]?.ss ? 'ss-b' : ''}"><a class="ri" href="#/ex/${encodeURIComponent(it.ex)}">${imgTag(it.ex, 0, 'thumb')}<div><strong>${esc(exSplit(exName(it.ex))[0])}</strong><span>${exSplit(exName(it.ex))[1] ? `${esc(exSplit(exName(it.ex))[1])} · ` : ''}${it.ss || r.items[i - 1]?.ss ? '<b class="ss-tag">Superset</b> ' : ''}${it.drop ? '<b class="ss-tag">+ drop set</b> ' : ''}${it.sets} × ${it.secs ? `${it.secs} s` : `${it.reps} reps`}${it.rest ? ` · ${it.rest} s rest` : ''}</span></div>${I.chevR}</a></li>`).join('')}</ol>`
    : `<div class="empty"><strong>No exercises yet</strong><span>Tap Edit to add some.</span></div>`}`;
}

/* ---------- routine editor ---------- */
function viewEditor(id) {
  if (!draft || (id === 'new' ? !draft.isNew : draft.id !== id)) {
    if (id === 'new') draft = { id: 'r-' + uid(), isNew: true, name: '', note: '', items: [] };
    else {
      const r = S.routines.find(x => x.id === id);
      if (!r) return `<div class="empty"><strong>Routine not found</strong></div>`;
      draft = JSON.parse(JSON.stringify(r));
    }
  }
  const d = draft;
  return `
  <header class="top bar"><button type="button" class="icon-btn" data-act="ed-cancel" aria-label="Cancel">${I.close}</button><h1 class="h-display grow bar-title">${d.isNew ? 'New routine' : 'Edit routine'}</h1><button type="button" class="btn primary" data-act="ed-save">Save</button></header>
  <div class="form">
    <label class="field"><span>Name</span><input class="input" id="ed-name" maxlength="40" placeholder="e.g. Monday upper body" value="${esc(d.name)}"></label>
    <label class="field"><span>Note (optional)</span><input class="input" id="ed-note" maxlength="60" placeholder="e.g. Gym, 45 minutes" value="${esc(d.note || '')}"></label>
  </div>
  <p class="error" id="ed-err" hidden></p>
  <div class="section-row"><h2 class="section">Exercises</h2><span class="muted" style="font-size:13px">${d.items.length ? `about ${routineMinutes(d)} min` : ''}</span></div>
  ${d.items.length ? `<ol class="ed-list">${d.items.map((it, i) => `
    <li class="ed-item ${it.ss ? 'ss-a' : d.items[i - 1]?.ss ? 'ss-b' : ''}">
      <div class="ed-head">${imgTag(it.ex, 0, 'thumb')}<div class="ed-title"><strong>${esc(exSplit(exName(it.ex))[0])}</strong><span>${exSplit(exName(it.ex))[1] ? `${esc(exSplit(exName(it.ex))[1])} · ` : ''}${esc((EXMAP.get(it.ex)?.m || []).join(', '))}</span></div>
        <div class="ed-order"><button type="button" class="icon-btn" data-act="ed-move" data-i="${i}" data-d="-1" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${I.up}</button><button type="button" class="icon-btn" data-act="ed-move" data-i="${i}" data-d="1" ${i === d.items.length - 1 ? 'disabled' : ''} aria-label="Move down">${I.down}</button></div></div>
      <div class="ed-controls">
        <div class="ed-ctl"><span class="field-label">Sets</span><div class="stepper sm"><button type="button" data-act="ed-step" data-i="${i}" data-f="sets" data-d="-1" aria-label="Fewer sets">${I.minus}</button><output>${it.sets}</output><button type="button" data-act="ed-step" data-i="${i}" data-f="sets" data-d="1" aria-label="More sets">${I.plus}</button></div></div>
        <div class="ed-ctl"><span class="mini-seg"><button type="button" class="${it.secs ? '' : 'on'}" data-act="ed-mode" data-i="${i}" data-v="reps">Reps</button><button type="button" class="${it.secs ? 'on' : ''}" data-act="ed-mode" data-i="${i}" data-v="secs">Secs</button></span>
          <div class="stepper sm"><button type="button" data-act="ed-step" data-i="${i}" data-f="${it.secs ? 'secs' : 'reps'}" data-d="-1" aria-label="Less">${I.minus}</button><output>${it.secs || it.reps}</output><button type="button" data-act="ed-step" data-i="${i}" data-f="${it.secs ? 'secs' : 'reps'}" data-d="1" aria-label="More">${I.plus}</button></div></div>
        <label class="ed-ctl"><span class="field-label">Rest</span><select class="input" data-ed-rest="${i}">${REST_OPTIONS.map(v => `<option value="${v}" ${v === it.rest ? 'selected' : ''}>${v ? `${v} s` : 'None'}</option>`).join('')}</select></label>
      </div>
      <div class="ed-opts">
        ${it.secs ? '' : `<button type="button" class="opt ${it.drop ? 'on' : ''}" data-act="ed-drop" data-i="${i}" aria-pressed="${!!it.drop}">${it.drop ? I.check : I.plus} Drop set at the end</button>`}
        ${i < d.items.length - 1 && !d.items[i - 1]?.ss ? `<button type="button" class="opt ${it.ss ? 'on' : ''}" data-act="ed-ss" data-i="${i}" aria-pressed="${!!it.ss}">${it.ss ? I.check : I.plus} Superset with next</button>` : ''}
      </div>
      <div class="ed-foot"><button type="button" class="btn sm ghost" data-act="ed-swap" data-i="${i}">${I.shuffle} Swap</button><button type="button" class="btn sm ghost danger" data-act="ed-remove" data-i="${i}">${I.trash} Remove</button></div>
    </li>`).join('')}</ol>` : `<div class="empty"><strong>No exercises yet</strong><span>Add some from the library. You can set sets, reps and rest for each.</span></div>`}
  <button type="button" class="btn block" data-act="ed-add">${I.plus} Add exercises</button>
  ${!d.isNew ? `<button type="button" class="btn ghost danger block" data-act="ed-delete">${I.trash} Delete routine</button>` : ''}`;
}

/* ============================== WORKOUT PLAYER ============================== */
let playerLayerEl = null, tickTimer = 0, rafId = 0, lastBeep = -1, doneSummary = null, gPhaseShown = '', voiceMark = '';
const TEMPO = { slow: 4000, normal: 3000, fast: 2000 };
const repMs = () => TEMPO[S.settings.tempo] || 3000;
const smooth = x => x * x * (3 - 2 * x);
const spoken = id => exName(id).replace(/\s+-\s+/g, ', ').replace(/[()]/g, '');
const restWords = s => s >= 60 && s % 60 === 0 ? plural(s / 60, 'minute') : `${s} seconds`;
const isGuided = () => !!S.settings.guided;
const whatWords = it => it.secs ? `${it.secs} second hold` : `${it.reps} reps`;

function startWorkout(rid) {
  if (S.active) { openPlayer(); if (S.active.rid !== rid) toast('Finish or end this workout first'); return; }
  const r = S.routines.find(x => x.id === rid);
  if (!r || !r.items.length) { toast('Add some exercises to this routine first'); return; }
  audio(); unlockSpeech();
  S.active = { rid: r.id, name: r.name, items: JSON.parse(JSON.stringify(r.items)), i: 0, set: 1, phase: 'work', restEnd: 0, restTotal: 0, workEnd: 0, start: Date.now(), sets: [], ending: false, repsIn: null, wIn: null, secsIn: null, g: null };
  S.active.wIn = startWeight(S.active.items[0].ex);
  if (isGuided()) guideStart();
  save();
  openPlayer(true);
}
const startWeight = (ex, item) => {
  const it = item || (S.active && S.active.items.find(x => x.ex === ex));
  const sg = it ? suggestFor(ex, it) : null;
  if (sg && sg.w != null) return sg.w;
  return S.lastWeights[ex] ? roundW(toW(S.lastWeights[ex])) : null;
};
function openPlayer(fresh = false) {
  if (!S.active && !doneSummary) return;
  if (playerLayerEl) { renderPlayer(); return; }
  const a = S.active;
  if (a && !fresh) {
    if (a.g && a.g.phase !== 'paused') guidePause();
    if (!a.g && isGuided() && a.phase === 'work') guideStart(true);
  }
  const el = overlayEl('<div class="player" id="player"></div>');
  playerLayerEl = el;
  el.addEventListener('click', onPlayerClick);
  el.addEventListener('input', onPlayerInput);
  pushLayer(el, {
    onClose: () => {
      clearInterval(tickTimer); cancelAnimationFrame(rafId); tickTimer = 0; rafId = 0;
      playerLayerEl = null; doneSummary = null; keepAwake(false); hush();
      if (/^(today|train|routine)/.test(currentRoute || 'today')) rerender();
    },
    guard: () => { if (!S.active) return true; guidePause(); S.active.ending = true; save(); renderPlayer(); return false; },
  });
  renderPlayer();
  clearInterval(tickTimer);
  tickTimer = setInterval(tick, 200);
  const loop = () => { if (!playerLayerEl) return; guideStep(); rafId = requestAnimationFrame(loop); };
  rafId = requestAnimationFrame(loop);
  keepAwake(true);
}
function closePlayer() {
  const l = layers.find(x => x.el === playerLayerEl);
  if (l) l.guard = null;
  closeAll();
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && playerLayerEl && S.active) { keepAwake(true); tick(); } });

/* ---------- guided sets: get ready, count reps, rest, repeat ---------- */
function guideStart(paused = false, queue = false) {
  const a = S.active, it = a.items[a.i];
  const first = a.sets.length === 0 && a.i === 0 && a.set === 1;
  const newEx = a.set === 1 || (a.sets.length > 0 && a.sets[a.sets.length - 1].ex !== it.ex && !a.dropping);
  a.workEnd = 0; a.repsIn = null; a.secsIn = null;
  a.g = { phase: 'ready', t0: Date.now(), readyMs: newEx ? 6000 : 5000, said: 0 };
  if (paused) { a.g.prev = 'ready'; a.g.phase = 'paused'; a.g.pausedAt = a.g.t0; return; }
  say(a.dropping ? `Drop set. ${whatWords(it)}.` : first ? `Let's go. ${spoken(it.ex)}. ${whatWords(it)}.` : newEx ? `${pairStartOf(a, a.i) >= 0 && a.set > 1 ? '' : 'Next up: '}${spoken(it.ex)}. ${pairStartOf(a, a.i) >= 0 ? `Set ${a.set}. ` : ''}${whatWords(it)}.` : `Set ${a.set} of ${it.sets}. ${whatWords(it)}.`, !queue);
}
function guidePause() {
  const a = S.active, g = a && a.g;
  if (!g || g.phase === 'paused') return;
  g.prev = g.phase; g.pausedAt = Date.now();
  if (g.phase === 'hold') { g.remain = Math.max(0, a.workEnd - Date.now()); a.workEnd = 0; }
  g.phase = 'paused';
  hush(); save();
}
function guideResume() {
  const a = S.active, g = a && a.g;
  if (!g || g.phase !== 'paused') return;
  unlockSpeech();
  const d = Date.now() - g.pausedAt;
  g.phase = g.prev;
  if (g.phase === 'hold') { a.workEnd = Date.now() + g.remain; lastBeep = -1; } else g.t0 += d;
  save();
}
function guideDone() {
  const a = S.active, g = a.g, it = a.items[a.i];
  if (g && it.secs) {
    const ph = g.phase === 'paused' ? g.prev : g.phase;
    const remain = g.phase === 'paused' ? (g.remain ?? it.secs * 1000) : Math.max(0, a.workEnd - Date.now());
    a.secsIn = ph === 'hold' ? Math.round(it.secs - remain / 1000) : it.secs;
  } else if (!it.secs) a.repsIn = it.reps;
  hush();
  doneSet();
}
function setDemo(v) {
  const d = playerLayerEl && $('.demo.driven', playerLayerEl); if (!d) return;
  const f1 = d.querySelector('.f1'); if (f1) f1.style.opacity = v.toFixed(3);
  const tag = d.querySelector('.demo-tag');
  if (tag) { const t = v >= 0.5 ? 'Finish' : 'Start'; if (tag.textContent !== t) tag.textContent = t; }
}
function guideStep() {
  const a = S.active; if (!a || !a.g || a.ending || a.phase !== 'work') return;
  const g = a.g, it = a.items[a.i], now = Date.now();
  if (g.phase === 'ready') {
    const left = g.readyMs - (now - g.t0), s = Math.ceil(left / 1000);
    if (s >= 1 && s <= 3 && g.said !== -s) { g.said = -s; say(String(s)); }
    if (left <= 0) {
      if (it.secs) { g.phase = 'hold'; a.workEnd = now + it.secs * 1000; lastBeep = -1; say(`Go. Hold for ${it.secs} seconds.`); }
      else { g.phase = 'go'; g.t0 = now; g.said = 0; say('Go'); }
      save();
    }
    setDemo(0);
  } else if (g.phase === 'go') {
    const rm = repMs(), el = now - g.t0, reps = Math.floor(el / rm), p = (el % rm) / rm;
    setDemo(p < 0.5 ? smooth(p * 2) : smooth(2 - p * 2));
    if (reps > g.said) {
      g.said = reps;
      if (reps >= it.reps) { say(`${reps}. Nice work.`); a.repsIn = reps; doneSet(); return; }
      say(reps === it.reps - 1 && it.reps > 2 ? `${reps}. Last one.` : String(reps));
      save();
    }
  } else if (g.phase === 'hold') setDemo(1);
  updateGuideUI();
}
function updateGuideUI() {
  const a = S.active; if (!a || !a.g || !playerLayerEl) return;
  const big = $('#g-big', playerLayerEl); if (!big) return;
  const g = a.g, it = a.items[a.i], now = Date.now();
  const ph = g.phase === 'paused' ? g.prev : g.phase;
  const t = g.phase === 'paused' ? g.pausedAt : now;
  let b = '', u = '', pct = 0;
  if (ph === 'ready') { b = String(Math.max(1, Math.ceil((g.readyMs - (t - g.t0)) / 1000))); u = 'get ready'; }
  else if (ph === 'go') { const done = (t - g.t0) / repMs(); b = String(Math.min(it.reps, Math.floor(done))); u = `of ${it.reps} reps`; pct = done / it.reps; }
  else if (ph === 'hold') { const rem = g.phase === 'paused' ? (g.remain ?? 0) : Math.max(0, a.workEnd - now); b = clock(Math.ceil(rem / 1000)); u = 'hold'; pct = 1 - rem / (it.secs * 1000); }
  if (g.phase === 'paused') u = 'paused';
  if (big.textContent !== b) big.textContent = b;
  const un = $('#g-unit', playerLayerEl); if (un && un.textContent !== u) un.textContent = u;
  const bar = $('#g-bar', playerLayerEl); if (bar) bar.style.width = (clamp(pct, 0, 1) * 100).toFixed(1) + '%';
  const ctl = $('#g-ctl', playerLayerEl);
  if (ctl && gPhaseShown !== g.phase) {
    gPhaseShown = g.phase;
    ctl.innerHTML = g.phase === 'paused'
      ? `<button type="button" class="btn primary" data-p="g-resume">${I.play} Resume</button><button type="button" class="btn" data-p="done">${I.check} Done set</button>`
      : `<button type="button" class="btn" data-p="g-pause">${I.pause} Pause</button><button type="button" class="btn" data-p="done">${I.check} Finished</button>`;
  }
}
function sayNext(queue = true) {
  const a = S.active, it = a.items[a.i];
  const newEx = a.set === 1 || (a.sets.length > 0 && a.sets[a.sets.length - 1].ex !== it.ex);
  say(newEx ? `${a.set === 1 ? 'Next up: ' : ''}${spoken(it.ex)}. ${a.set > 1 ? `Set ${a.set}. ` : ''}${whatWords(it)}.` : `Set ${a.set} of ${it.sets}. ${whatWords(it)}.`, !queue);
}

/* ---------- rendering ---------- */
function stepperHTML(id, val, label) {
  return `<div class="stepper"><button type="button" data-p="dec" data-t="${id}" aria-label="Less ${label}">${I.minus}</button><input id="${id}" inputmode="decimal" value="${val == null ? '' : trimNum(val)}" placeholder="0" aria-label="${label}"><button type="button" data-p="inc" data-t="${id}" aria-label="More ${label}">${I.plus}</button></div>`;
}
function mediaHTML(id, driven) {
  const v = S.videos[id];
  if (v && navigator.onLine) return videoBox(v, exName(id), false);
  return demo(id, '', driven);
}
const voiceBtn = () => voice.ok ? `<button type="button" class="icon-btn" data-p="voice" aria-pressed="${S.settings.coach}" aria-label="Voice counting ${S.settings.coach ? 'on' : 'off'}">${S.settings.coach ? I.volOn : I.volOff}</button>` : '';
function renderPlayer() {
  const box = playerLayerEl && $('#player', playerLayerEl); if (!box) return;
  gPhaseShown = '';
  if (doneSummary) { box.innerHTML = doneHTML(doneSummary); return; }
  const a = S.active; if (!a) return;
  const total = a.items.reduce((s, x) => s + x.sets, 0);
  const top = `<header class="p-top"><button type="button" class="icon-btn" data-p="end" aria-label="End workout">${I.close}</button>
    <div class="p-prog"><span>Exercise ${Math.min(a.i + 1, a.items.length)} of ${a.items.length} · ${esc(a.name)}</span><div class="p-bar"><i style="width:${(a.sets.length / total * 100).toFixed(1)}%"></i></div></div>
    ${voiceBtn()}<span class="p-clock num" id="p-elapsed">${clock((Date.now() - a.start) / 1000)}</span></header>`;
  const guided = isGuided() && a.g && a.phase === 'work';
  box.innerHTML = top + (a.ending ? endingHTML(a, total) : a.phase === 'rest' ? restHTML(a) : guided ? guidedHTML(a) : workHTML(a));
  if (guided && !a.ending) updateGuideUI();
}
const pNav = a => `<div class="p-nav">
      <button type="button" class="btn ghost" data-p="prev" ${a.i === 0 && a.set === 1 ? 'disabled' : ''}>${I.chevL} Back</button>
      <button type="button" class="btn ghost" data-p="howto">How to</button>
      <button type="button" class="btn ghost" data-p="swap">Swap</button>
      <button type="button" class="btn ghost" data-p="skip">Skip ${I.chevR}</button>
    </div>`;
function guidedHTML(a) {
  const it = a.items[a.i], ex = EXMAP.get(it.ex);
  const timed = it.secs > 0, showW = !timed && !!ex && ex.e !== 'body only';
  return `<div class="p-media">${mediaHTML(it.ex, true)}${musclePip(it.ex)}</div>
  <div class="p-body">
    <h2 class="p-name">${esc(exName(it.ex))}</h2>
    ${feelLine(it.ex)}
    <p class="p-set">${esc(setLabel(a))}${timed ? '' : ` · ${repMs() / 1000} s per rep`}${it.rest && !a.dropping ? ` · ${it.rest} s rest after` : ''}</p>
    ${a.set === 1 ? lastTimeHTML(it) : ''}
    <div class="p-target" aria-live="polite"><span class="huge" id="g-big">–</span><span class="p-unit" id="g-unit"></span></div>
    <div class="g-bar" aria-hidden="true"><i id="g-bar"></i></div>
    ${showW ? `<label class="field"><span class="field-label">Weight (${wUnit()})</span>${stepperHTML('p-w', a.wIn, 'weight')}</label>` : ''}
    ${showW && isBarbell(it.ex) ? `<button type="button" class="link plates-link" data-p="plates">${I.dumbbell} Plates &amp; warm-up sets</button>` : ''}
    <div class="g-ctl" id="g-ctl"></div>
    ${pNav(a)}
  </div>`;
}
function workHTML(a) {
  const it = a.items[a.i], ex = EXMAP.get(it.ex);
  const timed = it.secs > 0, bodyOnly = !ex || ex.e === 'body only';
  const showReps = !timed, showW = !timed && !bodyOnly;
  const remaining = a.workEnd ? Math.max(0, Math.ceil((a.workEnd - Date.now()) / 1000)) : it.secs;
  return `<div class="p-media">${mediaHTML(it.ex, false)}${musclePip(it.ex)}</div>
  <div class="p-body">
    <h2 class="p-name">${esc(exName(it.ex))}</h2>
    ${feelLine(it.ex)}
    <p class="p-set">${esc(setLabel(a))}${it.rest && !a.dropping && pairStartOf(a, a.i) !== a.i ? ` · then ${it.rest} s rest` : ''}</p>
    ${a.set === 1 ? lastTimeHTML(it) : ''}
    ${timed ? `<div class="p-target"><span class="huge" id="p-count">${clock(remaining)}</span><span class="p-unit">${a.workEnd ? 'to go' : 'hold'}</span></div>`
      : `<div class="p-target"><span class="huge">${it.reps}</span><span class="p-unit">reps</span></div>`}
    ${showReps || showW ? `<div class="p-inputs ${showReps && showW ? '' : 'one'}">
      ${showReps ? `<label class="field"><span class="field-label">Reps done</span>${stepperHTML('p-reps', a.repsIn ?? it.reps, 'reps')}</label>` : ''}
      ${showW ? `<label class="field"><span class="field-label">Weight (${wUnit()})</span>${stepperHTML('p-w', a.wIn, 'weight')}</label>` : ''}
    </div>` : ''}
    ${showW && isBarbell(it.ex) ? `<button type="button" class="link plates-link" data-p="plates">${I.dumbbell} Plates &amp; warm-up sets</button>` : ''}
    ${timed && !a.workEnd
      ? `<button type="button" class="btn primary xl block" data-p="timer">${I.play} Start ${it.secs} s timer</button><button type="button" class="btn block" data-p="done">${I.check} Mark set done</button>`
      : `<button type="button" class="btn primary xl block" data-p="done">${I.check} Done set</button>`}
    ${pNav(a)}
  </div>`;
}
const REST_R = 112, REST_C = 2 * Math.PI * REST_R;
function restHTML(a) {
  const it = a.items[a.i];
  const left = (a.restEnd - Date.now()) / 1000;
  return `<div class="p-rest">
    <p class="eyebrow" style="margin:0">Rest</p>
    <div class="rest-ring">
      <svg class="ring" viewBox="0 0 240 240" aria-hidden="true"><circle cx="120" cy="120" r="${REST_R}" class="ring-track" stroke-width="14" fill="none"/>
        <circle id="p-rest-ring" cx="120" cy="120" r="${REST_R}" class="ring-fill" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="${REST_C.toFixed(2)}" stroke-dashoffset="${(REST_C * (1 - clamp(left / (a.restTotal || 1), 0, 1))).toFixed(2)}" transform="rotate(-90 120 120)" style="transition:stroke-dashoffset .25s linear"/></svg>
      <div class="ring-center"><span class="huge" id="p-rest" role="timer">${clock(Math.max(0, Math.ceil(left)))}</span></div>
    </div>
    <div class="rest-btns"><button type="button" class="btn" data-p="rest-sub">−15 s</button><button type="button" class="btn primary" data-p="rest-skip">Skip rest</button><button type="button" class="btn" data-p="rest-add">+15 s</button></div>
    ${rpeHTML(a)}
    <div class="up-next">${imgTag(it.ex, 0, 'thumb')}<div><span class="eyebrow">Up next</span><strong>${esc(exName(it.ex))}</strong><span>${esc(setLabel(a))} · ${it.secs ? `${it.secs} s` : `${it.reps} reps`}</span></div></div>
    ${isGuided() ? '<p class="hint">The next set starts by itself when the rest is over.</p>' : ''}
  </div>`;
}
function endingHTML(a, total) {
  return `<div class="panel p-end">
    <h2 class="section">End this workout?</h2>
    <p class="muted">You’ve done ${a.sets.length} of ${plural(total, 'set')}.</p>
    ${a.sets.length ? `<button type="button" class="btn primary block" data-p="end-save">${I.check} Save what I did</button>` : ''}
    <button type="button" class="btn block" data-p="end-resume">Keep going</button>
    <button type="button" class="btn ghost danger block" data-p="end-discard">Discard workout</button>
  </div>`;
}
function doneHTML(w) {
  const vol = w.sets.reduce((s, x) => s + (x.reps || 0) * (x.w || 0), 0);
  const byEx = [];
  for (const s of w.sets) { let g = byEx.find(x => x.ex === s.ex); if (!g) byEx.push(g = { ex: s.ex, sets: [] }); g.sets.push(s); }
  return `<div class="p-done">
    <div><p class="eyebrow">${esc(w.name)}</p><h2 class="h-display">Workout done</h2></div>
    <dl class="stats">
      <div><dt>Time</dt><dd>${clock((w.end - w.start) / 1000)}</dd></div>
      <div><dt>Sets</dt><dd>${w.sets.length}</dd></div>
      <div><dt>Exercises</dt><dd>${byEx.length}</dd></div>
      <div><dt>Volume</dt><dd>${vol ? `${n0(toW(vol))}<small style="font-size:16px"> ${wUnit()}</small>` : '–'}</dd></div>
    </dl>
    ${(() => { const pb = personalBests(w); return pb.length ? `<div class="notice ok">${I.bolt}<div><strong>New personal best${pb.length > 1 ? 's' : ''}</strong>${pb.map(x => `<p>${esc(x)}</p>`).join('')}</div></div>` : ''; })()}
    <ul class="sum-list">${byEx.map(g => `<li><strong>${esc(exName(g.ex))}</strong><span>${g.sets.map(fmtSet).join(', ')}</span></li>`).join('')}</ul>
    <button type="button" class="btn primary xl block" data-p="finish">Finish</button>
  </div>`;
}

/* ---------- player input ---------- */
function onPlayerInput(e) {
  const a = S.active; if (!a) return;
  if (e.target.id === 'p-reps') a.repsIn = parseNum(e.target.value);
  if (e.target.id === 'p-w') a.wIn = parseNum(e.target.value);
  save();
}
function onPlayerClick(e) {
  if (e.target.closest('[data-demo-toggle], [data-demo-swap]')) return;
  const b = e.target.closest('[data-p]'); if (!b) return;
  const a = S.active, p = b.dataset.p;
  if (p === 'finish') { closePlayer(); return; }
  if (p === 'voice') {
    S.settings.coach = !S.settings.coach; save();
    if (S.settings.coach) { unlockSpeech(); say('Voice on'); } else hush();
    b.outerHTML = voiceBtn();
    return;
  }
  if (!a) return;
  switch (p) {
    case 'end': guidePause(); a.ending = true; save(); renderPlayer(); break;
    case 'end-resume': a.ending = false; guideResume(); save(); renderPlayer(); break;
    case 'end-save': a.ending = false; finishWorkout(); break;
    case 'end-discard': S.active = null; save(); closePlayer(); toast('Workout discarded'); break;
    case 'done': if (isGuided() && a.g) guideDone(); else doneSet(); break;
    case 'g-pause': guidePause(); updateGuideUI(); break;
    case 'g-resume': guideResume(); updateGuideUI(); break;
    case 'timer': audio(); unlockSpeech(); a.workEnd = Date.now() + a.items[a.i].secs * 1000; lastBeep = -1; say(`Hold for ${a.items[a.i].secs} seconds. Go.`); save(); renderPlayer(); break;
    case 'inc': case 'dec': {
      const input = $('#' + b.dataset.t, playerLayerEl);
      const isW = b.dataset.t === 'p-w', step = isW ? wStep() : 1;
      const v = Math.max(0, (parseNum(input.value) || 0) + (p === 'inc' ? step : -step));
      input.value = trimNum(v);
      if (isW) a.wIn = v; else a.repsIn = v;
      save(); break;
    }
    case 'rest-add': a.restEnd += 15000; a.restTotal += 15; save(); tick(); break;
    case 'rest-sub': a.restEnd -= 15000; save(); tick(); break;
    case 'rest-skip': a.phase = 'work'; unlockSpeech(); if (isGuided()) guideStart(); else sayNext(false); save(); renderPlayer(); break;
    case 'skip': a.dropping = false; skipExercise(); break;
    case 'rpe': {
      const last = a.sets[a.sets.length - 1]; if (!last) break;
      const v = Number(b.dataset.v); last.rpe = last.rpe === v ? undefined : v; save();
      $$('[data-p="rpe"]', playerLayerEl).forEach(x => { const on = Number(x.dataset.v) === last.rpe; x.classList.toggle('on', on); x.setAttribute('aria-pressed', String(on)); });
      break;
    }
    case 'plates': {
      if (a.g) { guidePause(); updateGuideUI(); }
      openPlates(a.wIn || startWeight(a.items[a.i].ex), w => { const A = S.active; if (!A) return; A.wIn = w; save(); renderPlayer(); });
      break;
    }
    case 'prev': prevSet(); break;
    case 'howto': if (a.g) { guidePause(); updateGuideUI(); } openHowTo(a.items[a.i].ex); break;
    case 'swap': {
      if (a.g) { guidePause(); updateGuideUI(); }
      openSwap(a.items[a.i].ex, id => {
        const A = S.active; if (!A) return;
        A.items[A.i].ex = id; A.repsIn = null; A.workEnd = 0; A.wIn = startWeight(id, A.items[A.i]);
        if (isGuided() && A.phase === 'work') guideStart();
        save(); renderPlayer(); toast(`Swapped to ${exName(id)}`);
      });
      break;
    }
  }
}
function doneSet() {
  const a = S.active, it = a.items[a.i];
  const timed = it.secs > 0;
  const secs = timed ? (a.secsIn != null ? a.secsIn : a.workEnd ? Math.round(it.secs - Math.max(0, (a.workEnd - Date.now()) / 1000)) : it.secs) : 0;
  const reps = timed ? 0 : Math.max(0, Math.round(a.repsIn ?? it.reps));
  const wKg = !timed && a.wIn > 0 ? Math.round(fromW(a.wIn) * 100) / 100 : 0;
  const rec = { ex: it.ex, set: a.set, reps, w: wKg, secs: Math.max(0, secs), t: Date.now() };
  if (a.dropping) rec.drop = true;
  a.sets.push(rec);
  if (wKg && !a.dropping) S.lastWeights[it.ex] = wKg;
  a.workEnd = 0; a.repsIn = null; a.secsIn = null; a.g = null;
  if (it.drop && !a.dropping && !timed && wKg > 0 && a.set >= it.sets && pairStartOf(a, a.i) < 0) {   // drop set straight after the last set
    a.dropping = true; a.wIn = Math.max(0, roundW(toW(wKg) * 0.75)); a.phase = 'work';
    say('Drop set. Take about a quarter of the weight off and go again.', false); buzz(30);
    if (isGuided()) guideStart(false, true);
    save(); renderPlayer(); return;
  }
  a.dropping = false;
  a.wByI = a.wByI || {}; a.wByI[a.i] = a.wIn;
  const nx = nextPos(a);
  if (!nx) { finishWorkout(); return; }
  if (nx.i !== a.i) a.wIn = a.wByI[nx.i] ?? startWeight(a.items[nx.i].ex, a.items[nx.i]);
  a.i = nx.i; a.set = nx.set;
  if (nx.rest > 0) {
    a.phase = 'rest'; a.restTotal = nx.rest; a.restEnd = Date.now() + nx.rest * 1000; lastBeep = -1;
    say(`Rest. ${restWords(nx.rest)}.`, false);
  } else {
    a.phase = 'work';
    if (isGuided()) guideStart(false, true); else sayNext(true);
  }
  buzz(30); save(); renderPlayer();
  const sc = $('.overlay', playerLayerEl); if (sc) sc.scrollTop = 0;
}
function skipExercise() {
  const a = S.active;
  a.workEnd = 0; a.repsIn = null; a.secsIn = null; a.phase = 'work'; a.g = null;
  if (a.i >= a.items.length - 1) { if (a.sets.length) finishWorkout(); else { a.ending = true; renderPlayer(); } return; }
  a.i++; a.set = 1; a.wIn = startWeight(a.items[a.i].ex);
  if (isGuided()) guideStart(); else sayNext(false);
  save(); renderPlayer();
}
function prevSet() {
  const a = S.active;
  a.workEnd = 0; a.repsIn = null; a.secsIn = null; a.phase = 'work'; a.g = null;
  if (a.set > 1) a.set--; else if (a.i > 0) { a.i--; a.set = a.items[a.i].sets; a.wIn = startWeight(a.items[a.i].ex); }
  if (isGuided()) guideStart(); else sayNext(false);
  save(); renderPlayer();
}
function finishWorkout() {
  const a = S.active;
  const w = { id: uid(), rid: a.rid, name: a.name, start: a.start, end: Date.now(), sets: a.sets };
  S.workouts.unshift(w);
  S.active = null;
  save();
  doneSummary = w;
  beep(880, 0.15); setTimeout(() => beep(1175, 0.25), 180);
  buzz([100, 60, 100]);
  say('Workout complete. Great job!', false);
  renderPlayer();
  const sc = $('.overlay', playerLayerEl); if (sc) sc.scrollTop = 0;
}
function tick() {
  const a = S.active; if (!a || !playerLayerEl) return;
  const el = $('#p-elapsed', playerLayerEl); if (el) el.textContent = clock((Date.now() - a.start) / 1000);
  if (a.ending) return;
  if (a.phase === 'rest') {
    const left = (a.restEnd - Date.now()) / 1000, s = Math.ceil(left);
    const t = $('#p-rest', playerLayerEl); if (t) t.textContent = clock(Math.max(0, s));
    const ring = $('#p-rest-ring', playerLayerEl); if (ring) ring.style.strokeDashoffset = (REST_C * (1 - clamp(left / (a.restTotal || 1), 0, 1))).toFixed(2);
    if (s === 10 && a.restTotal >= 20 && voiceMark !== 'r' + a.restEnd) { voiceMark = 'r' + a.restEnd; say('10 seconds'); }
    if (s <= 3 && s > 0 && s !== lastBeep) { lastBeep = s; if (coachOn()) say(String(s)); else beep(660, 0.1); }
    if (left <= 0) {
      lastBeep = -1; beep(990, 0.3); buzz([200, 80, 200]);
      a.phase = 'work';
      if (isGuided()) guideStart(); else sayNext(false);
      save(); renderPlayer();
    }
  } else if (a.workEnd) {
    const it = a.items[a.i];
    const left = (a.workEnd - Date.now()) / 1000, s = Math.ceil(left);
    const c = $('#p-count', playerLayerEl); if (c) c.textContent = clock(Math.max(0, s));
    if (s === 10 && it.secs >= 20 && voiceMark !== 'h' + a.workEnd) { voiceMark = 'h' + a.workEnd; say('10 seconds left'); }
    if (s <= 3 && s > 0 && s !== lastBeep) { lastBeep = s; if (coachOn()) say(String(s)); else beep(660, 0.1); }
    if (left <= 0) { lastBeep = -1; beep(990, 0.35); buzz([200, 80, 200]); say('Done'); doneSet(); }
  }
}
function openHowTo(id) {
  const e = EXMAP.get(id);
  const v = S.videos[id];
  const el = sheetEl(`${sheetHead(exName(id), e ? `${e.m.join(', ')} · ${e.e}` : '')}
    ${v && navigator.onLine ? videoBox(v, exName(id), true) : demo(id)}
    ${e ? `<ol class="steps">${e.t.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
    <div class="sheet-end"></div>`);
  pushLayer(el);
}

/* ============================== ME ============================== */
function viewMe() {
  const st = S.settings, P = st.profile || {};
  const pref = (label, key, opts) => `<div class="pref"><span class="pref-label">${label}</span><div class="seg">${opts.map(([v, l]) => `<button type="button" class="${String(st[key]) === String(v) ? 'on' : ''}" data-act="pref" data-k="${key}" data-v="${v}">${l}</button>`).join('')}</div></div>`;
  const hist = S.workouts.slice(0, 60).map(w => {
    const byEx = [];
    for (const s of w.sets) { let g = byEx.find(x => x.ex === s.ex); if (!g) byEx.push(g = { ex: s.ex, sets: [] }); g.sets.push(s); }
    return `<details class="hist"><summary><div><strong>${esc(w.name)}</strong><span>${esc(new Date(w.start).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }))} · ${clock((w.end - w.start) / 1000)} · ${plural(w.sets.length, 'set')}</span></div>${I.chevR}</summary>
      <ul>${byEx.map(g => `<li>${esc(exName(g.ex))}<span>${g.sets.map(fmtSet).join(', ')}</span></li>`).join('')}</ul>
      <button type="button" class="btn sm ghost danger" data-act="hist-del" data-id="${esc(w.id)}" style="margin-bottom:10px">${I.trash} Delete</button></details>`;
  }).join('');
  return `
  <header class="top"><div><p class="eyebrow date">Goals, settings and history</p><h1 class="h-display">Me</h1></div></header>
  <div class="cols"><div class="col-a">
  <section class="panel tight" id="you" aria-label="You">
    ${secHead(I.user, 'accent', 'You')}
    <div class="pref"><span class="pref-label">Sex</span><div class="seg"><button type="button" class="${P.sex === 'm' ? 'on' : ''}" data-act="set-sex" data-v="m">Male</button><button type="button" class="${P.sex === 'f' ? 'on' : ''}" data-act="set-sex" data-v="f">Female</button></div></div>
    <p class="hint" id="you-hint">${P.sex ? 'Your calorie (BMR and TDEE) and body-fat estimates, the safe minimum goal, the coach and the muscle figures all follow this.' : 'Pick one so your calorie and body-fat estimates and the muscle figures match you.'}</p>
  </section>
  <section class="panel" id="goals" aria-label="Daily goals">
    ${secHead(I.target, 'kcal', 'Daily goals')}
    <form class="form" data-form="goals">
      <label class="field gfield g-k"><span>Energy (${eUnit()} per day)</span><input class="input num" id="g-kcal" inputmode="numeric" value="${Math.round(toE(st.kcal))}"></label>
      <p class="hint tdee-line" id="g-tdee">${esc(goalVsTdee(st.kcal)) || 'Not sure what to aim for? Open the TDEE &amp; goal calculator below.'}</p>
      <div class="field"><span>Macro split</span><div class="seg wrap4" id="g-style">${MACRO_STYLES.map(([v, l]) => `<button type="button" class="${st.macroStyle === v ? 'on' : ''}" data-act="macro-style" data-v="${v}">${l}</button>`).join('')}</div>
        <p class="hint" id="g-style-hint">${esc(MACRO_STYLES.find(m => m[0] === st.macroStyle)?.[2] || 'Tap one to fill in protein, carbs and fat for your energy goal, then save.')}</p></div>
      <div class="grid3 gtiles">
        <label class="field gfield g-p"><span>Protein g</span><input class="input num" id="g-p" inputmode="numeric" value="${st.protein}"></label>
        <label class="field gfield g-c"><span>Carbs g</span><input class="input num" id="g-c" inputmode="numeric" value="${st.carbs}"></label>
        <label class="field gfield g-f"><span>Fat g</span><input class="input num" id="g-f" inputmode="numeric" value="${st.fat}"></label>
      </div>
      <p class="hint" id="g-check"></p>
      <button class="btn primary">Save goals</button>
      <a class="btn" href="#/plan">${I.utensils} Meal ideas for this goal</a>
    </form>
    <details class="calc" ${st.goalsSet ? '' : 'open'}>
      <summary>TDEE &amp; goal calculator</summary>
      <form class="form" data-form="calc" style="margin-top:12px">
        <p class="hint">Works out your BMR (resting burn), your TDEE (the calories you burn in a normal day) and a daily target for your goal.</p>
        <div class="field"><span>Sex</span><div class="seg"><button type="button" class="${P.sex === 'f' ? 'on' : ''}" data-act="calc-sex" data-v="f">Female</button><button type="button" class="${P.sex === 'm' ? 'on' : ''}" data-act="calc-sex" data-v="m">Male</button></div></div>
        <div class="grid3">
          <label class="field"><span>Age</span><input class="input" id="c-age" inputmode="numeric" value="${P.age || ''}"></label>
          <label class="field"><span>Height cm</span><input class="input" id="c-ht" inputmode="numeric" value="${P.height || ''}"></label>
          <label class="field"><span>Weight ${wUnit()}</span><input class="input" id="c-wt" inputmode="decimal" value="${P.weightKg ? trimNum(roundW10(toW(P.weightKg))) : ''}"></label>
        </div>
        <label class="field"><span>How active are you?</span><select class="input" id="c-act">
          ${ACTIVITY.map(([v, l]) => `<option value="${v}" ${Number(P.act || 1.55) === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></label>
        <label class="field"><span>Goal</span><select class="input" id="c-goal">
          ${GOAL_ADJ.map(([v, l]) => `<option value="${v}" ${Number(P.goal ?? 0) === v ? 'selected' : ''}>${l}</option>`).join('')}
        </select></label>
        <p class="error" id="calc-err" hidden></p>
        <button class="btn">Calculate</button>
        <div id="calc-out"></div>
      </form>
    </details>
  </section>
  <section class="panel tight" aria-label="Food needs" id="diet">
    ${secHead(I.leaf, 'protein', 'Food needs')}
    <p class="muted" style="font-size:15px">${dietActive() ? esc(dietSummary()) : 'No allergies or food rules set. Meal ideas use everything.'}</p>
    <button type="button" class="btn block" data-act="diet">${I.utensils} ${dietActive() ? 'Change food needs' : 'Allergies & foods you avoid'}</button>
  </section>
  <section class="panel tight" aria-label="Progress">
    ${secHead(I.chart, 'weight', 'Progress')}
    <div class="nav-rows">
      <a class="nav-row" href="#/progress"><span>Weight &amp; goal</span><span class="muted num">${(() => { const tr = weightTrend(); return tr ? `${wN(roundW10(toW(tr.trend)))} ${wUnit()}` : ''; })()}</span>${I.chevR}</a>
      <a class="nav-row" href="#/summary"><span>Weekly summary</span><span class="muted num">${plural(logStreak(), 'day')} streak</span>${I.chevR}</a>
      ${S.workouts.length ? `<a class="nav-row" href="#/strength"><span>Strength</span><span class="muted num">${plural(S.workouts.length, 'workout')}</span>${I.chevR}</a>` : ''}
    </div>
  </section>
  </div><div class="col-b">
  ${aiPanel()}
  <section class="panel" aria-label="Workout coach" id="coach">
    ${secHead(I.volOn, 'workout', 'Workout coach')}
    ${pref('Workout style', 'guided', [[true, lbl('Coach counts reps', 'Coach counts')], [false, lbl('I tap when done', 'I tap')]])}
    ${pref('Rep speed', 'tempo', [['slow', 'Slow · 4 s'], ['normal', 'Normal · 3 s'], ['fast', 'Fast · 2 s']])}
    ${voice.ok ? `${pref('Voice counting', 'coach', [[true, 'On'], [false, 'Off']])}
      ${voiceSelect()}
      <button type="button" class="btn" data-act="voice-test">${I.volOn} Test the voice</button>
      <div id="voice-help" aria-live="polite"></div>`
      : '<p class="hint">This browser can’t speak, so the coach uses beeps instead.</p>'}
    ${pref('Beeps', 'sound', [[true, 'On'], [false, 'Off']])}
    <p class="hint">With the coach on, workouts run hands-free: a 3-2-1 countdown, the picture moves with each rep while the coach counts, then it announces your rest and starts the next set by itself.</p>
  </section>
  <section class="panel" aria-label="Preferences">
    ${secHead(I.sliders, 'grey', 'Preferences')}
    ${pref('Energy unit', 'energy', [['kcal', 'Calories (kcal)'], ['kJ', 'Kilojoules (kJ)']])}
    ${pref('Weight unit', 'weight', [['kg', 'kg'], ['lb', 'lb']])}
    ${pref('Daily water goal', 'waterGoal', [[6, '1.5 L'], [8, '2 L'], [10, '2.5 L'], [12, '3 L']])}
    ${pref('Default rest between sets', 'rest', [[30, '30 s'], [60, '60 s'], [90, '90 s'], [120, '2 min']])}
    ${pref('Appearance', 'theme', [['dark', 'Dark'], ['light', 'Light'], ['system', 'Auto']])}
    <label class="pref"><span class="pref-label">Food search shows products sold in</span>
      <select class="input" id="pref-region">${REGIONS.map(([v, l]) => `<option value="${v}" ${st.region === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
  </section>
  <section class="panel tight" id="history" aria-label="Workout history">
    ${secHead(I.clock, 'workout', 'Workout history')}
    ${hist || '<p class="muted">Finished workouts show up here.</p>'}
  </section>
  <section class="panel tight" aria-label="Your data">
    ${secHead(I.shield, 'accent', 'Your data')}
    <p class="muted" style="font-size:14px">Everything stays on this phone. Only barcode numbers and food searches go to Open Food Facts. Save a backup now and then, and restore it if you change phones.</p>
    <button type="button" class="btn block" data-act="export">${I.download} ${lbl('Export &amp; calendar reminders', 'Export &amp; reminders')}</button>
    <div class="row-btns"><button type="button" class="btn" data-act="backup">${I.download} ${lbl('Save backup', 'Backup')}</button><button type="button" class="btn" data-act="restore">${I.upload} Restore</button></div>
    <input type="file" id="restore-file" accept="application/json,.json" hidden>
    <div id="restore-confirm"></div>
    <button type="button" class="btn ghost danger" data-act="erase">${I.trash} Erase everything</button>
  </section>
  ${!isStandalone() ? `<section class="panel tight">${secHead(I.phone, 'accent', 'Install')}<p class="muted" style="font-size:14px">${esc(installHowTo())}</p>${installPrompt ? '<button type="button" class="btn primary" data-act="install">Install RepPlate</button>' : ''}</section>` : ''}
  </div></div>
  <div class="credits">
    <p>Exercise pictures and instructions: free-exercise-db (public domain).</p>
    <p>Food data: <a href="https://world.openfoodfacts.org/" target="_blank" rel="noopener">Open Food Facts</a> contributors, Open Database Licence.</p>
    <p>Muscle figure: <a href="https://github.com/GV79/react-body-highlighter" target="_blank" rel="noopener">react-body-highlighter</a> by GV79, MIT licence.</p>
    <p>3D exercise animations: <a href="https://oss.exercisedb.dev/" target="_blank" rel="noopener">ExerciseDB</a> by AscendAPI (free version, personal non-commercial use).</p>
    <p>RepPlate gives general fitness information, not medical advice.</p>
  </div>`;
}
function voiceSelect() {
  const base = (navigator.language || 'en').slice(0, 2).toLowerCase();
  let list = voice.list.filter(v => v.lang.toLowerCase().startsWith(base));
  if (!list.length) list = voice.list.filter(v => /^en/i.test(v.lang));
  if (!list.length) return '';
  return `<label class="pref"><span class="pref-label">Voice</span><select class="input" id="pref-voice"><option value="">Automatic${voice.v && !S.settings.voiceURI ? ` (${esc(voice.v.name)})` : ''}</option>${list.map(v => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === S.settings.voiceURI ? 'selected' : ''}>${esc(v.name)} · ${esc(v.lang)}</option>`).join('')}</select></label>`;
}
function updateGoalCheck() {
  const out = $('#g-check'); if (!out) return;
  const p = parseNum($('#g-p').value) || 0, c = parseNum($('#g-c').value) || 0, f = parseNum($('#g-f').value) || 0;
  const kcal = p * 4 + c * 4 + f * 9;
  const goal = fromE(parseNum($('#g-kcal').value) || 0);
  out.textContent = `Protein, carbs and fat add up to ${n0(toE(kcal))} ${eUnit()}${goal ? ` (${Math.round(kcal / goal * 100)}% of your energy goal)` : ''}.`;
  const tl = $('#g-tdee'), line = goalVsTdee(goal); if (tl && line) tl.textContent = line;
}
/* ---------- energy needs: BMR, TDEE (maintenance) and the daily target, each explained ---------- */
const ACTIVITY = [[1.2, 'Mostly sitting, little exercise'], [1.375, 'Light exercise 1–3 days a week'], [1.55, 'Moderate exercise 3–5 days a week'], [1.725, 'Hard exercise 6–7 days a week'], [1.9, 'Very physical job plus training']];
const GOAL_ADJ = [[-500, 'Lose about 0.5 kg a week'], [-250, 'Lose slowly (about 0.25 kg a week)'], [0, 'Stay the same'], [250, 'Gain slowly (building muscle)']];
const ENERGY_WORDS = {
  bmr: 'Calories your body burns at complete rest: breathing, heartbeat, staying warm.',
  tdee: 'Total Daily Energy Expenditure: all you burn in a normal day. Eat this much and your weight stays the same.',
  target: 'What to eat each day to reach your goal.',
};
const bmrOf = (sex, kg, cm, age) => 10 * kg + 6.25 * cm - 5 * age + (sex === 'm' ? 5 : -161);   // Mifflin–St Jeor
function energyNeeds(P = S.settings.profile || {}) {
  const ws = weights(), kg = (ws.length ? ws[ws.length - 1].kg : 0) || P.weightKg;
  if (!P.sex || !(P.age > 0) || !(P.height > 0) || !(kg > 0)) return null;
  const act = Number(P.act) || 0;
  const bmr = Math.round(bmrOf(P.sex, kg, P.height, P.age) / 10) * 10;      // to the nearest 10, so the sums add up on screen
  return { bmr, act, tdee: act ? Math.round(bmr * act / 10) * 10 : 0, kg, actLabel: (ACTIVITY.find(a => a[0] === act) || [])[1] || '' };
}
// "Maintenance 2,760 kcal · this goal is 500 below → about 0.45 kg a week"
function goalVsTdee(goalKcal) {
  const n = energyNeeds(); if (!n || !n.tdee || !(goalKcal > 0)) return '';
  const d = goalKcal - n.tdee, wk = Math.abs(d) * 7 / 7700;
  const pace = Math.abs(d) < 60 ? 'about the same as maintenance, so your weight should stay steady'
    : `${fmtE(Math.abs(d))} ${eUnit()} ${d < 0 ? 'below' : 'above'} maintenance, about ${trimNum(Math.round(wk * 20) / 20)} kg a week ${d < 0 ? 'lost' : 'gained'}`;
  return `Your TDEE (maintenance) is about ${fmtE(n.tdee)} ${eUnit()} a day and your BMR (resting burn) about ${fmtE(n.bmr)} ${eUnit()}. This goal is ${pace}.`;
}
let calcSex = null;
// one place for sex: Me > You and the calculator both set it, and everything that depends on it follows
function setSex(v, redraw) {
  S.settings.profile = { ...(S.settings.profile || {}), sex: v }; calcSex = null; save();
  if (redraw) { rerender(); toast(v === 'f' ? 'Set to female' : 'Set to male'); return; }
  $$('[data-act="calc-sex"], [data-act="set-sex"]').forEach(x => x.classList.toggle('on', x.dataset.v === v));
}
function runCalc() {
  const err = $('#calc-err'), out = $('#calc-out');
  const sex = calcSex || S.settings.profile?.sex;
  const age = parseNum($('#c-age').value), ht = parseNum($('#c-ht').value), wt = parseNum($('#c-wt').value);
  const act = Number($('#c-act').value), goal = Number($('#c-goal').value);
  if (!sex || !(age >= 14 && age <= 100) || !(ht >= 120 && ht <= 230) || !(wt > 30)) {
    err.textContent = 'Fill in sex, age (14–100), height in cm and weight.'; err.hidden = false; out.innerHTML = ''; return;
  }
  err.hidden = true;
  const kg = fromW(wt);
  const bmr = Math.round(bmrOf(sex, kg, ht, age) / 10) * 10;
  const tdee = Math.round(bmr * act / 10) * 10;
  const floor = sex === 'm' ? 1500 : 1200;
  let target = Math.round((tdee + goal) / 10) * 10;
  const floored = target < floor; if (floored) target = floor;
  const protein = Math.round(kg * (goal < 0 ? 1.8 : 1.6) / 5) * 5;
  const fat = Math.round(target * 0.27 / 9 / 5) * 5;
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4 / 5) * 5);
  S.settings.profile = { sex, age, height: ht, weightKg: kg, act, goal };
  save();
  const u = eUnit(), row = (cls, name, what, val) => `<div class="tdee-row ${cls}"><div><b>${name}</b><p>${what}</p></div><strong class="num">${val}</strong></div>`;
  out.innerHTML = `<div class="calc-out">
    <div class="tdee-steps">
      ${row('', 'BMR', esc(ENERGY_WORDS.bmr), `${fmtE(bmr)} ${u}`)}
      ${row('mult', `× ${act} activity`, esc((ACTIVITY.find(a => a[0] === act) || [])[1] || ''), '')}
      ${row('total', 'TDEE · maintenance', esc(ENERGY_WORDS.tdee), `${fmtE(tdee)} ${u}`)}
      ${row('adj', 'Goal', esc((GOAL_ADJ.find(g => g[0] === goal) || [])[1] || ''), goal ? `${goal < 0 ? '−' : '+'}${fmtE(Math.abs(goal))} ${u}` : '±0')}
      ${row('target', 'Daily target', esc(ENERGY_WORDS.target), `${fmtE(target)} ${u}`)}
    </div>
    ${floored ? `<span class="hint">Raised to ${fmtE(floor)} ${u}, a common minimum for eating enough without medical supervision.</span>` : ''}
    <div class="tdee-macros"><span class="m-p"><i class="dot"></i><b>${protein} g</b> protein</span><span class="m-c"><i class="dot"></i><b>${carbs} g</b> carbs</span><span class="m-f"><i class="dot"></i><b>${fat} g</b> fat</span></div>
    <p class="hint">Protein: ${goal < 0 ? '1.8' : '1.6'} g per kg of body weight${goal < 0 ? ' (helps keep muscle)' : ''}. Fat: about 27% of calories. Carbs: the rest. After 2 weeks of logging, Progress > Smart goal shows your real TDEE.</p>
    <button type="button" class="btn primary" data-act="calc-use" data-k="${target}" data-p="${protein}" data-c="${carbs}" data-f="${fat}">Use these goals</button>
    <a class="link" href="#/plan">See meal ideas for ${fmtE(target)} ${eUnit()}</a>
  </div>`;
}

/* ============================== global actions ============================== */
function foodCtx() { return { date: /^food/.test(currentRoute) ? foodDate : dkey(), meal: mealNow() }; }
let eraseArmed = 0;
const ACTIONS = {
  scan: () => openScanner(foodCtx()),
  add: el => openAddSheet({ date: el.dataset.today ? dkey() : (/^food/.test(currentRoute) ? foodDate : dkey()), meal: el.dataset.meal || mealNow() }),
  day: el => { foodDate = addDays(foodDate, Number(el.dataset.d)); rerender(); },
  'day-today': () => { foodDate = dkey(); rerender(); },
  entry: el => openEntry(el.dataset.id),
  start: el => startWorkout(el.dataset.id),
  resume: () => openPlayer(),
  back: el => goBack(el.dataset.fallback),
  install: async () => { if (!installPrompt) return; installPrompt.prompt(); try { await installPrompt.userChoice; } catch (e) { /* ignore */ } installPrompt = null; rerender(); },
  'dismiss-install': () => { S.settings.installDismissed = true; save(); rerender(); },
  'lib-more': () => { lib.limit += 40; renderLibResults(); },
  'lib-pick': el => {
    if (!draft) return;
    const id = el.dataset.id, ex = EXMAP.get(id);
    const i = draft.items.findIndex(x => x.ex === id);
    if (i >= 0 && /^exercises/.test(currentRoute)) draft.items.splice(i, 1);
    else if (i < 0) {
      const timed = ex && (ex.c === 'stretching' || /plank|hold|bridge|wall sit/i.test(ex.n));
      draft.items.push({ ex: id, sets: 3, reps: timed ? 0 : 10, secs: timed ? 30 : 0, rest: S.settings.rest });
    }
    if (/^exercises/.test(currentRoute)) { renderLibResults(); const b = $('.pick-banner span'); if (b) b.innerHTML = `Adding to <strong>${esc(draft.name || 'your new routine')}</strong> · ${plural(draft.items.length, 'exercise')}`; }
    else rerender();
  },
  'pick-done': () => { pickMode = false; navUpTo('#/edit/' + (draft.isNew ? 'new' : encodeURIComponent(draft.id))); },
  'ex-add': el => openAddToRoutine(el.dataset.id),
  'ed-cancel': () => { const d = draft; draft = null; navUpTo(d && !d.isNew ? '#/routine/' + encodeURIComponent(d.id) : '#/train'); },
  'ed-add': () => { pickMode = true; lib.q = ''; lib.muscle = ''; lib.equip = ''; lib.limit = 40; location.hash = '#/exercises'; },
  'ed-step': el => {
    const it = draft.items[Number(el.dataset.i)], f = el.dataset.f, d = Number(el.dataset.d);
    if (f === 'sets') it.sets = clamp(it.sets + d, 1, 10);
    if (f === 'reps') it.reps = clamp(it.reps + d, 1, 100);
    if (f === 'secs') it.secs = clamp(it.secs + d * (it.secs >= 60 ? 15 : 5), 5, 600);
    rerender();
  },
  'ed-mode': el => {
    const it = draft.items[Number(el.dataset.i)];
    if (el.dataset.v === 'secs' && !it.secs) { it.secs = 30; it.reps = 0; }
    if (el.dataset.v === 'reps' && it.secs) { it.reps = 10; it.secs = 0; }
    rerender();
  },
  'ed-move': el => { const i = Number(el.dataset.i), j = i + Number(el.dataset.d); if (j < 0 || j >= draft.items.length) return; [draft.items[i], draft.items[j]] = [draft.items[j], draft.items[i]]; rerender(); },
  'ed-remove': el => { const i = Number(el.dataset.i); draft.items.splice(i, 1); if (draft.items[i - 1]?.ss && !draft.items[i]) draft.items[i - 1].ss = false; rerender(); },
  'ed-drop': el => { const it = draft?.items[Number(el.dataset.i)]; if (!it) return; it.drop = !it.drop; rerender(); },
  'ed-ss': el => {
    const i = Number(el.dataset.i), it = draft?.items[i]; if (!it || !draft.items[i + 1]) return;
    it.ss = !it.ss;
    if (it.ss) { if (draft.items[i + 1]) draft.items[i + 1].ss = false; if (draft.items[i - 1]) draft.items[i - 1].ss = false; it.drop = false; draft.items[i + 1].drop = false; }
    rerender();
  },
  hiit: () => openHiit(),
  plates: () => openPlates(0),
  'prog-start': el => {
    const p = programOf(el.dataset.id); if (!p) return;
    if (S.program && !el.dataset.sure) { el.dataset.sure = '1'; el.textContent = 'Tap again to switch programs'; return; }
    startProgram(p.id); navUpTo('#/train'); toast(`${p.name} started. Your week is set.`);
  },
  'prog-end': el => {
    if (!el.dataset.sure) { el.dataset.sure = '1'; el.textContent = 'Tap again to end'; return; }
    const p = programOf(S.program?.id), ids = new Set((p?.routines || []).map(r => progRid(p, r.key))), sc = schedule();
    for (const k of Object.keys(sc)) if (ids.has(sc[k])) delete sc[k];
    S.program = null; save(); rerender(); toast('Program ended. Your routines are still in Train.');
  },
  'ed-save': () => {
    const err = $('#ed-err');
    draft.name = $('#ed-name').value.trim(); draft.note = $('#ed-note').value.trim();
    if (!draft.name) { err.textContent = 'Give the routine a name.'; err.hidden = false; $('#ed-name').focus(); return; }
    if (!draft.items.length) { err.textContent = 'Add at least one exercise.'; err.hidden = false; return; }
    const r = { id: draft.id, name: draft.name, note: draft.note, starter: draft.starter || false, items: draft.items };
    const i = S.routines.findIndex(x => x.id === r.id);
    if (i >= 0) S.routines[i] = r; else S.routines.push(r);
    save(); draft = null;
    navUpTo('#/routine/' + encodeURIComponent(r.id));
    toast('Routine saved');
  },
  'ed-delete': el => {
    if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Tap again to delete this routine'; setTimeout(() => { if (el.isConnected) { delete el.dataset.armed; el.innerHTML = `${I.trash} Delete routine`; } }, 3500); return; }
    const id = draft.id; S.routines = S.routines.filter(x => x.id !== id); draft = null; save();
    navUpTo('#/train'); toast('Routine deleted');
  },
  pref: el => {
    const k = el.dataset.k; let v = el.dataset.v;
    if (k === 'sound' || k === 'guided' || k === 'coach') v = v === 'true';
    if (k === 'rest' || k === 'rate' || k === 'waterGoal') v = Number(v);
    S.settings[k] = v;
    if (k === 'theme') applyTheme();
    if (k === 'coach' && v) speakNow('Voice counting is on', { onResult: (ok, why) => { if (!ok) setTimeout(() => voiceHelp(why), 50); } });
    if (k === 'coach' && !v) hush();
    save(); rerender();
  },
  snap: () => openSnap(foodCtx()),
  'eat-now': () => openEatNow(foodCtx()),
  quick: () => openQuick(),
  weight: () => openWeight(),
  'weight-del': el => { setWeight(el.dataset.d, 0); rerender(); toast('Weigh-in deleted'); },
  'smart-apply': el => {
    const v = Number(el.dataset.v), diff = v - S.settings.kcal;
    S.settings.carbs = Math.max(50, Math.round((S.settings.carbs + diff / 4) / 5) * 5); S.settings.kcal = v; S.settings.goalsSet = true;
    save(); rerender(); toast(`Goal updated to ${fmtE(v)} ${eUnit()}`);
  },
  water: el => { const k = dkey(); S.water[k] = Math.max(0, (S.water[k] || 0) + Number(el.dataset.d)); save(); rerender(); },
  'usual-log': () => {
    if (!USUALS || !USUALS.usual) return;
    const k = dkey(), m = USUALS.meal, ids = copyEntries(USUALS.usual.list, k, m);
    rerender(); toast(`Logged your usual ${MEAL_NAME[m].toLowerCase()}`, { label: 'Undo', fn: () => { for (const id of ids) removeEntry(k, id); rerender(); } });
  },
  'usual-food': el => {
    const e = USUALS && USUALS.top[+el.dataset.i]; if (!e) return;
    const k = dkey(), m = USUALS.meal, ids = copyEntries([e], k, m);
    rerender(); toast(`Added ${e.name}`, { label: 'Undo', fn: () => { for (const id of ids) removeEntry(k, id); rerender(); } });
  },
  'sched-day': el => openSchedDay(Number(el.dataset.wd)),
  'week-make': () => { makeWeek(); rerender(); window.scrollTo(0, 0); toast('Week planned'); },
  'week-day-new': el => {
    const ws = weekState(); if (!ws) return;
    const i = Number(el.dataset.i), P = planState();
    ws.W.days[i] = freshPicks(Object.fromEntries(Object.entries(ws.W.days[i]).map(([k, v]) => [k, [v, ...((P.recent || {})[k] || [])]])));
    if (i === ws.idx) P.picks = ws.W.days[i];
    save(); rerender();
  },
  'shop-range': el => { if (!S.week) return; S.week.shopAll = el.dataset.v === 'all'; save(); rerender(); },
  'shop-clear': () => { if (!S.week) return; S.week.ticks = {}; save(); rerender(); },
  'shop-copy': async () => {
    const ws = weekState(); if (!ws) return;
    const list = shoppingList(S.week.shopAll ? 0 : ws.idx).filter(r => !(S.week.ticks || {})[r.id]);
    const text = 'Shopping list\n' + AISLES.filter(a => list.some(r => r.aisle === a)).map(a => `\n${a}\n` + list.filter(r => r.aisle === a).map(r => `- ${r.name}: ${r.amt}`).join('\n')).join('\n');
    try { await navigator.clipboard.writeText(text); toast('Shopping list copied. Paste it into WhatsApp or Notes.'); }
    catch (e) { toast('Couldn’t copy. Long-press to select the list instead.'); }
  },
  'summary-hide': el => { S.settings.summarySeen = el.dataset.v; save(); rerender(); },
  'ed-swap': el => { const i = Number(el.dataset.i); if (!draft || !draft.items[i]) return; openSwap(draft.items[i].ex, id => { draft.items[i].ex = id; rerender(); }); },
  say: () => { loadFoodDb().catch(() => {}); openSay(foodCtx()); },
  'repeat-meal': el => {
    const m = el.dataset.meal, src = (S.log[addDays(foodDate, -1)] || []).filter(e => e.meal === m);
    if (!src.length) return;
    const date = foodDate, ids = copyEntries(src, date, m);
    rerender();
    toast(`Added ${plural(ids.length, 'food')} to ${MEAL_NAME[m]}`, { label: 'Undo', fn: () => { for (const id of ids) removeEntry(date, id); rerender(); } });
  },
  'save-meal': el => openSaveMeal(foodDate, el.dataset.meal),
  'ai-remove': el => {
    if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Tap again to remove'; return; }
    S.settings.aiKey = ''; S.settings.aiModels = []; save(); rerender(); toast('AI key removed');
  },
  'ai-test': async () => {
    const msg = $('#ai-msg'); if (msg) msg.textContent = 'Checking with Google…';
    try {
      S.settings.aiModels = []; S.settings.aiModelsV = 0; for (const k in aiCool) delete aiCool[k];
      const t0 = Date.now();
      const out = await aiGenerate([{ text: `${AI_RULES}\nThe user said what they ate: "one banana"` }]);
      const secs = ((Date.now() - t0) / 1000).toFixed(1);
      if (msg) msg.textContent = out.items.length ? `Working. ${aiLastModel} answered in ${secs} seconds.` : 'Google answered, but with nothing in it. Try again.';
      const am = $('#ai-model'); if (am && aiLastModel) am.textContent = aiLastModel;
    } catch (e) { if (msg) msg.textContent = aiMsg(e); }
  },
  'plan-swap': el => {
    const P = planState(), slot = el.dataset.slot, pool = slot.startsWith('snack') ? 'snack' : slot, ok = allowedIdx(pool);
    if (!ok.length) return;
    const others = slot.startsWith('snack') ? SNACK_SLOTS.filter(x => x !== slot).map(x => P.picks[x]) : [];
    let pos = ok.indexOf(P.picks[slot]);
    for (let k = 0; k < ok.length; k++) { pos = (pos + 1) % ok.length; if (!others.includes(ok[pos])) break; }
    P.picks[slot] = ok[pos]; save(); rerender();
  },
  'plan-new': () => { const P = planState(); rememberPicks(P); P.picks = freshPicks(P.recent); const ws = weekState(); if (ws) ws.W.days[ws.idx] = P.picks; save(); rerender(); window.scrollTo(0, 0); },
  'plan-log': el => logPlanMeal(el.dataset.slot),
  diet: () => openDiet(),
  activity: () => openActivity(),
  coach: () => openCoach(),
  habits: () => openHabits(),
  'habits-later': () => { habitState().dismissed = true; save(); rerender(); },
  habit: el => {
    const H = habitState(), k = dkey(), id = el.dataset.id, list = H.done[k] = H.done[k] || [];
    const i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else { list.push(id); buzz(15); }
    for (const d of Object.keys(H.done)) if (d < addDays(k, -400)) delete H.done[d];
    save(); rerender();
  },
  'macro-style': el => {
    const v = el.dataset.v, kcal = fromE(parseNum($('#g-kcal')?.value) || toE(S.settings.kcal)), m = macrosFor(v, kcal, bodyKg());
    $('#g-p').value = m.p; $('#g-c').value = m.c; $('#g-f').value = m.f;
    S.settings.macroStyle = v; save();
    $$('[data-act="macro-style"]').forEach(x => x.classList.toggle('on', x === el));
    const h = $('#g-style-hint'); if (h) h.textContent = MACRO_STYLES.find(x => x[0] === v)[2] + ' Tap Save goals to keep it.';
    updateGoalCheck();
  },
  measure: () => openMeasure(),
  'photo-add': () => $('#photo-file')?.click(),
  'photo-view': el => openPhotoView(el.dataset.id),
  'photo-compare': () => openPhotoCompare(),
  cal: el => { calMonth = Math.min(0, calMonth + Number(el.dataset.d)); const box = el.closest('section'); if (box) box.innerHTML = calendarHTML(); },
  export: () => openExport(),
  fast: () => openFast(),
  'diet-none': () => { diet().asked = true; save(); rerender(); },
  'yt-remove': el => { delete S.videos[el.dataset.id]; save(); rerender(); toast('Video removed'); },
  'voice-test': () => {
    const box = $('#voice-help'); if (box) box.innerHTML = '';
    if (!voice.list.length) pickVoice();
    speakNow('Get ready. 3. 2. 1. Go. 1. 2. 3.', { onResult: (ok, why) => {
      if (ok) toast(S.settings.coach ? 'Speaking now. Turn your volume up if it’s quiet.' : 'That’s the voice. Turn Voice counting on to hear it in workouts.');
      else voiceHelp(why);
    } });
  },
  'calc-sex': el => { calcSex = el.dataset.v; setSex(el.dataset.v, false); },
  'set-sex': el => setSex(el.dataset.v, true),
  'calc-use': el => {
    Object.assign(S.settings, { kcal: Number(el.dataset.k), protein: Number(el.dataset.p), carbs: Number(el.dataset.c), fat: Number(el.dataset.f), goalsSet: true });
    save(); rerender(); toast('Goals updated');
  },
  'hist-del': el => {
    if (!el.dataset.armed) { el.dataset.armed = '1'; el.textContent = 'Tap again to delete'; return; }
    const i = S.workouts.findIndex(w => w.id === el.dataset.id);
    if (i < 0) return;
    const [w] = S.workouts.splice(i, 1); save(); rerender();
    toast('Workout deleted', { label: 'Undo', fn: () => { S.workouts.splice(i, 0, w); save(); rerender(); } });
  },
  backup: () => {
    saveNow();
    const copy = JSON.parse(JSON.stringify(S)); delete copy.settings.aiKey; delete copy.settings.aiModels;
    const blob = new Blob([JSON.stringify({ app: 'RepPlate', saved: new Date().toISOString(), data: copy }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `repplate-backup-${dkey()}.json`;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Backup saved to your downloads');
  },
  restore: () => $('#restore-file').click(),
  'restore-yes': () => { if (!pendingRestore) return; const keep = { aiKey: S.settings.aiKey, aiModels: S.settings.aiModels }; S = migrate(pendingRestore); if (!S.settings.aiKey && keep.aiKey) Object.assign(S.settings, keep); pendingRestore = null; saveNow(); applyTheme(); rerender(); toast('Backup restored'); },
  'restore-no': () => { pendingRestore = null; $('#restore-confirm').innerHTML = ''; },
  erase: el => {
    if (Date.now() - eraseArmed > 4000) { eraseArmed = Date.now(); el.textContent = 'Tap again to erase all food, workouts and settings'; return; }
    eraseArmed = 0; S = defaults(); saveNow(); applyTheme(); foodDate = dkey(); location.hash = '#/today'; toast('Everything erased');
  },
};
let pendingRestore = null;

function openAddToRoutine(exId) {
  const ex = EXMAP.get(exId);
  const el = sheetEl(`${sheetHead('Add to routine', exName(exId))}
    <ul class="food-list">${S.routines.map(r => `<li class="food-row"><button type="button" class="fr-main" data-r="${esc(r.id)}"><span class="fr-name">${esc(r.name)}</span><span class="fr-sub">${plural(r.items.length, 'exercise')}${r.items.some(i => i.ex === exId) ? ' · already in it' : ''}</span></button></li>`).join('')}</ul>
    <button type="button" class="btn block" data-r="__new">${I.plus} New routine with this exercise</button>
    <div class="sheet-end"></div>`);
  el.addEventListener('click', e => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    const timed = ex && (ex.c === 'stretching' || /plank|hold|bridge|wall sit/i.test(ex.n));
    const item = { ex: exId, sets: 3, reps: timed ? 0 : 10, secs: timed ? 30 : 0, rest: S.settings.rest };
    if (b.dataset.r === '__new') {
      draft = { id: 'r-' + uid(), isNew: true, name: '', note: '', items: [item] };
      closeAll(() => { location.hash = '#/edit/new'; });
      return;
    }
    const r = S.routines.find(x => x.id === b.dataset.r); if (!r) return;
    r.items.push(item); save();
    closeAll(() => toast(`Added to ${r.name}`));
  });
  pushLayer(el);
}

document.addEventListener('click', e => {
  const tabA = e.target.closest('#tabbar a[data-tab]');
  if (tabA) { e.preventDefault(); if (!layers.length) goTab(tabA.dataset.tab); return; }
  const repA = e.target.closest('a[data-nav="replace"]');
  if (repA && !e.target.closest('.layer')) { e.preventDefault(); if (repA.getAttribute('href') !== navHash()) navReplace(repA.getAttribute('href')); return; }
  const sw = e.target.closest('[data-demo-swap]');
  if (sw) { e.preventDefault(); S.settings.demoStyle = S.settings.demoStyle === 'photo' ? 'anim' : 'photo'; save(); $$('.demo[data-ex]').forEach(redrawDemo); return; }
  const dt = e.target.closest('[data-demo-toggle]');
  if (dt) {
    const d = dt.closest('.demo'); const paused = d.classList.toggle('paused');
    dt.innerHTML = paused ? I.play : I.pause; dt.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} demonstration`);
    return;
  }
  const flip = e.target.closest('.demo.paused');
  if (flip) { flip.classList.toggle('alt'); const t = flip.querySelector('.demo-tag'); if (t) t.textContent = flip.classList.contains('alt') ? 'Finish' : 'Start'; return; }
  if (e.target.closest('.layer')) return;
  const el = e.target.closest('[data-act]'); if (!el) return;
  const fn = ACTIONS[el.dataset.act]; if (!fn) return;
  e.preventDefault();
  fn(el, e);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]'); if (!f || e.target.closest('.layer')) return;
  e.preventDefault();
  if (f.dataset.form === 'goals') {
    const k = parseNum($('#g-kcal').value), p = parseNum($('#g-p').value), c = parseNum($('#g-c').value), fa = parseNum($('#g-f').value);
    if (!(k > 0)) { toast(`Enter an energy goal in ${eUnit()}`); return; }
    Object.assign(S.settings, { kcal: Math.round(fromE(k)), protein: Math.max(0, Math.round(p || 0)), carbs: Math.max(0, Math.round(c || 0)), fat: Math.max(0, Math.round(fa || 0)), goalsSet: true });
    save(); rerender(); toast('Goals saved');
  }
  if (f.dataset.form === 'calc') runCalc();
  if (f.dataset.form === 'ai-key') aiSaveKey($('#ai-key').value);
  if (f.dataset.form === 'yt') {
    const v = parseYT($('#yt-url').value);
    if (!v) { toast('That doesn’t look like a YouTube link'); return; }
    S.videos[f.dataset.ex] = v; save(); rerender(); toast('Video saved');
  }
});
document.addEventListener('input', e => {
  if (e.target.closest('.layer')) return;
  const id = e.target.id;
  if (id === 'lib-q') { lib.q = e.target.value; lib.limit = 40; renderLibResults(); }
  if (id === 'ed-name' && draft) draft.name = e.target.value;
  if (id === 'ed-note' && draft) draft.note = e.target.value;
  if (/^g-/.test(id)) updateGoalCheck();
});
document.addEventListener('change', e => {
  if (e.target.closest('.layer')) return;
  const t = e.target;
  if (t.id === 'photo-file' && t.files?.[0]) { const f = t.files[0]; t.value = ''; openPhotoAdd(f); return; }
  if (t.id === 'lib-muscle') { lib.muscle = t.value; lib.limit = 40; renderLibResults(); }
  if (t.id === 'lib-equip') { lib.equip = t.value; lib.limit = 40; renderLibResults(); }
  if (t.dataset.edRest != null && draft) { draft.items[Number(t.dataset.edRest)].rest = Number(t.value); }
  if (t.dataset.shop != null && S.week) { S.week.ticks = S.week.ticks || {}; S.week.ticks[t.dataset.shop] = t.checked; save(); const l = t.closest('label'); if (l) l.classList.toggle('got', t.checked); return; }
  if (t.id === 'pref-voice') { S.settings.voiceURI = t.value; voice.skipChosen = false; pickVoice(); save(); speakNow('This is your coach.', { onResult: (ok, why) => { if (!ok) voiceHelp(why); } }); }
  if (t.id === 'pref-region') { S.settings.region = t.value; save(); toast('Food search updated'); }
  if (t.id === 'restore-file') {
    const file = t.files[0]; t.value = '';
    if (!file) return;
    file.text().then(txt => {
      const j = JSON.parse(txt);
      const data = j && j.data ? j.data : j;
      if (!data || typeof data !== 'object' || !data.settings) throw new Error('bad');
      pendingRestore = data;
      const when = j.saved ? new Date(j.saved).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : 'an earlier date';
      $('#restore-confirm').innerHTML = `<div class="notice">${I.upload}<div><strong>Replace everything with the backup from ${esc(when)}?</strong><p>Food logged and workouts done since then on this phone will be lost.</p></div><div class="actions"><button type="button" class="btn sm primary" data-act="restore-yes">Replace</button><button type="button" class="btn sm" data-act="restore-no">Cancel</button></div></div>`;
    }).catch(() => toast('That file isn’t a RepPlate backup'));
  }
});

/* ============================== boot ============================== */
function applyTheme() {
  const t = S.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  $$('meta[name="theme-color"]').forEach(m => { m.content = dark ? '#000000' : '#F2F2F7'; });
}
function buildTabbar() {
  $('#tabbar').innerHTML = `<div class="tabbar-inner"><div class="tab-group">
    <a href="#/today" data-tab="today">${I.tToday}<span>Today</span></a>
    <a href="#/food" data-tab="food">${I.tFood}<span>Food</span></a>
    <a href="#/train" data-tab="train">${I.tTrain}<span>Train</span></a>
    <a href="#/me" data-tab="me">${I.tMe}<span>Me</span></a></div>
    <button type="button" class="tab-scan" data-act="scan" aria-label="Scan a barcode">${I.scan}</button>
  </div>`;
}
let lastDay = dkey();
setInterval(() => { const k = dkey(); if (k !== lastDay) { if (foodDate === lastDay) foodDate = k; lastDay = k; if (!layers.length) rerender(); } }, 60000);
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

applyTheme();
buildTabbar();
route();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // Updates: check for a new version every time the app opens or comes back to the front, and switch to it
  // straight away if that happens within a few seconds (never mid-workout or with a sheet open).
  const hadWorker = !!navigator.serviceWorker.controller;
  let shownAt = Date.now(), switched = false;
  const checkForUpdate = () => navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {});
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadWorker || switched) return;   // first install: nothing old to replace
    switched = true;
    if (Date.now() - shownAt < 20000 && !S.active && !layers.length) location.reload();
    else toast('RepPlate has been updated. Close and reopen it to see what’s new.');
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { shownAt = Date.now(); checkForUpdate(); } });
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(checkForUpdate).catch(() => {}));
}
// expose for debugging in the browser console
window.RepPlate = { get state() { return S; }, fn: { programDays: (...a) => programDays(...a), programOf: (...a) => programOf(...a), allEx: () => EX.map(e => e.i), listed: () => EXV.map(e => e.i), exGet: id => EXMAP.get(id), shapes: m => MUSCLE_SHAPES[m] || [] } };
})();
