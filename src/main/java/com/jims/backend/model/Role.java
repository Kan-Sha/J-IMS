package com.jims.backend.model;

public enum Role {
    TEACHER("Giáo viên", "/teacher/dashboard"),
    ASSISTANT("Trợ giảng", "/ta/dashboard"),
    ADMIN("Admin", "/admin/dashboard"),
    DIRECTOR("Giám đốc", "/director/dashboard");

    private final String uiName;
    private final String dashboardPath;

    Role(String uiName, String dashboardPath) {
        this.uiName = uiName;
        this.dashboardPath = dashboardPath;
    }

    public String getUiName() {
        return uiName;
    }

    public String getDashboardPath() {
        return dashboardPath;
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
