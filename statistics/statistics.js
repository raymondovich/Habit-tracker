/* =========================================================
   JOB & CASH
   STATISTICS ENGINE
   Version 3.1
   ========================================================= */

(function () {

    "use strict";

    const VERSION = "3.1";

    /* =====================================================
       STATE
    ===================================================== */

    let chartMetric = "earnings";
    let chartRange = "day";
    let initialized = false;


    /* =====================================================
       BASIC DATA
    ===================================================== */

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


    /* =====================================================
       DATE HELPERS
    ===================================================== */

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

        return [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, "0"),
            String(date.getDate()).padStart(2, "0")
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
            String(date.getMonth() + 1).padStart(2, "0")
        );
    }


    function getYearKey(date) {

        return String(
            date.getFullYear()
        );
    }


    /* =====================================================
       FORMATTERS
    ===================================================== */

    function formatMoney(value) {

        return (
            Math.round(Number(value) || 0)
                .toLocaleString("ru-RU") +
            " ₽"
        );
    }


    function formatChartValue(metric, value) {

        if (metric === "hours") {

            return (
                Number(value || 0)
                    .toFixed(1) +
                " ч"
            );
        }


        if (metric === "shifts") {

            return (
                Math.round(Number(value) || 0) +
                " смен"
            );
        }


        return formatMoney(value);
    }


    function formatPeriodLabel(period, type) {

        if (!period) return "—";

        const parts = period.split("-");

        if (type === "day") {

            if (parts.length !== 3) {
                return period;
            }

            return (
                parts[2] +
                "." +
                parts[1]
            );
        }


        if (type === "week") {

            if (parts.length !== 3) {
                return period;
            }

            return (
                parts[2] +
                "." +
                parts[1]
            );
        }


        if (type === "month") {

            if (parts.length !== 2) {
                return period;
            }

            return (
                parts[1] +
                "." +
                parts[0].slice(2)
            );
        }


        if (type === "year") {

            return period;
        }


        return period;
    }


    /* =====================================================
       STATISTICS CORE
    ===================================================== */

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

        shifts.forEach(function (shift) {

            addShiftToStats(
                stats,
                shift
            );

        });

        return finalizeStats(stats);
    }


    /* =====================================================
       PERIOD STATISTICS
    ===================================================== */

    function getDailyStatistics() {

        const shifts =
            getNormalizedShifts();

        const result = {};

        shifts.forEach(function (shift) {

            const date =
                parseDate(shift.date);

            if (!date) return;

            const key =
                formatDateKey(date);

            if (!result[key]) {

                result[key] =
                    createEmptyStats();
            }

            addShiftToStats(
                result[key],
                shift
            );

        });


        Object.keys(result)
            .forEach(function (key) {

                finalizeStats(
                    result[key]
                );

            });


        return result;
    }


    function getWeeklyStatistics() {

        const shifts =
            getNormalizedShifts();

        const result = {};

        shifts.forEach(function (shift) {

            const date =
                parseDate(shift.date);

            if (!date) return;

            const key =
                getWeekKey(date);

            if (!result[key]) {

                result[key] =
                    createEmptyStats();
            }

            addShiftToStats(
                result[key],
                shift
            );

        });


        Object.keys(result)
            .forEach(function (key) {

                finalizeStats(
                    result[key]
                );

            });


        return result;
    }


    function getMonthlyStatistics() {

        const shifts =
            getNormalizedShifts();

        const result = {};

        shifts.forEach(function (shift) {

            const date =
                parseDate(shift.date);

            if (!date) return;

            const key =
                getMonthKey(date);

            if (!result[key]) {

                result[key] =
                    createEmptyStats();
            }

            addShiftToStats(
                result[key],
                shift
            );

        });


        Object.keys(result)
            .forEach(function (key) {

                finalizeStats(
                    result[key]
                );

            });


        return result;
    }


    function getYearlyStatistics() {

        const shifts =
            getNormalizedShifts();

        const result = {};

        shifts.forEach(function (shift) {

            const date =
                parseDate(shift.date);

            if (!date) return;

            const key =
                getYearKey(date);

            if (!result[key]) {

                result[key] =
                    createEmptyStats();
            }

            addShiftToStats(
                result[key],
                shift
            );

        });


        Object.keys(result)
            .forEach(function (key) {

                finalizeStats(
                    result[key]
                );

            });


        return result;
    }


    /* =====================================================
       CURRENT / PREVIOUS PERIOD
    ===================================================== */

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

            return shifts.filter(function (shift) {

                const date =
                    parseDate(shift.date);

                return (
                    date &&
                    getMonthKey(date) === key
                );

            });
        }


        if (period === "year") {

            const key =
                getYearKey(now);

            return shifts.filter(function (shift) {

                const date =
                    parseDate(shift.date);

                return (
                    date &&
                    getYearKey(date) === key
                );

            });
        }


        const key =
            getWeekKey(now);

        return shifts.filter(function (shift) {

            const date =
                parseDate(shift.date);

            return (
                date &&
                getWeekKey(date) === key
            );

        });
    }


    function getCurrentPeriodSummary() {

        return aggregateShifts(
            getCurrentPeriodShifts()
        );
    }


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
                getMonthKey(previous);

            return shifts.filter(function (shift) {

                const date =
                    parseDate(shift.date);

                return (
                    date &&
                    getMonthKey(date) === key
                );

            });
        }


        if (period === "year") {

            const key =
                String(
                    now.getFullYear() - 1
                );

            return shifts.filter(function (shift) {

                const date =
                    parseDate(shift.date);

                return (
                    date &&
                    getYearKey(date) === key
                );

            });
        }


        const currentMonday =
            getMonday(now);

        const previousMonday =
            new Date(currentMonday);

        previousMonday.setDate(
            previousMonday.getDate() - 7
        );

        const key =
            getWeekKey(previousMonday);

        return shifts.filter(function (shift) {

            const date =
                parseDate(shift.date);

            return (
                date &&
                getWeekKey(date) === key
            );

        });
    }


    function getPreviousPeriodSummary() {

        return aggregateShifts(
            getPreviousPeriodShifts()
        );
    }


    /* =====================================================
       COMPARISON
    ===================================================== */

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


    /* =====================================================
       ALL TIME
    ===================================================== */

    function getAllTimeSummary() {

        return aggregateShifts(
            getNormalizedShifts()
        );
    }


    /* =====================================================
       BEST PERIODS
    ===================================================== */

    function getBestFromMap(map) {

        const entries =
            Object.entries(map);

        if (!entries.length) {
            return null;
        }


        let best = null;


        entries.forEach(function (
            [period, stats]
        ) {

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

        });


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

            .map(function (
                [period, stats]
            ) {

                return {
                    period,
                    ...stats
                };

            })

            .sort(function (a, b) {

                return (
                    b.earnings -
                    a.earnings
                );

            })

            .slice(0, limit);
    }


    /* =====================================================
       HISTORY
    ===================================================== */

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

            .map(function (
                [period, stats]
            ) {

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

            })

            .sort(function (a, b) {

                return a.period.localeCompare(
                    b.period
                );

            });
    }


    /* =====================================================
       CHART DATA
    ===================================================== */

    function getChartSeries(
        type = getCurrentPeriod()
    ) {

        const shifts =
            getNormalizedShifts();

        const series = {};


        shifts.forEach(function (shift) {

            const date =
                parseDate(shift.date);

            if (!date) return;


            let key;


            if (type === "day") {

                key =
                    formatDateKey(date);
            }


            if (type === "week") {

                key =
                    getWeekKey(date);
            }


            if (type === "month") {

                key =
                    getMonthKey(date);
            }


            if (type === "year") {

                key =
                    getYearKey(date);
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

        });


        Object.keys(series)
            .forEach(function (key) {

                finalizeStats(
                    series[key]
                );

            });


        return Object.entries(series)

            .map(function (
                [period, stats]
            ) {

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

            })

            .sort(function (a, b) {

                return a.period.localeCompare(
                    b.period
                );

            });
    }


    function getChartData(
        type = getCurrentPeriod(),
        metric = "earnings"
    ) {

        const series =
            getChartSeries(type);


        return series.map(function (item) {

            return {

                period:
                    item.period,

                value:
                    Number(
                        item[metric]
                    ) || 0

            };

        });
    }


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
            ...data.map(function (item) {

                return item.value;

            })
        );
    }


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


        return data.map(function (
            item,
            index
        ) {

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

        });
    }


    /* =====================================================
       PERFORMANCE
    ===================================================== */

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


    /* =====================================================
       MAIN UI
    ===================================================== */

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
                    "За этот месяц";

            } else if (period === "year") {

                earningsPeriod.textContent =
                    "За этот год";

            } else {

                earningsPeriod.textContent =
                    "За эту неделю";
            }
        }
    }


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


    /* =====================================================
       STATISTICS DASHBOARD UI
    ===================================================== */

    function updateStatisticsDashboard() {

        const comparison =
            getPeriodComparison();

        const allTime =
            getAllTimeSummary();


        const current =
            comparison.current;

        const previous =
            comparison.previous;


        const periodLabel =
            document.getElementById(
                "statisticsPeriodLabel"
            );


        if (periodLabel) {

            if (
                comparison.period ===
                "month"
            ) {

                periodLabel.textContent =
                    "Месяц";

            } else if (
                comparison.period ===
                "year"
            ) {

                periodLabel.textContent =
                    "Год";

            } else {

                periodLabel.textContent =
                    "Неделя";
            }
        }


        const currentValue =
            document.getElementById(
                "currentPerformanceValue"
            );

        const previousValue =
            document.getElementById(
                "previousPerformanceValue"
            );

        const changeValue =
            document.getElementById(
                "performanceChangeValue"
            );

        const changeDirection =
            document.getElementById(
                "performanceChangeDirection"
            );


        if (currentValue) {

            currentValue.textContent =
                formatMoney(
                    current.earnings
                );
        }


        if (previousValue) {

            previousValue.textContent =
                formatMoney(
                    previous.earnings
                );
        }


        if (changeValue) {

            if (
                comparison.earnings.percent ===
                null
            ) {

                changeValue.textContent =
                    current.earnings > 0
                        ? "+100%"
                        : "0%";

            } else {

                const percent =
                    comparison.earnings.percent;

                const prefix =
                    percent > 0
                        ? "+"
                        : "";

                changeValue.textContent =
                    prefix +
                    percent.toFixed(1) +
                    "%";
            }
        }


        if (changeDirection) {

            if (
                comparison.earnings.direction ===
                "up"
            ) {

                changeDirection.textContent =
                    "↑";

            } else if (
                comparison.earnings.direction ===
                "down"
            ) {

                changeDirection.textContent =
                    "↓";

            } else {

                changeDirection.textContent =
                    "—";
            }
        }


        const performanceHours =
            document.getElementById(
                "performanceHours"
            );

        const performanceShifts =
            document.getElementById(
                "performanceShifts"
            );

        const performanceAverage =
            document.getElementById(
                "performanceAverage"
            );


        if (performanceHours) {

            performanceHours.textContent =
                Number(
                    current.hours.toFixed(1)
                );
        }


        if (performanceShifts) {

            performanceShifts.textContent =
                current.shifts;
        }


        if (performanceAverage) {

            performanceAverage.textContent =
                formatMoney(
                    current.averageEarnings
                );
        }


        const allTimeEarnings =
            document.getElementById(
                "allTimeEarnings"
            );

        const allTimeHours =
            document.getElementById(
                "allTimeHours"
            );

        const allTimeShifts =
            document.getElementById(
                "allTimeShifts"
            );

        const allTimeAverage =
            document.getElementById(
                "allTimeAverage"
            );


        if (allTimeEarnings) {

            allTimeEarnings.textContent =
                formatMoney(
                    allTime.earnings
                );
        }


        if (allTimeHours) {

            allTimeHours.textContent =
                Number(
                    allTime.hours.toFixed(1)
                );
        }


        if (allTimeShifts) {

            allTimeShifts.textContent =
                allTime.shifts;
        }


        if (allTimeAverage) {

            allTimeAverage.textContent =
                formatMoney(
                    allTime.averageEarnings
                );
        }


        updateBestDashboardUI();

        renderChart();
    }


    /* =====================================================
       BEST DASHBOARD UI
    ===================================================== */

    function updateBestDashboardUI() {

        const bestDay =
            getBestDay();

        const bestWeek =
            getBestWeek();

        const bestMonth =
            getBestMonth();

        const bestYear =
            getBestYear();


        const bestDayDate =
            document.getElementById(
                "bestDayDate"
            );

        const bestMonthDate =
            document.getElementById(
                "bestMonthDate"
            );

        const bestYearDate =
            document.getElementById(
                "bestYearDate"
            );


        if (bestDayDate) {

            bestDayDate.textContent =
                bestDay
                    ? formatPeriodLabel(
                        bestDay.period,
                        "day"
                    )
                    : "—";
        }


        if (bestMonthDate) {

            bestMonthDate.textContent =
                bestMonth
                    ? formatPeriodLabel(
                        bestMonth.period,
                        "month"
                    )
                    : "—";
        }


        if (bestYearDate) {

            bestYearDate.textContent =
                bestYear
                    ? bestYear.period
                    : "—";
        }


        const rows =
            document.querySelectorAll(
                ".best-performance-row"
            );


        if (rows.length >= 4) {

            const values = [

                bestDay,

                bestWeek,

                bestMonth,

                bestYear

            ];


            rows.forEach(function (
                row,
                index
            ) {

                const valueElement =
                    row.querySelector(
                        ".best-performance-value"
                    );

                if (!valueElement) {
                    return;
                }


                const best =
                    values[index];


                valueElement.textContent =
                    best
                        ? formatMoney(
                            best.earnings
                        )
                        : "—";

            });
        }


        const bestWeekDate =
            document.getElementById(
                "bestWeekDate"
            );


        if (bestWeekDate) {

            bestWeekDate.textContent =
                bestWeek
                    ? formatPeriodLabel(
                        bestWeek.period,
                        "week"
                    )
                    : "—";
        }
    }


    /* =====================================================
       SVG CHART
    ===================================================== */

    function renderChart() {

        const container =
            document.getElementById(
                "statisticsChart"
            );


        if (!container) {
            return;
        }


        const data =
            getChartData(
                chartRange,
                chartMetric
            );


        container.innerHTML = "";


        if (!data.length) {

            const empty =
                document.createElement(
                    "div"
                );

            empty.className =
                "statistics-chart-empty";

            empty.textContent =
                "Недостаточно данных";

            container.appendChild(
                empty
            );

            updateChartHeader([]);

            return;
        }


        const width = 1000;

        const height = 320;

        const paddingLeft = 52;

        const paddingRight = 24;

        const paddingTop = 24;

        const paddingBottom = 42;


        const chartWidth =
            width -
            paddingLeft -
            paddingRight;

        const chartHeight =
            height -
            paddingTop -
            paddingBottom;


        const values =
            data.map(function (item) {

                return Number(
                    item.value
                ) || 0;

            });


        const max =
            Math.max(
                ...values
            );


        const safeMax =
            max > 0
                ? max
                : 1;


        const svg =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );


        svg.setAttribute(
            "viewBox",
            `0 0 ${width} ${height}`
        );

        svg.setAttribute(
            "preserveAspectRatio",
            "none"
        );

        svg.classList.add(
            "statistics-svg"
        );


        /* =========================================
           GRID
        ========================================= */

        for (
            let i = 0;
            i <= 4;
            i++
        ) {

            const ratio =
                i / 4;

            const y =
                paddingTop +
                chartHeight * ratio;


            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );


            line.setAttribute(
                "x1",
                paddingLeft
            );

            line.setAttribute(
                "x2",
                width - paddingRight
            );

            line.setAttribute(
                "y1",
                y
            );

            line.setAttribute(
                "y2",
                y
            );

            line.classList.add(
                "statistics-grid-line"
            );


            svg.appendChild(line);
        }


        /* =========================================
           POINTS
        ========================================= */

        const points =
            data.map(function (
                item,
                index
            ) {

                const x =
                    data.length === 1

                        ? paddingLeft +
                          chartWidth / 2

                        : paddingLeft +
                          (
                              index /
                              (data.length - 1)
                          ) *
                          chartWidth;


                const normalized =
                    item.value /
                    safeMax;


                const y =
                    paddingTop +
                    (
                        1 -
                        normalized
                    ) *
                    chartHeight;


                return {
                    x,
                    y,
                    value: item.value,
                    period: item.period
                };

            });


        /* =========================================
           AREA
        ========================================= */

        let areaPath = "";

        points.forEach(function (
            point,
            index
        ) {

            areaPath +=
                index === 0
                    ? `M ${point.x} ${point.y}`
                    : ` L ${point.x} ${point.y}`;

        });


        if (points.length > 0) {

            const last =
                points[points.length - 1];

            const first =
                points[0];


            areaPath +=
                ` L ${last.x} ${paddingTop + chartHeight}`;

            areaPath +=
                ` L ${first.x} ${paddingTop + chartHeight}`;

            areaPath +=
                " Z";


            const area =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );


            area.setAttribute(
                "d",
                areaPath
            );

            area.classList.add(
                "statistics-chart-area"
            );


            svg.appendChild(area);
        }


        /* =========================================
           LINE
        ========================================= */

        let linePath = "";

        points.forEach(function (
            point,
            index
        ) {

            linePath +=
                index === 0
                    ? `M ${point.x} ${point.y}`
                    : ` L ${point.x} ${point.y}`;

        });


        const path =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );


        path.setAttribute(
            "d",
            linePath
        );

        path.classList.add(
            "statistics-chart-line"
        );


        svg.appendChild(path);


        /* =========================================
           POINTS
        ========================================= */

        points.forEach(function (
            point
        ) {

            const circle =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                );


            circle.setAttribute(
                "cx",
                point.x
            );

            circle.setAttribute(
                "cy",
                point.y
            );

            circle.setAttribute(
                "r",
                "5"
            );

            circle.classList.add(
                "statistics-chart-point"
            );


            circle.addEventListener(
                "mouseenter",
                function () {

                    updateChartHeader(
                        data,
                        point.period,
                        point.value
                    );

                }
            );


            circle.addEventListener(
                "click",
                function () {

                    updateChartHeader(
                        data,
                        point.period,
                        point.value
                    );

                }
            );


            svg.appendChild(circle);

        });


        container.appendChild(svg);


        updateChartLabels(data);

        updateChartHeader(
            data
        );
    }


    /* =====================================================
       CHART HEADER
    ===================================================== */

    function updateChartHeader(
        data,
        selectedPeriod = null,
        selectedValue = null
    ) {

        const valueElement =
            document.getElementById(
                "statisticsChartValue"
            );

        const periodElement =
            document.getElementById(
                "statisticsChartPeriod"
            );


        if (!data.length) {

            if (valueElement) {

                valueElement.textContent =
                    formatChartValue(
                        chartMetric,
                        0
                    );
            }

            if (periodElement) {

                periodElement.textContent =
                    "—";
            }

            return;
        }


        let item;


        if (selectedPeriod !== null) {

            item = data.find(function (
                entry
            ) {

                return (
                    entry.period ===
                    selectedPeriod
                );

            });

        }


        if (!item) {

            item =
                data[data.length - 1];
        }


        const value =
            selectedValue !== null
                ? selectedValue
                : item.value;


        if (valueElement) {

            valueElement.textContent =
                formatChartValue(
                    chartMetric,
                    value
                );
        }


        if (periodElement) {

            periodElement.textContent =
                formatPeriodLabel(
                    item.period,
                    chartRange
                );
        }
    }


    /* =====================================================
       CHART LABELS
    ===================================================== */

    function updateChartLabels(data) {

        const labels =
            document.getElementById(
                "statisticsChartLabels"
            );


        if (!labels) {
            return;
        }


        labels.innerHTML = "";


        if (!data.length) {
            return;
        }


        const maxLabels = 7;


        let visibleData =
            data;


        if (
            data.length >
            maxLabels
        ) {

            const step =
                (
                    data.length - 1
                ) /
                (
                    maxLabels - 1
                );


            visibleData = [];


            for (
                let i = 0;
                i < maxLabels;
                i++
            ) {

                const index =
                    Math.round(
                        i * step
                    );

                visibleData.push(
                    data[index]
                );
            }
        }


        visibleData.forEach(
            function (item) {

                const label =
                    document.createElement(
                        "span"
                    );


                label.textContent =
                    formatPeriodLabel(
                        item.period,
                        chartRange
                    );


                labels.appendChild(
                    label
                );

            }
        );
    }


    /* =====================================================
       CHART CONTROLS
    ===================================================== */

    function bindChartControls() {

        const metricSwitcher =
            document.getElementById(
                "statisticsMetricSwitcher"
            );


        if (metricSwitcher) {

            metricSwitcher.addEventListener(
                "click",
                function (event) {

                    const button =
                        event.target.closest(
                            "[data-statistics-metric]"
                        );


                    if (!button) {
                        return;
                    }


                    chartMetric =
                        button.dataset
                            .statisticsMetric;


                    metricSwitcher
                        .querySelectorAll(
                            "[data-statistics-metric]"
                        )
                        .forEach(function (
                            item
                        ) {

                            item.classList.toggle(
                                "active",
                                item === button
                            );

                        });


                    renderChart();

                }
            );
        }


        const rangeSwitcher =
            document.getElementById(
                "statisticsRangeSwitcher"
            );


        if (rangeSwitcher) {

            rangeSwitcher.addEventListener(
                "click",
                function (event) {

                    const button =
                        event.target.closest(
                            "[data-statistics-range]"
                        );


                    if (!button) {
                        return;
                    }


                    chartRange =
                        button.dataset
                            .statisticsRange;


                    rangeSwitcher
                        .querySelectorAll(
                            "[data-statistics-range]"
                        )
                        .forEach(function (
                            item
                        ) {

                            item.classList.toggle(
                                "active",
                                item === button
                            );

                        });


                    renderChart();

                }
            );
        }
    }


    /* =====================================================
       STATISTICS SCREEN
    ===================================================== */

    function openStatistics() {

        const mainScreen =
            document.getElementById(
                "mainScreen"
            );

        const statisticsScreen =
            document.getElementById(
                "statisticsScreen"
            );


        if (!statisticsScreen) {
            return;
        }


        if (mainScreen) {

            mainScreen.hidden =
                true;
        }


        statisticsScreen.hidden =
            false;


        document.body.classList.add(
            "statistics-open"
        );


        updateStatisticsDashboard();


        window.scrollTo(
            0,
            0
        );
    }


    function closeStatistics() {

        const mainScreen =
            document.getElementById(
                "mainScreen"
            );

        const statisticsScreen =
            document.getElementById(
                "statisticsScreen"
            );


        if (statisticsScreen) {

            statisticsScreen.hidden =
                true;
        }


        if (mainScreen) {

            mainScreen.hidden =
                false;
        }


        document.body.classList.remove(
            "statistics-open"
        );


        window.scrollTo(
            0,
            0
        );
    }


    function bindStatisticsScreen() {

        const openButton =
            document.getElementById(
                "statisticsButton"
            );

        const backButton =
            document.getElementById(
                "statisticsBackButton"
            );


        if (openButton) {

            openButton.addEventListener(
                "click",
                function () {

                    openStatistics();

                }
            );
        }


        if (backButton) {

            backButton.addEventListener(
                "click",
                function () {

                    closeStatistics();

                }
            );
        }
    }


    /* =====================================================
       GLOBAL UI UPDATE
    ===================================================== */

    function updateUI() {

        updateCurrentPeriodUI();

        updateBestUI();

        updateStatisticsDashboard();


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


    /* =====================================================
       PERIOD SWITCHER
    ===================================================== */

    function bindPeriodSwitcher() {

        const switcher =
            document.getElementById(
                "periodSwitcher"
            );


        if (!switcher) {
            return;
        }


        switcher.addEventListener(
            "click",
            function () {

                setTimeout(
                    function () {

                        updateCurrentPeriodUI();

                        updateStatisticsDashboard();


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


    /* =====================================================
       EVENTS
    ===================================================== */

    function bindEvents() {

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
    }


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    function initialize() {

        if (initialized) {
            return;
        }


        initialized = true;


        bindStatisticsScreen();

        bindChartControls();

        bindPeriodSwitcher();

        bindEvents();

        updateUI();
    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.JobCashStatistics = {

        version:
            VERSION,

        getPeriod:
            getCurrentPeriod,

        getShifts:
            getNormalizedShifts,

        getCurrentPeriodShifts,

        getCurrentPeriodSummary,

        getPreviousPeriodShifts,

        getPreviousPeriodSummary,

        getPeriodComparison,

        getAllTimeSummary,

        getDailyStatistics,

        getWeeklyStatistics,

        getMonthlyStatistics,

        getYearlyStatistics,

        getHistory,

        getChartSeries,

        getChartData,

        getChartMax,

        getNormalizedChartData,

        getBestDay,

        getBestWeek,

        getBestMonth,

        getBestYear,

        getTopPeriods,

        getPerformanceSummary,

        updateCurrentPeriodUI,

        updateUI,

        openStatistics,

        closeStatistics

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})();