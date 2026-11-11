// Paints the living room behind the cats: sage wall, skirting board, oak floorboards,
// plus a window, the wooden chair, the globe lamp and the cat tree.
// w/h: canvas size, floorY: where wall meets floor, u: size of one "pixel", night: night colours.

const ROOM_COLOURS = {
  day: {
    wall: '#b9c0a6', skirt: '#f1ece2', skirtLine: '#8d8f7c',
    floor: '#d9b68c', plank: '#c29c70', plankAlt: '#e0c09a',
    frame: '#f1ece2', sky: '#a5d4ec', cloud: '#fff',
    chair: '#6b3f22', chairDark: '#4a2a15',
    table: '#8b9080', tableDark: '#6c7163', lamp: '#fffdf2',
    rope: '#cdb083', ropeLine: '#a98c5f', wood: '#d9b47c',
  },
  night: {
    wall: '#3b4337', skirt: '#77776b', skirtLine: '#23281f',
    floor: '#5e4a35', plank: '#4b3a29', plankAlt: '#66523b',
    frame: '#77776b', sky: '#161c38', cloud: '#f4edc9',
    chair: '#3a2314', chairDark: '#24150b',
    table: '#4a5046', tableDark: '#343931', lamp: '#fff3b8',
    rope: '#6f5f47', ropeLine: '#544733', wood: '#77603f',
  },
};

function drawRoom(ctx, w, h, floorY, u, night) {
  const c = night ? ROOM_COLOURS.night : ROOM_COLOURS.day;
  const rect = (col, x, y, rw, rh) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), Math.round(rw), Math.round(rh)); };

  // wall + floor
  rect(c.wall, 0, 0, w, floorY);
  rect(c.floor, 0, floorY, w, h - floorY);

  // floorboards: rows get taller towards the front, with staggered joints
  let y = floorY, rowH = 3 * u, row = 0;
  while (y < h) {
    if (row % 3 === 1) rect(c.plankAlt, 0, y, w, rowH);
    rect(c.plank, 0, y, w, Math.max(1, u / 2));
    const plankW = 34 * u;
    for (let x = ((row * 13) % 34) * u - plankW; x < w; x += plankW) rect(c.plank, x, y, Math.max(1, u / 2), rowH);
    y += rowH; rowH += u; row++;
  }

  // skirting board
  rect(c.skirt, 0, floorY - 3 * u, w, 3 * u);
  rect(c.skirtLine, 0, floorY - 3 * u, w, Math.max(1, u / 2));

  // furniture sits along the wall, spread evenly; skip pieces that don't fit
  const wallH = floorY;
  const items = [];
  if (wallH >= 30 * u) items.push({ w: 18, draw: drawWindow });
  items.push({ w: 14, draw: drawChair });
  items.push({ w: 10, draw: drawLampTable });
  items.push({ w: 10, draw: drawCatTree });
  while (items.length > 1 && items.reduce((s, i) => s + i.w, 0) + (items.length + 1) * 2 > w / u) items.shift();
  const gap = (w / u - items.reduce((s, i) => s + i.w, 0)) / (items.length + 1);
  let x = gap;
  for (const item of items) { item.draw(Math.round(x) * u); x += item.w + gap; }

  function drawWindow(x0) {
    const top = floorY - 28 * u;
    rect(c.frame, x0, top, 18 * u, 16 * u);
    rect(c.sky, x0 + 2 * u, top + 2 * u, 14 * u, 12 * u);
    if (night) {
      rect(c.cloud, x0 + 10 * u, top + 4 * u, 3 * u, 3 * u);          // moon
      rect(c.sky, x0 + 11 * u, top + 4 * u, 2 * u, 2 * u);            // ...crescent
      for (const [sx, sy] of [[4, 4], [6, 9], [13, 10], [8, 5]]) rect(c.cloud, x0 + sx * u, top + sy * u, u, u);
    } else {
      rect('#ffd95a', x0 + 11 * u, top + 3 * u, 3 * u, 3 * u);        // sun
      rect(c.cloud, x0 + 4 * u, top + 8 * u, 6 * u, 2 * u);           // cloud
      rect(c.cloud, x0 + 5 * u, top + 7 * u, 3 * u, u);
    }
    rect(c.frame, x0 + 8.5 * u, top + 2 * u, u, 12 * u);              // glazing bars
    rect(c.frame, x0 + 2 * u, top + 7.5 * u, 14 * u, u);
    rect(c.skirtLine, x0 - u, top + 16 * u, 20 * u, u);               // sill
  }

  function drawChair(x0) {
    const seatY = floorY - 7 * u, feet = floorY + 4 * u;
    const backTop = Math.max(u, seatY - 14 * u);
    rect(c.chairDark, x0 + u, seatY, 2 * u, feet - seatY - 2 * u);    // back legs
    rect(c.chairDark, x0 + 11 * u, seatY, 2 * u, feet - seatY - 2 * u);
    rect(c.chair, x0 + u, backTop, 12 * u, 3 * u);                    // top rail
    for (const sx of [1, 4, 6.5, 9, 12]) rect(c.chair, x0 + sx * u, backTop + 3 * u, u, seatY - backTop - 3 * u); // spindles
    rect(c.chair, x0, seatY, 14 * u, 2 * u);                          // seat
    rect(c.chairDark, x0, seatY + 2 * u, 14 * u, u);
    rect(c.chair, x0, seatY + 3 * u, 2 * u, feet - seatY - 3 * u);    // front legs
    rect(c.chair, x0 + 12 * u, seatY + 3 * u, 2 * u, feet - seatY - 3 * u);
    rect(c.chairDark, x0 + 2 * u, seatY + 7 * u, 10 * u, u);          // stretcher
  }

  function drawLampTable(x0) {
    const topY = floorY - 11 * u, feet = floorY + 2 * u;
    const cx = x0 + 5 * u, cy = topY - 4 * u;
    if (night) {                                                       // warm glow
      const g = ctx.createRadialGradient(cx, cy, 2 * u, cx, cy, 26 * u);
      g.addColorStop(0, 'rgba(255, 226, 140, .5)');
      g.addColorStop(1, 'rgba(255, 226, 140, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(cx - 26 * u, cy - 26 * u, 52 * u, 52 * u);
    }
    rect(c.tableDark, x0 + u, topY, u, feet - topY);                  // legs
    rect(c.tableDark, x0 + 8 * u, topY, u, feet - topY);
    rect(c.table, x0, topY, 10 * u, 2 * u);                           // top
    rect(c.table, x0 + u, topY + 6 * u, 8 * u, 3 * u);                // lower tray
    rect(c.tableDark, x0 + u, topY + 9 * u, 8 * u, Math.max(1, u / 2));
    rect(c.lamp, x0 + 3 * u, topY - 7 * u, 4 * u, 7 * u);             // globe lamp
    rect(c.lamp, x0 + 2 * u, topY - 6 * u, 6 * u, 5 * u);
  }

  function drawCatTree(x0) {
    const top = Math.max(0, floorY - 34 * u), feet = floorY + 3 * u;
    rect(c.rope, x0 + 5 * u, top, 4 * u, feet - top);                 // rope post
    for (let ry = top + u; ry < feet - u; ry += 2 * u) rect(c.ropeLine, x0 + 5 * u, ry, 4 * u, Math.max(1, u / 2));
    if (floorY - 18 * u > top) rect(c.wood, x0, floorY - 18 * u, 9 * u, 2 * u); // perch
    rect(c.wood, x0 + 2 * u, feet - u, 8 * u, 2 * u);                 // base
  }
}
