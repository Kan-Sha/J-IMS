package com.jims.backend.util;

import java.util.Optional;
import java.util.regex.Pattern;

public final class StudentNameValidator {
    /** Phụ huynh (full name) — letters + spaces only. */
    public static final String LETTERS_PARENT_FULL_NAME = "Họ tên chỉ được chứa chữ cái!";
    /** Họ (family name) field — STU-01 maps API {@code lastName} to Họ. */
    public static final String LETTERS_HO = "Họ chỉ được chứa chữ cái!";
    /** Tên (given name) field — STU-01 maps API {@code firstName} to Tên. */
    public static final String LETTERS_TEN = "Tên chỉ được chứa chữ cái!";

    /** @deprecated use {@link #LETTERS_PARENT_FULL_NAME} */
    public static final String LETTERS_ONLY_MESSAGE = LETTERS_PARENT_FULL_NAME;

    // Unicode letters only, allow single/multiple words separated by spaces.
    private static final Pattern LETTERS_ONLY = Pattern.compile("^[\\p{L}]+(?:\\s+[\\p{L}]+)*$");

    private StudentNameValidator() {
    }

    /** Họ tên phụ huynh (non-empty trimmed). */
    public static Optional<String> validateUnicodePersonName(String value) {
        return validateLettersOnly(value, LETTERS_PARENT_FULL_NAME);
    }

    /** Tên (API firstName / given name). */
    public static Optional<String> validateStudentTenLetters(String value) {
        return validateLettersOnly(value, LETTERS_TEN);
    }

    /** Họ (API lastName / family name). */
    public static Optional<String> validateStudentHoLetters(String value) {
        return validateLettersOnly(value, LETTERS_HO);
    }

    /** @deprecated use {@link #validateStudentTenLetters(String)} */
    public static Optional<String> validateFirstNameLettersOnly(String firstName) {
        return validateStudentTenLetters(firstName);
    }

    /** @deprecated use {@link #validateStudentHoLetters(String)} */
    public static Optional<String> validateLastNameLettersOnly(String lastName) {
        return validateStudentHoLetters(lastName);
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

