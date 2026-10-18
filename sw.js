/* RepPlate service worker: keeps the app working offline. Bump VERSION when you change files. */
const VERSION = 'repplate-v21';
const IMG_CACHE = 'repplate-exercise-images';
const PRECACHE = [
 "./",
 "index.html",
 "styles.css",
 "app.js",
 "manifest.webmanifest",
 "data/exercises.json",
 "data/foods.json",
 "vendor/zxing.min.js",
 "fonts/nunito-latin-wght-normal.woff2",
 "fonts/archivo-latin-wght-normal.woff2",
 "fonts/big-shoulders-display-latin-600-normal.woff2",
 "fonts/big-shoulders-display-latin-800-normal.woff2",
 "icons/apple-touch-icon.png",
 "icons/icon-192.png",
 "icons/icon-512.png",
 "icons/maskable-512.png",
 "img/ex/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
 "img/ex/Barbell_Bench_Press_-_Medium_Grip/1.jpg",
 "img/ex/Barbell_Curl/0.jpg",
 "img/ex/Barbell_Curl/1.jpg",
 "img/ex/Barbell_Squat/0.jpg",
 "img/ex/Barbell_Squat/1.jpg",
 "img/ex/Bent_Over_Two-Dumbbell_Row/0.jpg",
 "img/ex/Bent_Over_Two-Dumbbell_Row/1.jpg",
 "img/ex/Bodyweight_Squat/0.jpg",
 "img/ex/Bodyweight_Squat/1.jpg",
 "img/ex/Bodyweight_Walking_Lunge/0.jpg",
 "img/ex/Bodyweight_Walking_Lunge/1.jpg",
 "img/ex/Butt_Lift_Bridge/0.jpg",
 "img/ex/Butt_Lift_Bridge/1.jpg",
 "img/ex/Cross-Body_Crunch/0.jpg",
 "img/ex/Cross-Body_Crunch/1.jpg",
 "img/ex/Crunches/0.jpg",
 "img/ex/Crunches/1.jpg",
 "img/ex/Dips_-_Triceps_Version/0.jpg",
 "img/ex/Dips_-_Triceps_Version/1.jpg",
 "img/ex/Dumbbell_Bench_Press/0.jpg",
 "img/ex/Dumbbell_Bench_Press/1.jpg",
 "img/ex/Dumbbell_Bicep_Curl/0.jpg",
 "img/ex/Dumbbell_Bicep_Curl/1.jpg",
 "img/ex/Dumbbell_Lunges/0.jpg",
 "img/ex/Dumbbell_Lunges/1.jpg",
 "img/ex/Dumbbell_One-Arm_Triceps_Extension/0.jpg",
 "img/ex/Dumbbell_One-Arm_Triceps_Extension/1.jpg",
 "img/ex/Dumbbell_Shoulder_Press/0.jpg",
 "img/ex/Dumbbell_Shoulder_Press/1.jpg",
 "img/ex/Face_Pull/0.jpg",
 "img/ex/Face_Pull/1.jpg",
 "img/ex/Flat_Bench_Lying_Leg_Raise/0.jpg",
 "img/ex/Flat_Bench_Lying_Leg_Raise/1.jpg",
 "img/ex/Goblet_Squat/0.jpg",
 "img/ex/Goblet_Squat/1.jpg",
 "img/ex/Hammer_Curls/0.jpg",
 "img/ex/Hammer_Curls/1.jpg",
 "img/ex/Incline_Dumbbell_Press/0.jpg",
 "img/ex/Incline_Dumbbell_Press/1.jpg",
 "img/ex/Leg_Extensions/0.jpg",
 "img/ex/Leg_Extensions/1.jpg",
 "img/ex/Leg_Press/0.jpg",
 "img/ex/Leg_Press/1.jpg",
 "img/ex/Lying_Leg_Curls/0.jpg",
 "img/ex/Lying_Leg_Curls/1.jpg",
 "img/ex/Mountain_Climbers/0.jpg",
 "img/ex/Mountain_Climbers/1.jpg",
 "img/ex/Plank/0.jpg",
 "img/ex/Plank/1.jpg",
 "img/ex/Pushups/0.jpg",
 "img/ex/Pushups/1.jpg",
 "img/ex/Romanian_Deadlift/0.jpg",
 "img/ex/Romanian_Deadlift/1.jpg",
 "img/ex/Russian_Twist/0.jpg",
 "img/ex/Russian_Twist/1.jpg",
 "img/ex/Seated_Cable_Rows/0.jpg",
 "img/ex/Seated_Cable_Rows/1.jpg",
 "img/ex/Side_Bridge/0.jpg",
 "img/ex/Side_Bridge/1.jpg",
 "img/ex/Side_Lateral_Raise/0.jpg",
 "img/ex/Side_Lateral_Raise/1.jpg",
 "img/ex/Standing_Calf_Raises/0.jpg",
 "img/ex/Standing_Calf_Raises/1.jpg",
 "img/ex/Standing_Military_Press/0.jpg",
 "img/ex/Standing_Military_Press/1.jpg",
 "img/ex/Superman/0.jpg",
 "img/ex/Superman/1.jpg",
 "img/ex/Triceps_Pushdown/0.jpg",
 "img/ex/Triceps_Pushdown/1.jpg",
 "img/ex/Wide-Grip_Lat_Pulldown/0.jpg",
 "img/ex/Wide-Grip_Lat_Pulldown/1.jpg"
];

