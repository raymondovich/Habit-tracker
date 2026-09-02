(function () {

    "use strict";


    /* =====================================================
       JOB & CASH — SHIFTS MODULE
       ===================================================== */


    const STORAGE_KEY = "job_cash_shifts";


    let shifts = [];


    /* =====================================================
       DOM
       ===================================================== */

    let addButton = null;
    let shiftsList = null;
    let emptyState = null;


    let editingShiftId = null;


    /* =====================================================
       SWIPE STATE
       ===================================================== */

    let swipeState = null;


    /* =====================================================
       INIT DOM
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

        if (
            window.JobCashRate &&
            typeof window.JobCashRate.getRate ===
                "function"
        ) {

            return Number(
                window.JobCashRate.getRate()
            ) || 0;

        }


        return 0;

    }


    function notifyShiftsChange(
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


        return modal;

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


        const rate =
            getCurrentRate();


        if (rate <= 0) {

            window.alert(
                "Сначала установите почасовую ставку."
            );

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


        if (
            !start ||
            !end
        ) {

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


            notifyShiftsChange(
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


        notifyShiftsChange(
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


        notifyShiftsChange(
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

                                <div class="shift-date">

                                    ${formatDate(
                                        shift.date
                                    )}

                                </div>


                                <div class="shift-time">

                                    ${shift.start}
                                    –
                                    ${shift.end}

                                </div>


                                <div class="shift-hours">

                                    ${Number(
                                        shift.hours
                                    ).toFixed(2)}
                                    ч.

                                </div>


                                <div class="shift-earnings">

                                    ${formatMoney(
                                        shift.earnings
                                    )}

                                </div>


                                <button
                                    type="button"
                                    class="shift-edit-button"
                                    data-action="edit"
                                    data-id="${shift.id}"
                                    aria-label="Редактировать смену"
                                    title="Редактировать"
                                >
                                    <span
                                        class="shift-edit-icon"
                                        aria-hidden="true"
                                    >
                                        ✎
                                    </span>
                                </button>


                                <div
                                    class="shift-delete-action"
                                    data-delete-action="true"
                                    aria-hidden="true"
                                >
                                    Удалить
                                </div>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       EDIT ACTION
       ===================================================== */

    function handleEditAction(
        event
    ) {

        const button =
            event.target.closest(
                "[data-action='edit']"
            );


        if (!button) {

            return false;

        }


        const id =
            button.dataset.id;


        openEditModal(
            id
        );


        return true;

    }


    /* =====================================================
       SWIPE HELPERS
       ===================================================== */

    function getShiftElement(
        event
    ) {

        return event.target.closest(
            ".shift-item"
        );

    }


    function closeSwipe(
        item
    ) {

        if (!item) {

            return;

        }


        item.style.transform =
            "";


        item.classList.remove(
            "shift-item-swiped"
        );

    }


    function openSwipe(
        item
    ) {

        if (!item) {

            return;

        }


        item.style.transform =
            "translateX(88px)";


        item.classList.add(
            "shift-item-swiped"
        );

    }


    function handleSwipeStart(
        event
    ) {

        if (
            event.pointerType ===
            "mouse" &&
            event.button !== 0
        ) {

            return;

        }


        const item =
            getShiftElement(
                event
            );


        if (!item) {

            return;

        }


        const editButton =
            event.target.closest(
                ".shift-edit-button"
            );


        if (editButton) {

            return;

        }


        const rect =
            item.getBoundingClientRect();


        swipeState = {

            item:
                item,

            startX:
                event.clientX,

            startY:
                event.clientY,

            currentX:
                event.clientX,

            startTransform:
                item.classList.contains(
                    "shift-item-swiped"
                )
                    ? 88
                    : 0,

            width:
                rect.width,

            dragging:
                false

        };


        item.setPointerCapture?.(
            event.pointerId
        );

    }


    function handleSwipeMove(
        event
    ) {

        if (!swipeState) {

            return;

        }


        const item =
            swipeState.item;


        if (!item) {

            return;

        }


        const deltaX =
            event.clientX -
            swipeState.startX;


        const deltaY =
            event.clientY -
            swipeState.startY;


        if (
            !swipeState.dragging &&
            Math.abs(deltaY) >
                Math.abs(deltaX)
        ) {

            return;

        }


        if (
            Math.abs(deltaX) >
            8
        ) {

            swipeState.dragging =
                true;

        }


        if (
            !swipeState.dragging
        ) {

            return;

        }


        let translate =
            swipeState.startTransform +
            deltaX;


        /*
         Swipe is only allowed to the right.
        */

        if (translate < 0) {

            translate = 0;

        }


        if (translate > 100) {

            translate = 100;

        }


        item.style.transform =
            "translateX(" +
            translate +
            "px)";


        if (
            translate >= 44
        ) {

            item.classList.add(
                "shift-item-swiped"
            );

        } else {

            item.classList.remove(
                "shift-item-swiped"
            );

        }

    }


    function handleSwipeEnd(
        event
    ) {

        if (!swipeState) {

            return;

        }


        const state =
            swipeState;


        swipeState =
            null;


        const item =
            state.item;


        if (!item) {

            return;

        }


        const deltaX =
            event.clientX -
            state.startX;


        if (
            state.dragging
        ) {

            if (
                deltaX >= 44 ||
                state.startTransform >= 44
            ) {

                openSwipe(
                    item
                );

            } else {

                closeSwipe(
                    item
                );

            }

        }

    }


    /* =====================================================
       SWIPE DELETE ACTION
       ===================================================== */

    function handleDeleteSwipeClick(
        event
    ) {

        const item =
            event.target.closest(
                ".shift-item"
            );


        if (!item) {

            return;

        }


        if (
            !item.classList.contains(
                "shift-item-swiped"
            )
        ) {

            return;

        }


        const id =
            item.dataset.shiftId;


        const deleteArea =
            item.querySelector(
                ".shift-delete-action"
            );


        if (
            !deleteArea
        ) {

            return;

        }


        const rect =
            deleteArea.getBoundingClientRect();


        if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
        ) {

            return;

        }


        deleteShift(
            id
        );

    }


    /* =====================================================
       SHIFT CLICK
       ===================================================== */

    function handleShiftClick(
        event
    ) {

        if (
            handleEditAction(
                event
            )
        ) {

            return;

        }


        handleDeleteSwipeClick(
            event
        );

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
                handleShiftClick
            );


            shiftsList.addEventListener(
                "pointerdown",
                handleSwipeStart
            );


            shiftsList.addEventListener(
                "pointermove",
                handleSwipeMove
            );


            shiftsList.addEventListener(
                "pointerup",
                handleSwipeEnd
            );


            shiftsList.addEventListener(
                "pointercancel",
                handleSwipeEnd
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