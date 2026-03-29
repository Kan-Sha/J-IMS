package com.jims.backend.util;

import java.util.Optional;
import java.util.regex.Pattern;

public final class PasswordPolicyUtil {
    private static final Pattern STRONG_PASSWORD = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$"
    );

    /** AUT-03: single message for empty / weak new password (after trim). */
    public static final String NEW_PASSWORD_POLICY_MESSAGE =
            "Yêu cầu : Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ thường, chữ hoa, số và kí tự đặc biệt";

    private PasswordPolicyUtil() {
    }

    /**
     * New password: ≥ 8 chars, lowercase, uppercase, digit, special character.
     */
    public static Optional<String> validateNewPassword(String password) {
        if (password == null || password.isEmpty()) {
            return Optional.of(NEW_PASSWORD_POLICY_MESSAGE);
        }
        if (!STRONG_PASSWORD.matcher(password).matches()) {
            return Optional.of(NEW_PASSWORD_POLICY_MESSAGE);
        }
        return Optional.empty();
    }
}
