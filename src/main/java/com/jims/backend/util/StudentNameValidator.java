package com.jims.backend.util;

import java.util.Optional;
import java.util.regex.Pattern;

public final class StudentNameValidator {
    // Unicode letters only, allow single/multiple words separated by spaces.
    private static final Pattern LETTERS_ONLY = Pattern.compile("^[\\p{L}]+(?:\\s+[\\p{L}]+)*$");

    private StudentNameValidator() {
    }

    public static Optional<String> validateFirstNameLettersOnly(String firstName) {
        return validateLettersOnly(firstName, "Tên chỉ được chứa chữ cái");
    }

    public static Optional<String> validateLastNameLettersOnly(String lastName) {
        return validateLettersOnly(lastName, "Họ chỉ được chứa chữ cái");
    }

    private static Optional<String> validateLettersOnly(String value, String message) {
        if (value == null) {
            return Optional.empty();
        }
        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return Optional.empty();
        }
        if (!LETTERS_ONLY.matcher(trimmed).matches()) {
            return Optional.of(message);
        }
        return Optional.empty();
    }
}

