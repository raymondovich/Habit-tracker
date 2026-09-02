```javascript
/* =====================================================
   JOB & CASH — SHIFTS MODULE
   ===================================================== */

(function () {

    "use strict";


    /* =================================================
       STORAGE
    ================================================= */

    const STORAGE_KEY = "job_cash_shifts";


    /* =================================================
       STATE
    ================================================= */

    let shifts = [];

    let showAllShifts = false;


    /* =================================================
       DOM
    ================================================= */

    const addShiftButton =
        document.getElementById("addShiftButton");

    const allShiftsButton =
        document.getElementById("allShiftsButton");

    const shiftsList =
        document.getElementById("shiftsList");

    const emptyShifts =
        document.getElementById("emptyShifts");


    /* =================================================
       STORAGE FUNCTIONS
    ================================================= */

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


            if (Array.isArray(parsed)) {

                shifts = parsed;

            } else {

                shifts = [];

            }

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


    /* =================================================
       DATE
    ================================================= */

    function getToday() {

        const date = new Date();

        const year =
            date.getFullYear();

        const month =
            String(date.getMonth() + 1)
                .padStart(2, "0");

        const day =
            String(date.getDate())
                .padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function formatDate(dateString) {

        if (!dateString) {

            return "";
        }


        const parts =
            dateString.split("-");


        if (parts.length !== 3) {

            return dateString;
        }


        return `${parts[2]}.${parts[1]}.${parts[0]}`;
    }


    /* =================================================
       TIME / HOURS
    ================================================= */

    function timeToMinutes(time) {

        if (!time) {

            return 0;
        }


        const parts =
            time.split(":");


        const hours =
            Number(parts[0]);

        const minutes =
            Number(parts[1]);


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
            endMinutes - startMinutes;


        /*
         * Ночная смена.
         *
         * Например:
         * 22:00 → 06:00
         */

        if (difference <= 0) {

            difference += 24 * 60;
        }


        return difference / 60;
    }


    function formatHours(hours) {

        const number =
            Number(hours);


        if (!Number.isFinite(number)) {

            return "0 ч";
        }


        const rounded =
            Math.round(number * 100) / 100;


        return `${rounded} ч`;
    }


    /* =================================================
       RATE
    ================================================= */

    function getCurrentRate() {

        if (
            window.JobCashRate &&
            typeof window.JobCashRate.getRate === "function"
        ) {

            return Number(
                window.JobCashRate.getRate()
            ) || 0;
        }


        return 0;
    }


    function formatMoney(value) {

        const number =
            Number(value) || 0;


        return `€${number.toFixed(2)}`;
    }


    /* =================================================
       MODAL
    ================================================= */

    function openAddShiftModal() {

        const existing =
            document.getElementById(
                "jobCashShiftModal"
            );


        if (existing) {

            existing.remove();
        }


        const rate =
            getCurrentRate();


        if (rate <= 0) {

            showRateRequiredMessage();

            return;
        }


        const modal =
            document.createElement("div");

        modal.id =
            "jobCashShiftModal";

        modal.className =
            "jobcash-modal";


        modal.innerHTML = `

            <div class="jobcash-modal-backdrop"></div>

            <div class="jobcash-modal-card">

                <div class="jobcash-modal-header">

                    <div>

                        <div class="jobcash-modal-eyebrow">
                            NEW SHIFT
                        </div>

                        <h3>
                            Добавить смену
                        </h3>

                    </div>

                    <button
                        type="button"
                        class="jobcash-modal-close"
                        id="closeShiftModal"
                        aria-label="Закрыть"
                    >
                        ×
                    </button>

                </div>


                <div class="jobcash-form">


                    <label class="jobcash-field">

                        <span>
                            Дата
                        </span>

                        <input
                            type="date"
                            id="shiftDateInput"
                            value="${getToday()}"
                        >

                    </label>


                    <div class="jobcash-time-grid">


                        <label class="jobcash-field">

                            <span>
                                Начало
                            </span>

                            <input
                                type="time"
                                id="shiftStartInput"
                                value="09:00"
                            >

                        </label>


                        <label class="jobcash-field">

                            <span>
                                Конец
                            </span>

                            <input
                                type="time"
                                id="shiftEndInput"
                                value="17:00"
                            >

                        </label>

                    </div>


                    <div class="jobcash-preview">

                        <div>

                            <span>
                                Часы
                            </span>

                            <strong
                                id="shiftHoursPreview"
                            >
                                8 ч
                            </strong>

                        </div>


                        <div>

                            <span>
                                Ставка
                            </span>

                            <strong>
                                ${formatMoney(rate)}
                            </strong>

                        </div>


                        <div>

                            <span>
                                Заработок
                            </span>

                            <strong
                                id="shiftEarningsPreview"
                            >
                                ${formatMoney(rate * 8)}
                            </strong>

                        </div>

                    </div>


                    <div
                        class="jobcash-form-error"
                        id="shiftFormError"
                    ></div>


                    <button
                        type="button"
                        class="jobcash-save-button"
                        id="saveShiftButton"
                    >
                        Сохранить смену
                    </button>

                </div>

            </div>
        `;


        document.body.appendChild(modal);


        injectModalStyles();


        const dateInput =
            document.getElementById(
                "shiftDateInput"
            );

        const startInput =
            document.getElementById(
                "shiftStartInput"
            );

        const endInput =
            document.getElementById(
                "shiftEndInput"
            );

        const hoursPreview =
            document.getElementById(
                "shiftHoursPreview"
            );

        const earningsPreview =
            document.getElementById(
                "shiftEarningsPreview"
            );


        function updatePreview() {

            const hours =
                calculateHours(
                    startInput.value,
                    endInput.value
                );


            hoursPreview.textContent =
                formatHours(hours);


            earningsPreview.textContent =
                formatMoney(
                    hours * rate
                );
        }


        startInput.addEventListener(
            "input",
            updatePreview
        );


        endInput.addEventListener(
            "input",
            updatePreview
        );


        document
            .getElementById("closeShiftModal")
            .addEventListener(
                "click",
                closeShiftModal
            );


        modal
            .querySelector(
                ".jobcash-modal-backdrop"
            )
            .addEventListener(
                "click",
                closeShiftModal
            );


        document
            .getElementById("saveShiftButton")
            .addEventListener(
                "click",
                function () {

                    saveNewShift(
                        dateInput.value,
                        startInput.value,
                        endInput.value
                    );

                }
            );


        document.addEventListener(
            "keydown",
            handleEscape,
            {
                once: true
            }
        );


        updatePreview();
    }


    function handleEscape(event) {

        if (event.key === "Escape") {

            closeShiftModal();
        }
    }


    function closeShiftModal() {

        const modal =
            document.getElementById(
                "jobCashShiftModal"
            );


        if (modal) {

            modal.remove();
        }
    }


    /* =================================================
       RATE REQUIRED
    ================================================= */

    function showRateRequiredMessage() {

        const answer =
            window.confirm(
                "Сначала установите почасовую ставку."
            );


        if (
            answer &&
            window.JobCashRate &&
            typeof window.JobCashRate.openRateModal === "function"
        ) {

            window.JobCashRate.openRateModal();
        }
    }


    /* =================================================
       SAVE NEW SHIFT
    ================================================= */

    function saveNewShift(
        date,
        start,
        end
    ) {

        const errorElement =
            document.getElementById(
                "shiftFormError"
            );


        function error(message) {

            if (errorElement) {

                errorElement.textContent =
                    message;
            }
        }


        if (!date) {

            error("Выберите дату.");

            return;
        }


        if (!start || !end) {

            error(
                "Укажите время начала и окончания."
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

            error(
                "Не удалось определить продолжительность смены."
            );

            return;
        }


        const rate =
            getCurrentRate();


        if (rate <= 0) {

            error(
                "Почасовая ставка должна быть больше €0."
            );

            return;
        }


        const earnings =
            Math.round(
                hours * rate * 100
            ) / 100;


        const shift = {

            id:
                createId(),

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
                Math.round(
                    rate * 100
                ) / 100,

            earnings:
                earnings

        };


        shifts.push(shift);


        shifts.sort(
            sortNewestFirst
        );


        saveShifts();


        closeShiftModal();


        renderShifts();


        dispatchShiftChange();
    }


    /* =================================================
       ID
    ================================================= */

    function createId() {

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 8)
        );
    }


    /* =================================================
       SORT
    ================================================= */

    function sortNewestFirst(a, b) {

        const first =
            `${a.date} ${a.start || "00:00"}`;

        const second =
            `${b.date} ${b.start || "00:00"}`;


        return second.localeCompare(first);
    }


    /* =================================================
       RENDER
    ================================================= */

    function renderShifts() {

        if (!shiftsList) {

            return;
        }


        if (shifts.length === 0) {

            shiftsList.innerHTML = "";


            if (emptyShifts) {

                emptyShifts.style.display =
                    "";
                
                shiftsList.appendChild(
                    emptyShifts
                );
            }


            if (allShiftsButton) {

                allShiftsButton.style.display =
                    "none";
            }


            return;
        }


        if (emptyShifts) {

            emptyShifts.style.display =
                "none";
        }


        if (allShiftsButton) {

            allShiftsButton.style.display =
                "";
        }


        const visibleShifts =
            showAllShifts
                ? shifts
                : shifts.slice(0, 5);


        shiftsList.innerHTML = "";


        visibleShifts.forEach(
            function (shift) {

                shiftsList.appendChild(
                    createShiftElement(shift)
                );

            }
        );


        if (
            !showAllShifts &&
            shifts.length > 5
        ) {

            allShiftsButton.textContent =
                `Все (${shifts.length})`;

        } else {

            allShiftsButton.textContent =
                showAllShifts
                    ? "Скрыть"
                    : "Все";
        }
    }


    function createShiftElement(shift) {

        const item =
            document.createElement("div");


        item.className =
            "shift-item";


        item.dataset.id =
            shift.id;


        item.innerHTML = `

            <div class="shift-main">

                <div class="shift-date">
                    ${formatDate(shift.date)}
                </div>

                <div class="shift-time">
                    ${shift.start} — ${shift.end}
                </div>

            </div>


            <div class="shift-meta">

                <div class="shift-hours">
                    ${formatHours(shift.hours)}
                </div>

                <div class="shift-earnings">
                    ${formatMoney(shift.earnings)}
                </div>

            </div>


            <button
                type="button"
                class="shift-delete"
                aria-label="Удалить смену"
                title="Удалить"
            >
                ×
            </button>
        `;


        const deleteButton =
            item.querySelector(
                ".shift-delete"
            );


        deleteButton.addEventListener(
            "click",
            function (event) {

                event.stopPropagation();

                deleteShift(shift.id);

            }
        );


        return item;
    }


    /* =================================================
       DELETE
    ================================================= */

    function deleteShift(id) {

        const shift =
            shifts.find(
                item => item.id === id
            );


        if (!shift) {

            return;
        }


        const confirmed =
            window.confirm(
                `Удалить смену ${formatDate(shift.date)}?`
            );


        if (!confirmed) {

            return;
        }


        shifts =
            shifts.filter(
                item => item.id !== id
            );


        saveShifts();


        renderShifts();


        dispatchShiftChange();
    }


    /* =================================================
       ALL SHIFTS
    ================================================= */

    function toggleAllShifts() {

        if (shifts.length <= 5) {

            return;
        }


        showAllShifts =
            !showAllShifts;


        renderShifts();
    }


    /* =================================================
       EVENTS
    ================================================= */

    function dispatchShiftChange() {

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


    /* =================================================
       PUBLIC API
    ================================================= */

    function getShifts() {

        return shifts.map(
            shift => ({
                ...shift
            })
        );
    }


    window.JobCashShifts = {

        getShifts,

        addShift: function (
            date,
            start,
            end
        ) {

            const hours =
                calculateHours(
                    start,
                    end
                );


            const rate =
                getCurrentRate();


            if (
                !date ||
                !start ||
                !end ||
                hours <= 0 ||
                rate <= 0
            ) {

                return false;
            }


            const shift = {

                id:
                    createId(),

                date,

                start,

                end,

                hours:
                    Math.round(
                        hours * 100
                    ) / 100,

                rate:
                    Math.round(
                        rate * 100
                    ) / 100,

                earnings:
                    Math.round(
                        hours * rate * 100
                    ) / 100

            };


            shifts.push(shift);

            shifts.sort(
                sortNewestFirst
            );

            saveShifts();

            renderShifts();

            dispatchShiftChange();

            return true;
        },

        deleteShift,

        reload: function () {

            loadShifts();

            renderShifts();
        }

    };


    /* =================================================
       MODAL STYLES
    ================================================= */

    function injectModalStyles() {

        if (
            document.getElementById(
                "jobcash-shift-modal-styles"
            )
        ) {

            return;
        }


        const style =
            document.createElement("style");


        style.id =
            "jobcash-shift-modal-styles";


        style.textContent = `

            .jobcash-modal {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }


            .jobcash-modal-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.82);
                backdrop-filter: blur(10px);
            }


            .jobcash-modal-card {
                position: relative;
                width: min(100%, 460px);
                max-height: calc(100vh - 40px);
                overflow-y: auto;
                background: #090909;
                border: 1px solid rgba(214, 166, 58, 0.35);
                border-radius: 20px;
                box-shadow:
                    0 25px 80px rgba(0, 0, 0, 0.8),
                    0 0 35px rgba(214, 166, 58, 0.06);
                padding: 24px;
            }


            .jobcash-modal-header {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 20px;
                margin-bottom: 24px;
            }


            .jobcash-modal-eyebrow {
                color: #b98b2f;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.2em;
                margin-bottom: 6px;
            }


            .jobcash-modal-header h3 {
                margin: 0;
                color: #f4f1e9;
                font-size: 24px;
                font-weight: 600;
            }


            .jobcash-modal-close {
                width: 34px;
                height: 34px;
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 50%;
                background: #101010;
                color: #b4b0a7;
                font-size: 22px;
                line-height: 1;
                cursor: pointer;
            }


            .jobcash-form {
                display: flex;
                flex-direction: column;
                gap: 18px;
            }


            .jobcash-field {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }


            .jobcash-field > span {
                color: #74716b;
                font-size: 10px;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
            }


            .jobcash-field input {
                width: 100%;
                box-sizing: border-box;
                padding: 14px 15px;
                border: 1px solid rgba(255,255,255,0.09);
                border-radius: 10px;
                background: #050505;
                color: #f4f1e9;
                font: inherit;
                outline: none;
            }


            .jobcash-field input:focus {
                border-color: rgba(214,166,58,0.55);
                box-shadow: 0 0 0 3px rgba(214,166,58,0.06);
            }


            .jobcash-time-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }


            .jobcash-preview {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 8px;
                padding: 14px;
                border: 1px solid rgba(214,166,58,0.16);
                border-radius: 12px;
                background: #0d0d0d;
            }


            .jobcash-preview div {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }


            .jobcash-preview span {
                color: #74716b;
                font-size: 9px;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }


            .jobcash-preview strong {
                color: #d6a63a;
                font-size: 14px;
                font-weight: 600;
            }


            .jobcash-form-error {
                min-height: 18px;
                color: #c9a65b;
                font-size: 12px;
            }


            .jobcash-save-button {
                width: 100%;
                border: 1px solid rgba(214,166,58,0.55);
                border-radius: 11px;
                padding: 15px;
                background: #d6a63a;
                color: #050505;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
                transition: 0.2s ease;
            }


            .jobcash-save-button:active {
                transform: scale(0.98);
            }


            .shift-delete {
                flex: 0 0 auto;
                width: 28px;
                height: 28px;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 50%;
                background: transparent;
                color: #74716b;
                font-size: 18px;
                cursor: pointer;
            }


            .shift-delete:hover {
                color: #d6a63a;
                border-color: rgba(214,166,58,0.35);
            }


            @media (max-width: 420px) {

                .jobcash-modal-card {
                    padding: 18px;
                    border-radius: 16px;
                }


                .jobcash-preview {
                    grid-template-columns: 1fr;
                    gap: 12px;
                }


                .jobcash-time-grid {
                    gap: 8px;
                }

            }

        `;


        document.head.appendChild(style);
    }


    /* =================================================
       INIT
    ================================================= */

    function init() {

        loadShifts();

        renderShifts();


        if (addShiftButton) {

            addShiftButton.addEventListener(
                "click",
                openAddShiftModal
            );
        }


        if (allShiftsButton) {

            allShiftsButton.addEventListener(
                "click",
                toggleAllShifts
            );
        }


        window.addEventListener(
            "jobcash:ratechange",
            function () {

                renderShifts();

            }
        );
    }


    init();


})();


