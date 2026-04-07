export const BILLING_CYCLE_MONTHS = 2;

export function generateBillingCycles(year, cycle) {
  var cycleLen = Number(cycle || BILLING_CYCLE_MONTHS);
  var y = Number(year);
  if (!Number.isInteger(y) || y < 2000 || y > 2100) return [];
  if (!Number.isInteger(cycleLen) || cycleLen < 1 || cycleLen > 12) return [];

  var result = [];
  for (var m = 1; m <= 12; m += cycleLen) {
    var end = Math.min(m + cycleLen - 1, 12);
    result.push({
      value: String(y) + '-' + String(m).padStart(2, '0'),
      label: 'Tháng ' + m + '-' + end + '/' + y
    });
  }
  return result;
}

export function billingPeriodToLabel(canonical) {
  if (!canonical) return '';
  var match = String(canonical).trim().match(/^(\d{4})-(\d{2})$/);
  if (!match) return String(canonical);
  var year = Number(match[1]);
  var startMonth = Number(match[2]);
  if (startMonth < 1 || startMonth > 12) return String(canonical);
  var endMonth = Math.min(startMonth + BILLING_CYCLE_MONTHS - 1, 12);
  return 'Tháng ' + startMonth + '-' + endMonth + '/' + year;
}
