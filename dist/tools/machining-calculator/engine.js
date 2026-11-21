/**
 * 加工計算核心｜純數學，不操作畫面、儲存空間或網路。
 *
 * 計算輸入一律為 number：尺寸 mm、切削速度 m/min、每齒進給 mm/tooth、
 * 每轉進給 mm/rev；輸出轉速 rpm、進給速度 mm/min。畫面單位換算由 app.js 處理。
 * milling／drilling／turning／thread 接收物件；limits／fit 接收依序排列的尺寸。
 * 單位與螺距換算回傳 number，其餘方法回傳物件，所有不合法輸入均拋出 RangeError。
 * 公式與適用範圍見 catalog.js；本檔不提供材料推薦值或 ISO 公差表。
 */

(() => {
  'use strict';

  // ── 01｜共用驗證：拒絕空值、文字、非有限數字與不可表示的計算結果。 ──
  const MM_PER_INCH = 25.4;

  function finite(value, label) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new RangeError(`${label}必須是有限數字。`);
    }
    return value;
  }

  function positive(value, label) {
    finite(value, label);
    if (value <= 0) throw new RangeError(`${label}必須大於 0。`);
    return value;
  }

  function options(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new RangeError('請以物件提供計算參數。');
    }
    return value;
  }

  function result(value, label, requirePositive = false) {
    finite(value, label);
    if (requirePositive && value <= 0) {
      throw new RangeError(`${label}超出可表示的正數範圍。`);
    }
    return value;
  }

  // ── 02｜轉速與進給：D 為有效切削直徑，車削時為工件加工直徑。 ──
  function spindleSpeed(diameter, cuttingSpeed) {
    positive(diameter, '直徑');
    positive(cuttingSpeed, '切削速度');
    return result((cuttingSpeed / diameter) * (1000 / Math.PI), '主軸轉速', true);
  }

  /** {diameter, cuttingSpeed, teeth, feedPerTooth} → {rpm, feedRate} */
  function milling(input) {
    const { diameter, cuttingSpeed, teeth, feedPerTooth } = options(input);
    if (!Number.isSafeInteger(teeth) || teeth <= 0) {
      throw new RangeError('有效刀刃數必須是大於 0 的安全整數。');
    }
    positive(feedPerTooth, '每齒進給');
    const rpm = spindleSpeed(diameter, cuttingSpeed);
    const feedRate = result(rpm * feedPerTooth * teeth, '進給速度', true);
    return { rpm, feedRate };
  }

  /** {diameter, cuttingSpeed, feedPerRev} → {rpm, feedRate}；鑽削與車削共用。 */
  function feedPerRevolution(input) {
    const { diameter, cuttingSpeed, feedPerRev } = options(input);
    positive(feedPerRev, '每轉進給');
    const rpm = spindleSpeed(diameter, cuttingSpeed);
    const feedRate = result(rpm * feedPerRev, '進給速度', true);
    return { rpm, feedRate };
  }

  // ── 03｜螺距與攻牙：只做公制 60° 切削攻牙 D−P 粗估，不計成形攻牙。 ──
  function pitchToTpi(pitch) {
    positive(pitch, '螺距');
    return result(MM_PER_INCH / pitch, '每英吋牙數', true);
  }

  function tpiToPitch(tpi) {
    positive(tpi, '每英吋牙數');
    return result(MM_PER_INCH / tpi, '螺距', true);
  }

  /** {majorDiameter, pitch} → {pitch, tpi, tapDrill}；尺寸均為 mm。 */
  function thread(input) {
    const { majorDiameter, pitch } = options(input);
    positive(majorDiameter, '螺紋公稱直徑');
    const tpi = pitchToTpi(pitch);
    const tapDrill = result(majorDiameter - pitch, '預鑽孔徑', true);
    return { pitch, tpi, tapDrill };
  }

  // ── 04｜圖面尺寸：偏差可以為正、負或零；不代查任何標準公差等級。 ──
  /** limits(nominal, upper, lower) → {min, max} */
  function limits(nominal, upper, lower) {
    positive(nominal, '基本尺寸');
    finite(upper, '上偏差');
    finite(lower, '下偏差');
    if (upper < lower) throw new RangeError('上偏差不得小於下偏差。');
    const min = result(nominal + lower, '最小尺寸', true);
    const max = result(nominal + upper, '最大尺寸', true);
    return { min, max };
  }

  /** fit(holeMin, holeMax, shaftMin, shaftMax) → {minClearance, maxClearance, type} */
  function fit(holeMin, holeMax, shaftMin, shaftMax) {
    positive(holeMin, '孔最小尺寸');
    positive(holeMax, '孔最大尺寸');
    positive(shaftMin, '軸最小尺寸');
    positive(shaftMax, '軸最大尺寸');
    if (holeMin > holeMax || shaftMin > shaftMax) {
      throw new RangeError('孔與軸的最大尺寸不得小於最小尺寸。');
    }
    const minClearance = result(holeMin - shaftMax, '最小間隙');
    const maxClearance = result(holeMax - shaftMin, '最大間隙');
    // 邊界間隙 0 歸入無過盈的一側；兩者都為 0 時屬零間隙特例。
    const type = minClearance >= 0 ? 'clearance' : maxClearance <= 0 ? 'interference' : 'transition';
    return { minClearance, maxClearance, type };
  }

  // ── 05｜長度換算：接受帶正負號的有限數值，亦可換算圖面偏差。 ──
  function mmToInch(mm) {
    finite(mm, '公釐數值');
    const inch = result(mm / MM_PER_INCH, '英吋數值');
    if (mm !== 0 && inch === 0) throw new RangeError('英吋數值小於可表示範圍。');
    return inch;
  }

  function inchToMm(inch) {
    finite(inch, '英吋數值');
    const mm = result(inch * MM_PER_INCH, '公釐數值');
    if (inch !== 0 && mm === 0) throw new RangeError('公釐數值小於可表示範圍。');
    return mm;
  }

  // ── 06｜公開介面：瀏覽器 classic script 與 Node require 皆可直接載入。 ──
  const api = Object.freeze({
    milling,
    drilling: feedPerRevolution,
    turning: feedPerRevolution,
    thread,
    limits,
    fit,
    pitchToTpi,
    tpiToPitch,
    mmToInch,
    inchToMm
  });
  globalThis.MachiningMath = api;
  if (typeof window !== 'undefined') window.MachiningMath = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})();
