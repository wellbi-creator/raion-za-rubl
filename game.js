
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const balance = document.getElementById("balance");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const modalAvatar = document.getElementById("modalAvatar");
const panelHeading = document.getElementById("panelHeading");
const panelContent = document.getElementById("panelContent");

const state = {
  balance: 1000000,
  reputation: 0
};

function saveGame() {
  localStorage.setItem("raion-save", JSON.stringify(state));
}

function loadGame() {
  try {
    const saved = JSON.parse(localStorage.getItem("raion-save"));
    if (saved) Object.assign(state, saved);
  } catch (e) {}

  updateBalance();
}

function updateBalance() {
  balance.textContent = state.balance.toLocaleString("ru-RU") + " ₽";
}

function openDialog(title, message, avatar = "👵🏻") {
  modalTitle.textContent = title;
  modalText.textContent = message;
  modalAvatar.textContent = avatar;
  modal.classList.remove("hidden");
}

function closeDialog() {
  modal.classList.add("hidden");
}

document.getElementById("modalClose").addEventListener("click", closeDialog);
document.getElementById("modalAction").addEventListener("click", closeDialog);

modal.addEventListener("click", e => {
  if (e.target === modal) closeDialog();
});

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
        <p>⚡ Электричество: отключено</p>
        <p>💧 Вода: отключена</p>
        <p>🔥 Отопление: отключено</p>
        <p>🚰 Канализация: отключена</p>
      </div>`
  },

  quests: {
    title: "Тетрадка",
    html: `
      <div class="info-card">
        <h3>📖 Задание №1. Новый хозяин</h3>
        <p>Познакомься с Бабой Зиной и осмотри старый дом.</p>
        <p>Награда: скоро появится.</p>
      </div>`
  },

  houses: {
    title: "Дома",
    html: `
      <div class="info-card">
        <h3>🏠 Старый дом</h3>
        <p>Первый дом района.</p>
        <p>Состояние: требует капитального ремонта.</p>
      </div>`
  },

  finance: {
    title: "Финансы",
    html: `
      <div class="info-card">
        <h3>💰 Бюджет района</h3>
        <p>Баланс: ${state.balance.toLocaleString("ru-RU")} ₽</p>
        <p>Репутация: ${state.reputation}</p>
      </div>`
  },

  residents: {
    title: "Жители",
    html: `
      <div class="info-card">
        <h3>👵🏻 Баба Зина</h3>
        <p>Первая жительница района.</p>
        <p>Настроение: ждёт перемен.</p>
      </div>`
  }
};

function showPanel(name) {
  const panel = panels[name];

  if (!panel) return;

  panelHeading.textContent = panel.title;
  panelContent.innerHTML = panel.html;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.panel === name
    );
  });
}

// Навигация
document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => {
    showPanel(button.dataset.panel);
  });
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

  ctx.fillStyle = "#b69d7e";
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

  ctx.fillStyle = "#65432e";
  ctx.fillRect(p.x - 12, p.y - 38, 17, 31);

  ctx.fillStyle = "#8cc9d7";
  ctx.fillRect(p.x - 35, p.y - 57, 16, 15);
  ctx.fillRect(p.x + 16, p.y - 57, 16, 15);
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

  // Дорога
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

  // Двор
  diamond(-1, 0, "#b9a17b");
  diamond(0, 0, "#b9a17b");
  diamond(1, 0, "#b9a17b");

  // Деревья
  tree(-3, -2);
  tree(3, -2);
  tree(-3, 1);
  tree(3, 1);
  tree(-4, 3);

  // Дом и жители
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
      "Дом требует ремонта. Нужно восстановить электричество, воду, отопление и канализацию.",
      "🏚️"
    );
    return;
  }

  if (Math.abs(x - b.x) < 35 && Math.abs(y - (b.y - 20)) < 35) {
    openDialog(
      "Баба Зина",
      "Здравствуй, хозяин! Помоги вернуть нашему району нормальную жизнь!",
      "👵🏻"
    );
  }
});

document.getElementById("homeView").addEventListener("click", () => {
  resizeCanvas();
});

window.addEventListener("resize", resizeCanvas);

// Запуск игры
loadGame();
showPanel("district");
resizeCanvas();

setTimeout(() => {
  openDialog(
    "Баба Зина",
    "Ну здравствуй, новый хозяин! Купил наш район за рубль? Теперь помоги вернуть ему жизнь!"
  );
}, 500);
