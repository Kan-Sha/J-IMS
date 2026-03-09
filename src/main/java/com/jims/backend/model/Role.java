package com.jims.backend.model;

public enum Role {
    TEACHER("Giáo viên", "/teacher/dashboard", new String[] {"teacher", "giao-vien", "gv"}),
    ASSISTANT("Trợ giảng", "/ta/dashboard", new String[] {"assistant", "ta", "tro-giang"}),
    ADMIN("Admin", "/admin/dashboard", new String[] {"admin"}),
    DIRECTOR("Giám đốc", "/director/dashboard", new String[] {"director", "giam-doc"});

    private final String uiName;
    private final String dashboardPath;
    private final String[] aliases;

    Role(String uiName, String dashboardPath, String[] aliases) {
        this.uiName = uiName;
        this.dashboardPath = dashboardPath;
        this.aliases = aliases;
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
        String normalized = normalize(raw);
        for (Role role : values()) {
            if (normalize(role.uiName).equals(normalized)) {
                return role;
            }
            for (int i = 0; i < role.aliases.length; i++) {
                if (normalize(role.aliases[i]).equals(normalized)) {
                    return role;
                }
            }
        }
        return null;
    }

    private static String normalize(String input) {
        return input == null ? "" : input.trim().toLowerCase();
    }
}
