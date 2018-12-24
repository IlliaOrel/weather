window.addEventListener("DOMContentLoaded", init);

const getCity = async query => {
  const API_KEY = "50dfab57ee44ae62d11234e2616eed17";
  const BASE_URL = "https://api.openweathermap.org/data/2.5/weather?appid=" + API_KEY;
  const url = new URL(BASE_URL);

  for (let key in query) {
    const val = query[key];
    url.searchParams.append(key, val);
  }

  const response = await fetch(url);
  const city = await response.json();

  return city;
};

const storage = {
  ids: [],
  key: "cities",
  save(id) {
    if (!this.getItem()) this.setItem([]);

    const cityIds = this.getItem();
    cityIds.push(id);
    this.setItem(cityIds);
  },
  remove(id) {
    if (this.getItem()) {
      const cityIds = this.getItem().filter(cityId => cityId !== +id);
      console.log(id, cityIds);
      this.setItem(cityIds);
    }
  },
  setItem(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },
  getItem() {
    const d = localStorage.getItem(this.key);
    return JSON.parse(d);
  },
};

function init() {
  const ids = storage.getItem();
  const cities = document.querySelector(".cities");

  ids.forEach(async id => {
    const c = await getCity({ id });
    createCard(c, cities);
    isEmpty(cities);
  });

  const input = document.querySelector(".input");
  const form = document.querySelector(".form");

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const val = input.value;

    if (val.trim().length) {
      const city = await findCity(val);

      if (city) {
        input.value = "";
        createCard(city, cities);
        isEmpty(cities);

        storage.save(city.id);
      }
    }
  });
  form.addEventListener("keyup", ev => {
    if (ev.keyCode !== 13) toggleErrorMessage();
  });

  async function findCity(q) {
    const response = await getCity({ q });

    if (response.cod !== 200) {
      toggleErrorMessage(response.message);
      return;
    }

    return response;
  }

  function toggleErrorMessage(msg) {
    if (msg) {
      const p = document.createElement("p");
      p.className = "error";
      p.textContent = msg;
      form.appendChild(p);
    } else {
      const p = form.querySelector(".error");
      if (p) form.removeChild(p);
    }
  }

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      async position => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        const city = await getCity({ lat, lon });
        createCard(city, cities);
      },
      () => isEmpty(cities),
    );
  }

  function createCard(data, row) {
    const weather = data.weather[0];
    const template = `
      <div class="card mt-5 city-card">
        <div class="card-image">
          <img src="https://openweathermap.org/img/w/${weather.icon}.png">
        </div>
        <div class="card-body">
          <h5 class="card-title">${data.name}</h5>
          <p class="card-text">
            ${weather.main}. ${(data.main.temp - 273).toFixed(1)}&deg;C
          </p>
          <button class="btn btn-primary update" data-id="${data.id}">Update city</button>
          <button class="btn btn-danger delete" data-id="${data.id}">Delete city</button>
        </div>
      </div>
    `;
    const col = document.createElement("div");
    col.className = "col-3";
    col.innerHTML = template;

    col.querySelector(".delete").addEventListener("click", function() {
      const col = this.closest(".col-3");
      cities.removeChild(col);
      const id = this.dataset.id;
      storage.remove(id);
      isEmpty(cities);
    });

    col.querySelector(".update").addEventListener("click", async function() {
      const card = this.closest(".city-card");
      const id = this.dataset.id;
      const city = await getCity({ id });

      const weather = city.weather[0];
      card.querySelector(".card-text").innerHTML = `${weather.main}. ${(
        city.main.temp - 273
      ).toFixed(1)}&deg;C`;
      card.querySelector(".card-image img").src = `https://openweathermap.org/img/w/${
        weather.icon
      }.png`;
    });

    row.appendChild(col);
  }

  function isEmpty(row) {
    const cityCards = document.querySelectorAll(".city-card");

    if (!cityCards.length) {
      const col = document.createElement("div");
      col.className = "col-12 d-flex justify-content-center is-empty";
      col.innerHTML = `<h1 class="mt-2">You have not cities.</h1>`;
      row.appendChild(col);
      return;
    } else {
      const isEmpty = document.querySelector(".is-empty");
      if (isEmpty) row.removeChild(isEmpty);
    }
  }
}
  

  
