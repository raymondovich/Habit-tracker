```javascript
(function () {

    "use strict";

    const STORAGE_KEY = "job_cash_hourly_rate";

    let currentRate =
        Number(localStorage.getItem(STORAGE_KEY)) || 0;


    function formatRate(value) {

        return "€" + Number(value).toFixed(2);

    }


    function render() {

        const element =
            document.getElementById("currentRate");

        if (!element) {

            console.error(
                "JOB & CASH: элемент #currentRate не найден"
            );

            return;
        }

        element.textContent =
            formatRate(currentRate);

    }


    function changeRate() {

        const value =
            window.prompt(
                "Введите вашу почасовую ставку (€):",
                currentRate > 0
                    ? currentRate
                    : ""
            );


        if (value === null) {

            return;
        }


        const rate =
            Number(
                String(value)
                    .replace(",", ".")
                    .trim()
            );


        if (
            !Number.isFinite(rate) ||
            rate < 0
        ) {

            window.alert(
                "Введите корректную ставку."
            );

            return;
        }


        currentRate =
            Math.round(rate * 100) / 100;


        localStorage.setItem(
            STORAGE_KEY,
            String(currentRate)
        );


        render();


        window.dispatchEvent(
            new CustomEvent(
                "jobcash:ratechange",
                {
                    detail: {
                        rate: currentRate
                    }
                }
            )
        );

    }


    function init() {

        console.log(
            "JOB & CASH: rate.js загружен"
        );


        const button =
            document.getElementById(
                "changeRateButton"
            );


        if (!button) {

            console.error(
                "JOB & CASH: #changeRateButton не найден"
            );

            return;
        }


        button.addEventListener(
            "click",
            changeRate
        );


        render();

    }


    /*
     * index.html загружает этот файл
     * как ES module.
     *
     * DOM к этому моменту уже существует,
     * поэтому запускаем сразу.
     */

    init();


    window.JobCashRate = {

        getRate: function () {

            return currentRate;

        },


        setRate: function (value) {

            const rate =
                Number(value);


            if (
                !Number.isFinite(rate) ||
                rate < 0
            ) {

                return false;
            }


            currentRate =
                Math.round(rate * 100) / 100;


            localStorage.setItem(
                STORAGE_KEY,
                String(currentRate)
            );


            render();


            window.dispatchEvent(
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

        },


        formatRate

    };


})();
```
