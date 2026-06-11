/* pi — resident critter + rocket */
(function () {
  var el = document.getElementById("critter");
  var rk = document.getElementById("rocket");
  if (!el || !rk) return;
  var cv = el.querySelector("canvas"), cx = cv.getContext("2d");
  var rcv = rk.querySelector("canvas"), rcx = rcv.getContext("2d");
  var bubble = document.getElementById("critter-bubble");
  var REDUCED = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── pi sprite ── */
  var FRAMES = {
    idle:  ["....W.....","..WWWWWW..",".WWWWWWWW.",".WWKWWKWW.",".WWWWWWWW.",".WWWWWWWW.","..GWWWWG..","..WW..WW..","..WW..WW..","..GG..GG..",".........."],
    blink: ["....W.....","..WWWWWW..",".WWWWWWWW.",".WWGWWGWW.",".WWWWWWWW.",".WWWWWWWW.","..GWWWWG..","..WW..WW..","..WW..WW..","..GG..GG..",".........."],
    walk1: ["....W.....","..WWWWWW..",".WWWWWWWW.",".WWKWWKWW.",".WWWWWWWW.",".WWWWWWWW.","..GWWWWG..","..WW..WW..",".WW....WW.",".GG....GG.",".........."],
    walk2: ["....W.....","..WWWWWW..",".WWWWWWWW.",".WWKWWKWW.",".WWWWWWWW.",".WWWWWWWW.","..GWWWWG..","..WW..WW..","...WWWW...","...GGGG...",".........."],
    held:  ["....W.....","..WWWWWW..",".WWWWWWWW.",".WWKWWKWW.",".WWWWWWWW.",".WWWWWWWW.","..GWWWWG..",".WW....WW.","WW......WW","GG......GG",".........."]
  };
  var COLORS = { W:"#efefef", G:"#9e9e9e", K:"#0a0a0a", O:"#FFA94D", Y:"#FFE066" };

  function drawPi(name, flip) {
    cx.clearRect(0, 0, 10, 11);
    var f = FRAMES[name];
    for (var y = 0; y < f.length; y++)
      for (var x = 0; x < 10; x++) {
        var c = f[y][flip ? 9 - x : x];
        if (c !== ".") { cx.fillStyle = COLORS[c]; cx.fillRect(x, y, 1, 1); }
      }
  }

  /* ── rocket sprite ── */
  var ROCKET = [
    "....W....",
    "...WWW...",
    "...WWW...",
    "..WWWWW..",
    "..WKKKW..",
    "..WWWWW..",
    "..WWWWW..",
    "..GWWWG..",
    ".WGWWWGW.",
    ".W.WWW.W.",
    "...GGG...",
    ".........",
    "........."
  ];
  function drawRocket(flame) {
    rcx.clearRect(0, 0, 9, 13);
    for (var y = 0; y < ROCKET.length; y++)
      for (var x = 0; x < 9; x++) {
        var c = ROCKET[y][x];
        if (c !== ".") { rcx.fillStyle = COLORS[c]; rcx.fillRect(x, y, 1, 1); }
      }
    // nose light blink when parked
    if (!flame) {
      rcx.fillStyle = (Math.floor(perf() / 600) % 2) ? "#9e9e9e" : "#efefef";
      rcx.fillRect(4, 0, 1, 1);
    }
    if (flame) {
      rcx.fillStyle = COLORS.O; rcx.fillRect(3, 11, 1, 1); rcx.fillRect(5, 11, 1, 1);
      rcx.fillStyle = COLORS.Y; rcx.fillRect(4, 11, 1, 1);
      if (Math.floor(perf() / 90) % 2) { rcx.fillStyle = COLORS.O; rcx.fillRect(4, 12, 1, 1); }
    }
  }
  function perf() { return performance.now(); }

  /* ── state ── */
  var W = function(){ return window.innerWidth; };
  var floorY = function(){ return window.innerHeight - 37; };
  var x = Math.min(80, W() - 60), y = floorY();
  var dir = 1, vx = 0.45, vy = 0, mode = REDUCED ? "pause" : "walk", t = 0, pauseT = 1e9;
  if (!REDUCED) pauseT = 0;
  var held = false, grabDX = 0, grabDY = 0, moved = 0;

  // rocket pad: bottom-right
  var rx = 0, ry = 0, rAngle = 0, flying = false, flightT0 = 0, prevRX = 0, prevRY = 0;
  function padPos() { return { x: W() - 52, y: window.innerHeight - 46 }; }
  function parkRocket() { var p = padPos(); rx = p.x; ry = p.y; rAngle = 0; }
  parkRocket();

  var QUIPS = [
    "pi:~$ hi. i\u2019m pi.",
    "pi — help console soon\u2122",
    "drag me. i don\u2019t mind.",
    "pi:~$ watching the build.",
    "drop me on the rocket \u2192",
    "nightstar/solutions \u25cf live"
  ];
  var bubbleT = null;
  function say(msg) {
    bubble.textContent = msg;
    bubble.style.left = Math.max(6, Math.min(W() - 170, x - 30)) + "px";
    bubble.style.top = Math.max(6, y - 30) + "px";
    bubble.classList.add("show");
    clearTimeout(bubbleT);
    bubbleT = setTimeout(function(){ bubble.classList.remove("show"); }, 2200);
  }

  /* ── flight ── */
  var FL = { board: 600, ascend: 900, orbit: 4200, ret: 900 };
  function globeCenter() {
    var g = document.getElementById("globe");
    if (g) {
      var r = g.getBoundingClientRect();
      var cx0 = r.left + r.width / 2, cy0 = r.top + r.height / 2;
      if (cy0 > -100 && cy0 < window.innerHeight + 100)
        return { x: cx0, y: cy0, rx: r.width * 0.62 + 26, ry: r.height * 0.40 + 18 };
    }
    return { x: W() / 2, y: window.innerHeight * 0.4, rx: W() * 0.3, ry: window.innerHeight * 0.18 };
  }
  function orbitPoint(a, g) { return { x: g.x + Math.cos(a) * g.rx - 13, y: g.y + Math.sin(a) * g.ry - 19 }; }

  function flyStep(now) {
    var el2 = now - flightT0;
    var g = globeCenter();
    var A0 = 0.9; // orbit entry angle (lower right)
    prevRX = rx; prevRY = ry;
    if (el2 < FL.board) {
      var p = padPos();
      rx = p.x + Math.sin(el2 / 28) * 1.6; ry = p.y;        // shake
      rk.style.zIndex = 79;
    } else if (el2 < FL.board + FL.ascend) {
      var u = (el2 - FL.board) / FL.ascend; u = 1 - Math.pow(1 - u, 3);
      var p = padPos(), o = orbitPoint(A0, g);
      rx = p.x + (o.x - p.x) * u; ry = p.y + (o.y - p.y) * u;
    } else if (el2 < FL.board + FL.ascend + FL.orbit) {
      var u = (el2 - FL.board - FL.ascend) / FL.orbit;
      var a = A0 - u * Math.PI * 4;                          // two orbits
      var o = orbitPoint(a, g);
      rx = o.x; ry = o.y;
      var behind = Math.sin(a) < -0.15;
      rk.style.zIndex = behind ? 0 : 79;
      rk.style.opacity = behind ? 0.55 : 1;
    } else if (el2 < FL.board + FL.ascend + FL.orbit + FL.ret) {
      var u = (el2 - FL.board - FL.ascend - FL.orbit) / FL.ret; u = 1 - Math.pow(1 - u, 3);
      var o = orbitPoint(A0 - Math.PI * 4, g), p = padPos();
      rx = o.x + (p.x - o.x) * u; ry = o.y + (p.y - o.y) * u;
      rk.style.zIndex = 79; rk.style.opacity = 1;
    } else {
      // land + deboard
      flying = false; parkRocket();
      rk.style.transform = "translate(" + rx + "px," + ry + "px)";
      x = rx - 26; y = floorY(); mode = REDUCED ? "pause" : "walk"; dir = -1;
      el.style.display = "";
      say("pi:~$ orbit complete.");
      return;
    }
    // heading
    var dx = rx - prevRX, dy = ry - prevRY;
    if (el2 > FL.board && (dx || dy)) rAngle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    else rAngle = 0;
    rk.style.transform = "translate(" + rx + "px," + ry + "px) rotate(" + rAngle + "deg)";
    drawRocket(el2 > FL.board);
  }

  /* ── main loop ── */
  function step(now) {
    t++;
    if (flying) {
      flyStep(now || perf());
    } else {
      drawRocket(false);
      rk.style.transform = "translate(" + rx + "px," + ry + "px)";
      if (held) {
        drawPi("held", dir < 0);
      } else if (mode === "fall") {
        vy += 0.55; y += vy;
        if (y >= floorY()) { y = floorY(); vy = 0; mode = REDUCED ? "pause" : "walk"; }
        drawPi("held", dir < 0);
      } else if (mode === "pause") {
        pauseT--;
        if (pauseT <= 0 && !REDUCED) { mode = "walk"; dir = Math.random() < 0.5 ? -1 : 1; }
        drawPi(t % 90 < 6 ? "blink" : "idle", dir < 0);
      } else {
        x += vx * dir;
        if (x < 8) { x = 8; dir = 1; }
        if (x > W() - 86) { x = W() - 86; dir = -1; }   // stop before the rocket pad
        if (Math.random() < 0.004) { mode = "pause"; pauseT = 90 + Math.random() * 200; }
        y = floorY();
        drawPi(t % 16 < 8 ? "walk1" : "walk2", dir < 0);
      }
      el.style.transform = "translate(" + x + "px," + y + "px)";
    }
    requestAnimationFrame(step);
  }

  function overlapsRocket() {
    var a = el.getBoundingClientRect(), b = rk.getBoundingClientRect();
    return !(a.right < b.left - 6 || a.left > b.right + 6 || a.bottom < b.top - 6 || a.top > b.bottom + 6);
  }

  el.addEventListener("pointerdown", function (e) {
    if (flying) return;
    held = true; moved = 0;
    grabDX = e.clientX - x; grabDY = e.clientY - y;
    el.classList.add("held");
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  el.addEventListener("pointermove", function (e) {
    if (!held) return;
    var nx = e.clientX - grabDX, ny = e.clientY - grabDY;
    moved += Math.abs(nx - x) + Math.abs(ny - y);
    x = Math.max(0, Math.min(W() - 30, nx));
    y = Math.max(0, Math.min(floorY(), ny));
  });
  el.addEventListener("pointerup", function () {
    if (!held) return;
    held = false; el.classList.remove("held");
    if (moved < 6) {
      say(QUIPS[Math.floor(Math.random() * QUIPS.length)]);
      mode = "pause"; pauseT = 120;
    } else if (overlapsRocket() && !flying) {
      // board the rocket
      el.style.display = "none";
      flying = true; flightT0 = perf();
      say("pi:~$ launching...");
    } else if (y < floorY()) {
      vy = 0; mode = "fall";
    }
  });
  window.addEventListener("resize", function () {
    x = Math.min(x, W() - 38);
    if (!held && mode !== "fall" && !flying) y = floorY();
    if (!flying) parkRocket();
  });

  drawPi("idle", false);
  drawRocket(false);
  requestAnimationFrame(step);
  setTimeout(function () { if (!held && !flying) say("pi:~$ hi. i\u2019m pi."); }, 2600);
})();
