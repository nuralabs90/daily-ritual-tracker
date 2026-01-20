const STORAGE_KEY = "ritual-tracker:v1";

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { rituals: [], lastSeenDay: todayISO() };
  try {
    return JSON.parse(raw);
  } catch {
    return { rituals: [], lastSeenDay: todayISO() };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function ensureDayRoll(state) {
  const t = todayISO();
  if (state.lastSeenDay !== t) {
    state.rituals = state.rituals.map(r => ({ ...r, doneToday: false }));
    state.lastSeenDay = t;
    saveState(state);
  }
}

function render(state) {
  const list = document.getElementById("ritualList");
  list.innerHTML = "";
  document.getElementById("todayLabel").textContent = `Today: ${todayISO()}`;

  if (state.rituals.length === 0) {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `<div class="left"><span class="name">No rituals yet. Add one above.</span></div>`;
    list.appendChild(li);
    return;
  }

  state.rituals.forEach((ritual) => {
    const li = document.createElement("li");
    li.className = "item";

    const left = document.createElement("div");
    left.className = "left";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = ritual.doneToday === true;

    checkbox.addEventListener("change", () => {
      ritual.doneToday = checkbox.checked;

      if (checkbox.checked) {
        const t = todayISO();
        if (ritual.lastCompletedDate !== t) {
          ritual.streak = (ritual.streak || 0) + 1;
          ritual.lastCompletedDate = t;
        }
      }
      saveState(state);
      render(state);
    });

    const name = document.createElement("span");
    name.className = "name";
    name.textContent = ritual.name;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = `Streak: ${ritual.streak || 0}`;

    left.appendChild(checkbox);
    left.appendChild(name);
    left.appendChild(badge);

    const del = document.createElement("button");
    del.textContent = "Delete";
    del.addEventListener("click", () => {
      state.rituals = state.rituals.filter(r => r.id !== ritual.id);
      saveState(state);
      render(state);
    });

    li.appendChild(left);
    li.appendChild(del);

    list.appendChild(li);
  });
}

function main() {
  let state = loadState();
  ensureDayRoll(state);
  render(state);

  const form = document.getElementById("ritualForm");
  const input = document.getElementById("ritualInput");
  const resetTodayBtn = document.getElementById("resetTodayBtn");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;

    state.rituals.unshift({
      id: crypto.randomUUID(),
      name,
      doneToday: false,
      streak: 0,
      lastCompletedDate: null,
    });

    input.value = "";
    saveState(state);
    render(state);
  });

  resetTodayBtn.addEventListener("click", () => {
    state.rituals = state.rituals.map(r => ({ ...r, doneToday: false }));
    saveState(state);
    render(state);
  });
}

main();