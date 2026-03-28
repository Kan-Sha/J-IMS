package com.jims.backend.util;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * UTF-8 URL encoding/decoding for Java 8 ({@link URLDecoder}/{@link URLEncoder} use checked exceptions).
 */
public final class UrlEncodingUtil {

    private UrlEncodingUtil() {
    }

    public static String decodeUtf8(String s) {
        if (s == null) {
            return null;
        }
        try {
            return URLDecoder.decode(s, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException("UTF-8 must be supported", e);
        }
    }

    public static String encodeUtf8(String s) {
        if (s == null) {
            return null;
        }
        try {
            return URLEncoder.encode(s, StandardCharsets.UTF_8.name());
        } catch (UnsupportedEncodingException e) {
            throw new IllegalStateException("UTF-8 must be supported", e);
        }
    }
}