// 3D animations for the starter routines, saved on install so they work offline straight away
const ANIM_B = 'https://static.exercisedb.dev/media/';
const STARTER_ANIM = ["10Z2DXU", "17lJ1kr", "25GPyDY", "2NpxjC1", "3ZflifB", "75Bgtjy", "B3Rxp6L", "BJ0Hz5L", "DsgkuIt", "EIeI8Vf", "I4hDWkc", "IZVHb27", "Kyd9Rz5", "NbVPDMW", "RJgzwny", "RKjH6Lt", "RRWFUcw", "SP3hUez", "SpYC0Kp", "TFqbd8t", "VBAWRPG", "WhuFnR7", "X6C6i5Y", "XVDdcoj", "ZA8b5hc", "ZfyAGhK", "eYnzaCm", "fUBheHs", "iYzB0Cz", "my33uHU", "nAuHPcD", "rbu5UUb", "u0cNiij", "wQ2c4XD", "ykUOVze", "znQUdHY"];
const saveStarterAnims = () => caches.open(IMG_CACHE).then(c => Promise.all(STARTER_ANIM.map(id => {
  const url = ANIM_B + id + '.gif';
  return c.match(url).then(hit => hit || fetch(new Request(url, { mode: 'no-cors' })).then(r => c.put(url, r))).catch(() => {});
}))).catch(() => {});
self.addEventListener('install', event => {
  // cache: 'reload' skips the phone's own 10-minute copy, so a new version stores the new files
  event.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => Promise.race([saveStarterAnims(), new Promise(res => setTimeout(res, 15000))])).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== IMG_CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(req, event) {
  const cache = await caches.open(VERSION);
  // 'no-cache' = always ask the server whether the file changed (a tiny check when it hasn't)
  const fresh = fetch(req.mode === 'navigate' ? new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }) : new Request(req, { cache: 'no-cache' }))
    .then(res => { if (res && res.ok) return cache.put(req, res.clone()).then(() => res); return res; });
  event.waitUntil(fresh.catch(() => {}));   // on a slow line, keep downloading and save it for next time
  try {
    return await Promise.race([fresh, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000))]);
  } catch (e) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
    return Response.error();
  }
}
async function cacheFirst(req, name, keepOpaque = false) {
  const cache = await caches.open(name);
  const hit = await cache.match(req, { ignoreSearch: name === VERSION });
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || (keepOpaque && res.type === 'opaque'))) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    const shell = req.mode === 'navigate' || /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
    event.respondWith(shell ? networkFirst(req, event) : cacheFirst(req, VERSION));
    return;
  }
  if (url.hostname === 'raw.githubusercontent.com' || url.hostname === 'cdn.jsdelivr.net') {
    event.respondWith(cacheFirst(req, IMG_CACHE));
  }
  // 3D exercise animations from ExerciseDB: keep a copy of each one once it has been seen, so it works offline
  if (url.hostname === 'static.exercisedb.dev') {
    event.respondWith(cacheFirst(req, IMG_CACHE, true));
  }
  // Everything else (Open Food Facts lookups and product photos) goes straight to the network.
});
