(function () {

```
"use strict";


const STORAGE_KEY = "job_cash_shifts";


let shifts = [];


const addButton =
    document.getElementById("addShiftButton");

const shiftsList =
    document.getElementById("shiftsList");

const emptyState =
    document.getElementById("emptyShifts");


/* =====================================================
   STORAGE
   ===================================================== */

function loadShifts() {

    try {

        const saved =
            localStorage.getItem(STORAGE_KEY);

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

    } catch (error) {

        console.error(
            "JOB & CASH: ошибка загрузки смен",
            error
        );

        shifts = [];

    }

}


function saveShifts() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(shifts)
    );

}


/* =====================================================
   DATE
   ===================================================== */

function getToday() {

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

    if (!value) {
        return "";
    }

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


/* =====================================================
   TIME
   ===================================================== */

function timeToMinutes(time) {

    if (!time) {
        return 0;
    }

    const parts =
        time.split(":");

    if (parts.length !== 2) {
        return 0;
    }

    const hours =
        Number(parts[0]);

    const minutes =
        Number(parts[1]);

    if (
        !Number.isFinite(hours) ||
        !Number.isFinite(minutes)
    ) {
        return 0;
    }

    return (
        hours * 60 +
        minutes
    );

}


function calculateHours(start, end) {

    const startMinutes =
        timeToMinutes(start);

    const endMinutes =
        timeToMinutes(end);


    let difference =
        endMinutes -
        startMinutes;


    /*
     * Смена через полночь.
     */

    if (difference < 0) {

        difference += 1440;

    }


    return (
        difference / 60
    );

}


/* =====================================================
   MONEY
   ===================================================== */

function money(value) {

    const number =
        Number(value) || 0;

    return (
        "€" +
        number.toFixed(2)
    );

}


/* =====================================================
   MODAL
   ===================================================== */

function createModal() {

    const existing =
        document.getElementById(
            "jobCashShiftModal"
        );

    if (existing) {
        return existing;
    }


    const modal =
        document.createElement("div");

    modal.id =
        "jobCashShiftModal";


    modal.innerHTML = `

        <div class="jc-modal-backdrop"></div>

        <div class="jc-modal">

            <div class="jc-modal-header">

                <div class="jc-modal-title">
                    Добавить смену
                </div>

                <button
                    type="button"
                    class="jc-modal-close"
                    id="jcClose"
                >
                    ×
                </button>

            </div>


            <div class="jc-field">

                <label for="jcDate">
                    Дата
                </label>

                <input
                    type="date"
                    id="jcDate"
                >

            </div>


            <div class="jc-time-row">

                <div class="jc-field">

                    <label for="jcStart">
                        Начало
                    </label>

                    <input
                        type="time"
                        id="jcStart"
                        value="09:00"
                    >

                </div>


                <div class="jc-field">

                    <label for="jcEnd">
                        Конец
                    </label>

                    <input
                        type="time"
                        id="jcEnd"
                        value="17:00"
                    >

                </div>

            </div>


            <div class="jc-preview">

                <div>

                    <span>
                        Часы
                    </span>

                    <strong id="jcHours">
                        8.00
                    </strong>

                </div>


                <div>

                    <span>
                        Заработок
                    </span>

                    <strong id="jcEarnings">
                        €0.00
                    </strong>

                </div>

            </div>


            <button
                type="button"
                class="jc-save"
                id="jcSave"
            >
                Сохранить смену
            </button>

        </div>

    `;


    document.body.appendChild(modal);


    injectModalStyles();


    return modal;

}


function injectModalStyles() {

    if (
        document.getElementById(
            "jobCashShiftStyles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");

    style.id =
        "jobCashShiftStyles";


    style.textContent = `

        #jobCashShiftModal {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }


        .jc-modal-backdrop {
            position: absolute;
            inset: 0;
            background: rgba(0,0,0,.82);
            backdrop-filter: blur(8px);
        }


        .jc-modal {
            position: relative;
            width: 100%;
            max-width: 430px;
            padding: 24px;
            background: #0b0b0b;
            border: 1px solid rgba(214,166,58,.42);
            border-radius: 18px;
            box-shadow:
                0 20px 70px rgba(0,0,0,.75),
                0 0 30px rgba(214,166,58,.08);
        }


        .jc-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 24px;
        }


        .jc-modal-title {
            color: #f4f1e9;
            font-size: 20px;
            font-weight: 600;
        }


        .jc-modal-close {
            width: 36px;
            height: 36px;
            border: 1px solid rgba(255,255,255,.1);
            border-radius: 50%;
            background: #101010;
            color: #b4b0a7;
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
        }


        .jc-field {
            margin-bottom: 18px;
        }


        .jc-field label {
            display: block;
            margin-bottom: 8px;
            color: #74716b;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: .08em;
        }


        .jc-field input {
            box-sizing: border-box;
            width: 100%;
            height: 48px;
            padding: 0 14px;
            border: 1px solid rgba(255,255,255,.08);
            border-radius: 10px;
            background: #101010;
            color: #f4f1e9;
            font-size: 16px;
            outline: none;
        }


        .jc-field input:focus {
            border-color: rgba(214,166,58,.55);
        }


        .jc-time-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }


        .jc-preview {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin: 22px 0;
        }


        .jc-preview > div {
            padding: 15px;
            border: 1px solid rgba(214,166,58,.16);
            border-radius: 12px;
            background: #101010;
        }


        .jc-preview span {
            display: block;
            margin-bottom: 7px;
            color: #74716b;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .08em;
        }


        .jc-preview strong {
            color: #d6a63a;
            font-size: 20px;
            font-weight: 600;
        }


        .jc-save {
            width: 100%;
            height: 50px;
            border: 1px solid rgba(214,166,58,.55);
            border-radius: 10px;
            background: #d6a63a;
            color: #050505;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
        }


        .jc-save:active {
            transform: translateY(1px);
        }

    `;


    document.head.appendChild(style);

}


/* =====================================================
   MODAL LOGIC
   ===================================================== */

function openModal() {

    if (
        !window.JobCashRate ||
        typeof window.JobCashRate.getRate !== "function"
    ) {

        window.alert(
            "Модуль ставки ещё не загружен."
        );

        return;
    }


    const rate =
        window.JobCashRate.getRate();


    if (rate <= 0) {

        window.alert(
            "Сначала установите почасовую ставку."
        );

        return;

    }


    const modal =
        createModal();


    const dateInput =
        modal.querySelector("#jcDate");

    const startInput =
        modal.querySelector("#jcStart");

    const endInput =
        modal.querySelector("#jcEnd");


    dateInput.value =
        getToday();


    updatePreview();


    modal.style.display =
        "flex";


    function updatePreview() {

        const hours =
            calculateHours(
                startInput.value,
                endInput.value
            );


        const earnings =
            hours * rate;


        modal.querySelector(
            "#jcHours"
        ).textContent =
            hours.toFixed(2);


        modal.querySelector(
            "#jcEarnings"
        ).textContent =
            money(earnings);

    }


    startInput.oninput =
        updatePreview;


    endInput.oninput =
        updatePreview;


    modal.querySelector(
        "#jcClose"
    ).onclick =
        function () {

            closeModal();

        };


    modal.querySelector(
        ".jc-modal-backdrop"
    ).onclick =
        function () {

            closeModal();

        };


    modal.querySelector(
        "#jcSave"
    ).onclick =
        function () {

            saveShift(
                dateInput.value,
                startInput.value,
                endInput.value,
                rate
            );

        };

}


function closeModal() {

    const modal =
        document.getElementById(
            "jobCashShiftModal"
        );

    if (!modal) {
        return;
    }

    modal.style.display =
        "none";

}


/* =====================================================
   SAVE SHIFT
   ===================================================== */

function saveShift(
    date,
    start,
    end,
    rate
) {

    if (!date) {

        window.alert(
            "Выберите дату."
        );

        return;

    }


    if (!start || !end) {

        window.alert(
            "Укажите время начала и окончания."
        );

        return;

    }


    if (start === end) {

        window.alert(
            "Время начала и окончания не может совпадать."
        );

        return;

    }


    const hours =
        calculateHours(
            start,
            end
        );


    if (
        !Number.isFinite(hours) ||
        hours <= 0 ||
        hours > 24
    ) {

        window.alert(
            "Некорректная продолжительность смены."
        );

        return;

    }


    const earnings =
        hours * rate;


    const shift = {

        id:
            Date.now(),

        date:
            date,

        start:
            start,

        end:
            end,

        hours:
            Math.round(
                hours * 100
            ) / 100,

        rate:
            rate,

        earnings:
            Math.round(
                earnings * 100
            ) / 100

    };


    shifts.push(
        shift
    );


    shifts.sort(
        function (a, b) {

            return (
                String(b.date)
                    .localeCompare(
                        String(a.date)
                    ) ||
                String(b.start)
                    .localeCompare(
                        String(a.start)
                    )
            );

        }
    );


    saveShifts();


    render();


    closeModal();


    window.dispatchEvent(
        new CustomEvent(
            "jobcash:shiftschange",
            {
                detail: {
                    shift:
                        shift
                }
            }
        )
    );

}


/* =====================================================
   RENDER
   ===================================================== */

function render() {

    if (!shiftsList) {
        return;
    }


    shiftsList.innerHTML = "";


    if (shifts.length === 0) {

        if (emptyState) {

            shiftsList.appendChild(
                emptyState
            );

        }

        return;

    }


    const recent =
        shifts.slice(0, 5);


    recent.forEach(
        function (shift) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "shift-item";


            item.innerHTML = `

                <div class="shift-date">
                    ${formatDate(shift.date)}
                </div>

                <div class="shift-time">
                    ${shift.start} — ${shift.end}
                </div>

                <div class="shift-hours">
                    ${Number(shift.hours).toFixed(2)} ч
                </div>

                <div class="shift-earnings">
                    ${money(shift.earnings)}
                </div>

            `;


            shiftsList.appendChild(
                item
            );

        }
    );

}


/* =====================================================
   PUBLIC API
   ===================================================== */

window.JobCashShifts = {

    getShifts: function () {

        return shifts.slice();

    },


    reload: function () {

        loadShifts();

        render();

    }

};


/* =====================================================
   INIT
   ===================================================== */

loadShifts();

render();


if (addButton) {

    addButton.addEventListener(
        "click",
        openModal
    );

}
```

})();
