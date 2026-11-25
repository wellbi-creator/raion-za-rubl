
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const balance = document.getElementById("balance");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalAvatar = document.getElementById("modalAvatar");
const panelHeading = document.getElementById("panelHeading");
const panelContent = document.getElementById("panelContent");
const modalClose = document.getElementById("modalClose");
const modalAction = document.getElementById("modalAction");

const defaultState = {
  balance: 1000000,
  reputation: 0,
  repairs: {
    wiring: false,
    panel: false,
    sockets: false,
    lighting: false,
    water: false,
    heating: false,
    sewage: false,
    rooms: false,
    furniture: false
  }
};

let state = structuredClone(defaultState);
let modalActionHandler = () => closeDialog();

const repairItems = [
  { id: "wiring", name: "Замена проводки", icon: "⚡", price: 120000, description: "Новая электропроводка во всём доме" },
  { id: "panel", name: "Электрощиток", icon: "🔌", price: 45000, description: "Установка нового электрощитка" },
  { id: "sockets", name: "Розетки", icon: "🔋", price: 25000, description: "Замена старых розеток" },
  { id: "lighting", name: "Освещение", icon: "💡", price: 60000, description: "Новые светильники и лампы" },
  { id: "water", name: "Водопровод", icon: "💧", price: 110000, description: "Восстановление подачи воды" },
  { id: "heating", name: "Отопление", icon: "🔥", price: 130000, description: "Ремонт системы отопления" },
  { id: "sewage", name: "Канализация", icon: "🚰", price: 90000, description: "Восстановление канализации" },
  { id: "rooms", name: "Ремонт помещений", icon: "🧱", price: 160000, description: "Ремонт стен, пола и потолка" },
  { id: "furniture", name: "Новая мебель", icon: "🛋️", price: 100000, description: "Покупка мебели для дома" }
];

function saveGame() {
  localStorage.setItem("raion-save", JSON.stringify(state));
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem("raion-save"));
    if (saved) {
      state = {
        ...defaultState,
        ...saved,
        repairs: {
          ...defaultState.repairs,
          ...(saved.repairs || {})
        }
      };
    }
  } catch (e) {
    state = structuredClone(defaultState);
  }

  updateBalance();
}

function updateBalance() {
  balance.textContent = state.balance.toLocaleString("ru-RU") + " ₽";
}

function openDialog(title, message, avatar = "👵🏻", buttonText = "Понятно", action = closeDialog) {
  modalTitle.textContent = title;
  modalText.textContent = message;
  modalAvatar.textContent = avatar;
  modalAction.textContent = buttonText;
  modalActionHandler = action;
  modal.classList.remove("hidden");
}

function closeDialog() {
  modal.classList.add("hidden");
}

modalClose.addEventListener("click", closeDialog);
modalAction.addEventListener("click", () => modalActionHandler());

modal.addEventListener("click", e => {
  if (e.target === modal) closeDialog();
});

function completedRepairs() {
  return repairItems.filter(item => state.repairs[item.id]).length;
}

function allUtilitiesRestored() {
  return ["wiring", "panel", "sockets", "lighting", "water", "heating", "sewage"]
    .every(id => state.repairs[id]);
}

function renderRepairPanel() {
  const itemsHTML = repairItems.map(item => {
    const done = state.repairs[item.id];

    return `
      <div class="info-card">
        <h3>${item.icon} ${item.name}</h3>
        <p>${item.description}</p>
        <p><b>${item.price.toLocaleString("ru-RU")} ₽</b></p>
        ${
          done
            ? `<p style="color:#4b9b5b"><b>✓ Выполнено</b></p>`
            : `<button class="repair-button" data-repair="${item.id}"
                style="padding:10px 14px;border:0;border-radius:10px;background:#426d4b;color:white;font-weight:bold">
                Купить ремонт
              </button>`
        }
      </div>
    `;
  }).join("");

  panelHeading.textContent = "Ремонт дома";

  panelContent.innerHTML = `
    <div class="info-card">
      <h3>🏚️ Старый дом</h3>
      <p>Восстанови дом и верни в него жизнь!</p>
      <p>Выполнено работ: ${completedRepairs()} из ${repairItems.length}</p>
      <p>Бюджет: ${state.balance.toLocaleString("ru-RU")} ₽</p>
    </div>
    ${itemsHTML}
  `;
}

