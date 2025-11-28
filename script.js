const API_KEY = "fb40e44f0160a91109735cdef5ad4043";

/* ========== ELEMENTOS DEL DOM ========== */

const homePanel = document.getElementById("homePanel");
const weatherPanel = document.getElementById("weatherPanel");
const topHeader = document.getElementById("topHeader");

const backBtn = document.getElementById("backBtn");

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const gpsBtn = document.getElementById("gpsBtn");

const cityNameTop = document.querySelector(".top-header #cityName");
const cityNameCard = document.querySelector(".location-row #cityName");

const dateLabel = document.getElementById("dateLabel");

const temperature = document.getElementById("temperature");
const weatherIcon = document.getElementById("weatherIcon");
const description = document.getElementById("description");

const precip = document.getElementById("precip");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");

const hourlyWave = document.getElementById("hourlyWave");
const hourlyBall = document.getElementById("hourlyBall");
const hourlyInfo = document.getElementById("hourlyInfo");

const forecastContainer = document.getElementById("forecast");

const tempGraph = document.getElementById("tempGraph");

/* ICONOS */
const ICONS = {
    Clear: "clear-weather.webp",
    Clouds: "cloudweather.webp",
    Rain: "rainweather.webp",
    Snow: "snow-weather.webp",
    Mist: "mist-weather.webp",
    Fog: "mist-weather.webp",
    Drizzle: "drizzle-weather.webp",
    Thunderstorm: "rainweather.webp"
};


/* ===================================================== */
/* ==================== EVENTOS ======================== */
/* ===================================================== */

searchBtn.addEventListener("click", () => {
    fetchWeather(cityInput.value.trim());
});

cityInput.addEventListener("keypress", e => {
    if (e.key === "Enter") fetchWeather(cityInput.value.trim());
});

gpsBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(pos => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
    });
});

backBtn.addEventListener("click", () => {
    weatherPanel.classList.add("hidden");
    topHeader.classList.add("hidden");
    homePanel.classList.remove("hidden");
});


/* ===================================================== */
/* ==================== PETICIONES ===================== */
/* ===================================================== */

function fetchWeather(city) {
    if (!city) return;

    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=es&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.cod === "404") {
                alert("Ciudad no encontrada");
                return;
            }

            renderWeatherCard(data);
            fetchHourlyAndDaily(data.name);
        });
}

function fetchWeatherByCoords(lat, lon) {
    fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${API_KEY}`)
        .then(r => r.json())
        .then(data => {
            renderWeatherCard(data);
            fetchHourlyAndDaily(data.name);
        });
}


/* ===================================================== */
/* ================= RENDER TARJETA ==================== */
/* ===================================================== */

function renderWeatherCard(data) {
    homePanel.classList.add("hidden");
    weatherPanel.classList.remove("hidden");
    topHeader.classList.remove("hidden");

    cityNameTop.textContent = data.name;
    cityNameCard.textContent = data.name;

    temperature.textContent = Math.round(data.main.temp) + "°";
    description.textContent = data.weather[0].description;

    weatherIcon.src = "./assets/icons/" + (ICONS[data.weather[0].main] || ICONS.Clear);

    precip.textContent = data.rain ? "100%" : "0%";
    humidity.textContent = data.main.humidity + "%";
    wind.textContent = data.wind.speed + " km/h";

    dateLabel.textContent = new Date().toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long"
    });
}


/* ===================================================== */
/* ======= GRÁFICA DE TEMPERATURA (CHART.JS) =========== */
/* ===================================================== */

function renderGraph(temps) {
    const ctx = tempGraph.getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: ["", "", "", "", "", "", "", ""],
            datasets: [{
                data: temps,
                borderColor: "#4b7bff",
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            plugins: { legend: { display: false }},
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}


/* ===================================================== */
/* ======== ONDA + PELOTA (SVG INTERACTIVO) ============ */
/* ===================================================== */

function renderHourlyWave(hourly) {
    hourlyWave.innerHTML = "";

    const temps = hourly.map(h => h.main.temp);
    const hours = hourly.map(h => new Date(h.dt * 1000).getHours());

    const max = Math.max(...temps);
    const min = Math.min(...temps);

    const width = hourlyWave.clientWidth;
    const height = 150;

    hourlyWave.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const points = temps.map((t, i) => ({
        x: (width / (temps.length - 1)) * i,
        y: height - ((t - min) / (max - min)) * height
    }));

    let path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    const svgPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    svgPath.setAttribute("d", path);
    svgPath.setAttribute("stroke", "#4e7aff");
    svgPath.setAttribute("fill", "none");
    svgPath.setAttribute("stroke-width", "4");

    hourlyWave.appendChild(svgPath);

    function moveBall(i) {
        hourlyBall.style.left = `${points[i].x}px`;
        hourlyBall.style.top = `${points[i].y}px`;
        hourlyInfo.innerHTML = `${hours[i]}:00 - <strong>${Math.round(temps[i])}°</strong>`;
    }

    moveBall(0);

    hourlyWave.onclick = e => {
        const x = e.offsetX;
        let closest = 0;
        let minD = Infinity;

        points.forEach((p, i) => {
            const d = Math.abs(p.x - x);
            if (d < minD) {
                minD = d;
                closest = i;
            }
        });

        moveBall(closest);
    };
}


/* ===================================================== */
/* ============ PRONÓSTICO 7 DÍAS ======================= */
/* ===================================================== */

function render7Days(days) {
    forecastContainer.innerHTML = "";

    days.forEach(d => {
        forecastContainer.innerHTML += `
            <div class="day-card">
                <p>${d.day}</p>
                <img src="./assets/icons/${d.icon}">
                <p>${d.temp}°</p>
            </div>
        `;
    });
}


/* ===================================================== */
/* ========= PETICIÓN HORAS + 7 DÍAS ==================== */
/* ===================================================== */

function fetchHourlyAndDaily(city) {
    fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=es&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {

            // --- HORAS ---
            const hourly = data.list.slice(0, 8);
            renderHourlyHours(hourly);

            // --- 7 DÍAS ---
            const groups = {};

            data.list.forEach(x => {
                const d = x.dt_txt.split(" ")[0];
                if (!groups[d]) groups[d] = [];
                groups[d].push(x);
            });

            const final = Object.keys(groups).slice(0, 7).map(date => {
                const mid = groups[date][Math.floor(groups[date].length / 2)];
                return {
                    day: new Date(date).toLocaleDateString("es-ES", { weekday: "short" }),
                    temp: Math.round(mid.main.temp),
                    icon: ICONS[mid.weather[0].main]
                };
            });

            render7Days(final);
        });
}


const hourlyBox = document.getElementById("hourlyBox");

function renderHourlyHours(hourly) {
    hourlyBox.innerHTML = "";

    hourly.forEach(h => {
        const hour = new Date(h.dt * 1000).getHours();
        const temp = Math.round(h.main.temp);
        const main = h.weather[0].main;

        hourlyBox.innerHTML += `
            <div class="hour-item">
                <p>${hour}:00</p>
                <img src="./assets/icons/${ICONS[main] || ICONS.Clear}">
                <p>${temp}°</p>
            </div>
        `;
    });
}
