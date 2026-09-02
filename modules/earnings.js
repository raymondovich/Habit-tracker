(function () {

    "use strict";


    /* =====================================================
       JOB & CASH — EARNINGS MODULE
       ===================================================== */


    const SHIFTS_STORAGE_KEY =
        "job_cash_shifts";


    let currentPeriod =
        "week";


    /* =====================================================
       DOM
       ===================================================== */

    let periodSwitcher = null;

    let totalEarnings = null;

    let earningsPeriod = null;

    let shiftCount = null;

    let workedHours = null;

    let averageEarnings = null;

    let currentDate = null;


    /* =====================================================
       DOM INIT
       ===================================================== */

    function initDOM() {

        periodSwitcher =
            document.getElementById(
                "periodSwitcher"
            );


        totalEarnings =
            document.getElementById(
                "totalEarnings"
            );


        earningsPeriod =
            document.getElementById(
                "earningsPeriod"
            );


        shiftCount =
            document.getElementById(
                "shiftCount"
            );


        workedHours =
            document.getElementById(
                "workedHours"
            );


        averageEarnings =
            document.getElementById(
                "averageEarnings"
            );


        currentDate =
            document.getElementById(
                "currentDate"
            );

    }


    /* =====================================================
       STORAGE
       ===================================================== */

    function getShifts() {

        /*
         First try the public shifts API.
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
         Fallback:
         read directly from localStorage.
        */

        try {

            const saved =
                localStorage.getItem(
                    SHIFTS_STORAGE_KEY
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
                "JOB & CASH: ошибка чтения смен",
                error
            );

        }


        return [];

    }


    /* =====================================================
       MONEY
       ===================================================== */

    function formatMoney(value) {

        const number =
            Number(value) || 0;


        return (
            "€" +
            number.toFixed(2)
        );

    }


    /* =====================================================
       DATE
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
            !Number.isFinite(year) ||
            !Number.isFinite(month) ||
            !Number.isFinite(day)
        ) {

            return null;

        }


        const date =
            new Date(
                year,
                month,
                day
            );


        date.setHours(
            0,
            0,
            0,
            0
        );


        return date;

    }


    /* =====================================================
       WEEK RANGE
       ===================================================== */

    function getWeekRange() {

        const today =
            new Date();


        today.setHours(
            0,
            0,
            0,
            0
        );


        const day =
            today.getDay();


        /*
         Monday = 1
         Sunday = 0

         Week:
         Monday → Sunday
        */

        const daysFromMonday =
            day === 0
                ? 6
                : day - 1;


        const start =
            new Date(today);


        start.setDate(
            today.getDate() -
            daysFromMonday
        );


        start.setHours(
            0,
            0,
            0,
            0
        );


        const end =
            new Date(start);


        end.setDate(
            start.getDate() + 6
        );


        end.setHours(
            23,
            59,
            59,
            999
        );


        return {

            start:
                start,

            end:
                end

        };

    }


    /* =====================================================
       MONTH RANGE
       ===================================================== */

    function getMonthRange() {

        const today =
            new Date();


        const start =
            new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            );


        start.setHours(
            0,
            0,
            0,
            0
        );


        const end =
            new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0
            );


        end.setHours(
            23,
            59,
            59,
            999
        );


        return {

            start:
                start,

            end:
                end

        };

    }


    /* =====================================================
       YEAR RANGE
       ===================================================== */

    function getYearRange() {

        const today =
            new Date();


        const start =
            new Date(
                today.getFullYear(),
                0,
                1
            );


        start.setHours(
            0,
            0,
            0,
            0
        );


        const end =
            new Date(
                today.getFullYear(),
                11,
                31
            );


        end.setHours(
            23,
            59,
            59,
            999
        );


        return {

            start:
                start,

            end:
                end

        };

    }


    /* =====================================================
       CURRENT PERIOD RANGE
       ===================================================== */

    function getCurrentRange() {

        if (
            currentPeriod === "week"
        ) {

            return getWeekRange();

        }


        if (
            currentPeriod === "year"
        ) {

            return getYearRange();

        }


        return getMonthRange();

    }


    /* =====================================================
       FILTER SHIFTS
       ===================================================== */

    function getPeriodShifts() {

        const shifts =
            getShifts();


        const range =
            getCurrentRange();


        return shifts.filter(
            function (shift) {

                const date =
                    parseDate(
                        shift.date
                    );


                if (!date) {

                    return false;

                }


                return (
                    date >= range.start &&
                    date <= range.end
                );

            }
        );

    }


    /* =====================================================
       CALCULATE
       ===================================================== */

    function calculate() {

        const shifts =
            getPeriodShifts();


        let earnings = 0;

        let hours = 0;


        shifts.forEach(
            function (shift) {

                earnings +=
                    Number(
                        shift.earnings
                    ) || 0;


                hours +=
                    Number(
                        shift.hours
                    ) || 0;

            }
        );


        const count =
            shifts.length;


        const average =
            count > 0
                ? earnings / count
                : 0;


        return {

            earnings:
                Math.round(
                    earnings * 100
                ) / 100,

            hours:
                Math.round(
                    hours * 100
                ) / 100,

            count:
                count,

            average:
                Math.round(
                    average * 100
                ) / 100

        };

    }


    /* =====================================================
       PERIOD LABEL
       ===================================================== */

    function getPeriodLabel() {

        if (
            currentPeriod === "week"
        ) {

            return "За эту неделю";

        }


        if (
            currentPeriod === "year"
        ) {

            return "За этот год";

        }


        return "За этот месяц";

    }


    /* =====================================================
       CURRENT DATE
       ===================================================== */

    function renderCurrentDate() {

        if (!currentDate) {

            return;

        }


        const today =
            new Date();


        const months = [

            "Январь",
            "Февраль",
            "Март",
            "Апрель",
            "Май",
            "Июнь",
            "Июль",
            "Август",
            "Сентябрь",
            "Октябрь",
            "Ноябрь",
            "Декабрь"

        ];


        currentDate.textContent =
            months[
                today.getMonth()
            ] +
            " " +
            today.getFullYear();

    }


    /* =====================================================
       RENDER PERIOD BUTTONS
       ===================================================== */

    function renderPeriodButtons() {

        if (!periodSwitcher) {

            return;

        }


        const buttons =
            periodSwitcher.querySelectorAll(
                "[data-period]"
            );


        buttons.forEach(
            function (button) {

                const period =
                    button.dataset.period;


                if (
                    period ===
                    currentPeriod
                ) {

                    button.classList.add(
                        "active"
                    );

                } else {

                    button.classList.remove(
                        "active"
                    );

                }

            }
        );

    }


    /* =====================================================
       RENDER EARNINGS
       ===================================================== */

    function renderEarnings() {

        const data =
            calculate();


        /*
         MAIN EARNINGS
        */

        if (totalEarnings) {

            totalEarnings.textContent =
                formatMoney(
                    data.earnings
                );

        }


        /*
         PERIOD LABEL
        */

        if (earningsPeriod) {

            earningsPeriod.textContent =
                getPeriodLabel();

        }


        /*
         SHIFT COUNT
        */

        if (shiftCount) {

            shiftCount.textContent =
                String(
                    data.count
                );

        }


        /*
         WORKED HOURS
        */

        if (workedHours) {

            workedHours.textContent =
                data.hours.toFixed(2);

        }


        /*
         AVERAGE
        */

        if (averageEarnings) {

            averageEarnings.textContent =
                formatMoney(
                    data.average
                );

        }

    }


    /* =====================================================
       FULL RENDER
       ===================================================== */

    function render() {

        renderPeriodButtons();

        renderEarnings();

        renderCurrentDate();

    }


    /* =====================================================
       CHANGE PERIOD
       ===================================================== */

    function setPeriod(period) {

        if (
            period !== "week" &&
            period !== "month" &&
            period !== "year"
        ) {

            return;

        }


        currentPeriod =
            period;


        render();

    }


    /* =====================================================
       PERIOD BUTTONS
       ===================================================== */

    function initPeriodButtons() {

        if (!periodSwitcher) {

            return;

        }


        const buttons =
            periodSwitcher.querySelectorAll(
                "[data-period]"
            );


        buttons.forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        setPeriod(
                            button.dataset.period
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       EVENTS
       ===================================================== */

    function initEvents() {

        /*
         New shift added.
        */

        window.addEventListener(
            "jobcash:shiftschange",
            function () {

                /*
                 Small delay guarantees that
                 localStorage and shifts module
                 are already synchronized.
                */

                window.setTimeout(
                    function () {

                        render();

                    },
                    0
                );

            }
        );


        /*
         Rate changed.
        */

        window.addEventListener(
            "jobcash:ratechange",
            function () {

                render();

            }
        );

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.JobCashEarnings = {

        getPeriod:
            function () {

                return currentPeriod;

            },


        setPeriod:
            function (period) {

                setPeriod(
                    period
                );

            },


        getData:
            function () {

                return calculate();

            },


        reload:
            function () {

                render();

            }

    };


    /* =====================================================
       INIT
       ===================================================== */

    function init() {

        initDOM();

        initPeriodButtons();

        initEvents();

        render();

    }


    /* =====================================================
       START
       ===================================================== */

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