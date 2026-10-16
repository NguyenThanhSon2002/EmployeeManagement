package com.company.hrms.common.util;

import java.time.*;
import java.time.format.DateTimeFormatter;

public final class DateTimeUtils {

    public static final ZoneId ZONE_VN = ZoneId.of("Asia/Ho_Chi_Minh");
    public static final ZoneId ZONE_UTC = ZoneId.of("UTC");

    public static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    public static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");
    public static final DateTimeFormatter ISO_INSTANT_FORMATTER = DateTimeFormatter.ISO_INSTANT;

    private DateTimeUtils() {
    }

    /**
     * Convert local date and local time in Vietnam timezone to UTC Instant
     */
    public static Instant toUtcInstant(LocalDate date, LocalTime time) {
        if (date == null || time == null) {
            return null;
        }
        ZonedDateTime vnZdt = ZonedDateTime.of(date, time, ZONE_VN);
        return vnZdt.toInstant();
    }

    /**
     * Convert UTC Instant to LocalDateTime in Vietnam timezone
     */
    public static LocalDateTime toVnLocalDateTime(Instant instant) {
        if (instant == null) {
            return null;
        }
        return LocalDateTime.ofInstant(instant, ZONE_VN);
    }

    /**
     * Format Instant to ISO-8601 UTC string (e.g. 2026-10-13T08:15:30Z)
     */
    public static String formatUtc(Instant instant) {
        if (instant == null) {
            return null;
        }
        return ISO_INSTANT_FORMATTER.format(instant);
    }
}
