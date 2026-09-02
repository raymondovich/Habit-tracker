(function () {

    "use strict";

    /* =====================================================
       JOB & CASH — SHIFTS MODULE
       ===================================================== */

    const STORAGE_KEY = "job_cash_shifts";

    let shifts = [];

    let addButton = null;
    let shiftsList = null;
    let emptyState = null;

    let editingShiftId = null;


    /* =====================================================
       DOM
       ===================================================== */

    function initDOM() {

        addButton =
            document.getElementById(
                "addShiftButton"
            );

        shiftsList =
            document.getElementById(
                "shiftsList"
            );

        emptyState =
            document.getElementById(
                "emptyShifts"
            );

        if (!addButton) {

            console.error(
                "JOB & CASH: #addShiftButton не найден"
            );

        }

    }


    /* =====================================================
       STORAGE
       ===================================================== */

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

        try {

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(shifts)
            );

        } catch (error) {

            console.error(
                "JOB & CASH: ошибка сохранения смен",
                error
            );

        }

    }


    /* =====================================================
       HELPERS
       ===================================================== */

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


    function calculateHours(
        start,
        end
    ) {

        const startParts =
            start.split(":");

        const endParts =
            end.split(":");

        const startMinutes =
            Number(startParts[0]) * 60 +
            Number(startParts[1]);

        const endMinutes =
            Number(endParts[0]) * 60 +
            Number(endParts[1]);

        let difference =
            endMinutes -
            startMinutes;

        /*
         Overnight shift.
         Example:
         22:00 → 06:00
        */

        if (difference < 0) {

            difference += 24 * 60;

        }

        return difference / 60;

    }


    function formatMoney(value) {

        return (
            "₽" +
            Number(value || 0)
                .toFixed(2)
        );

    }


    function formatDate(dateString) {

        const parts =
            dateString.split("-");

        if (parts.length !== 3) {

            return dateString;

        }

        return (
            parts[2] +
            "." +
            parts[1] +
            "." +
            parts[0]
        );

    }


    function getCurrentRate() {

        let rate = 0;

        if (
            window.JobCashRate &&
            typeof window.JobCashRate.getRate ===
                "function"
        ) {

            rate =
                Number(
                    window.JobCashRate.getRate()
                ) || 0;

        }

        return rate;

    }


    function dispatchShiftsChange(
        shift = null
    ) {

        window.dispatchEvent(
            new CustomEvent(
                "jobcash:shiftschange",
                {
                    detail: {
                        shift: shift
                    }
                }
            )
        );

    }


    /* =====================================================
       MODAL
       ===================================================== */

    function createModal() {

        const oldModal =
            document.getElementById(
                "jobCashShiftModal"
            );

        if (oldModal) {

            oldModal.remove();

        }

        const modal =
            document.createElement("div");

        modal.id =
            "jobCashShiftModal";

        modal.innerHTML = `

            <div class="jc-modal-backdrop">

                <div class="jc-modal">

                    <div class="jc-modal-header">

                        <div>

                            <div
                                class="jc-modal-title"
                                id="jcModalTitle"
                            >
                                Добавить смену
                            </div>

                            <div
                                class="jc-modal-subtitle"
                                id="jcModalSubtitle"
                            >
                                Запиши рабочую смену
                            </div>

                        </div>

                        <button
                            type="button"
                            class="jc-modal-close"
                            id="jcCloseModal"
                        >
                            ×
                        </button>

                    </div>


                    <div class="jc-form">


                        <label class="jc-label">
                            Дата
                        </label>

                        <input
                            type="date"
                            id="jcShiftDate"
                            class="jc-input"
                            value="${today()}"
                        />


                        <div class="jc-time-row">

                            <div>

                                <label class="jc-label">
                                    Начало
                                </label>

                                <input
                                    type="time"
                                    id="jcShiftStart"
                                    class="jc-input"
                                    value="09:00"
                                />

                            </div>


                            <div>

                                <label class="jc-label">
                                    Конец
                                </label>

                                <input
                                    type="time"
                                    id="jcShiftEnd"
                                    class="jc-input"
                                    value="17:00"
                                />

                            </div>

                        </div>


                        <div
                            id="jcShiftPreview"
                            class="jc-preview"
                        >

                            <div>

                                <span>
                                    Часы
                                </span>

                                <strong
                                    id="jcPreviewHours"
                                >
                                    8.00
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Ставка
                                </span>

                                <strong
                                    id="jcPreviewRate"
                                >
                                    ₽0.00
                                </strong>

                            </div>


                            <div>

                                <span>
                                    Заработок
                                </span>

                                <strong
                                    id="jcPreviewEarnings"
                                >
                                    ₽0.00
                                </strong>

                            </div>

                        </div>


                        <button
                            type="button"
                            class="jc-save-button"
                            id="jcSaveShift"
                        >
                            Сохранить смену
                        </button>


                    </div>

                </div>

            </div>

        `;

        document.body.appendChild(
            modal
        );

        injectModalStyles();

        return modal;

    }


    /* =====================================================
       MODAL STYLES
       ===================================================== */

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
                z-index: 99999;

            }


            .jc-modal-backdrop {

                position: absolute;
                inset: 0;

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

                background:
                    #0b0b0b;

                border:
                    1px solid
                    rgba(214,166,58,.42);

                border-radius:
                    18px;

                padding:
                    22px;

                box-sizing:
                    border-box;

                box-shadow:
                    0 25px 80px
                    rgba(0,0,0,.75),

                    0 0 35px
                    rgba(214,166,58,.08);

            }


            .jc-modal-header {

                display: flex;

                align-items:
                    flex-start;

                justify-content:
                    space-between;

                margin-bottom:
                    24px;

            }


            .jc-modal-title {

                color:
                    #f4f1e9;

                font-size:
                    22px;

                font-weight:
                    700;

                letter-spacing:
                    .02em;

            }


            .jc-modal-subtitle {

                margin-top:
                    5px;

                color:
                    #74716b;

                font-size:
                    13px;

            }


            .jc-modal-close {

                width:
                    34px;

                height:
                    34px;

                border:
                    1px solid
                    rgba(255,255,255,.1);

                border-radius:
                    50%;

                background:
                    #111;

                color:
                    #b4b0a7;

                font-size:
                    24px;

                line-height:
                    1;

                cursor:
                    pointer;

            }


            .jc-label {

                display:
                    block;

                margin-bottom:
                    7px;

                color:
                    #b4b0a7;

                font-size:
                    12px;

                text-transform:
                    uppercase;

                letter-spacing:
                    .08em;

            }


            .jc-input {

                width:
                    100%;

                min-height:
                    48px;

                box-sizing:
                    border-box;

                margin-bottom:
                    16px;

                padding:
                    0 14px;

                border:
                    1px solid
                    rgba(214,166,58,.18);

                border-radius:
                    10px;

                outline:
                    none;

                background:
                    #101010;

                color:
                    #f4f1e9;

                font-size:
                    16px;

            }


            .jc-input:focus {

                border-color:
                    rgba(214,166,58,.55);

            }


            .jc-time-row {

                display:
                    grid;

                grid-template-columns:
                    1fr 1fr;

                gap:
                    12px;

            }


            .jc-preview {

                display:
                    grid;

                grid-template-columns:
                    repeat(3, 1fr);

                gap:
                    8px;

                margin:
                    5px 0 20px;

                padding:
                    14px 8px;

                border:
                    1px solid
                    rgba(214,166,58,.14);

                border-radius:
                    12px;

                background:
                    #080808;

            }


            .jc-preview div {

                text-align:
                    center;

            }


            .jc-preview span {

                display:
                    block;

                margin-bottom:
                    6px;

                color:
                    #74716b;

                font-size:
                    10px;

                text-transform:
                    uppercase;

                letter-spacing:
                    .05em;

            }


            .jc-preview strong {

                color:
                    #d6a63a;

                font-size:
                    15px;

            }


            .jc-save-button {

                width:
                    100%;

                min-height:
                    50px;

                border:
                    1px solid
                    #d6a63a;

                border-radius:
                    11px;

                background:
                    #d6a63a;

                color:
                    #050505;

                font-size:
                    15px;

                font-weight:
                    700;

                cursor:
                    pointer;

            }


            .jc-save-button:active {

                transform:
                    scale(.98);

            }


            .jc-shift-actions {

                display:
                    flex;

                align-items:
                    center;

                gap:
                    7px;

                margin-left:
                    8px;

                flex-shrink:
                    0;

            }


            .jc-shift-action {

                width:
                    32px;

                height:
                    32px;

                padding:
                    0;

                border:
                    1px solid
                    rgba(255,255,255,.10);

                border-radius:
                    8px;

                background:
                    #111;

                color:
                    #b4b0a7;

                font-size:
                    15px;

                cursor:
                    pointer;

            }


            .jc-shift-action:hover {

                border-color:
                    rgba(214,166,58,.45);

                color:
                    #d6a63a;

            }


            .jc-shift-action-delete:hover {

                border-color:
                    rgba(255,80,80,.45);

                color:
                    #ff7777;

            }

        `;

        document.head.appendChild(
            style
        );

    }


    /* =====================================================
       PREVIEW
       ===================================================== */

    function updatePreview() {

        const start =
            document.getElementById(
                "jcShiftStart"
            );

        const end =
            document.getElementById(
                "jcShiftEnd"
            );

        const hoursElement =
            document.getElementById(
                "jcPreviewHours"
            );

        const rateElement =
            document.getElementById(
                "jcPreviewRate"
            );

        const earningsElement =
            document.getElementById(
                "jcPreviewEarnings"
            );

        if (
            !start ||
            !end ||
            !hoursElement ||
            !rateElement ||
            !earningsElement
        ) {

            return;

        }

        if (
            !start.value ||
            !end.value
        ) {

            return;

        }

        const hours =
            calculateHours(
                start.value,
                end.value
            );

        const rate =
            getCurrentRate();

        const earnings =
            hours * rate;

        hoursElement.textContent =
            hours.toFixed(2);

        rateElement.textContent =
            formatMoney(rate);

        earningsElement.textContent =
            formatMoney(earnings);

    }


    /* =====================================================
       OPEN ADD MODAL
       ===================================================== */

    function openModal() {

        const rate =
            getCurrentRate();

        if (rate <= 0) {

            window.alert(
                "Сначала установите почасовую ставку."
            );

            return;

        }

        editingShiftId =
            null;

        const modal =
            createModal();

        const closeButton =
            document.getElementById(
                "jcCloseModal"
            );

        const saveButton =
            document.getElementById(
                "jcSaveShift"
            );

        const startInput =
            document.getElementById(
                "jcShiftStart"
            );

        const endInput =
            document.getElementById(
                "jcShiftEnd"
            );

        closeButton.addEventListener(
            "click",
            closeModal
        );

        modal
            .querySelector(
                ".jc-modal-backdrop"
            )
            .addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        event.currentTarget
                    ) {

                        closeModal();

                    }

                }
            );

        startInput.addEventListener(
            "input",
            updatePreview
        );

        endInput.addEventListener(
            "input",
            updatePreview
        );

        saveButton.addEventListener(
            "click",
            saveShift
        );

        updatePreview();

    }


    /* =====================================================
       OPEN EDIT MODAL
       ===================================================== */

    function openEditModal(
        shiftId
    ) {

        const rate =
            getCurrentRate();

        if (rate <= 0) {

            window.alert(
                "Сначала установите почасовую ставку."
            );

            return;

        }

        const shift =
            shifts.find(
                function (item) {

                    return String(item.id) ===
                        String(shiftId);

                }
            );

        if (!shift) {

            return;

        }

        editingShiftId =
            shift.id;

        const modal =
            createModal();

        const title =
            document.getElementById(
                "jcModalTitle"
            );

        const subtitle =
            document.getElementById(
                "jcModalSubtitle"
            );

        const dateInput =
            document.getElementById(
                "jcShiftDate"
            );

        const startInput =
            document.getElementById(
                "jcShiftStart"
            );

        const endInput =
            document.getElementById(
                "jcShiftEnd"
            );

        const saveButton =
            document.getElementById(
                "jcSaveShift"
            );

        title.textContent =
            "Редактировать смену";

        subtitle.textContent =
            "Измени данные рабочей смены";

        saveButton.textContent =
            "Сохранить изменения";

        dateInput.value =
            shift.date;

        startInput.value =
            shift.start;

        endInput.value =
            shift.end;

        const closeButton =
            document.getElementById(
                "jcCloseModal"
            );

        closeButton.addEventListener(
            "click",
            closeModal
        );

        modal
            .querySelector(
                ".jc-modal-backdrop"
            )
            .addEventListener(
                "click",
                function (event) {

                    if (
                        event.target ===
                        event.currentTarget
                    ) {

                        closeModal();

                    }

                }
            );

        startInput.addEventListener(
            "input",
            updatePreview
        );

        endInput.addEventListener(
            "input",
            updatePreview
        );

        saveButton.addEventListener(
            "click",
            saveShift
        );

        updatePreview();

    }


    /* =====================================================
       CLOSE MODAL
       ===================================================== */

    function closeModal() {

        const modal =
            document.getElementById(
                "jobCashShiftModal"
            );

        if (modal) {

            modal.remove();

        }

        editingShiftId =
            null;

    }


    /* =====================================================
       SAVE SHIFT
       ===================================================== */

    function saveShift() {

        const dateInput =
            document.getElementById(
                "jcShiftDate"
            );

        const startInput =
            document.getElementById(
                "jcShiftStart"
            );

        const endInput =
            document.getElementById(
                "jcShiftEnd"
            );

        if (
            !dateInput ||
            !startInput ||
            !endInput
        ) {

            return;

        }

        const date =
            dateInput.value;

        const start =
            startInput.value;

        const end =
            endInput.value;

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

        if (hours <= 0) {

            window.alert(
                "Не удалось определить продолжительность смены."
            );

            return;

        }

        const rate =
            getCurrentRate();

        if (rate <= 0) {

            window.alert(
                "Почасовая ставка не установлена."
            );

            return;

        }

        const earnings =
            hours * rate;

        const normalizedHours =
            Math.round(
                hours * 100
            ) / 100;

        const normalizedRate =
            Math.round(
                rate * 100
            ) / 100;

        const normalizedEarnings =
            Math.round(
                earnings * 100
            ) / 100;


        /* =================================================
           EDIT EXISTING SHIFT
           ================================================= */

        if (
            editingShiftId !== null
        ) {

            const index =
                shifts.findIndex(
                    function (item) {

                        return String(item.id) ===
                            String(editingShiftId);

                    }
                );

            if (index === -1) {

                closeModal();

                return;

            }

            const updatedShift = {

                id:
                    shifts[index].id,

                date:
                    date,

                start:
                    start,

                end:
                    end,

                hours:
                    normalizedHours,

                rate:
                    normalizedRate,

                earnings:
                    normalizedEarnings

            };

            shifts[index] =
                updatedShift;

            saveShifts();

            render();

            closeModal();

            dispatchShiftsChange(
                updatedShift
            );

            return;

        }


        /* =================================================
           ADD NEW SHIFT
           ================================================= */

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
                normalizedHours,

            rate:
                normalizedRate,

            earnings:
                normalizedEarnings

        };

        shifts.unshift(
            shift
        );

        saveShifts();

        render();

        closeModal();

        dispatchShiftsChange(
            shift
        );

    }


    /* =====================================================
       DELETE SHIFT
       ===================================================== */

    function deleteShift(
        shiftId
    ) {

        const index =
            shifts.findIndex(
                function (item) {

                    return String(item.id) ===
                        String(shiftId);

                }
            );

        if (index === -1) {

            return;

        }

        const shift =
            shifts[index];

        const confirmed =
            window.confirm(
                "Удалить эту смену?"
            );

        if (!confirmed) {

            return;

        }

        shifts.splice(
            index,
            1
        );

        saveShifts();

        render();

        dispatchShiftsChange(
            shift
        );

    }


    /* =====================================================
       RENDER
       ===================================================== */

    function render() {

        if (
            !shiftsList ||
            !emptyState
        ) {

            return;

        }

        if (shifts.length === 0) {

            shiftsList.innerHTML =
                "";

            emptyState.style.display =
                "";

            return;

        }

        emptyState.style.display =
            "none";

        const recent =
            shifts.slice(
                0,
                5
            );

        shiftsList.innerHTML =
            recent
                .map(
                    function (shift) {

                        return `

                            <div
                                class="shift-item"
                                data-shift-id="${shift.id}"
                            >

                                <div
                                    class="shift-date"
                                >
                                    ${formatDate(
                                        shift.date
                                    )}
                                </div>


                                <div
                                    class="shift-time"
                                >
                                    ${shift.start}
                                    –
                                    ${shift.end}
                                </div>


                                <div
                                    class="shift-hours"
                                >
                                    ${Number(
                                        shift.hours
                                    ).toFixed(2)}
                                    ч.
                                </div>


                                <div
                                    class="shift-earnings"
                                >
                                    ${formatMoney(
                                        shift.earnings
                                    )}
                                </div>


                                <div
                                    class="jc-shift-actions"
                                >

                                    <button
                                        type="button"
                                        class="jc-shift-action jc-shift-action-edit"
                                        data-action="edit"
                                        data-id="${shift.id}"
                                        aria-label="Редактировать смену"
                                        title="Редактировать"
                                    >
                                        ✎
                                    </button>


                                    <button
                                        type="button"
                                        
                                                                            <button
                                        type="button"
                                        class="jc-shift-action jc-shift-action-delete"
                                        data-action="delete"
                                        data-id="${shift.id}"
                                        aria-label="Удалить смену"
                                        title="Удалить"
                                    >
                                        ×
                                    </button>

                                </div>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       SHIFT ACTIONS
       ===================================================== */

    function handleShiftAction(
        event
    ) {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) {

            return;

        }

        const action =
            button.dataset.action;

        const id =
            button.dataset.id;

        if (
            action ===
            "edit"
        ) {

            openEditModal(id);

            return;

        }

        if (
            action ===
            "delete"
        ) {

            deleteShift(id);

        }

    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.JobCashShifts = {

        getShifts:
            function () {

                return shifts.slice();

            },


        reload:
            function () {

                loadShifts();

                render();

            }

    };


    /* =====================================================
       INITIALIZATION
       ===================================================== */

    function init() {

        initDOM();

        loadShifts();

        render();


        if (shiftsList) {

            shiftsList.addEventListener(
                "click",
                handleShiftAction
            );

        }


        if (addButton) {

            addButton.addEventListener(
                "click",
                function (event) {

                    event.preventDefault();

                    openModal();

                }
            );

        }

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
                                       