// The image maths behind "Edit text in image" (src/imageTextFill.js):
// finding the letters in the box, filling them in, and never touching a
// pixel outside the box.
import { test } from "node:test";
import assert from "node:assert/strict";
import { findLetters, boxMask, quickFill, blendInBox, fontSizeForLines } from "../src/imageTextFill.js";

const W = 240, H = 120;
// A soft left-to-right gradient (like a card background) with a little
// noise, and dark "letters" (vertical strokes) in the middle.
function makeImage() {
  const data = new Uint8ClampedArray(W * H * 4);
  let s = 7;
  const rand = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const base = 200 + (x / W) * 40 + (rand() - 0.5) * 6;
      data[i] = base; data[i + 1] = base - 10; data[i + 2] = base - 30; data[i + 3] = 255;
    }
  }
  const letters = [];
  for (let k = 0; k < 6; k++) {
    const x0 = 80 + k * 14;
    for (let y = 50; y < 72; y++) for (let x = x0; x < x0 + 4; x++) {
      const i = (y * W + x) * 4;
      data[i] = 40; data[i + 1] = 30; data[i + 2] = 20;
      letters.push(y * W + x);
    }
  }
  return { data, letters };
}
const BOX = { x: 70, y: 40, w: 100, h: 42 };
const inBox = (p) => { const x = p % W, y = Math.floor(p / W); return x >= BOX.x && x < BOX.x + BOX.w && y >= BOX.y && y < BOX.y + BOX.h; };

test("finds the letters, not the background, and gives their own bounding box", () => {
  const { data, letters } = makeImage();
  const found = findLetters(data, W, H, BOX);
  assert.ok(found, "letters found");
  for (const p of letters) assert.equal(found.mask[p], 1);
  assert.deepEqual(found.bbox, { x: 80, y: 50, w: 74, h: 22 });
  assert.equal(found.color, "#281e14");
  // The mask is wider than the letters, but stays far from covering the box.
  const on = found.mask.reduce((n, v) => n + v, 0);
  assert.ok(on > letters.length && on < BOX.w * BOX.h * 0.8);
  for (let p = 0; p < W * H; p++) if (found.mask[p]) assert.ok(inBox(p), "mask never leaves the box");
});

test("a plain box with nothing in it isn't mistaken for letters", () => {
  const { data } = makeImage();
  assert.equal(findLetters(data, W, H, { x: 5, y: 5, w: 50, h: 30 }), null);
});

test("quick fill replaces the letters with background-like color", () => {
  const { data, letters } = makeImage();
  const { mask } = findLetters(data, W, H, BOX);
  const filled = quickFill(data, W, H, mask, BOX);
  for (const p of letters) {
    const i = p * 4;
    assert.ok(filled[i] > 190 && filled[i] < 250, `pixel ${p} red=${filled[i]}`);
    assert.ok(Math.abs(filled[i + 1] - (filled[i] - 10)) < 12);
  }
});

test("quick fill on the whole box also works (no letters detected case)", () => {
  const { data } = makeImage();
  const mask = boxMask(W, H, BOX);
  const filled = quickFill(data, W, H, mask, BOX);
  const centre = ((BOX.y + 20) * W + BOX.x + 50) * 4;
  assert.ok(filled[centre] > 190 && filled[centre] < 250);
});

test("blending changes nothing outside the box, even with a soft edge", () => {
  const { data } = makeImage();
  const { mask } = findLetters(data, W, H, BOX);
  const edited = new Uint8ClampedArray(data.length).fill(0); // an "AI result" that is completely different everywhere
  const out = blendInBox(data, edited, W, H, mask, BOX, 2);
  let changedInside = 0;
  for (let p = 0; p < W * H; p++) {
    const same = [0, 1, 2, 3].every((c) => out[p * 4 + c] === data[p * 4 + c]);
    if (!inBox(p)) assert.ok(same, `pixel ${p} outside the box changed`);
    else if (!same) changedInside++;
  }
  assert.ok(changedInside > 0);
  // Pixels inside the box but away from the letters stay as they were.
  const far = (BOX.y + 2) * W + BOX.x + 2;
  assert.equal(out[far * 4], data[far * 4]);
});

test("font size from the letters' height", () => {
  assert.equal(Math.round(fontSizeForLines(21, 1)), 20);
  assert.equal(Math.round(fontSizeForLines(77, 2)), 31);
});
