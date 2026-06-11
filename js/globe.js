/* NIGHTFALL — interactive ascii globe */
(function () {
  var LAND = window.NF_LAND;
  var MW = LAND[0].length, MH = LAND.length;
  var RAMP = " .:;t%S8X@";
  var GREYS = ["#3a3a3a","#5c5c5c","#7e7e7e","#9e9e9e","#bcbcbc","#d8d8d8","#efefef","#ffffff"];
  var ACCENTS = ["#FF5252","#4ADE80","#5B8DEF","#FFA94D","#4DD6E8","#E879F9"];

  var canvas = document.getElementById("globe");
  var ctx = canvas.getContext("2d");

  var COLS = 56, ROWS = 56;          // character grid
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var cssSize = 420, cellW, cellH, fontPx;

  function size() {
    cssSize = canvas.clientWidth || 420;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    cellW = canvas.width / COLS;
    cellH = canvas.height / ROWS;
    fontPx = Math.ceil(cellH * 0.95);
    ctx.font = "bold " + fontPx + "px 'JetBrains Mono', monospace";
    ctx.textBaseline = "top";
  }

  // deterministic hash → stable ocean dots & land accents (no flicker)
  function hash(a, b) {
    var h = (a * 374761393 + b * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177 | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }

  var yaw = 0, pitch = -0.35;
  var t0 = performance.now();
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vyaw = 0.005;                  // auto-rotate speed
  var dragging = false, lastX = 0, lastY = 0, idleT = 0;

  function frame() {
    if (!dragging) {
      yaw += vyaw;
      vyaw += (0.005 - vyaw) * 0.02;  // ease back to cruise speed
    }
    pitch = Math.max(-1.2, Math.min(1.2, pitch));

    var zt = REDUCED ? 1 : Math.min(1, (performance.now() - t0) / 1500);
    var ze = 1 - Math.pow(1 - zt, 3);              // ease-out cubic
    var zoom = 2.4 - 1.4 * ze;                      // 2.4 -> 1.0
    var R = (COLS / 2 - 1.5) * zoom;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = REDUCED ? 1 : Math.min(1, 0.25 + zt * 0.9);
    var cy = Math.cos(pitch), sy = Math.sin(pitch);
    // light from upper-left-front
    var lx = -0.45, ly = -0.5, lz = 0.74;

    for (var gy = 0; gy < ROWS; gy++) {
      for (var gx = 0; gx < COLS; gx++) {
        var nx = (gx - COLS / 2 + 0.5) / R;
        var ny = (gy - ROWS / 2 + 0.5) / R;
        var rr = nx * nx + ny * ny;
        if (rr > 1) {
          // sparse stable starfield outside the disc
          var s = hash(gx, gy);
          if (s < 0.012) {
            ctx.fillStyle = s < 0.005 ? "#2e3a5e" : "#2e2e2e";
            ctx.fillText(s < 0.008 ? "." : "*", gx * cellW, gy * cellH);
          }
          continue;
        }
        var nz = Math.sqrt(1 - rr);
        // rotate: pitch around X, yaw around Y
        var y1 = ny * cy - nz * sy;
        var z1 = ny * sy + nz * cy;
        var x1 = nx;
        var lon = Math.atan2(x1, z1) + yaw;
        var lat = Math.asin(Math.max(-1, Math.min(1, y1)));
        // sample mask
        var mx = ((Math.round((lon / (2 * Math.PI) + 0.5) * MW) % MW) + MW) % MW;
        var my = Math.round((lat / Math.PI + 0.5) * (MH - 1));
        var land = LAND[my].charCodeAt(mx) === 49;
        // illumination
        var lum = Math.max(0, nx * lx + ny * ly + nz * lz);
        if (land) {
          var v = 0.35 + lum * 0.65;
          var ch = RAMP[Math.min(9, Math.floor(v * 9.99))];
          var hsh = hash(mx, my);
          ctx.fillStyle = hsh < 0.05 ? ACCENTS[Math.floor(hsh * 20 * ACCENTS.length) % ACCENTS.length]
                                     : GREYS[Math.min(7, Math.floor(v * 8))];
          ctx.fillText(ch, gx * cellW, gy * cellH);
        } else {
          // ocean: faint stable dots, denser near rim for shape
          var o = hash(mx, my);
          if (rr > 0.92) {
            ctx.fillStyle = "#3a3a3a";
            ctx.fillText(":", gx * cellW, gy * cellH);
          } else if (o < 0.16) {
            ctx.fillStyle = lum > 0.45 ? "#30343f" : "#23252c";
            ctx.fillText(o < 0.08 ? "." : ":", gx * cellW, gy * cellH);
          }
        }
      }
    }
    requestAnimationFrame(frame);
  }

  function startDrag(x, y) { dragging = true; lastX = x; lastY = y; canvas.classList.add("dragging"); }
  function moveDrag(x, y) {
    if (!dragging) return;
    var dx = x - lastX, dy = y - lastY;
    yaw += dx * 0.008;
    pitch -= dy * 0.008;
    vyaw = dx * 0.0016;              // throw inertia
    lastX = x; lastY = y;
  }
  function endDrag() { dragging = false; canvas.classList.remove("dragging"); }

  canvas.addEventListener("mousedown", function (e) { startDrag(e.clientX, e.clientY); e.preventDefault(); });
  window.addEventListener("mousemove", function (e) { moveDrag(e.clientX, e.clientY); });
  window.addEventListener("mouseup", endDrag);
  canvas.addEventListener("touchstart", function (e) { var t = e.touches[0]; startDrag(t.clientX, t.clientY); }, { passive: true });
  canvas.addEventListener("touchmove", function (e) { var t = e.touches[0]; moveDrag(t.clientX, t.clientY); }, { passive: true });
  canvas.addEventListener("touchend", endDrag);

  window.addEventListener("resize", size);
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(size); }
  size();
  requestAnimationFrame(frame);
})();
