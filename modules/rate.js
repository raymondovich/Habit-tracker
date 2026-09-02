/* =========================================================
   JOB & CASH
   RATE MODULE
   ---------------------------------------------------------
   Отвечает за:
   - текущую почасовую ставку
   - сохранение ставки
   - изменение ставки
   - выбор готовой ставки
   - ввод собственной ставки
   - уведомление других модулей об изменении ставки
   ========================================================= */

(() => {

    "use strict";


    /* =====================================================
       CONFIG
    ===================================================== */

    const STORAGE_KEY = "job_cash_hourly_rate";

    const DEFAULT_RATE = 0;

    const PRESET_RATES = [
        10,
        12,
        14,
        15,
        16,
        17,
        18,
        20,
        22,
        25,
        30
    ];


    /* =====================================================
       STATE
    ===================================================== */

    let currentRate = loadRate();


    /* =====================================================
       DOM
    ===================================================== */

    const rateElement =
        document.getElementById("currentRate");

    const changeButton =
        document.getElementById("changeRateButton");


    /* =====================================================
       INITIALIZATION
    ===================================================== */

    init();


    function init() {

        renderRate();

        if (changeButton) {

            changeButton.addEventListener(
                "click",
                openRateModal
            );

        }

    }


    /* =====================================================
       STORAGE
    ===================================================== */

    function loadRate() {

        try {

            const saved =
                localStorage.getItem(STORAGE_KEY);

            if (saved === null) {
                return DEFAULT_RATE;
            }

            const value =
                Number.parseFloat(saved);

            if (!Number.isFinite(value) || value < 0) {
                return DEFAULT_RATE;
            }

            return value;

        } catch (error) {

            console.error(
                "Job & Cash: не удалось загрузить ставку.",
                error
            );

            return DEFAULT_RATE;

        }

    }


    function saveRate(rate) {

        try {

            localStorage.setItem(
                STORAGE_KEY,
                String(rate)
            );

        } catch (error) {

            console.error(
                "Job & Cash: не удалось сохранить ставку.",
                error
            );

        }

    }


    /* =====================================================
       SET RATE
    ===================================================== */

    function setRate(rate) {

        const value =
            Number.parseFloat(rate);


        if (
            !Number.isFinite(value) ||
            value < 0
        ) {
            return false;
        }


        /*
         * Максимум две цифры после запятой.
         */

        currentRate =
            Math.round(value * 100) / 100;


        saveRate(currentRate);

        renderRate();


        /*
         * Сообщаем остальным модулям,
         * что ставка изменилась.
         */

        document.dispatchEvent(
            new CustomEvent(
                "jobcash:ratechange",
                {
                    detail: {
                        rate: currentRate
                    }
                }
            )
        );


        return true;

    }


    /* =====================================================
       RENDER
    ===================================================== */

    function renderRate() {

        if (!rateElement) {
            return;
        }


        rateElement.textContent =
            formatRate(currentRate);

    }


    function formatRate(value) {

        return (
            "€" +
            Number(value).toLocaleString(
                "ru-RU",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )
        );

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openRateModal() {

        if (
            document.getElementById(
                "jobCashRateModal"
            )
        ) {
            return;
        }


        const overlay =
            document.createElement("div");

        overlay.id =
            "jobCashRateModal";

        overlay.className =
            "rate-modal-overlay";


        overlay.innerHTML = `

            <div
                class="rate-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="rateModalTitle"
            >

                <div class="rate-modal-header">

                    <div>

                        <div
                            class="rate-modal-kicker"
                        >
                            JOB & CASH
                        </div>

                        <h3 id="rateModalTitle">
                            Почасовая ставка
                        </h3>

                    </div>

                    <button
                        type="button"
                        class="rate-modal-close"
                        id="rateModalClose"
                        aria-label="Закрыть"
                    >
                        ×
                    </button>

                </div>


                <div class="rate-modal-current">

                    <span>
                        Текущая ставка
                    </span>

                    <strong>
                        ${formatRate(currentRate)}
                    </strong>

                </div>


                <div class="rate-modal-section">

                    <div class="rate-modal-label">
                        Выберите ставку
                    </div>

                    <div
                        class="rate-presets"
                        id="ratePresets"
                    >

                        ${PRESET_RATES.map(rate => `

                            <button
                                type="button"
                                class="rate-preset ${
                                    rate === currentRate
                                        ? "active"
                                        : ""
                                }"
                                data-rate="${rate}"
                            >
                                €${rate}
                            </button>

                        `).join("")}

                    </div>

                </div>


                <div class="rate-divider">
                    <span>или</span>
                </div>


                <div class="rate-modal-section">

                    <div class="rate-modal-label">
                        Своя ставка
                    </div>

                    <div class="custom-rate-row">

                        <div class="custom-rate-input">

                            <span>€</span>

                            <input
                                type="number"
                                id="customRateInput"
                                inputmode="decimal"
                                min="0"
                                max="100000"
                                step="0.01"
                                placeholder="0.00"
                                value="${
                                    currentRate > 0
                                        ? currentRate
                                        : ""
                                }"
                            >

                            <span class="per-hour">
                                / час
                            </span>

                        </div>

                    </div>

                </div>


                <button
                    type="button"
                    class="rate-save-button"
                    id="saveRateButton"
                >
                    Сохранить ставку
                </button>

            </div>

        `;


        document.body.appendChild(overlay);


        addModalStyles();


        requestAnimationFrame(() => {

            overlay.classList.add("visible");

        });


        bindModalEvents();

    }


    /* =====================================================
       MODAL EVENTS
    ===================================================== */

    function bindModalEvents() {

        const overlay =
            document.getElementById(
                "jobCashRateModal"
            );

        if (!overlay) {
            return;
        }


        const closeButton =
            document.getElementById(
                "rateModalClose"
            );


        const saveButton =
            document.getElementById(
                "saveRateButton"
            );


        const input =
            document.getElementById(
                "customRateInput"
            );


        const presets =
            overlay.querySelectorAll(
                ".rate-preset"
            );


        /* ---------------------------------------------
           CLOSE
        --------------------------------------------- */

        closeButton.addEventListener(
            "click",
            closeRateModal
        );


        overlay.addEventListener(
            "click",
            event => {

                if (event.target === overlay) {
                    closeRateModal();
                }

            }
        );


        /* ---------------------------------------------
           ESC
        --------------------------------------------- */

        document.addEventListener(
            "keydown",
            handleEscape
        );


        /* ---------------------------------------------
           PRESETS
        --------------------------------------------- */

        presets.forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const rate =
                        Number.parseFloat(
                            button.dataset.rate
                        );


                    if (input) {
                        input.value = rate;
                    }


                    presets.forEach(item => {
                        item.classList.remove(
                            "active"
                        );
                    });


                    button.classList.add(
                        "active"
                    );

                }
            );

        });


        /* ---------------------------------------------
           INPUT
        --------------------------------------------- */

        if (input) {

            input.addEventListener(
                "input",
                () => {

                    presets.forEach(item => {

                        item.classList.remove(
                            "active"
                        );

                    });

                }
            );


            input.addEventListener(
                "keydown",
                event => {

                    if (event.key === "Enter") {

                        event.preventDefault();

                        saveCurrentRate();

                    }

                }
            );

        }


        /* ---------------------------------------------
           SAVE
        --------------------------------------------- */

        saveButton.addEventListener(
            "click",
            saveCurrentRate
        );


        /*
         * Автоматически ставим фокус
         * на поле своей ставки.
         */

        if (input) {

            setTimeout(() => {

                input.focus();
                input.select();

            }, 120);

        }

    }


    /* =====================================================
       SAVE FROM MODAL
    ===================================================== */

    function saveCurrentRate() {

        const input =
            document.getElementById(
                "customRateInput"
            );


        if (!input) {
            return;
        }


        const rawValue =
            input.value.trim();


        if (rawValue === "") {

            showRateError(
                "Введите почасовую ставку."
            );

            return;

        }


        const rate =
            Number.parseFloat(
                rawValue.replace(",", ".")
            );


        if (
            !Number.isFinite(rate) ||
            rate < 0
        ) {

            showRateError(
                "Введите корректную ставку."
            );

            return;

        }


        if (rate > 100000) {

            showRateError(
                "Ставка не может быть больше €100 000."
            );

            return;

        }


        if (
            !setRate(rate)
        ) {

            showRateError(
                "Не удалось сохранить ставку."
            );

            return;

        }


        closeRateModal();

    }


    /* =====================================================
       ERROR
    ===================================================== */

    function showRateError(message) {

        let error =
            document.getElementById(
                "rateModalError"
            );


        if (!error) {

            const modal =
                document.querySelector(
                    "#jobCashRateModal .rate-modal"
                );

            if (!modal) {
                return;
            }


            error =
                document.createElement("div");

            error.id =
                "rateModalError";

            error.className =
                "rate-modal-error";


            const saveButton =
                document.getElementById(
                    "saveRateButton"
                );


            modal.insertBefore(
                error,
                saveButton
            );

        }


        error.textContent =
            message;


        error.classList.add("visible");

    }


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    function closeRateModal() {

        const overlay =
            document.getElementById(
                "jobCashRateModal"
            );


        if (!overlay) {
            return;
        }


        overlay.classList.remove(
            "visible"
        );


        document.removeEventListener(
            "keydown",
            handleEscape
        );


        setTimeout(() => {

            overlay.remove();

        }, 180);

    }


    function handleEscape(event) {

        if (event.key === "Escape") {
            closeRateModal();
        }

    }


    /* =====================================================
       MODAL STYLES
       -----------------------------------------------------
       Стили модального окна находятся здесь,
       чтобы rate.js был полностью самостоятельным.
       Основной дизайн приложения остаётся в style.css.
    ===================================================== */

    function addModalStyles() {

        if (
            document.getElementById(
                "jobCashRateModalStyles"
            )
        ) {
            return;
        }


        const style =
            document.createElement("style");

        style.id =
            "jobCashRateModalStyles";


        style.textContent = `

            .rate-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;

                display: flex;
                align-items: flex-end;
                justify-content: center;

                padding: 16px;

                background:
                    rgba(0, 0, 0, 0.78);

                backdrop-filter:
                    blur(12px);

                -webkit-backdrop-filter:
                    blur(12px);

                opacity: 0;

                transition:
                    opacity 180ms ease;
            }


            .rate-modal-overlay.visible {
                opacity: 1;
            }


            .rate-modal {