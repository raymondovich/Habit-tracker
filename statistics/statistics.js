/* =========================================================
   JOB & CASH
   STATISTICS ENGINE
   Version 2.2
   ========================================================= */
(function () {
    "use strict";
    const VERSION = "2.2";
    /* =========================================================
       HELPERS
       ========================================================= */
    function getShifts() {
        if (
            window.JobCashShifts &&
            typeof window.JobCashShifts.getShifts === "function"
        ) {
            return window.JobCashShifts.getShifts() || [];
        }
        return [];
    }
    function getCurrentPeriod() {
        if (
            window.JobCashEarnings &&
            typeof window.JobCashEarnings.getPeriod === "function"
        ) {
            return window.JobCashEarnings.getPeriod();
        }
        return "week";
    }
    function normalizeShift(shift) {
        if (!shift) return null;
        const date = String(shift.date || "").trim();
        const earnings = Number(shift.earnings) || 0;
        const hours = Number(shift.hours) || 0;
        const rate = Number(shift.rate) || 0;
        if (!date) return null;
        return {
            id: shift.id,
            date,
            earnings,
            hours,
            rate,
            start: shift.start || "",
            end: shift.end || ""
        };
    }
    function getNormalizedShifts() {
        return getShifts()
            .map(normalizeShift)
            .filter(Boolean);
    }
    function parseDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split("-");
        if (parts.length !== 3) return null;
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);
        const date = new Date(year, month, day);
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return date;
    }
    function startOfDay(date) {
        const result = new Date(date);
        result.setHours(0, 0, 0, 0);
        return result;
    }
    function formatDateKey(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    function getMonday(date) {
        const result = startOfDay(date);
        const day = result.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        result.setDate(result.getDate() + diff);
        return result;
    }
    function getWeekKey(date) {
        return formatDateKey(getMonday(date));
    }
    function getMonthKey(date) {
        return `${date.getFullYear()}-${String(
            date.getMonth() + 1
        ).padStart(2, "0")}`;
    }
    function getYearKey(date) {
        return String(date.getFullYear());
    }
    function formatMoney(value) {
        return Math.round(value).toLocaleString("ru-RU") + " ₽";
    }
    /* =========================================================
       AGGREGATION
       ========================================================= */
    function createEmptyStats() {
        return {
            earnings: 0,
            hours: 0,
            shifts: 0,
            averageEarnings: 0,
            averageEarningsPerHour: 0,
            averageHours: 0,
            averageRate: 0
        };
    }
    function addShiftToStats(stats, shift) {
        stats.earnings += shift.earnings;
        stats.hours += shift.hours;
        stats.shifts += 1;
    }
    function finalizeStats(stats) {
        if (stats.shifts > 0) {
            stats.averageEarnings =
                stats.earnings / stats.shifts;
            stats.averageHours =
                stats.hours / stats.shifts;
        }
        if (stats.hours > 0) {
            stats.averageEarningsPerHour =
                stats.earnings / stats.hours;
        }
        if (stats.shifts > 0) {
            stats.averageRate =
                stats.earnings / stats.hours;
        }
        return stats;
    }
    /* =========================================================
       DAILY
       ========================================================= */
    function getDailyStatistics() {
        const shifts = getNormalizedShifts();
        const result = {};
        shifts.forEach(shift => {
            const date = parseDate(shift.date);
            if (!date) return;
            const key = formatDateKey(date);
            if (!result[key]) {
                result[key] = createEmptyStats();
            }
            addShiftToStats(result[key], shift);
        });
        Object.keys(result).forEach(key => {
            finalizeStats(result[key]);
        });
        return result;
    }
    /* =========================================================
       WEEKLY
       ========================================================= */
    function getWeeklyStatistics() {
        const shifts = getNormalizedShifts();
        const result = {};
        shifts.forEach(shift => {
            const date = parseDate(shift.date);
            if (!date) return;
            const key = getWeekKey(date);
            if (!result[key]) {
                result[key] = createEmptyStats();
            }
            addShiftToStats(result[key], shift);
        });
        Object.keys(result).forEach(key => {
            finalizeStats(result[key]);
        });
        return result;
    }
    /* =========================================================
       MONTHLY
       ========================================================= */
    function getMonthlyStatistics() {
        const shifts = getNormalizedShifts();
        const result = {};
        shifts.forEach(shift => {
            const date = parseDate(shift.date);
            if (!date) return;
            const key = getMonthKey(date);
            if (!result[key]) {
                result[key] = createEmptyStats();
            }
            addShiftToStats(result[key], shift);
        });
        Object.keys(result).forEach(key => {
            finalizeStats(result[key]);
        });
        return result;
    }
    /* =========================================================
       YEARLY
       ========================================================= */
    function getYearlyStatistics() {
        const shifts = getNormalizedShifts();
        const result = {};
        shifts.forEach(shift => {
            const date = parseDate(shift.date);
            if (!date) return;
            const key = getYearKey(date);
            if (!result[key]) {
                result[key] = createEmptyStats();
            }
            addShiftToStats(result[key], shift);
        });
        Object.keys(result).forEach(key => {
            finalizeStats(result[key]);
        });
        return result;
    }
    /* =========================================================
       CURRENT PERIOD
       ========================================================= */
    function getCurrentPeriodShifts() {
        const shifts = getNormalizedShifts();
        const period = getCurrentPeriod();
        const now = new Date();
        if (period === "month") {
            const currentMonth = getMonthKey(now);
            return shifts.filter(shift => {
                const date = parseDate(shift.date);
                return date && getMonthKey(date) === currentMonth;
            });
        }
        if (period === "year") {
            const currentYear = getYearKey(now);
            return shifts.filter(shift => {
                const date = parseDate(shift.date);
                return date && getYearKey(date) === currentYear;
            });
        }
        const currentWeek = getWeekKey(now);
        return shifts.filter(shift => {
            const date = parseDate(shift.date);
            return date && getWeekKey(date) === currentWeek;
        });
    }
    function getCurrentPeriodSummary() {
        const shifts = getCurrentPeriodShifts();
        const stats = createEmptyStats();
        shifts.forEach(shift => {
            addShiftToStats(stats, shift);
        });
        return finalizeStats(stats);
    }
    /* =========================================================
       BEST PERIODS
       ========================================================= */
    function getBestFromMap(map) {
        const entries = Object.entries(map);
        if (!entries.length) {
            return null;
        }
        let best = null;
        entries.forEach(([period, stats]) => {
            if (!best || stats.earnings > best.earnings) {
                best = {
                    period,
                    ...stats
                };
            }
        });
        return best;
    }
    function getBestDay() {
        return getBestFromMap(getDailyStatistics());
    }
    function getBestWeek() {
        return getBestFromMap(getWeeklyStatistics());
    }
    function getBestMonth() {
        return getBestFromMap(getMonthlyStatistics());
    }
    function getBestYear() {
        return getBestFromMap(getYearlyStatistics());
    }
    /* =========================================================
       TOP PERIODS
       ========================================================= */
    function getTopPeriods(type, limit = 5) {
        let data;
        switch (type) {
            case "day":
                data = getDailyStatistics();
                break;
            case "week":
                data = getWeeklyStatistics();
                break;
            case "month":
                data = getMonthlyStatistics();
                break;
            case "year":
                data = getYearlyStatistics();
                break;
            default:
                return [];
        }
        return Object.entries(data)
            .map(([period, stats]) => ({
                period,
                ...stats
            }))
            .sort((a, b) => b.earnings - a.earnings)
            .slice(0, limit);
    }
    /* =========================================================
       CURRENT PERIOD → MAIN DASHBOARD
       ========================================================= */
    function updateCurrentPeriodUI() {
        const summary = getCurrentPeriodSummary();
        const period = getCurrentPeriod();
        const totalEarnings =
            document.getElementById("totalEarnings");
        const earningsPeriod =
            document.getElementById("earningsPeriod");
        const shiftCount =
            document.getElementById("shiftCount");
        const workedHours =
            document.getElementById("workedHours");
        const averageEarnings =
            document.getElementById("averageEarnings");
        if (totalEarnings) {
            totalEarnings.textContent =
                formatMoney(summary.earnings);
        }
        if (shiftCount) {
            shiftCount.textContent =
                summary.shifts;
        }
        if (workedHours) {
            workedHours.textContent =
                Number(summary.hours.toFixed(1));
        }
        if (averageEarnings) {
            averageEarnings.textContent =
                formatMoney(summary.averageEarnings);
        }
        if (earningsPeriod) {
            if (period === "month") {
                earningsPeriod.textContent = "MONTH";
            } else if (period === "year") {
                earningsPeriod.textContent = "YEAR";
            } else {
                earningsPeriod.textContent = "WEEK";
            }
        }
    }
    /* =========================================================
       BEST PERIOD UI
       ========================================================= */
    function updateBestUI() {
        const bestWeek = getBestWeek();
        const bestMonth = getBestMonth();
        const bestYear = getBestYear();
        const bestWeekElement =
            document.getElementById("bestWeek");
        const bestMonthElement =
            document.getElementById("bestMonth");
        const bestYearElement =
            document.getElementById("bestYear");
        if (bestWeekElement) {
            bestWeekElement.textContent =
                bestWeek
                    ? formatMoney(bestWeek.earnings)
                    : "—";
        }
        if (bestMonthElement) {
            bestMonthElement.textContent =
                bestMonth
                    ? formatMoney(bestMonth.earnings)
                    : "—";
        }
        if (bestYearElement) {
            bestYearElement.textContent =
                bestYear
                    ? formatMoney(bestYear.earnings)
                    : "—";
        }
    }
    /* =========================================================
       FULL UI UPDATE
       ========================================================= */
    function updateUI() {
        updateCurrentPeriodUI();
        updateBestUI();
        window.dispatchEvent(
            new CustomEvent("jobcash:statisticschange", {
                detail: {
                    version: VERSION,
                    period: getCurrentPeriod(),
                    summary: getCurrentPeriodSummary()
                }
            })
        );
    }
    /* =========================================================
       PERIOD SWITCHER BRIDGE
       ========================================================= */
    function bindPeriodSwitcher() {
        const switcher =
            document.getElementById("periodSwitcher");
        if (!switcher) return;
        switcher.addEventListener("click", function () {
            /*
             * earnings.js processes the same click first.
             * setTimeout guarantees that its currentPeriod
             * has already been updated before Statistics reads it.
             */
            setTimeout(function () {
                updateCurrentPeriodUI();
                window.dispatchEvent(
                    new CustomEvent(
                        "jobcash:statisticsperiodchange",
                        {
                            detail: {
                                period: getCurrentPeriod(),
                                summary: getCurrentPeriodSummary()
                            }
                        }
                    )
                );
            }, 0);
        });
    }
    /* =========================================================
       EVENTS
       ========================================================= */
    window.addEventListener(
        "jobcash:shiftschange",
        function () {
            updateUI();
        }
    );
    window.addEventListener(
        "jobcash:ratechange",
        function () {
            updateUI();
        }
    );
    window.addEventListener(
        "DOMContentLoaded",
        function () {
            bindPeriodSwitcher();
            updateUI();
        }
    );
    /* =========================================================
       PUBLIC API
       ========================================================= */
    window.JobCashStatistics = {
        version: VERSION,
        getPeriod: getCurrentPeriod,
        getShifts: getNormalizedShifts,
        getCurrentPeriodShifts,
        getCurrentPeriodSummary,
        getDailyStatistics,
        getWeeklyStatistics,
        getMonthlyStatistics,
        getYearlyStatistics,
        getBestDay,
        getBestWeek,
        getBestMonth,
        getBestYear,
        getTopPeriods,
        updateCurrentPeriodUI,
        updateUI
    };
})();