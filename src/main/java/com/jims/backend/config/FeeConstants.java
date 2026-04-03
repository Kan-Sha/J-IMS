package com.jims.backend.config;

import java.math.BigDecimal;

public final class FeeConstants {

    public static final int MAX_FEE_DIGITS = 7;
    public static final BigDecimal MAX_FEE_VALUE = new BigDecimal("9999999");

    private FeeConstants() {
    }
}

