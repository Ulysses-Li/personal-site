/**
 * 國際公差｜純資料查詢核心
 * 偏差一律保存 μm，基本尺寸一律保存 mm；顯示單位不改寫原值。
 * 只查已收錄的原表，不用基本偏差公式補出未收錄的公差帶。
 */
(function publish(root) {
  'use strict';
  const gradeOrder = grade => grade === '01' ? -1 : Number(grade);
  const classPattern = /^([A-Za-z]{1,2})(01|0|[1-9]|1[0-8])$/;
  function parseClass(value, member) {
    const match = String(value).match(classPattern);
    if (!match) return null;
    const zone = match[1], inferred = zone === zone.toUpperCase() ? 'hole' : zone === zone.toLowerCase() ? 'shaft' : null;
    return inferred && (!member || inferred === member) ? { member: inferred, zone, grade: match[2] } : null;
  }
  // 尺寸段下開上閉；僅吸收公英制往返造成的機器浮點誤差。
  function snap(value, bounds) {
    return bounds.find(bound => Math.abs(value - bound) <= 8 * Number.EPSILON * Math.max(1, Math.abs(value), Math.abs(bound))) ?? value;
  }
  function contains(row, value) {
    if (!Number.isFinite(value) || value <= 0) return false;
    const d = snap(value, [row.minMm, row.maxMm, row.minimumNominalMm].filter(Number.isFinite));
    return d > row.minMm && d <= row.maxMm && (row.minimumNominalMm === undefined || (row.minimumNominalExclusive ? d > row.minimumNominalMm : d >= row.minimumNominalMm));
  }
  function dimensions(row, nominalMm) {
    if (!contains(row, nominalMm)) throw new RangeError('基本尺寸不在這筆原表的適用範圍。');
    const minimumMm = nominalMm + row.lowerUm / 1000, maximumMm = nominalMm + row.upperUm / 1000;
    if (minimumMm <= 0 || !Number.isFinite(maximumMm)) throw new RangeError('此基本尺寸與公差帶會產生無效的實際尺寸。');
    return { minimumMm, maximumMm, widthUm: row.upperUm - row.lowerUm };
  }
  function parseQuery(value) {
    const text = String(value).trim().replace(/[ØøΦφ⌀]/g, '').replace(/\s*\/\s*/g, '/');
    const it = text.match(/^IT\s*(01|0|[1-9]|1[0-8])(?:\s+(\d+(?:\.\d+)?))?$/i);
    if (it) return { mode: 'it', grade: it[1], nominalMm: it[2] ? Number(it[2]) : null };
    const match = text.match(/^(?:(\d+(?:\.\d+)?)\s*)?([A-Za-z]{1,2}(?:01|0|[1-9]|1[0-8]))(?:\/([A-Za-z]{1,2}(?:01|0|[1-9]|1[0-8])))?(?:\s+(\d+(?:\.\d+)?))?$/);
    if (!match || (match[1] && match[4])) return null;
    const first = parseClass(match[2]), second = match[3] && parseClass(match[3]);
    if (!first || (match[3] && (!second || first.member !== 'hole' || second.member !== 'shaft'))) return null;
    const nominalMm = match[1] || match[4] ? Number(match[1] || match[4]) : null;
    return second ? { mode: 'fit', holeClass: match[2], shaftClass: match[3], nominalMm } : { mode: 'lookup', ...first, nominalMm };
  }
  function create({ holeData, shaftData, itData }) {
    const members = { hole: holeData, shaft: shaftData }, index = new Map();
    for (const [member, data] of Object.entries(members)) {
      for (const row of data.records) {
        const key = `${member}|${row.zone}|${row.grade}`;
        if (!index.has(key)) index.set(key, []);
        index.get(key).push(row);
      }
    }
    for (const rows of index.values()) rows.sort((a, b) => a.minMm - b.minMm || a.maxMm - b.maxMm);
    const bands = (member, zone, grade) => index.get(`${member}|${zone}|${grade}`) || [];
    const classes = member => [...new Set(members[member].records.map(row => row.zone + row.grade))];
    const zones = member => [...new Set(members[member].records.map(row => row.zone))];
    const grades = (member, zone) => [...new Set(members[member].records.filter(row => row.zone === zone).map(row => row.grade))].sort((a, b) => gradeOrder(a) - gradeOrder(b));
    const lookup = ({ member, zone, grade, nominalMm }) => bands(member, zone, grade).find(row => contains(row, nominalMm)) || null;
    const itBands = grade => itData.records.filter(row => row.grade === grade);
    function fit(nominalMm, holeClass, shaftClass) {
      const holeSpec = parseClass(holeClass, 'hole'), shaftSpec = parseClass(shaftClass, 'shaft');
      if (!holeSpec || !shaftSpec) return null;
      const hole = lookup({ ...holeSpec, nominalMm }), shaft = lookup({ ...shaftSpec, nominalMm });
      if (!hole || !shaft) return null;
      if (nominalMm + Math.min(hole.lowerUm, shaft.lowerUm) / 1000 <= 0) return null;
      // 以原表 μm 相減，避免尺寸加減後的浮點誤差影響零間隙判斷。
      const minimumUm = hole.lowerUm - shaft.upperUm, maximumUm = hole.upperUm - shaft.lowerUm;
      const type = minimumUm === 0 && maximumUm === 0 ? '零間隙' : minimumUm >= 0 ? '間隙配合' : maximumUm <= 0 ? '過盈配合' : '過渡配合';
      return { hole, shaft, holeDimensions: dimensions(hole, nominalMm), shaftDimensions: dimensions(shaft, nominalMm), minimumUm, maximumUm, type };
    }
    return { bands, classes, zones, grades, lookup, itBands, fit, contains, dimensions, parseClass, parseQuery,
      itGrades: () => [...new Set(itData.records.map(row => row.grade))].sort((a, b) => gradeOrder(a) - gradeOrder(b)),
      sources: [...holeData.sources, ...shaftData.sources, ...itData.sources].filter((source, i, all) => all.findIndex(other => other.id === source.id) === i),
      counts: { hole: holeData.records.length, shaft: shaftData.records.length, it: itData.records.length }
    };
  }
  const api = { create, contains, dimensions, parseClass, parseQuery };
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IsoToleranceMath = api;
})(typeof window === 'object' ? window : null);
