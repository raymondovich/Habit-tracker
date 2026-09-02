(function () {

    "use strict";


    /* =====================================================
       JOB & CASH — STATISTICS ENGINE
       ===================================================== */

    const MODULE_NAME =
        "JOB & CASH: Statistics";


    /* =====================================================
       DATA SOURCE
       ===================================================== */

    function getShifts() {

        /*
         * Основной источник —
         * публичный API модуля смен.
         */

        if (
            window.JobCashShifts &&
            typeof window.JobCashShifts.getShifts ===
                "function"
        ) {

            const result =
                window.JobCashShifts.getShifts();

            if (Array.isArray(result)) {

                return result;

            }

        }


        /*
         * Fallback для независимой работы
         * статистического движка.
         */

        try {

            const saved =
                localStorage.getItem(
                    "job_cash_shifts"
                );


            if (!saved) {

                return [];

            }


            const parsed =
                JSON.parse(saved);


            if (Array.isArray(parsed)) {

                return parsed;

            }

        } catch (error) {

            console.error(
                MODULE_NAME +
                ": ошибка чтения смен",
                error
            );

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

        return (
            Math.round(
                toNumber(value) * 100
            ) / 100
        );

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


        if (
            !Number.isInteger(year) ||
            !Number.isInteger(month) ||
            !Number.isInteger(day)
        ) {

            return null;

        }


        const date =
            new Date(
                year,
                month,
                day
            );


        /*
         * Проверяем, что дата действительно
         * соответствует введённому значению.
         */

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


    function formatDateKey(date) {

        if (!(date instanceof Date)) {

            return "";

        }


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        return (
            year +
            "-" +
            month +
            "-" +
            day
        );

    }


    function getISOWeekInfo(date) {

        /*
         * ISO week:
         * Monday = первый день недели.
         */

        const target =
            new Date(date);


        target.setHours(
            0,
            0,
            0,
            0
        );


        /*
         * Thursday определяет ISO year.
         */

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
                    (
                        diff /
                        86400000
                    ) + 1
                ) / 7
            );


        return {

            year:
                year,

            week:
                week

        };

    }


    function getWeekKey(date) {

        const info =
            getISOWeekInfo(date);


        return (
            info.year +
            "-W" +
            String(
                info.week
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


    /* =====================================================
       NORMALIZE SHIFT
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
            .map(
                normalizeShift
            )
            .filter(
                function (shift) {

                    return shift !== null;

                }
            );

    }


    /* =====================================================
       AGGREGATE SHIFTS
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


        const averageEarnings =
            count > 0
                ? earnings / count
                : 0;


        const averageHours =
            count > 0
                ? hours / count
                : 0;


        const averageRate =
            hours > 0
                ? earnings / hours
                : 0;


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
                    averageEarnings
                ),

            averageHours:
                round(
                    averageHours
                ),

            averageRate:
                round(
                    averageRate
                )

        };

    }


    /* =====================================================
       GROUP BY
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

                    return formatDateKey(
                        shift.dateObject
                    );

                }
            );


        return Object.keys(groups)
            .sort()
            .map(
                function (key) {

                    const data =
                        aggregate(
                            groups[key]
                        );


                    return {

                        period:
                            key,

                        type:
                            "day",

                        ...data

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
                function (key) {

                    const data =
                        aggregate(
                            groups[key]
                        );


                    return {

                        period:
                            key,

                        type:
                            "week",

                        ...data

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
                function (key) {

                    const data =
                        aggregate(
                            groups[key]
                        );


                    return {

                        period:
                            key,

                        type:
                            "month",

                        ...data

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
                function (key) {

                    const data =
                        aggregate(
                            groups[key]
                        );


                    return {

                        period:
                            key,

                        type:
                            "year",

                        ...data

                    };

                }
            );

    }


    /* =====================================================
       BEST PERIOD
       ===================================================== */

    function findBest(
        statistics
    ) {

        if (
            !Array.isArray(statistics) ||
            statistics.length === 0
        ) {

            return null;

        }


        return statistics.reduce(
            function (best, current) {

                if (!best) {

                    return current;

                }


                if (
                    current.earnings >
                    best.earnings
                ) {

                    return current;

                }


                return best;

            },
            null
        );

    }


    /* =====================================================
       BEST DAY
       ===================================================== */

    function getBestDay() {

        return findBest(
            getDailyStatistics()
        );

    }


    /* =====================================================
       BEST WEEK
       ===================================================== */

    function getBestWeek() {

        return findBest(
            getWeeklyStatistics()
        );

    }


    /* =====================================================
       BEST MONTH
       ===================================================== */

    function getBestMonth() {

        return findBest(
            getMonthlyStatistics()
        );

    }


    /* =====================================================
       BEST YEAR
       ===================================================== */

    function getBestYear() {

        return findBest(
            getYearlyStatistics()
        );

    }


    /* =====================================================
       ALL-TIME SUMMARY
       ===================================================== */

    function getAllTimeSummary() {

        const shifts =
            getNormalizedShifts();


        return aggregate(
            shifts
        );

    }


    /* =====================================================
       CURRENT PERIOD
       ===================================================== */

    function getCurrentPeriodSummary(
        period
    ) {

        const shifts =
            getNormalizedShifts();


        const now =
            new Date();


        now.setHours(
            0,
            0,
            0,
            0
        );


        let filtered = [];


        if (period === "day") {

            const todayKey =
                formatDateKey(
                    now
                );


            filtered =
                shifts.filter(
                    function (shift) {

                        return (
                            formatDateKey(
                                shift.dateObject
                            ) ===
                            todayKey
                        );

                    }
                );

        }


        if (period === "week") {

            const currentWeek =
                getWeekKey(
                    now
                );


            filtered =
                shifts.filter(
                    function (shift) {

                        return (
                            getWeekKey(
                                shift.dateObject
                            ) ===
                            currentWeek
                        );

                    }
                );

        }


        if (period === "month") {

            const currentMonth =
                getMonthKey(
                    now
                );


            filtered =
                shifts.filter(
                    function (shift) {

                        return (
                            getMonthKey(
                                shift.dateObject
                            ) ===
                            currentMonth
                        );

                    }
                );

        }


        if (period === "year") {

            const currentYear =
                getYearKey(
                    now
                );


            filtered =
                shifts.filter(
                    function (shift) {

                        return (
                            getYearKey(
                                shift.dateObject
                            ) ===
                            currentYear
                        );

                    }
                );

        }


        return aggregate(
            filtered
        );

    }


    /* =====================================================
       TOP PERIODS
       ===================================================== */

    function getTopPeriods(
        type,
        limit
    ) {

        const count =
            Number(limit) > 0
                ? Number(limit)
                : 5;


        let statistics = [];


        if (type === "day") {

            statistics =
                getDailyStatistics();

        }


        if (type === "week") {

            statistics =
                getWeeklyStatistics();

        }


        if (type === "month") {

            statistics =
                getMonthlyStatistics();

        }


        if (type === "year") {

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
                count
            );

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.JobCashStatistics = {

        getShifts:
            function () {

                return getNormalizedShifts();

            },


        getAllTimeSummary:
            function () {

                return getAllTimeSummary();

            },


        getCurrentPeriodSummary:
            function (period) {

                return getCurrentPeriodSummary(
                    period
                );

            },


        getDailyStatistics:
            function () {

                return getDailyStatistics();

            },


        getWeeklyStatistics:
            function () {

                return getWeeklyStatistics();

            },


        getMonthlyStatistics:
            function () {

                return getMonthlyStatistics();

            },


        getYearlyStatistics:
            function () {

                return getYearlyStatistics();

            },


        getBestDay:
            function () {

                return getBestDay();

            },


        getBestWeek:
            function () {

                return getBestWeek();

            },


        getBestMonth:
            function () {

                return getBestMonth();

            },


        getBestYear:
            function () {

                return getBestYear();

            },


        getTopPeriods:
            function (
                type,
                limit
            ) {

                return getTopPeriods(
                    type,
                    limit
                );

            },


        reload:
            function () {

                return getAllTimeSummary();

            }

    };


    /* =====================================================
       EVENTS
       ===================================================== */

    window.addEventListener(
        "jobcash:shiftschange",
        function () {

            /*
             * Statistics не хранит состояние,
             * поэтому после изменения смен
             * новые расчёты автоматически
             * получают актуальные данные.
             */

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

    } else {

        init();

    }


})();
