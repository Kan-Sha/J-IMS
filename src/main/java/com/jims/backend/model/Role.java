package com.jims.backend.model;

public enum Role {
    TEACHER("Giáo viên"),
    ASSISTANT("Trợ giảng"),
    ADMIN("Admin");

    private final String uiName;

    Role(String uiName) {
        this.uiName = uiName;
    }

    public String getUiName() {
        return uiName;
    }

    public static Role fromUiName(String raw) {
        if (raw == null) {
            return null;
        }
        for (Role role : values()) {
            if (role.uiName.equals(raw.trim())) {
                return role;
            }
        }
        return null;
    }
}
