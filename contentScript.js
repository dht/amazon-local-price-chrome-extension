const TO_CURRENCY = "ILS";
const CURRENCY_SIGN = "₪";

const DEFAULT_RATE = 3.45;
const RATES_API = `https://openexchangerates.org/api/latest.json?app_id=${EXCHANGE_APP_ID}&base=USD`;
const PRICE_REGEX = /\$(\d+.\d+)/g;

const STORAGE_KEY_RATE = "USD_TO_LOCALE";
const STORAGE_KEY_LAST_CHECK = "LAST_CHECK_TIMESTAMP";
const MILI_SECONDS_IN_A_MINUTE = 1000 * 60;
const MILI_SECONDS_IN_A_WEEK = 1000 * 60 * 60 * 24 * 7;

let RATE = localStorage.getItem(STORAGE_KEY_RATE) || DEFAULT_RATE;

const timestamp = () => new Date().getTime();
const localeNumber = number =>
    number.toLocaleString("he", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

const getCurrentRate = async () => {
    return await fetch(RATES_API)
        .then(res => res.json())
        .then(res => res.rates[TO_CURRENCY]);
};

const updateRateEveryWeek = async () => {
    const lastCheck = localStorage.getItem(STORAGE_KEY_LAST_CHECK) || 0;
    const now = timestamp();
    const delta = now - lastCheck;

    console.log(delta);

    // week did not pass
    if (delta < MILI_SECONDS_IN_A_WEEK) {
        const inMinutes = localeNumber(delta / MILI_SECONDS_IN_A_MINUTE);
        const everyMinutes = localeNumber(
            MILI_SECONDS_IN_A_WEEK / MILI_SECONDS_IN_A_MINUTE
        );
        console.log(
            `rate was updated ${inMinutes} minutes ago. skipping refresh. refreshing every ${everyMinutes} minutes`
        );
    }

    const rate = await getCurrentRate();
    console.log(`rate was updated to: ${rate} ${TO_CURRENCY} for one USD.`);

    localStorage.setItem(STORAGE_KEY_RATE, rate);
    localStorage.setItem(STORAGE_KEY_LAST_CHECK, now);

    RATE = rate;
};

// has $ but does not have the locale currency (already parsed)
const isPrice = content =>
    content.match(PRICE_REGEX) && content.indexOf(CURRENCY_SIGN) < 0;

const addPrice = item => {
    item.span.innerHTML = item.span.innerHTML.replace(
        PRICE_REGEX,
        (all, price) => {
            const priceInLocaleCurrency = localeNumber(price * RATE);
            return `${all} (${CURRENCY_SIGN}${priceInLocaleCurrency})`;
        }
    );
};

const parsePrices = () => {
    const spans = [...document.querySelectorAll("span")];
    console.log(`found ${spans.length} with $ sign`);

    const prices = spans
        .map(span => ({ span, content: span.innerHTML }))
        .filter(item => isPrice(item.content));

    prices.forEach(addPrice);
};

const onKeyDown = ev => {
    if (ev.key === "`") {
        parsePrices();
    }
};

const addShortcut = () => {
    document.removeEventListener("keydown", onKeyDown);
    document.addEventListener("keydown", onKeyDown);
};

const start = async () => {
    await updateRateEveryWeek();
    console.log(`USD to ${TO_CURRENCY} rate: ${RATE}`);
    parsePrices();
    addShortcut();
};

start();
