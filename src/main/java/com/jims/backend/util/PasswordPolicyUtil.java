package com.jims.backend.util;

import java.util.Optional;
import java.util.regex.Pattern;

public final class PasswordPolicyUtil {
    private static final Pattern STRONG_PASSWORD = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$"
    );

    private PasswordPolicyUtil() {
    }

    /**
     * New password: ≥ 8 chars, lowercase, uppercase, digit, special character.
     */
    public static Optional<String> validateNewPassword(String password) {
        if (password == null || password.isEmpty()) {
            return Optional.of("Mật khẩu mới không được để trống!");
        }
        if (!STRONG_PASSWORD.matcher(password).matches()) {
            return Optional.of("Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ thường, chữ hoa, số và ký tự đặc biệt!");
        }
        return Optional.empty();
    }
}
