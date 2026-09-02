(function () {

    "use strict";


    /* =====================================================
       JOB & CASH — STATISTICS 2.0
       ===================================================== */

    const MODULE_NAME =
        "JOB & CASH: Statistics";


    /* =====================================================
       DATA SOURCE
       ===================================================== */

    function getShifts() {

        if (
            window.JobCashShifts &&
            typeof window.JobCashShifts.getShifts === "function"
        ) {

            const shifts =
                window.JobCashShifts.getShifts();

            return Array.isArray(shifts)
                ? shifts
                : [];

        }

        return [];

    }


    /* =====================================================
       NUMBER HELPERS
       ===================================================== */

    function toNumber(value) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : 0;

    }


    function round(value) {

        return Math.round(
            toNumber(value) * 100
        ) / 100;

    }


    function formatMoney(value) {

        return new Intl.NumberFormat(
            "ru-RU",
            {
                maximumFractionDigits: 0
            }
        ).format(
            toNumber(value)
        ) + " ₽";

    }


    /* =====================================================
       DATE HELPERS
       ===================================================== */

    function parseDate(value) {

        if (!value) {
            return null;
        }


        const parts =
            String(value).split("-");


        if (parts.length !== 3) {
            return null;
        }


        const year =
            Number(parts[0]);

        const month =
            Number(parts[1]) - 1;

        const day =
            Number(parts[2]);


        const date =
            new Date(
                year,
                month,
                day
            );


        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month ||
            date.getDate() !== day
        ) {

            return null;

        }


        date.setHours(
            0,
            0,
            0,
            0
        );


        return date;

    }


    function getToday() {

        const date =
            new Date();


        date.setHours(
            0,
            0,
            0,
            0
        );


        return date;

    }


    function getDateKey(date) {

        return (
            date.getFullYear() +
            "-" +
            String(
                date.getMonth() + 1
            ).padStart(2, "0") +
            "-" +
            String(
                date.getDate()
            ).padStart(2, "0")
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


    function getISOWeekInfo(date) {

        const target =
            new Date(date);


        target.setHours(
            0,
            0,
            0,
            0
        );


        const day =
            target.getDay() || 7;


        target.setDate(
            target.getDate() +
            4 -
            day
        );


        const year =
            target.getFullYear();


        const yearStart =
            new Date(
                year,
                0,
                1
            );


        const diff =
            target -
            yearStart;


        const week =
            Math.ceil(
                (
                    diff / 86400000 +
                    1
                ) / 7
            );


        return {
            year,
            week
        };

    }


    function getWeekKey(date) {

        const info =
            getISOWeekInfo(
                date
            );


        return (
            info.year +
            "-W" +
            String(
                info.week
            ).padStart(2, "0")
        );

    }


    /* =====================================================
       NORMALIZATION
       ===================================================== */

    function normalizeShift(shift) {

        if (!shift) {
            return null;
        }


        const date =
            parseDate(
                shift.date
            );


        if (!date) {
            return null;
        }


        return {

            id:
                shift.id,

            date:
                shift.date,

            dateObject:
                date,

            hours:
                toNumber(
                    shift.hours
                ),

            rate:
                toNumber(
                    shift.rate
                ),

            earnings:
                toNumber(
                    shift.earnings
                )

        };

    }


    function getNormalizedShifts() {

        return getShifts()
            .map(normalizeShift)
            .filter(Boolean);

    }


    /* =====================================================
       AGGREGATION
       ===================================================== */

    function aggregate(shifts) {

        let earnings = 0;

        let hours = 0;


        shifts.forEach(
            function (shift) {

                earnings +=
                    shift.earnings;

                hours +=
                    shift.hours;

            }
        );


        const count =
            shifts.length;


        return {

            earnings:
                round(
                    earnings
                ),

            hours:
                round(
                    hours
                ),

            count:

                count,

            averageEarnings:
                round(
                    count > 0
                        ? earnings / count
                        : 0
                ),

            averageHours:
                round(
                    count > 0
                        ? hours / count
                        : 0
                ),

            averageRate:
                round(
                    hours > 0
                        ? earnings / hours
                        : 0
                )

        };

    }


    /* =====================================================
       GROUPING
       ===================================================== */

    function groupBy(
        shifts,
        keyFunction
    ) {

        const groups = {};


        shifts.forEach(
            function (shift) {

                const key =
                    keyFunction(
                        shift
                    );


                if (!groups[key]) {

                    groups[key] = [];

                }


                groups[key].push(
                    shift
                );

            }
        );


        return groups;

    }


    /* =====================================================
       DAILY STATISTICS
       ===================================================== */

    function getDailyStatistics() {

        const shifts =
            getNormalizedShifts();


        const groups =
            groupBy(
                shifts,
                function (shift) {

                    return shift.date;

                }
            );


        return Object.keys(groups)
            .sort()
            .map(
                function (period) {

                    return {

                        period,

                        type:
                            "day",

                        ...aggregate(
                            groups[period]
                        )

                    };

                }
            );

    }


    /* =====================================================
       WEEKLY STATISTICS
       ===================================================== */

    function getWeeklyStatistics() {

        const shifts =
            getNormalizedShifts();


        const groups =
            groupBy(
                shifts,
                function (shift) {

                    return getWeekKey(
                        shift.dateObject
                    );

                }
            );


        return Object.keys(groups)
            .sort()
            .map(
                function (period) {

                    return {

                        period,

                        type:
                            "week",

                        ...aggregate(
                            groups[period]
                        )

                    };

                }
            );

    }


    /* =====================================================
       MONTHLY STATISTICS
       ===================================================== */

    function getMonthlyStatistics() {

        const shifts =
            getNormalizedShifts();


        const groups =
            groupBy(
                shifts,
                function (shift) {

                    return getMonthKey(
                        shift.dateObject
                    );

                }
            );


        return Object.keys(groups)
            .sort()
            .map(
                function (period) {

                    return {

                        period,

                        type:
                            "month",

                        ...aggregate(
                            groups[period]
                        )

                    };

                }
            );

    }


    /* =====================================================
       YEARLY STATISTICS
       ===================================================== */

    function getYearlyStatistics() {

        const shifts =
            getNormalizedShifts();


        const groups =
            groupBy(
                shifts,
                function (shift) {

                    return getYearKey(
                        shift.dateObject
                    );

                }
            );


        return Object.keys(groups)
            .sort()
            .map(
                function (period) {

                    return {

                        period,

                        type:
                            "year",

                        ...aggregate(
                            groups[period]
                        )

                    };

                }
            );

    }


    /* =====================================================
       CURRENT PERIOD
       ===================================================== */

    function getCurrentWeek() {

        const today =
            getToday();


        const key =
            getWeekKey(
                today
            );


        return getNormalizedShifts()
            .filter(
                function (shift) {

                    return (
                        getWeekKey(
                            shift.dateObject
                        ) === key
                    );

                }
            );

    }


    function getCurrentMonth() {

        const today =
            getToday();


        const key =
            getMonthKey(
                today
            );


        return getNormalizedShifts()
            .filter(
                function (shift) {

                    return (
                        getMonthKey(
                            shift.dateObject
                        ) === key
                    );

                }
            );

    }


    function getCurrentYear() {

        const today =
            getToday();


        const key =
            getYearKey(
                today
            );


        return getNormalizedShifts()
            .filter(
                function (shift) {

                    return (
                        getYearKey(
                            shift.dateObject
                        ) === key
                    );

                }
            );

    }


    function getCurrentWeekSummary() {

        return aggregate(
            getCurrentWeek()
        );

    }


    function getCurrentMonthSummary() {

        return aggregate(
            getCurrentMonth()
        );

    }


    function getCurrentYearSummary() {

        return aggregate(
            getCurrentYear()
        );

    }


    /* =====================================================
       BEST PERIOD
       ===================================================== */

    function findBest(statistics) {

        if (
            !statistics.length
        ) {

            return null;

        }


        return statistics.reduce(
            function (best, current) {

                if (!best) {
                    return current;
                }


                return current.earnings >
                    best.earnings
                    ? current
                    : best;

            },
            null
        );

    }


    function getBestDay() {

        return findBest(
            getDailyStatistics()
        );

    }


    function getBestWeek() {

        return findBest(
            getWeeklyStatistics()
        );

    }


    function getBestMonth() {

        return findBest(
            getMonthlyStatistics()
        );

    }


    function getBestYear() {

        return findBest(
            getYearlyStatistics()
        );

    }


    /* =====================================================
       TOP PERIODS
       ===================================================== */

    function getTopPeriods(
        type,
        limit = 5
    ) {

        let statistics = [];


        if (type === "day") {

            statistics =
                getDailyStatistics();

        }

        else if (type === "week") {

            statistics =
                getWeeklyStatistics();

        }

        else if (type === "month") {

            statistics =
                getMonthlyStatistics();

        }

        else if (type === "year") {

            statistics =
                getYearlyStatistics();

        }


        return statistics
            .slice()
            .sort(
                function (a, b) {

                    return (
                        b.earnings -
                        a.earnings
                    );

                }
            )
            .slice(
                0,
                Math.max(
                    1,
                    Number(limit) || 5
                )
            );

    }


    /* =====================================================
       COMPLETE DASHBOARD DATA
       ===================================================== */

    function getDashboardData() {

        const allTime =
            aggregate(
                getNormalizedShifts()
            );


        const currentWeek =
            getCurrentWeekSummary();


        const currentMonth =
            getCurrentMonthSummary();


        const currentYear =
            getCurrentYearSummary();


        const bestDay =
            getBestDay();


        const bestWeek =
            getBestWeek();


        const bestMonth =
            getBestMonth();


        const bestYear =
            getBestYear();


        return {

            allTime,

            current: {

                week:
                    currentWeek,

                month:
                    currentMonth,

                year:
                    currentYear

            },

            best: {

                day:
                    bestDay,

                week:
                    bestWeek,

                month:
                    bestMonth,

                year:
                    bestYear

            },

            history: {

                days:
                    getDailyStatistics(),

                weeks:
                    getWeeklyStatistics(),

                months:
                    getMonthlyStatistics(),

                years:
                    getYearlyStatistics()

            }

        };

    }


    /* =====================================================
       EXISTING UI
       ===================================================== */

    function updateStatisticsUI() {

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


        const bestWeek =
            getBestWeek();


        const bestMonth =
            getBestMonth();


        const bestYear =
            getBestYear();


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
       PUBLIC API
       ===================================================== */

    window.JobCashStatistics = {

        getShifts:
            getNormalizedShifts,

        getAllTimeSummary:
            function () {

                return aggregate(
                    getNormalizedShifts()
                );

            },

        getCurrentWeekSummary:
            getCurrentWeekSummary,

        getCurrentMonthSummary:
            getCurrentMonthSummary,

        getCurrentYearSummary:
            getCurrentYearSummary,

        getDailyStatistics:
            getDailyStatistics,

        getWeeklyStatistics:
            getWeeklyStatistics,

        getMonthlyStatistics:
            getMonthlyStatistics,

        getYearlyStatistics:
            getYearlyStatistics,

        getBestDay:
            getBestDay,

        getBestWeek:
            getBestWeek,

        getBestMonth:
            getBestMonth,

        getBestYear:
            getBestYear,

        getTopPeriods:
            getTopPeriods,

        getDashboardData:
            getDashboardData,

        updateUI:
            updateStatisticsUI

    };


    /* =====================================================
       EVENTS
       ===================================================== */

    window.addEventListener(
        "jobcash:shiftschange",
        function () {

            updateStatisticsUI();


            window.dispatchEvent(
                new CustomEvent(
                    "jobcash:statisticschange"
                )
            );

        }
    );


    /* =====================================================
       INIT
       ===================================================== */

    function init() {

        updateStatisticsUI();


        console.log(
            MODULE_NAME +
            " initialized"
        );

    }


    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    }

    else {

        init();

    }


})();