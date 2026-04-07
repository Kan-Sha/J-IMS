package com.jims.backend.util;

import java.time.LocalDate;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Maps UI labels (e.g. "Tháng 3-4") to canonical DB/API form {@code YYYY-MM} (first month of the pair).
 */
public final class BillingPeriodUtil {

    private static final Pattern DISPLAY = Pattern.compile("^Tháng\\s(\\d{1,2})-(\\d{1,2})(?:/(\\d{4}))?$");
    private static final Pattern CANONICAL = Pattern.compile("^(\\d{4})-(\\d{2})$");

    private BillingPeriodUtil() {
    }

    /**
     * @param raw     UI string ("Tháng 3-4") or already-canonical "YYYY-MM"
     * @param year    calendar year to use when resolving display labels (typically {@link LocalDate#now()}'s year)
     * @return canonical {@code YYYY-MM} or null if invalid
     */
    public static String toCanonical(String raw, int year) {
        if (raw == null) {
            return null;
        }
        String s = raw.trim();
        if (s.isEmpty()) {
            return null;
        }

        Matcher cm = CANONICAL.matcher(s);
        if (cm.matches()) {
            int y = Integer.parseInt(cm.group(1), 10);
            int mo = Integer.parseInt(cm.group(2), 10);
            if (y < 2000 || y > 2100 || mo < 1 || mo > 12) {
                return null;
            }
            return String.format("%04d-%02d", y, mo);
        }

        Matcher dm = DISPLAY.matcher(s);
        if (!dm.matches()) {
            return null;
        }
        int a = Integer.parseInt(dm.group(1), 10);
        int b = Integer.parseInt(dm.group(2), 10);
        if (a < 1 || a > 11 || b < 2 || b > 12 || b != a + 1) {
            return null;
        }
        int y = year;
        if (dm.group(3) != null) {
            y = Integer.parseInt(dm.group(3), 10);
        }
        return String.format("%d-%02d", y, a);
    }

    /**
     * Inverse of {@link #toCanonical(String, int)} for canonical months {@code 01,03,…,11} produced by the UI pairs.
     */
    public static String toDisplayLabel(String canonical) {
        if (canonical == null) {
            return null;
        }
        String s = canonical.trim();
        Matcher cm = CANONICAL.matcher(s);
        if (!cm.matches()) {
            return s;
        }
        int mo = Integer.parseInt(cm.group(2), 10);
        if (mo >= 1 && mo <= 11 && mo % 2 == 1) {
            return "Tháng " + mo + "-" + (mo + 1) + "/" + cm.group(1);
        }
        return s;
    }

    public static String toShortDisplay(String canonical) {
        if (canonical == null) return null;
        Matcher cm = CANONICAL.matcher(canonical.trim());
        if (!cm.matches()) return canonical;
        int mo = Integer.parseInt(cm.group(2), 10);
        int year = Integer.parseInt(cm.group(1), 10);
        if (mo >= 1 && mo <= 11 && mo % 2 == 1) {
            return mo + "-" + (mo + 1) + "/" + year;
        }
        return canonical;
    }
}
