const CACHE_NAME = "sudoku-cache-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./sudoku.js",
  "./sudoku_generator.js",
  "./sudoku_history.js",
  "./sudoku_history_import.js",
  "./sudoku_history_ui.js",
  "./sudoku_solver.js",
  "./manifest.json"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});