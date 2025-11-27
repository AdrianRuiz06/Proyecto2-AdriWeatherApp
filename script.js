const API_KEY = "fb40e44f0160a91109735cdef5ad4043";

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const gpsBtn = document.getElementById("gpsBtn");

// ===== ENTER EVENT =====
cityInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        getWeather(cityInput.value);
        cityInput.value = "";
        cityInput.blur();
    }
});

// ===== BUTTON EVENT =====
searchBtn.addEventListener("click", () => {
    getWeather(cityInput.value);
    cityInput.value = "";
    cityInput.blur();
});

// ===== MAIN WEATHER FUNCTION =====
function getWeather(city) {
    if (city === "") return;

    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=es&appid=${API_KEY}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {

            if (data.cod === "404") {
                showError();
                return;
            }

            document.getElementById("errorMsg").classList.add("hidden");
            document.querySelector(".weather-box").classList.remove("hidden");
            document.querySelector(".details").classList.remove("hidden");

            document.getElementById("temperature").innerHTML = `${Math.round(data.main.temp)}°C`;
            document.getElementById("description").innerHTML = data.weather[0].description;
            document.getElementById("humidity").innerHTML = `${data.main.humidity}%`;
            document.getElementById("wind").innerHTML = `${data.wind.speed} km/h`;

            const icon = document.getElementById("weatherIcon");
            const weatherMain = data.weather[0].main;

            if (weatherMain === "Clear") icon.src = "./assets/icons/clear-weather.webp";
            else if (weatherMain === "Clouds") icon.src = "./assets/icons/cloudweather.webp";
            else if (weatherMain === "Rain") icon.src = "./assets/icons/rainweather.webp";
            else if (weatherMain === "Snow") icon.src = "./assets/icons/snow-weather.webp";
            else if (weatherMain === "Mist" || weatherMain === "Fog") icon.src = "./assets/icons/mist-weather.webp";
            else if (weatherMain === "Drizzle") icon.src = "./assets/icons/drizzle-weather.webp";
            else icon.src = "./assets/icons/clear-weather.webp";

            // Fondo dinámico
            document.body.className = "";
            if (weatherMain === "Clear") document.body.classList.add("sunny");
            if (weatherMain === "Clouds") document.body.classList.add("cloudy");
            if (weatherMain === "Rain") document.body.classList.add("rainy");
            if (weatherMain === "Snow") document.body.classList.add("snowy");
            if (weatherMain === "Mist") document.body.classList.add("misty");

            // Animación
            document.querySelector(".weather-box").classList.add("fade-in");
            document.querySelector(".details").classList.add("fade-in");

            setTimeout(() => {
                document.querySelector(".weather-box").classList.remove("fade-in");
                document.querySelector(".details").classList.remove("fade-in");
            }, 600);

            addToHistory(city);
            getForecast(city);
        })
        .catch(() => {
            showError();
        });
}

// ===== ERROR =====
function showError() {
    document.querySelector(".weather-box").classList.add("hidden");
    document.querySelector(".details").classList.add("hidden");
    document.getElementById("errorMsg").classList.remove("hidden");
}

// ===== HISTORIAL =====
function addToHistory(city) {
    let history = JSON.parse(localStorage.getItem("history")) || [];

    history = history.filter(item => item.toLowerCase() !== city.toLowerCase());
    history.unshift(city);
    history = history.slice(0, 3);

    localStorage.setItem("history", JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const list = document.getElementById("historyList");
    let history = JSON.parse(localStorage.getItem("history")) || [];

    list.innerHTML = "";
    history.forEach(ciudad => {
        const li = document.createElement("li");
        li.textContent = ciudad;
        li.onclick = () => getWeather(ciudad);
        list.appendChild(li);
    });
}

renderHistory();

// ===== GPS =====
gpsBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                getWeather(data.name);
            });
    });
});

// ===== FORECAST (7 DÍAS) =====
function getForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=es&appid=${API_KEY}`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const forecast = document.getElementById("forecast");
            forecast.innerHTML = "";
            forecast.classList.remove("hidden");

            // Agrupar por día
            const daily = {};

            data.list.forEach(item => {
                const date = item.dt_txt.split(" ")[0];
                if (!daily[date]) daily[date] = [];
                daily[date].push(item);
            });

            // Coger los primeros 7 días
            const dias = Object.keys(daily).slice(0, 7);

            dias.forEach(date => {
                const items = daily[date];
                const middle = items[Math.floor(items.length / 2)];

                const div = document.createElement("div");
                div.className = "forecast-day";

                div.innerHTML = `
                    <p>${new Date(date).toLocaleDateString("es-ES", { weekday: "short" })}</p>
                    <p>${Math.round(middle.main.temp)}°C</p>
                `;

                forecast.appendChild(div);
            });
        });
}

// ===== HISTORIAL DESPLEGABLE =====
document.getElementById("toggleHistory").addEventListener("click", () => {
    const historyDiv = document.getElementById("historyContainer");

    historyDiv.classList.toggle("show");

    const btn = document.getElementById("toggleHistory");
    btn.textContent = historyDiv.classList.contains("show")
        ? "Ocultar historial ▲"
        : "Ver historial ▼";
});
