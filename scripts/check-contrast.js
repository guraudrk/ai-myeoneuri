#!/usr/bin/env node
/**
 * WCAG AAA 대비율 검사 (최소 7:1)
 * 사용: node scripts/check-contrast.js
 */

function sRGBtoLinear(c) {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function hex2luminance(hex) {
  const n = hex.replace("#", "");
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

function ratio(fg, bg) {
  const L1 = Math.max(hex2luminance(fg), hex2luminance(bg));
  const L2 = Math.min(hex2luminance(fg), hex2luminance(bg));
  return (L1 + 0.05) / (L2 + 0.05);
}

// 검사할 조합 (text, background, 이름, 용도)
const CHECKS = [
  // 주요 텍스트
  { fg: "#101828", bg: "#FFFFFF", name: "textPrimary / white",          minRatio: 7 },
  { fg: "#101828", bg: "#F5F7FB", name: "textPrimary / background",      minRatio: 7 },
  { fg: "#344054", bg: "#FFFFFF", name: "textSecondary / white",         minRatio: 7 },
  { fg: "#344054", bg: "#F5F7FB", name: "textSecondary / background",    minRatio: 7 },
  { fg: "#667085", bg: "#FFFFFF", name: "textMuted / white (caption)",   minRatio: 4.5 },

  // primary 버튼
  { fg: "#FFFFFF", bg: "#1939B7", name: "white / primary",               minRatio: 7 },
  { fg: "#1939B7", bg: "#FFFFFF", name: "primary / white",               minRatio: 7 },
  { fg: "#1939B7", bg: "#F5F7FB", name: "primary / background",          minRatio: 7 },
  { fg: "#1939B7", bg: "#EEF2FF", name: "primary / primaryTint",         minRatio: 4.5 },

  // 위험/SOS (20sp 대형 텍스트 — AAA 대형 = 4.5:1, 실제 목표 7:1)
  { fg: "#FFFFFF", bg: "#991B1B", name: "white / danger",                minRatio: 7 },

  // 성공 (대형 텍스트)
  { fg: "#FFFFFF", bg: "#065F46", name: "white / success",               minRatio: 7 },
];

let pass = 0;
let fail = 0;

CHECKS.forEach(({ fg, bg, name, minRatio }) => {
  const r = ratio(fg, bg);
  const ok = r >= minRatio;
  const icon = ok ? "✅" : "❌";
  const label = ok ? "PASS" : "FAIL";
  console.log(`${icon} ${label} ${r.toFixed(2)}:1  ${name}`);
  ok ? pass++ : fail++;
});

console.log(`\n${pass} pass / ${fail} fail`);
if (fail > 0) {
  process.exitCode = 1;
}
