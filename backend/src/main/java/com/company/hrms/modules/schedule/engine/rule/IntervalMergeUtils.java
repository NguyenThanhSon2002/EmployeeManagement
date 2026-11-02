package com.company.hrms.modules.schedule.engine.rule;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class IntervalMergeUtils {

    private IntervalMergeUtils() {
    }

    public static class Interval implements Comparable<Interval> {
        private final LocalDateTime start;
        private final LocalDateTime end;
        private final int breakMinutes;

        public Interval(LocalDateTime start, LocalDateTime end, int breakMinutes) {
            this.start = start;
            this.end = end;
            this.breakMinutes = Math.max(0, breakMinutes);
        }

        public LocalDateTime getStart() {
            return start;
        }

        public LocalDateTime getEnd() {
            return end;
        }

        public int getBreakMinutes() {
            return breakMinutes;
        }

        @Override
        public int compareTo(Interval o) {
            return this.start.compareTo(o.start);
        }
    }

    /**
     * Calculates the net working minutes by merging overlapping intervals (Union of intervals)
     * and deducting break minutes, preventing duplicate counts for handover periods.
     */
    public static long calculateDeduplicatedMinutes(List<Interval> rawList) {
        if (rawList == null || rawList.isEmpty()) {
            return 0;
        }
        List<Interval> list = new ArrayList<>(rawList);
        Collections.sort(list);

        List<Interval> merged = new ArrayList<>();
        Interval current = list.get(0);

        for (int i = 1; i < list.size(); i++) {
            Interval next = list.get(i);
            // Overlapping or touching intervals: start of next is not after end of current
            if (!next.getStart().isAfter(current.getEnd())) {
                LocalDateTime newEnd = next.getEnd().isAfter(current.getEnd()) ? next.getEnd() : current.getEnd();
                int combinedBreak = current.getBreakMinutes() + next.getBreakMinutes();
                current = new Interval(current.getStart(), newEnd, combinedBreak);
            } else {
                merged.add(current);
                current = next;
            }
        }
        merged.add(current);

        long totalNetMinutes = 0;
        for (Interval iv : merged) {
            long rawMins = Duration.between(iv.getStart(), iv.getEnd()).toMinutes();
            totalNetMinutes += Math.max(0, rawMins - iv.getBreakMinutes());
        }
        return totalNetMinutes;
    }
}