function buyRepair(id) {
  const item = repairItems.find(x => x.id === id);
  if (!item || state.repairs[id]) return;

  if (state.balance < item.price) {
    openDialog(
      "Не хватает денег",
      `Для этой работы нужно ${item.price.toLocaleString("ru-RU")} ₽. У тебя сейчас ${state.balance.toLocaleString("ru-RU")} ₽.`,
      "💸"
    );
    return;
  }

  state.balance -= item.price;
  state.repairs[id] = true;

  if (allUtilitiesRestored() && state.reputation === 0) {
    state.reputation = 10;
    state.balance += 100000;

    saveGame();
    updateBalance();
    renderRepairPanel();

    openDialog(
      "Первый успех!",
      "Все коммуникации восстановлены! Баба Зина очень рада. За выполненную работу район получил первые 10 очков репутации и премию 100 000 ₽!",
      "👵🏻"
    );
    return;
  }

  saveGame();
  updateBalance();
  renderRepairPanel();

  openDialog(
    "Работа выполнена!",
    `${item.name}: готово! Деньги списаны с бюджета района.`,
    "🔨"
  );
}

const panels = {
  district: {
    title: "Район",
    html: `
      <div class="info-card">
        <h3>🏚️ Заброшенный район</h3>
        <p>Ты купил этот район всего за один рубль.</p>
        <p>Теперь предстоит вернуть ему жизнь!</p>
      </div>
      <div class="info-card">
        <h3>Состояние района</h3>
        <p>⚡ Электричество: ${allUtilitiesRestored() ? "восстановлено" : "требует ремонта"}</p>
        <p>💧 Вода: ${state.repairs.water ? "восстановлена" : "отключена"}</p>
        <p>🔥 Отопление: ${state.repairs.heating ? "восстановлено" : "отключено"}</p>
        <p>🚰 Канализация: ${state.repairs.sewage ? "восстановлена" : "отключена"}</p>
        <p>⭐ Репутация: ${state.reputation}</p>
      </div>`
  },

  quests: {
    title: "Тетрадка",
    html: `
      <div class="info-card">
        <h3>📖 Задание №1. Новый хозяин</h3>
        <p>Познакомься с Бабой Зиной и осмотри старый дом.</p>
        <p>Статус: выполнено, когда восстановишь коммуникации.</p>
      </div>
      <div class="info-card">
        <h3>🔨 Задание №2. Возвращаем жизнь</h3>
        <p>Восстанови электричество, воду, отопление и канализацию.</p>
        <p>Прогресс: ${completedRepairs()} из ${repairItems.length}</p>
      </div>`
  },

  houses: {
    title: "Дома",
    html: `
      <div class="info-card">
        <h3>🏠 Старый дом</h3>
        <p>Первый дом района.</p>
        <p>Ремонт: ${completedRepairs()} из ${repairItems.length} работ.</p>
        <button data-open-repair style="padding:10px 14px;border:0;border-radius:10px;background:#426d4b;color:white">
          Открыть ремонт
        </button>
      </div>`
  },

  finance: {
    title: "Финансы",
    html: `
      <div class="info-card">
        <h3>💰 Бюджет района</h3>
        <p>Баланс: ${state.balance.toLocaleString("ru-RU")} ₽</p>
        <p>Репутация: ${state.reputation}</p>
        <p>Потрачено на ремонт: ${(1000000 - state.balance + (state.reputation >= 10 ? 100000 : 0)).toLocaleString("ru-RU")} ₽</p>
      </div>`
  },

  residents: {
    title: "Жители",
    html: `
      <div class="info-card">
        <h3>👵🏻 Баба Зина</h3>
        <p>Первая жительница района.</p>
        <p>Настроение: ${allUtilitiesRestored() ? "счастлива" : "ждёт перемен"}.</p>
      </div>`
  }
};

function showPanel(name) {
  if (name === "repair") {
    renderRepairPanel();
    return;
  }

  const panel = panels[name];
  if (!panel) return;

  panelHeading.textContent = panel.title;
  panelContent.innerHTML = panel.html;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.panel === name);
  });
}

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => showPanel(button.dataset.panel));
});

panelContent.addEventListener("click", e => {
  const repairButton = e.target.closest("[data-repair]");
  if (repairButton) {
    buyRepair(repairButton.dataset.repair);
    return;
  }

  if (e.target.closest("[data-open-repair]")) {
    showPanel("repair");
  }
});

// Изометрическая карта
function iso(x, y) {
  return {
    x: canvas.clientWidth / 2 + (x - y) * 38,
    y: canvas.clientHeight / 2 + (x + y) * 19
  };
}

