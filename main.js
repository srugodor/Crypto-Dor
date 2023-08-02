"use strict";

(async () => {

    const currenciesLink = document.getElementById("currenciesLink");
    const reportsLink = document.getElementById("reportsLink");
    const aboutLink = document.getElementById("aboutLink");
    const mainContent = document.getElementById("mainContent");
    const container = document.getElementById("container");
    const search = document.getElementById("search");
    const coins = await getJson("json/markets.json");
    const selectedCoins = [];
    let filteredCoins = coins;
    const modal = document.getElementById("selectedCoinsModal");
    const modalBody = document.getElementById("selectedCoinsModalBody");
    const replaceButton = document.getElementById("replaceButton");
    const cancelButton = document.getElementById("cancelButton");
    const closeWindowButton = document.getElementById("closeWindowButton");
    let selectedCoinForReplacement = null;

    const storedSelectedCoins = JSON.parse(localStorage.getItem('selectedCoins'));
    if (Array.isArray(storedSelectedCoins)) {
        selectedCoins.push(...storedSelectedCoins);
    }

    currenciesLink.addEventListener("click", displayCurrencies);
    reportsLink.addEventListener("click", displayReports);
    aboutLink.addEventListener("click", displayAbout);
    window.addEventListener('beforeunload', saveSelectedCoinsToLocalStorage);
    cancelButton.addEventListener("click", closeModal);
    closeWindowButton.addEventListener("click", closeModal);
    search.addEventListener('input', function (event) {
        const searchTerm = event.target.value.toLowerCase();
        filteredCoins = coins.filter(coin => {
            const nameIncludesTerm = coin.name.toLowerCase().includes(searchTerm);
            const symbolIncludesTerm = coin.symbol.toLowerCase().includes(searchTerm);
            return nameIncludesTerm || symbolIncludesTerm;
        });
        if (filteredCoins.length === 0) {
            container.innerHTML = '<h2>No coins found</h2>';
        } else {
            displayCurrencies();
        }
    });

    async function getJson(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const json = await response.json();
            return json;
        } catch (error) {
            const alertElement = document.getElementById("myAlert");
            console.log("Error: " + error.message);
            alertElement.style.display = "block";

            setTimeout(() => {
                alertElement.style.display = "none";
            }, 5000);
        }
    }

    async function cacheFetch(url) {
        try {
            const cachedData = sessionStorage.getItem(url);
            if (cachedData !== null) {
                const cachedObj = JSON.parse(cachedData);
                const currentTime = new Date().getTime();
                const elapsedSeconds = Math.floor((currentTime - cachedObj.time) / 1000);
                if (elapsedSeconds < 120) {
                    return Promise.resolve(cachedObj.data);
                }
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Unable to fetch data");
            }
            const data = await response.json();
            sessionStorage.setItem(url, JSON.stringify({ time: new Date().getTime(), data: data }));
            return data;
        } catch (error) {
            const alertElement = document.getElementById("myAlert");
            console.log("Error: " + error.message);
            alertElement.style.display = "block";

            setTimeout(() => {
                alertElement.style.display = "none";
            }, 5000);
        }
    }

    function displayCurrencies() {
        mainContent.innerHTML = `<h1>Currencies</h1>`;
        getAndDisplayCoins();
    }

    async function getAndDisplayCoins() {
        try {
            displayCoins(filteredCoins);

            const moreInfoButtons = document.querySelectorAll('.more-info-btn');
            moreInfoButtons.forEach(button => {
                button.addEventListener('click', async (event) => {
                    if (button.nextElementSibling.classList.contains('show')) {
                        button.nextElementSibling.classList.remove('show');
                        return;
                    }
                    button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...`;
                    const coinId = event.target.dataset.coinId;
                    const coinUrl = `https://api.coingecko.com/api/v3/coins/${coinId}`;
                    const coinData = await cacheFetch(coinUrl);
                    updatePriceElements(coinId, coinData);
                    button.innerHTML = `More Info`;
                    button.nextElementSibling.classList.add('show');
                });
            });
        } catch (error) {
            const alertElement = document.getElementById("myAlert");
            console.log("Error: " + error.message);
            alertElement.style.display = "block";

            setTimeout(() => {
                alertElement.style.display = "none";
            }, 5000);
        }
    }

    async function updatePriceElements(coinId, coinData) {
        const priceUSD = document.getElementById(`priceUSD${coinId}`);
        const priceILS = document.getElementById(`priceILS${coinId}`);
        const priceEURO = document.getElementById(`priceEURO${coinId}`);

        priceUSD.textContent = coinData.market_data.current_price.usd;
        priceILS.textContent = coinData.market_data.current_price.ils;
        priceEURO.textContent = coinData.market_data.current_price.eur;
    }

    function displayCoins(coins) {
        const coinSwitches = document.getElementsByClassName('coin-switch');

        for (const coinSwitch of coinSwitches) {
            coinSwitch.removeEventListener('change', coinSwitchHandler);
        }
        let html = '';
        for (const coin of coins) {
            const isChecked = selectedCoins.some(selectedCoin => selectedCoin.id === coin.id);
            html += `
                <div class="card m-1" style="width: 10rem;">
                    <div class="form-check form-switch ms-auto">
                        <input class="form-check-input coin-switch" type="checkbox" id="switch${coin.id}" data-coin-id="${coin.id}" ${isChecked ? 'checked' : ''}>
                        <label class="form-check-label" for="switch${coin.id}"></label>
                    </div>
                    <div class="card-body text-center d-flex flex-column">
                        <img src="${coin.image}" class="card-img-top img-fluid rounded mx-auto" alt="${coin.image}" style="width: 50px; height: 50px;">
                        <h5 class="card-title">${coin.name}</h5>
                        <p class="card-text">Symbol: ${coin.symbol}</p>
                        <button class="btn btn-primary more-info-btn mt-auto" data-coin-id="${coin.id}">More Info</button>
                        <div class="collapse" id="collapse${coin.id}">
                            <div class="mt-2">
                                <h6>$ <span id="priceUSD${coin.id}"></span></h6>
                                <h6>€ <span id="priceEURO${coin.id}"></span></h6>
                                <h6>₪ <span id="priceILS${coin.id}"></span></h6>
                            </div> 
                        </div>
                    </div>
                </div>
            `;
        }
        container.innerHTML = html;
        for (const coinSwitch of coinSwitches) {
            coinSwitch.addEventListener('change', function (event) {
                coinSwitchHandler(event);
            });
        }
    }

    function coinSwitchHandler(event) {
        const coinId = event.target.dataset.coinId;
        const isChecked = event.target.checked;
        if (isChecked) {
            const selectedCoin = coins.find(coin => coin.id === coinId);
            if (selectedCoins.length >= 5) {
                event.target.checked = false;
                openModal(selectedCoin);
            } else {
                selectedCoins.push(selectedCoin);
                localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));
            }
        } else {
            const coinIndex = selectedCoins.findIndex(coin => coin.id === coinId);
            if (coinIndex !== -1) {
                selectedCoins.splice(coinIndex, 1);
                localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));
            }
        }
    }

    function openModal(selectedCoin) {
        modal.style.display = "block";
        modalBody.innerHTML = generateModalContent();
        selectedCoinForReplacement = selectedCoin;
        replaceButton.addEventListener("click", onReplaceButtonClick);

    }

    function closeModal() {
        modal.style.display = "none";
        replaceButton.removeEventListener("click", onReplaceButtonClick);

    }

    function generateModalContent() {
        let html = "";
        for (const coin of selectedCoins) {
            html += `
                <div class="card m-1" style="width: 10rem;">
                    <div class="form-check form-switch ms-auto">
                        <input class="form-check-input modal-coin-switch" type="checkbox" data-coin-id="${coin.id}" checked>
                        <label class="form-check-label"></label>
                    </div>
                    <div class="card-body text-center d-flex flex-column">
                        <img src="${coin.image}" class="card-img-top img-fluid rounded mx-auto" alt="${coin.image}" style="width: 50px; height: 50px;">
                        <h5 class="card-title">${coin.name}</h5>
                        <p class="card-text">Symbol: ${coin.symbol}</p>
                    </div>
                </div>
            `;
        }
        return html;
    }


    function replaceCoin(selectedCoin) {
        const modalCoinSwitches = document.getElementsByClassName("modal-coin-switch");
        let coinsToReplace = [];
        for (const modalCoinSwitch of modalCoinSwitches) {
            if (!modalCoinSwitch.checked) {
                coinsToReplace.push(modalCoinSwitch.dataset.coinId);
            }
        }

        if (coinsToReplace.length === 0) {
            alert("Please select at least one coin to replace.");
            return;
        }

        if (coinsToReplace.length > 1) {
            alert("Please select only one coin to replace.");
            return;
        }

        const coinToReplaceId = coinsToReplace[0];
        const coinToReplaceIndex = selectedCoins.findIndex((coin) => coin.id === coinToReplaceId);

        if (coinToReplaceIndex !== -1) {
            selectedCoins.splice(coinToReplaceIndex, 1);
            selectedCoins.push(selectedCoin);
            localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));
        }

        displayCurrencies();
    }
    function onReplaceButtonClick() {
        if (selectedCoinForReplacement) {
            replaceCoin(selectedCoinForReplacement);
            selectedCoinForReplacement = null;
            closeModal();
        }
    }

    function saveSelectedCoinsToLocalStorage() {
        localStorage.setItem('selectedCoins', JSON.stringify(selectedCoins));
    }

    window.addEventListener('beforeunload', saveSelectedCoinsToLocalStorage);

    displayCurrencies();


    function displayReports() {
        mainContent.innerHTML = `<h1>Reports</h1>
        <img src="assets/images/under-construction.jpg" class="img-fluid" alt="under-construction">
        `;
        container.innerHTML = '';
    }

    function displayAbout() {
        mainContent.innerHTML = `
            <h1>About</h1>    
            <h2 style="text-align:center">Our Team</h2>
            <div class="card-group">
                <div class="card">
                    <img src="assets/images/dorsrugo.JPG" class="card-img-top" alt="Dor Srugo">
                    <div class="card-body">
                        <h5 class="card-title">Dor Srugo</h5>
                        <p class="card-text">CEO & Owner</p>
                        <p class="card-text"><small class="text-body-secondary">Senior economist and billionaire who founded the company. Started his journey when he bought 100 Bitcoin coins for only ten shekels.</small></p>
                    </div>
                </div>
                <div class="card">
                    <img src="assets/images/yosisrael.jpg" class="card-img-top" alt="Yos Israel">
                    <div class="card-body">
                        <h5 class="card-title">Yos Israel</h5>
                        <p class="card-text">Legal advice</p>
                        <p class="card-text"><small class="text-body-secondary">Senior lawyer and cryptocurrency expert. He founded Crypto Bryce College, where he enjoys teaching his students to this day.</small></p>
                    </div>
                </div>
                <div class="card">
                    <img src="assets/images/mrbean.jpg" class="card-img-top" alt="Mr Bean">
                    <div class="card-body">
                        <h5 class="card-title">Mr Bean</h5>
                        <p class="card-text">Data Security</p>
                        <p class="card-text"><small class="text-body-secondary">The man and the legend.</small></p>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = "";
    }

})();
