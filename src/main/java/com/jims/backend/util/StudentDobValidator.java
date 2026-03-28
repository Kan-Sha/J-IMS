package com.jims.backend.util;

import java.time.LocalDate;
import java.util.Optional;

public final class StudentDobValidator {
    private StudentDobValidator() {
    }

    /**
     * Student must be at least 5 years old (no maximum age).
     */
    public static Optional<String> validateMinimumAgeFive(LocalDate dob) {
        if (dob == null) {
            return Optional.of("Ngày sinh không hợp lệ!");
        }

        LocalDate today = LocalDate.now();
        LocalDate minDob = today.minusYears(5);

        if (dob.isAfter(minDob)) {
            return Optional.of("Độ tuổi học sinh phải từ 5 tuổi trở lên");
        }
        return Optional.empty();
    }
}
