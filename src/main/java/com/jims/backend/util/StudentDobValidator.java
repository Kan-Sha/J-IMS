package com.jims.backend.util;

import java.time.LocalDate;
import java.util.Optional;

public final class StudentDobValidator {
    private StudentDobValidator() {
    }

    /**
     * Business rule:
     * - Age must be between 3 and 20 years old (inclusive), calculated based on system date.
     */
    public static Optional<String> validateAgeBetween3And20Inclusive(LocalDate dob) {
        if (dob == null) {
            return Optional.of("Ngày sinh không hợp lệ!");
        }

        LocalDate today = LocalDate.now();
        LocalDate minDob = today.minusYears(20); // oldest allowed (inclusive)
        LocalDate maxDob = today.minusYears(3);  // youngest allowed (inclusive)

        if (dob.isBefore(minDob) || dob.isAfter(maxDob)) {
            return Optional.of("Độ tuổi học sinh phải từ 3 đến 20 tuổi");
        }
        return Optional.empty();
    }
}

