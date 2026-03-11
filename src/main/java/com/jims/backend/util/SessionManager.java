package com.jims.backend.util;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

public final class SessionManager {
    private static final Map<String, SessionData> SESSIONS = new ConcurrentHashMap<String, SessionData>();

    private SessionManager() {
    }

    public static String createSession(int staffId, String role) {
        String token = UUID.randomUUID().toString();
        SESSIONS.put(token, new SessionData(staffId, role));
        return token;
    }

    public static SessionData getSession(String token) {
        return token == null ? null : SESSIONS.get(token);
    }

    public static void removeSession(String token) {
        if (token != null) {
            SESSIONS.remove(token);
        }
    }

    public static final class SessionData {
        private final int staffId;
        private final String role;

        private SessionData(int staffId, String role) {
            this.staffId = staffId;
            this.role = role;
        }

        public int getStaffId() {
            return staffId;
        }

        public String getRole() {
            return role;
        }
    }
}
