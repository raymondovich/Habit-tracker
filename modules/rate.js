
(function () {

    "use strict";


    const STORAGE_KEY =
        "job_cash_hourly_rate";


    let currentRate =
        Number(
            localStorage.getItem(STORAGE_KEY)
        ) || 0;


    const button =
        document.getElementById(
            "changeRateButton"
        );


    const rateElement =
        document.getElementById(
            "currentRate"
        );


    function renderRate() {

        if (!rateElement) {
            return;
        }


        rateElement.textContent =
            "€" +
            currentRate.toFixed(2);
    }


    function changeRate() {

        const input =
            window.prompt(
                "Введите почасовую ставку (€):",
                currentRate > 0
                    ? currentRate.toFixed(2)
                    : ""
            );


        if (input === null) {
            return;
        }


        const normalized =
            String(input)
                .replace(",", ".")
                .trim();


        const value =
            Number(normalized);


        if (
            !Number.isFinite(value) ||
            value < 0
        ) {

            window.alert(
                "Введите корректную сумму."
            );

            return;
        }


        currentRate =
            Math.round(
                value * 100
            ) / 100;


        localStorage.setItem(
            STORAGE_KEY,
            String(currentRate)
        );


        renderRate();


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


    if (button) {

        button.addEventListener(
            "click",
            changeRate
        );

    }


    renderRate();


    window.JobCashRate = {

        getRate: function () {

            return currentRate;

        },


        setRate: function (value) {

            const number =
                Number(value);


            if (
                !Number.isFinite(number) ||
                number < 0
            ) {

                return false;
            }


            currentRate =
                Math.round(
                    number * 100
                ) / 100;


            localStorage.setItem(
                STORAGE_KEY,
                String(currentRate)
            );


            renderRate();


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


        formatRate: function (value) {

            return (
                "€" +
                Number(value).toFixed(2)
            );

        }

    };


})();

