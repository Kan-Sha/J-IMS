export function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function tokenize(str) {
  return normalize(str)
    .split(/\s+/)
    .map(function (t) { return t.trim(); })
    .filter(Boolean);
}

export function matchName(search, target) {
  const searchTokens = tokenize(search);
  if (!searchTokens.length) return true;
  const targetTokens = tokenize(target);
  return searchTokens.every(function (token) {
    return targetTokens.some(function (t) { return t === token; });
  });
}

export function matchAgainstFields(search, fields) {
  const searchTokens = tokenize(search);
  if (!searchTokens.length) return true;
  let allTokens = [];
  (fields || []).forEach(function (f) {
    allTokens = allTokens.concat(tokenize(f));
  });
  return searchTokens.every(function (token) {
    return allTokens.some(function (t) { return t === token; });
  });
}

/**
 * Invoice list keyword filter: substring match on invoice/student id (case-insensitive, trim);
 * name keeps token-based matching for multi-word searches.
 */
export function matchesInvoiceListSearch(keyword, item) {
  const raw = String(keyword || '').trim();
  if (!raw) return true;
  const inv = normalize(String(item.invoiceId || ''));
  const sid = normalize(String(item.studentId || ''));
  const invCompact = inv.replace(/-/g, '');
  const name = item.studentName || '';
  const tokens = tokenize(raw);
  return tokens.every(function (token) {
    if (inv.includes(token) || sid.includes(token)) return true;
    const tCompact = token.replace(/-/g, '');
    if (tCompact && invCompact.includes(tCompact)) return true;
    return matchName(token, name);
  });
}
