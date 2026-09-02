```javascript
(function () {

    "use strict";


    const STORAGE_KEY =
        "job_cash_shifts";


    let shifts = [];


    const addButton =
        document.getElementById(
            "addShiftButton"
        );


    const shiftsList =
        document.getElementById(
            "shiftsList"
        );


    const emptyState =
        document.getElementById(
            "emptyShifts"
        );


    /* =========================================
       LOAD
    ========================================= */

    function loadShifts() {

        try {

            const saved =
                localStorage.getItem(
                    STORAGE_KEY
                );


            if (!saved) {

                shifts = [];

                return;
            }


            const parsed =
                JSON.parse(saved);


            shifts =
                Array.isArray(parsed)
                    ? parsed
                    : [];

        }

        catch (error) {

            console.error(
                "JOB & CASH: ошибка загрузки смен",
                error
            );

            shifts = [];
        }

    }


    /* =========================================
       SAVE
    ========================================= */

    function saveShifts() {

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(shifts)
        );

    }


    /* =========================================
       DATE
    ========================================= */

    function today() {

        const date =
            new Date();


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


    function formatDate(value) {

        const parts =
            value.split("-");


        if (parts.length !== 3) {

            return value;
        }


        return (
            parts[2] +
            "." +
            parts[1] +
            "." +
            parts[0]
        );

    }


    /* =========================================
       HOURS
    ========================================= */

    function timeToMinutes(time) {

        const parts =
            time.split(":");


        return (
            Number(parts[0]) * 60 +
            Number(parts[1])
        );

    }


    function calculateHours(
        start,
        end
    ) {

        let startMinutes =
            timeToMinutes(start);


        let endMinutes =
            timeToMinutes(end);


        let difference =
            endMinutes -
            startMinutes;


        /*
         * Ночная смена:
         * 22:00 → 06:00
         */

        if (difference <= 0) {

            difference += 1440;
        }


        return (
            difference / 60
        );

    }


    /* =========================================
       MONEY
    ========================================= */

    function money(value) {

        return (
            "€" +
            Number(value).toFixed(2)
        );

    }


    /* =========================================
       ADD SHIFT MODAL
    ========================================= */

    function openModal() {

        const rate =
            window.JobCashRate
                ? window.JobCashRate.getRate()
                : 0;


        if (rate <= 0) {

            window.alert(
                "Сначала установите почасовую ставку."
            );

            return;
        }


        const modal =
            document.createElement("div");


        modal.id =
            "jobCashShiftModal";


        modal.innerHTML = `

            <div class="jc-overlay">

                <div class="jc-modal">

                    <div class="jc-modal-top">

                        <div>

                            <div class="jc-eyebrow">
                                JOB & CASH
                            </div>

                            <h2>
                                Новая смена
                            </h2>

                        </div>


                        <button
                            type="button"
                            id="jcClose"
                            class="jc-close"
                        >
                            ×
                        </button>

                    </div>


                    <label>

                        <span>Дата</span>

                        <input
                            type="date"
                            id="jcDate"
                            value="${today()}"
                        >

                    </label>


                    <div class="jc-row">

                        <label>

                            <span>Начало</span>

                            <input
                                type="time"
                                id="jcStart"
                                value="09:00"
                            >

                        </label>


                        <label>

                            <span>Конец</span>

                            <input
                                type="time"
                                id="jcEnd"
                                value="17:00"
                            >

                        </label>

                    </div>


                    <div class="jc-summary">

                        <div>

                            <small>
                                ЧАСЫ
                            </small>

                            <strong id="jcHours">
                                8 ч
                            </strong>

                        </div>


                        <div>

                            <small>
                                СТАВКА
                            </small>

                            <strong>
                                ${money(rate)}
                            </strong>

                        </div>


                        <div>

                            <small>
                                ЗАРАБОТОК
                            </small>

                            <strong id="jcEarnings">
                                ${money(rate * 8)}
                            </strong>

                        </div>

                    </div>


                    <button
                        type="button"
                        id="jcSave"
                        class="jc-save"
                    >
                        Сохранить смену
                    </button>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        injectStyles();


        const date =
            document.getElementById(
                "jcDate"
            );


        const start =
            document.getElementById(
                "jcStart"
            );


        const end =
            document.getElementById(
                "jcEnd"
            );


        const hoursElement =
            document.getElementById(
                "jcHours"
            );


        const earningsElement =
            document.getElementById(
                "jcEarnings"
            );


        function update() {

            const hours =
                calculateHours(
                    start.value,
                    end.value
                );


            hoursElement.textContent =
                hours.toFixed(2) +
                " ч";


            earningsElement.textContent =
                money(
                    hours * rate
                );

        }


        start.addEventListener(
            "input",
            update
        );


        end.addEventListener(
            "input",
            update
        );


        document
            .getElementById("jcClose")
            .addEventListener(
                "click",
                function () {

                    modal.remove();

                }
            );


        document
            .getElementById("jcSave")
            .addEventListener(
                "click",
                function () {

                    const hours =
                        calculateHours(
                            start.value,
                            end.value
                        );


                    const shift = {

                        id:
                            Date.now(),

                        date:
                            date.value,

                        start:
                            start.value,

                        end:
                            end.value,

                        hours:
                            Math.round(
                                hours * 100
                            ) / 100,

                        rate:
                            rate,

                        earnings:
                            Math.round(
                                hours *
                                rate *
                                100
                            ) / 100

                    };


                    shifts.push(
                        shift
                    );


                    shifts.sort(
                        function (a, b) {

                            return (
                                b.date.localeCompare(
                                    a.date
                                )
                            );

                        }
                    );


                    saveShifts();


                    modal.remove();


                    render();


                    notify();

                }
            );


        update();

    }


    /* =========================================
       RENDER
    ========================================= */

    function render() {

        if (!shiftsList) {

            return;
        }


        if (shifts.length === 0) {

            shiftsList.innerHTML = "";


            if (emptyState) {

                emptyState.style.display =
                    "";

                shiftsList.appendChild(
                    emptyState
                );

            }


            return;
        }


        if (emptyState) {

            emptyState.style.display =
                "none";
        }


        shiftsList.innerHTML = "";


        shifts
            .slice(0, 5)
            .forEach(
                function (shift) {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "shift-item";


                    item.innerHTML = `

                        <div>

                            <div class="shift-date">
                                ${formatDate(shift.date)}
                            </div>

                            <div class="shift-time">
                                ${shift.start}
                                —
                                ${shift.end}
                            </div>

                        </div>


                        <div>

                            <div class="shift-hours">
                                ${shift.hours} ч
                            </div>

                            <div class="shift-earnings">
                                ${money(shift.earnings)}
                            </div>

                        </div>

                    `;


                    shiftsList.appendChild(
                        item
                    );

                }
            );

    }


    /* =========================================
       EVENTS
    ========================================= */

    function notify() {

        window.dispatchEvent(
            new CustomEvent(
                "jobcash:shiftschange",
                {
                    detail: {
                        shifts:
                            getShifts()
                    }
                }
            )
        );

    }


    /* =========================================
       API
    ========================================= */

    function getShifts() {

        return shifts.map(
            function (shift) {

                return {
                    ...shift
                };

            }
        );

    }


    window.JobCashShifts = {

        getShifts:
            getShifts,

        reload:
            function () {

                loadShifts();

                render();

            }

    };


    /* =========================================
       STYLES
    ========================================= */

    function injectStyles() {

        if (
            document.getElementById(
                "jobcash-shift-styles"
            )
        ) {

            return;
        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "jobcash-shift-styles";


        style.textContent = `

            .jc-overlay {

                position: fixed;

                inset: 0;

                z-index: 9999;

                display: flex;

                align-items: center;

                justify-content: center;

                padding: 20px;

                background:
                    rgba(0,0,0,.82);

                backdrop-filter:
                    blur(12px);

            }


            .jc-modal {

                width: 100%;

                max-width: 430px;

                box-sizing: border-box;

                padding: 24px;

                border:
                    1px solid
                    rgba(214,166,58,.35);

                border-radius: 20px;

                background: #090909;

                box-shadow:
                    0 30px 80px
                    rgba(0,0,0,.8);

            }


            .jc-modal-top {

                display: flex;

                justify-content:
                    space-between;

                align-items:
                    flex-start;

                margin-bottom: 24px;

            }


            .jc-eyebrow {

                margin-bottom: 6px;

                color: #b98b2f;

                font-size: 10px;

                font-weight: 700;

                letter-spacing: .2em;

            }


            .jc-modal h2 {

                margin: 0;

                color: #f4f1e9;

                font-size: 24px;

            }


            .jc-close {

                width: 34px;

                height: 34px;

                border:
                    1px solid
                    rgba(255,255,255,.1);

                border-radius: 50%;

                background: #101010;

                color: #b4b0a7;

                font-size: 22px;

            }


            .jc-modal label {

                display: flex;

                flex-direction: column;

                gap: 7px;

                margin-bottom: 15px;

            }


            .jc-modal label span {

                color: #74716b;

                font-size: 10px;

                font-weight: 700;

                letter-spacing: .12em;

                text-transform: uppercase;

            }


            .jc-modal input {

                box-sizing: border-box;

                width: 100%;

                padding: 13px;

                border:
                    1px solid
                    rgba(255,255,255,.1);

                border-radius: 10px;

                outline: none;

                background: #050505;

                color: #f4f1e9;

                font: inherit;

            }


            .jc-row {

                display: grid;

                grid-template-columns:
                    1fr 1fr;

                gap: 12px;

            }


            .jc-summary {

                display: grid;

                grid-template-columns:
                    repeat(3, 1fr);

                gap: 8px;

                margin:
                    8px 0 18px;

                padding: 14px;

                border:
                    1px solid
                    rgba(214,166,58,.16);

                border-radius: 12px;

                background: #0d0d0d;

            }


            .jc-summary div {

                display: flex;

                flex-direction: column;

                gap: 5px;

            }


            .jc-summary small {

                color: #74716b;

                font-size: 9px;

                letter-spacing: .08em;

            }


            .jc-summary strong {

                color: #d6a63a;

                font-size: 13px;

            }


            .jc-save {

                width: 100%;

                padding: 14px;

                border:
                    1px solid
                    rgba(214,166,58,.55);

                border-radius: 11px;

                background: #d6a63a;

                color: #050505;

                font: inherit;

                font-weight: 700;

            }

        `;


        document.head.appendChild(
            style
        );

    }


    /* =========================================
       INIT
    ========================================= */

    loadShifts();

    render();


    if (addButton) {

        addButton.addEventListener(
            "click",
            openModal
        );

    }


})();

