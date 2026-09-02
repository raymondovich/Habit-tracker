(function () {

    "use strict";


    /* =====================================================
       JOB & CASH — EARNINGS MODULE
       ===================================================== */


    let currentPeriod = "month";


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
       INIT DOM
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

    function getToday() {

        const date =
            new Date();


        return {

            year:
                date.getFullYear(),

            month:
                date.getMonth(),

            day:
                date.getDate(),

            date:
                date

        };

    }


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


        return new Date(
            year,
            month,
            day
        );

    }


    /* =====================================================
       PERIOD — WEEK
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
         JavaScript:
         Sunday = 0
         Monday = 1

         We need Monday → Sunday.
        */

        const difference =
            day === 0
                ? -6
                : 1 - day;


        const start =
            new Date(today);


        start.setDate(
            today.getDate() +
            difference
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
            start: start,
            end: end
        };

    }


    /* =====================================================
       PERIOD — MONTH
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
            start: start,
            end: end
        };

    }


    /* =====================================================
       PERIOD — YEAR
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
            start: start,
            end: end
        };

    }


    /* =====================================================
       CURRENT RANGE
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
       SHIFT FILTER
       ===================================================== */

    function getPeriodShifts() {

        if (
            !window.JobCashShifts ||
            typeof window.JobCashShifts.getShifts !==
                "function"
        ) {

            return [];

        }


        const shifts =
            window.JobCashShifts.getShifts();


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

            return "За неделю";

        }


        if (
            currentPeriod === "year"
        ) {

            return "За год";

        }


        return "За месяц";

    }


    /* =====================================================
       RENDER PERIOD
       ===================================================== */

    function renderPeriod() {

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

                    button.setAttribute(
                        "aria-selected",
                        "true"
                    );

                } else {

                    button.classList.remove(
                        "active"
                    );

                    button.setAttribute(
                        "aria-selected",
                        "false"
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


        if (totalEarnings) {

            totalEarnings.textContent =
                formatMoney(
                    data.earnings
                );

        }


        if (earningsPeriod) {

            earningsPeriod.textContent =
                getPeriodLabel();

        }


        if (shiftCount) {

            shiftCount.textContent =
                String(
                    data.count
                );

        }


        if (workedHours) {

            workedHours.textContent =
                data.hours.toFixed(2);

        }


        if (averageEarnings) {

            averageEarnings.textContent =
                formatMoney(
                    data.average
                );

        }

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


        const monthNames = [

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
            monthNames[
                today.getMonth()
            ] +
            " " +
            today.getFullYear();

    }


    /* =====================================================
       RENDER
       ===================================================== */

    function render() {

        renderPeriod();

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

        window.addEventListener(
            "jobcash:shiftschange",
            function () {

                render();

            }
        );


        window.addEventListener(
            "jobcash:ratechange",
            function () {

                /*
                 Existing shifts keep their
                 historical earnings.

                 We still rerender the UI
                 so everything stays synchronized.
                */

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

                setPeriod(period);

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