function diamond(x, y, color) {
  const p = iso(x, y);

  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 19);
  ctx.lineTo(p.x + 38, p.y);
  ctx.lineTo(p.x, p.y + 19);
  ctx.lineTo(p.x - 38, p.y);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();
}

function tree(x, y) {
  const p = iso(x, y);

  ctx.fillStyle = "#765036";
  ctx.fillRect(p.x - 4, p.y - 25, 8, 28);

  ctx.fillStyle = "#28613a";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 37, 19, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#43894d";
  ctx.beginPath();
  ctx.arc(p.x - 8, p.y - 44, 11, 0, Math.PI * 2);
  ctx.fill();
}

function house(x, y) {
  const p = iso(x, y);

  ctx.fillStyle = state.repairs.rooms ? "#d5c6a6" : "#b69d7e";
  ctx.fillRect(p.x, p.y - 65, 43, 58);

  ctx.fillStyle = "#d6c2a1";
  ctx.fillRect(p.x - 43, p.y - 65, 43, 58);

  ctx.fillStyle = "#874b3f";
  ctx.beginPath();
  ctx.moveTo(p.x - 51, p.y - 65);
  ctx.lineTo(p.x, p.y - 105);
  ctx.lineTo(p.x + 51, p.y - 65);
  ctx.lineTo(p.x, p.y - 38);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = state.repairs.lighting ? "#ffe7a0" : "#8cc9d7";
  ctx.fillRect(p.x - 35, p.y - 57, 16, 15);
  ctx.fillRect(p.x + 16, p.y - 57, 16, 15);

  ctx.fillStyle = "#65432e";
  ctx.fillRect(p.x - 12, p.y - 38, 17, 31);
}

function person(x, y, color, name) {
  const p = iso(x, y);

  ctx.fillStyle = color;
  ctx.fillRect(p.x - 8, p.y - 22, 16, 21);

  ctx.fillStyle = "#e6b58e";
  ctx.beginPath();
  ctx.arc(p.x, p.y - 29, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, p.x, p.y - 43);
}

function drawWorld() {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#87ad76";
  ctx.fillRect(0, 0, w, h);

  for (let x = -7; x <= 7; x++) {
    for (let y = -7; y <= 7; y++) {
      diamond(x, y, (x + y) % 2 ? "#86ad73" : "#91b77e");
    }
  }

  const a = iso(-7, 3);
  const b = iso(7, 3);
  const c = iso(7, 4.2);
  const d = iso(-7, 4.2);

  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
  ctx.fillStyle = "#626b68";
  ctx.fill();

  diamond(-1, 0, "#b9a17b");
  diamond(0, 0, "#b9a17b");
  diamond(1, 0, "#b9a17b");

  tree(-3, -2);
  tree(3, -2);
  tree(-3, 1);
  tree(3, 1);
  tree(-4, 3);

  house(0, 0);
  person(-1, 2, "#456e9b", "Вы");
  person(1, 2, "#a94d45", "Баба Зина");
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWorld();
}

canvas.addEventListener("click", event => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  const h = iso(0, 0);
  const b = iso(1, 2);

  if (Math.abs(x - h.x) < 55 && Math.abs(y - (h.y - 70)) < 65) {
    openDialog(
      "Старый дом",
      "Дом требует ремонта. Восстанови коммуникации, а затем приведи в порядок комнаты и мебель.",
      "🏚️",
      "Перейти к ремонту",
      () => {
        closeDialog();
        showPanel("repair");
      }
    );
    return;
  }

  if (Math.abs(x - b.x) < 35 && Math.abs(y - (b.y - 20)) < 35) {
    openDialog(
      "Баба Зина",
      allUtilitiesRestored()
        ? "Спасибо тебе, хозяин! В доме снова есть свет, вода и тепло. Теперь можно заняться уютом!"
        : "Здравствуй, хозяин! Сначала восстанови электричество, воду, отопление и канализацию. Без этого нам никак!",
      "👵🏻",
      "Открыть задания",
      () => {
        closeDialog();
        showPanel("quests");
      }
    );
  }
});

document.getElementById("homeView").addEventListener("click", resizeCanvas);
window.addEventListener("resize", resizeCanvas);

loadGame();
showPanel("district");
resizeCanvas();

setTimeout(() => {
  openDialog(
    "Баба Зина",
    "Ну здравствуй, новый хозяин! Купил наш район за рубль? Теперь помоги вернуть ему жизнь!"
  );
}, 500);
