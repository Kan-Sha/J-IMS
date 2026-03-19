package com.jims.backend.model;

import java.text.Normalizer;
import java.util.Locale;

public enum Role {
    ADMIN,
    TEACHER,
    ASSISTANT;

    /**
     * Parse role input from request payload (accepts many aliases + is case-insensitive).
     * This is the backend "single source of truth" for supported roles.
     */
    public static Role fromRequestValue(String raw) {
        if (raw == null) return null;
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) return null;

        // Normalize: remove accents, then keep only letters/digits to make matching stable across DB/frontends.
        String noAccents = Normalizer.normalize(trimmed, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        String compact = noAccents.replaceAll("[^A-Za-z0-9]", "").toUpperCase(Locale.ROOT);

        if ("ADMIN".equals(compact)) {
            return ADMIN;
        }

        // TEACHER aliases: Teacher, Giáo viên, Giao vien, TEACHER, giao-vien...
        if ("TEACHER".equals(compact) || "GIAOVIEN".equals(compact)) {
            return TEACHER;
        }

        // ASSISTANT aliases: TA, Assistant, Trợ giảng, Tro giang, ASSISTANT...
        if ("ASSISTANT".equals(compact) || "TA".equals(compact) || "TROGIANG".equals(compact)) {
            return ASSISTANT;
        }

        return null;
    }
}

