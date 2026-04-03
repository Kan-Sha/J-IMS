package com.jims.backend.util;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public final class StudentIdGenerator {
    private static final DateTimeFormatter YM = DateTimeFormatter.ofPattern("yyyyMM");

    private StudentIdGenerator() {
    }

    public static String generate(String latestId) {
        String prefix = "JS-" + LocalDate.now().format(YM) + "-";
        int nextNumber = 1;

        if (latestId != null && latestId.startsWith(prefix)) {
            String suffix = latestId.substring(prefix.length());
            nextNumber = Integer.parseInt(suffix) + 1;
        }

        return prefix + String.format("%03d", nextNumber);
    }
}
