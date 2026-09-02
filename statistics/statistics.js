/* =========================================================
   JOB & CASH
   STATISTICS ENGINE
   Version 3.0
   ========================================================= */
(function () {
    "use strict";
    const VERSION = "3.0";
    /* =========================================================
       DATA ACCESS
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
    /* =========================================================
       NORMALIZATION
       ========================================================= */
    function normalizeShift(shift) {
        if (!shift) return null;
        const date = String(shift.date || "").trim();
        if (!date) return null;
        return {
            id: shift.id,
            date,
            earnings: Number(shift.earnings) || 0,
            hours: Number(shift.hours) || 0,
            rate: Number(shift.rate) || 0,
            start: shift.start || "",
            end: shift.end || ""
        };
    }
    function getNormalizedShifts() {
        return getShifts()
            .map(normalizeShift)
            .filter(Boolean);
    }
    /* =========================================================
       DATE HELPERS
       ========================================================= */
    function parseDate(dateString) {
        if (!dateString) return null;
        const parts = dateString.split("-");
        if (parts.length !== 3) {
            return null;
        }
        const year = Number(parts[0]);
        const month = Number(parts[1]) - 1;
        const day = Number(parts[2]);
        const date = new Date(
            year,
            month,
            day
        );
        if (Number.isNaN(date.getTime())) {
            return null;
        }
        return date;
    }
    function startOfDay(date) {
        const result = new Date(date);
        result.setHours(
            0,
            0,
            0,
            0
        );
        return result;
    }
    function formatDateKey(date) {
        return [
            date.getFullYear(),
            String(
                date.getMonth() + 1
            ).padStart(2, "0"),
            String(
                date.getDate()
            ).padStart(2, "0")
        ].join("-");
    }
    function getMonday(date) {
        const result = startOfDay(date);
        const day = result.getDay();
        const difference =
            day === 0
                ? -6
                : 1 - day;
        result.setDate(
            result.getDate() + difference
        );
        return result;
    }
    function getWeekKey(date) {
        return formatDateKey(
            getMonday(date)
        );
    }
    function getMonthKey(date) {
        return (
            date.getFullYear() +
            "-" +
            String(
                date.getMonth() + 1
            ).padStart(2, "0")
        );
    }
    function getYearKey(date) {
        return String(
            date.getFullYear()
        );
    }
    function formatMoney(value) {
        return (
            Math.round(
                Number(value) || 0
            ).toLocaleString("ru-RU") +
            " ₽"
        );
    }
    /* =========================================================
       BASIC STATS
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
    function addShiftToStats(
        stats,
        shift
    ) {
        stats.earnings += shift.earnings;
        stats.hours += shift.hours;
        stats.shifts += 1;
    }
    function finalizeStats(stats) {
        if (stats.shifts > 0) {
            stats.averageEarnings =
                stats.earnings /
                stats.shifts;
            stats.averageHours =
                stats.hours /
                stats.shifts;
        }
        if (stats.hours > 0) {
            stats.averageEarningsPerHour =
                stats.earnings /
                stats.hours;
            stats.averageRate =
                stats.earnings /
                stats.hours;
        }
        return stats;
    }
    function aggregateShifts(shifts) {
        const stats =
            createEmptyStats();
        shifts.forEach(
            function (shift) {
                addShiftToStats(
                    stats,
                    shift
                );
            }
        );
        return finalizeStats(
            stats
        );
    }
    /* =========================================================
       DAILY
       ========================================================= */
    function getDailyStatistics() {
        const shifts =
            getNormalizedShifts();
        const result = {};
        shifts.forEach(
            function (shift) {
                const date =
                    parseDate(
                        shift.date
                    );
                if (!date) return;
                const key =
                    formatDateKey(
                        date
                    );
                if (!result[key]) {
                    result[key] =
                        createEmptyStats();
                }
                addShiftToStats(
                    result[key],
                    shift
                );
            }
        );
        Object.keys(result).forEach(
            function (key) {
                finalizeStats(
                    result[key]
                );
            }
        );
        return result;
    }
    /* =========================================================
       WEEKLY
       ========================================================= */
    function getWeeklyStatistics() {
        const shifts =
            getNormalizedShifts();
        const result = {};
        shifts.forEach(
            function (shift) {
                const date =
                    parseDate(
                        shift.date
                    );
                if (!date) return;
                const key =
                    getWeekKey(
                        date
                    );
                if (!result[key]) {
                    result[key] =
                        createEmptyStats();
                }
                addShiftToStats(
                    result[key],
                    shift
                );
            }
        );
        Object.keys(result).forEach(
            function (key) {
                finalizeStats(
                    result[key]
                );
            }
        );
        return result;
    }
    /* =========================================================
       MONTHLY
       ========================================================= */
    function getMonthlyStatistics() {
        const shifts =
            getNormalizedShifts();
        const result = {};
        shifts.forEach(
            function (shift) {
                const date =
                    parseDate(
                        shift.date
                    );
                if (!date) return;
                const key =
                    getMonthKey(
                        date
                    );
                if (!result[key]) {
                    result[key] =
                        createEmptyStats();
                }
                addShiftToStats(
                    result[key],
                    shift
                );
            }
        );
        Object.keys(result).forEach(
            function (key) {
                finalizeStats(
                    result[key]
                );
            }
        );
        return result;
    }
    /* =========================================================
       YEARLY
       ========================================================= */
    function getYearlyStatistics() {
        const shifts =
            getNormalizedShifts();
        const result = {};
        shifts.forEach(
            function (shift) {
                const date =
                    parseDate(
                        shift.date
                    );
                if (!date) return;
                const key =
                    getYearKey(
                        date
                    );
                if (!result[key]) {
                    result[key] =
                        createEmptyStats();
                }
                addShiftToStats(
                    result[key],
                    shift
                );
            }
        );
        Object.keys(result).forEach(
            function (key) {
                finalizeStats(
                    result[key]
                );
            }
        );
        return result;
    }
    /* =========================================================
       CURRENT PERIOD
       ========================================================= */
    function getCurrentPeriodShifts() {
        const shifts =
            getNormalizedShifts();
        const period =
            getCurrentPeriod();
        const now =
            new Date();
        if (period === "month") {
            const key =
                getMonthKey(now);
            return shifts.filter(
                function (shift) {
                    const date =
                        parseDate(
                            shift.date
                        );
                    return (
                        date &&
                        getMonthKey(
                            date
                        ) === key
                    );
                }
            );
        }
        if (period === "year") {
            const key =
                getYearKey(now);
            return shifts.filter(
                function (shift) {
                    const date =
                        parseDate(
                            shift.date
                        );
                    return (
                        date &&
                        getYearKey(
                            date
                        ) === key
                    );
                }
            );
        }
        const key =
            getWeekKey(now);
        return shifts.filter(
            function (shift) {
                const date =
                    parseDate(
                        shift.date
                    );
                return (
                    date &&
                    getWeekKey(
                        date
                    ) === key
                );
            }
        );
    }
    function getCurrentPeriodSummary() {
        return aggregateShifts(
            getCurrentPeriodShifts()
        );
    }
    /* =========================================================
       PREVIOUS PERIOD
       ========================================================= */
    function getPreviousPeriodShifts() {
        const shifts =
            getNormalizedShifts();
        const period =
            getCurrentPeriod();
        const now =
            new Date();
        if (period === "month") {
            const previous =
                new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                );
            const key =
                getMonthKey(
                    previous
                );
            return shifts.filter(
                function (shift) {
                    const date =
                        parseDate(
                            shift.date
                        );
                    return (
                        date &&
                        getMonthKey(
                            date
                        ) === key
                    );
                }
            );
        }
        if (period === "year") {
            const key =
                String(
                    now.getFullYear() - 1
                );
            return shifts.filter(
                function (shift) {
                    const date =
                        parseDate(
                            shift.date
                        );
                    return (
                        date &&
                        getYearKey(
                            date
                        ) === key
                    );
                }
            );
        }
        const currentMonday =
            getMonday(now);
        const previousMonday =
            new Date(
                currentMonday
            );
        previousMonday.setDate(
            previousMonday.getDate() - 7
        );
        const key =
            getWeekKey(
                previousMonday
            );
        return shifts.filter(
            function (shift) {
                const date =
                    parseDate(
                        shift.date
                    );
                return (
                    date &&
                    getWeekKey(
                        date
                    ) === key
                );
            }
        );
    }
    function getPreviousPeriodSummary() {
        return aggregateShifts(
            getPreviousPeriodShifts()
        );
    }
    /* =========================================================
       PERIOD COMPARISON
       ========================================================= */
    function calculateChange(
        current,
        previous
    ) {
        if (previous === 0) {
            if (current === 0) {
                return {
                    value: 0,
                    percent: 0,
                    direction: "equal"
                };
            }
            return {
                value: current,
                percent: null,
                direction: "up"
            };
        }
        const value =
            current - previous;
        const percent =
            (value / previous) * 100;
        let direction =
            "equal";
        if (percent > 0) {
            direction = "up";
        }
        if (percent < 0) {
            direction = "down";
        }
        return {
            value,
            percent,
            direction
        };
    }
    function getPeriodComparison() {
        const current =
            getCurrentPeriodSummary();
        const previous =
            getPreviousPeriodSummary();
        return {
            period:
                getCurrentPeriod(),
            current,
            previous,
            earnings:
                calculateChange(
                    current.earnings,
                    previous.earnings
                ),
            hours:
                calculateChange(
                    current.hours,
                    previous.hours
                ),
            shifts:
                calculateChange(
                    current.shifts,
                    previous.shifts
                ),
            averageEarnings:
                calculateChange(
                    current.averageEarnings,
                    previous.averageEarnings
                ),
            averageEarningsPerHour:
                calculateChange(
                    current.averageEarningsPerHour,
                    previous.averageEarningsPerHour
                ),
            averageHours:
                calculateChange(
                    current.averageHours,
                    previous.averageHours
                )
        };
    }
    /* =========================================================
       ALL TIME
       ========================================================= */
    function getAllTimeSummary() {
        return aggregateShifts(
            getNormalizedShifts()
        );
    }
    /* =========================================================
       BEST PERIODS
       ========================================================= */
    function getBestFromMap(map) {
        const entries =
            Object.entries(map);
        if (!entries.length) {
            return null;
        }
        let best = null;
        entries.forEach(
            function ([period, stats]) {
                if (
                    !best ||
                    stats.earnings >
                    best.earnings
                ) {
                    best = {
                        period,
                        ...stats
                    };
                }
            }
        );
        return best;
    }
    function getBestDay() {
        return getBestFromMap(
            getDailyStatistics()
        );
    }
    function getBestWeek() {
        return getBestFromMap(
            getWeeklyStatistics()
        );
    }
    function getBestMonth() {
        return getBestFromMap(
            getMonthlyStatistics()
        );
    }
    function getBestYear() {
        return getBestFromMap(
            getYearlyStatistics()
        );
    }
    /* =========================================================
       TOP PERIODS
       ========================================================= */
    function getTopPeriods(
        type,
        limit = 5
    ) {
        let data;
        switch (type) {
            case "day":
                data =
                    getDailyStatistics();
                break;
            case "week":
                data =
                    getWeeklyStatistics();
                break;
            case "month":
                data =
                    getMonthlyStatistics();
                break;
            case "year":
                data =
                    getYearlyStatistics();
                break;
            default:
                return [];
        }
        return Object.entries(data)
            .map(
                function ([period, stats]) {
                    return {
                        period,
                        ...stats
                    };
                }
            )
            .sort(
                function (a, b) {
                    return (
                        b.earnings -
                        a.earnings
                    );
                }
            )
            .slice(0, limit);
    }
    /* =========================================================
       HISTORY
       ========================================================= */
    function getHistory(type) {
        let data;
        switch (type) {
            case "day":
                data =
                    getDailyStatistics();
                break;
            case "week":
                data =
                    getWeeklyStatistics();
                break;
            case "month":
                data =
                    getMonthlyStatistics();
                break;
            case "year":
                data =
                    getYearlyStatistics();
                break;
            default:
                return [];
        }
        return Object.entries(data)
            .map(
                function ([period, stats]) {
                    return {
                        period,
                        earnings:
                            stats.earnings,
                        hours:
                            stats.hours,
                        shifts:
                            stats.shifts,
                        averageEarnings:
                            stats.averageEarnings,
                        averageEarningsPerHour:
                            stats.averageEarningsPerHour,
                        averageHours:
                            stats.averageHours,
                        averageRate:
                            stats.averageRate
                    };
                }
            )
            .sort(
                function (a, b) {
                    return (
                        a.period.localeCompare(
                            b.period
                        )
                    );
                }
            );
    }
    /* =========================================================
       CHART SERIES
       ========================================================= */
    function getChartSeries(
        type = getCurrentPeriod()
    ) {
        const shifts =
            getNormalizedShifts();
        const series = {};
        shifts.forEach(
            function (shift) {
                const date =
                    parseDate(
                        shift.date
                    );
                if (!date) return;
                let key;
                if (type === "day") {
                    key =
                        formatDateKey(
                            date
                        );
                }
                if (type === "week") {
                    key =
                        getWeekKey(
                            date
                        );
                }
                if (type === "month") {
                    key =
                        getMonthKey(
                            date
                        );
                }
                if (type === "year") {
                    key =
                        getYearKey(
                            date
                        );
                }
                if (!key) return;
                if (!series[key]) {
                    series[key] =
                        createEmptyStats();
                }
                addShiftToStats(
                    series[key],
                    shift
                );
            }
        );
        Object.keys(series).forEach(
            function (key) {
                finalizeStats(
                    series[key]
                );
            }
        );
        return Object.entries(series)
            .map(
                function ([period, stats]) {
                    return {
                        period,
                        earnings:
                            stats.earnings,
                        hours:
                            stats.hours,
                        shifts:
                            stats.shifts,
                        averageEarnings:
                            stats.averageEarnings,
                        averageEarningsPerHour:
                            stats.averageEarningsPerHour
                    };
                }
            )
            .sort(
                function (a, b) {
                    return (
                        a.period.localeCompare(
                            b.period
                        )
                    );
                }
            );
    }
    /* =========================================================
       CHART DATA
       ========================================================= */
    function getChartData(
        type = getCurrentPeriod(),
        metric = "earnings"
    ) {
        const series =
            getChartSeries(type);
        return series.map(
            function (item) {
                return {
                    period:
                        item.period,
                    value:
                        Number(
                            item[metric]
                        ) || 0
                };
            }
        );
    }
    /* =========================================================
       CHART MAX
       ========================================================= */
    function getChartMax(
        type = getCurrentPeriod(),
        metric = "earnings"
    ) {
        const data =
            getChartData(
                type,
                metric
            );
        if (!data.length) {
            return 0;
        }
        return Math.max(
            ...data.map(
                function (item) {
                    return item.value;
                }
            )
        );
    }
    /* =========================================================
       CHART NORMALIZATION
       ========================================================= */
    function getNormalizedChartData(
        type = getCurrentPeriod(),
        metric = "earnings"
    ) {
        const data =
            getChartData(
                type,
                metric
            );
        const max =
            getChartMax(
                type,
                metric
            );
        return data.map(
            function (item, index) {
                return {
                    index,
                    period:
                        item.period,
                    value:
                        item.value,
                    normalized:
                        max > 0
                            ? item.value / max
                            : 0
                };
            }
        );
    }
    /* =========================================================
       PERFORMANCE SUMMARY
       ========================================================= */
    function getPerformanceSummary() {
        const comparison =
            getPeriodComparison();
        return {
            period:
                comparison.period,
            current:
                comparison.current,
            previous:
                comparison.previous,
            comparison,
            allTime:
                getAllTimeSummary(),
            bestDay:
                getBestDay(),
            bestWeek:
                getBestWeek(),
            bestMonth:
                getBestMonth(),
            bestYear:
                getBestYear()
        };
    }
    /* =========================================================
       DASHBOARD UI
       ========================================================= */
    function updateCurrentPeriodUI() {
        const summary =
            getCurrentPeriodSummary();
        const period =
            getCurrentPeriod();
        const totalEarnings =
            document.getElementById(
                "totalEarnings"
            );
        const earningsPeriod =
            document.getElementById(
                "earningsPeriod"
            );
        const shiftCount =
            document.getElementById(
                "shiftCount"
            );
        const workedHours =
            document.getElementById(
                "workedHours"
            );
        const averageEarnings =
            document.getElementById(
                "averageEarnings"
            );
        if (totalEarnings) {
            totalEarnings.textContent =
                formatMoney(
                    summary.earnings
                );
        }
        if (shiftCount) {
            shiftCount.textContent =
                summary.shifts;
        }
        if (workedHours) {
            workedHours.textContent =
                Number(
                    summary.hours.toFixed(1)
                );
        }
        if (averageEarnings) {
            averageEarnings.textContent =
                formatMoney(
                    summary.averageEarnings
                );
        }
        if (earningsPeriod) {
            if (period === "month") {
                earningsPeriod.textContent =
                    "MONTH";
            } else if (period === "year") {
                earningsPeriod.textContent =
                    "YEAR";
            } else {
                earningsPeriod.textContent =
                    "WEEK";
            }
        }
    }
    /* =========================================================
       BEST UI
       ========================================================= */
    function updateBestUI() {
        const bestWeek =
            getBestWeek();
        const bestMonth =
            getBestMonth();
        const bestYear =
            getBestYear();
        const bestWeekElement =
            document.getElementById(
                "bestWeek"
            );
        const bestMonthElement =
            document.getElementById(
                "bestMonth"
            );
        const bestYearElement =
            document.getElementById(
                "bestYear"
            );
        if (bestWeekElement) {
            bestWeekElement.textContent =
                bestWeek
                    ? formatMoney(
                        bestWeek.earnings
                    )
                    : "—";
        }
        if (bestMonthElement) {
            bestMonthElement.textContent =
                bestMonth
                    ? formatMoney(
                        bestMonth.earnings
                    )
                    : "—";
        }
        if (bestYearElement) {
            bestYearElement.textContent =
                bestYear
                    ? formatMoney(
                        bestYear.earnings
                    )
                    : "—";
        }
    }
    /* =========================================================
       FULL UPDATE
       ========================================================= */
    function updateUI() {
        updateCurrentPeriodUI();
        updateBestUI();
        window.dispatchEvent(
            new CustomEvent(
                "jobcash:statisticschange",
                {
                    detail: {
                        version:
                            VERSION,
                        period:
                            getCurrentPeriod(),
                        summary:
                            getCurrentPeriodSummary(),
                        comparison:
                            getPeriodComparison(),
                        chart:
                            getChartData(
                                getCurrentPeriod(),
                                "earnings"
                            )
                    }
                }
            )
        );
    }
    /* =========================================================
       PERIOD SWITCHER
       ========================================================= */
    function bindPeriodSwitcher() {
        const switcher =
            document.getElementById(
                "periodSwitcher"
            );
        if (!switcher) return;
        switcher.addEventListener(
            "click",
            function () {
                setTimeout(
                    function () {
                        updateCurrentPeriodUI();
                        window.dispatchEvent(
                            new CustomEvent(
                                "jobcash:statisticsperiodchange",
                                {
                                    detail: {
                                        period:
                                            getCurrentPeriod(),
                                        summary:
                                            getCurrentPeriodSummary(),
                                        comparison:
                                            getPeriodComparison(),
                                        chart:
                                            getChartData(
                                                getCurrentPeriod(),
                                                "earnings"
                                            )
                                    }
                                }
                            )
                        );
                    },
                    0
                );
            }
        );
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
        version:
            VERSION,
        /* Data */
        getPeriod:
            getCurrentPeriod,
        getShifts:
            getNormalizedShifts,
        /* Current period */
        getCurrentPeriodShifts,
        getCurrentPeriodSummary,
        /* Previous period */
        getPreviousPeriodShifts,
        getPreviousPeriodSummary,
        /* Comparison */
        getPeriodComparison,
        /* All time */
        getAllTimeSummary,
        /* Historical */
        getDailyStatistics,
        getWeeklyStatistics,
        getMonthlyStatistics,
        getYearlyStatistics,
        /* History */
        getHistory,
        /* Chart */
        getChartSeries,
        getChartData,
        getChartMax,
        getNormalizedChartData,
        /* Best */
        getBestDay,
        getBestWeek,
        getBestMonth,
        getBestYear,
        /* Ranking */
        getTopPeriods,
        /* Performance */
        getPerformanceSummary,
        /* UI */
        updateCurrentPeriodUI,
        updateUI
    };
})();