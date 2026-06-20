const STORAGE_KEY = "duo-kitchen-phase1";
const SYNC_SETTINGS_KEY = "duo-kitchen-sync-settings";
const SCHEMA_VERSION = 13;
const DEFAULT_SYNC_SETTINGS = {
  url: "https://gnaggnujcskjyeeulbos.supabase.co",
  key: "sb_publishable_QorZ2Q2Z2V45qRsjffy2lg_lpuQJngc",
  householdId: "our-kitchen"
};

const illustrationAssets = {
  fridgeOpen: "./assets/illustrations/fridge-open-mobile.jpg",
  fridgeClosed: "./assets/illustrations/fridge-closed-mobile.jpg",
  fridge: "./assets/illustrations/fridge-open-mobile.jpg",
  table: "",
  recipe: ""
};

const categoryAssets = {
  meat: "./assets/food/meat.png",
  seafood: "./assets/food/seafood.png",
  vegetable: "./assets/food/vegetable.png",
  fruit: "./assets/food/fruit.png",
  eggDairy: "./assets/food/eggDairy.png",
  staple: "./assets/food/staple.png",
  drink: "./assets/food/drink.png",
  seasoning: "./assets/food/seasoning.png",
  frozen: "./assets/food/frozen.png",
  leftover: "./assets/food/leftover.png",
  snack: "./assets/food/snack.png",
  other: "./assets/food/other.png"
};

const zoneLabels = {
  freezerTop: "冷冻上层",
  freezerBottom: "冷冻下层",
  freshTop: "保鲜一层",
  freshMiddle: "保鲜二层",
  freshBottom: "保鲜三层",
  crisper: "保鲜抽屉",
  doorTop: "门架上层",
  doorMiddle: "门架中层",
  doorBottom: "门架下层"
};

const defaultFridgeIntro = "上层冷冻、下层保鲜、门架都可以单独放东西。";

const fridgeSections = [
  { title: "上层冷冻区", className: "freezer-section", zones: ["freezerTop", "freezerBottom"] },
  { title: "下层保鲜区", className: "fresh-section", zones: ["freshTop", "freshMiddle", "freshBottom", "crisper"] },
  { title: "下层门架", className: "door-section", zones: ["doorTop", "doorMiddle", "doorBottom"] }
];

const categoryLabels = {
  meat: "肉类",
  seafood: "海鲜",
  vegetable: "蔬菜",
  fruit: "水果",
  eggDairy: "蛋奶",
  staple: "主食",
  drink: "饮料",
  seasoning: "调味料",
  frozen: "速冻食品",
  leftover: "熟食剩菜",
  snack: "零食",
  other: "其他"
};

const categoryEmoji = {
  meat: "🥩",
  seafood: "🐟",
  vegetable: "🥬",
  fruit: "🍎",
  eggDairy: "🥚",
  staple: "🍚",
  drink: "🥛",
  seasoning: "🧂",
  frozen: "🧊",
  leftover: "🍱",
  snack: "🍪",
  other: "🍽"
};

const mealSlots = [
  { id: "breakfast", label: "早餐" },
  { id: "lunch", label: "午餐" },
  { id: "dinner", label: "晚餐" },
  { id: "snack", label: "加餐" }
];

const recipeCategories = ["家常", "快手菜", "汤", "主食", "早餐", "甜点", "饮品", "周末菜", "待尝试", "其他"];

const navItems = [
  { id: "fridge", label: "我的冰箱", icon: "fridge" },
  { id: "table", label: "今日餐桌", icon: "table" },
  { id: "recipes", label: "我的菜谱", icon: "recipes" }
];

const app = document.querySelector("#app");
let state = loadState();
syncWeekDaysWithToday();
let customMusicUrl = "";
let customMusicName = "";
let customAudio = null;
let syncClient = null;
let syncUser = null;
let syncHouseholdId = "";
let syncMessage = "还没连接云同步";
let syncSaveTimer = null;
let syncBooted = false;

function makeDefaultData() {
  const days = makeWeekDays();
  const today = days.find((day) => day.isToday) || days[0];
  const recipes = makeDefaultRecipes();
  today.meals.breakfast.planned = ["牛奶", "面包"];
  today.meals.breakfast.status = "计划中";
  today.meals.dinner.planned = ["番茄炒蛋", "米饭"];
  today.meals.dinner.recipeIds = ["tomato-egg"];
  today.meals.dinner.usages = makeUsagesFromRecipe(recipes[0]);
  today.meals.dinner.status = "计划中";
  today.meals.dinner.arrangedBy = "kerwin";
  today.meals.dinner.reactions = [{ memberId: "partner", label: "想吃" }];

  return {
    schemaVersion: SCHEMA_VERSION,
    activeTab: "table",
    activeMember: "kerwin",
    fridgeOpen: true,
    lastSyncedTodayId: today.id,
    fridgeIntro: defaultFridgeIntro,
    selectedZone: "freshMiddle",
    selectedRecipeId: "tomato-egg",
    selectedRecipeCategory: "all",
    selectedDayId: today.id,
    tableView: "day",
    drawer: null,
    editingIngredientId: null,
    editingMealId: null,
    editingRecipeId: null,
    scheduleRecipeId: null,
    draftIngredientCategory: "vegetable",
    fridgeDoor: {
      note: "今晚：番茄炒蛋",
      stickers: ["🍅", "🥚", "🌿"]
    },
    sound: true,
    music: true,
    cooking: null,
    toast: "",
    undo: null,
    members: [
      { id: "kerwin", name: "Kerwin", color: "#d8e7e8", shape: "cloud", hair: "short", expression: "smile", photo: "" },
      { id: "partner", name: "对象", color: "#e2eadb", shape: "drop", hair: "tuft", expression: "smile", photo: "" }
    ],
    ingredients: [
      { id: "tomato", name: "番茄", category: "vegetable", quantity: 3, unit: "个", zone: "freshMiddle", expiry: "明天最好吃掉", opened: false },
      { id: "egg", name: "鸡蛋", category: "eggDairy", quantity: 2, unit: "个", zone: "doorMiddle", expiry: "还很新鲜", opened: false },
      { id: "milk", name: "牛奶", category: "drink", quantity: 1, unit: "瓶", zone: "doorBottom", expiry: "明天喝掉更好", opened: true },
      { id: "soy", name: "酱油", category: "seasoning", quantity: 1, unit: "瓶", zone: "doorMiddle", expiry: "常温调味", opened: true },
      { id: "rice", name: "米饭", category: "staple", quantity: 2, unit: "份", zone: "freshBottom", expiry: "今天或明天", opened: false }
    ],
    recipes,
    days,
    shopping: [{ id: "shop-egg", name: "鸡蛋", quantity: 1, unit: "个", reason: "为了番茄炒蛋", addedBy: "kerwin", bought: false }],
    activity: ["Kerwin 安排了今晚的番茄炒蛋。", "对象点了：想吃。"]
  };
}

function makeWeekDays(baseDate = new Date()) {
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);
  const labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const id = makeDateId(date);
    const isToday = sameDate(date, baseDate);
    const label = labels[(date.getDay() + 6) % 7];
    return {
      id,
      label,
      dateLabel: `${date.getMonth() + 1}/${date.getDate()}`,
      isToday,
      meals: Object.fromEntries(mealSlots.map((slot) => [slot.id, makeMeal(slot.id, slot.label)]))
    };
  });
}

function makeDateId(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function makeMeal(id, slot) {
  return {
    id,
    slot,
    planned: [],
    actual: [],
    recipeIds: [],
    usages: [],
    status: "未安排",
    arrangedBy: "kerwin",
    reactions: []
  };
}

function makeDefaultRecipes() {
  return [
    {
      id: "tomato-egg",
      name: "番茄炒蛋",
      image: "",
      category: "快手菜",
      time: "15 分钟",
      difficulty: "简单",
      favorite: true,
      cookedCount: 6,
      lastCooked: "3 天前",
      tags: ["两个人都喜欢", "快手", "家常"],
      ingredients: [
        { name: "番茄", ingredientId: "tomato", quantity: 2, unit: "个", required: true },
        { name: "鸡蛋", ingredientId: "egg", quantity: 3, unit: "个", required: true },
        { name: "盐", ingredientId: null, quantity: 1, unit: "少量", required: true },
        { name: "糖", ingredientId: null, quantity: 1, unit: "少量", required: false }
      ],
      steps: [
        { title: "打蛋", body: "鸡蛋打散，放一点点盐。", time: "1 分钟" },
        { title: "切番茄", body: "番茄切块，保留一点汁水。", time: "2 分钟" },
        { title: "先炒鸡蛋", body: "中火把鸡蛋炒到刚刚凝固，盛出。", time: "1 分钟" },
        { title: "炒番茄", body: "番茄炒软，加少量盐和一点糖。", time: "4 分钟" },
        { title: "合在一起", body: "鸡蛋倒回锅里，翻一翻就出锅。", time: "1 分钟" }
      ],
      notes: ["下次少放糖。", "对象喜欢番茄汁多一点。"],
      history: []
    },
    {
      id: "tom-yum",
      name: "冬阴功汤",
      image: "",
      category: "汤",
      time: "35 分钟",
      difficulty: "中等",
      favorite: true,
      cookedCount: 2,
      lastCooked: "上周",
      tags: ["汤", "周末", "对象喜欢"],
      ingredients: [
        { name: "虾仁", ingredientId: null, quantity: 1, unit: "包", required: true },
        { name: "蘑菇", ingredientId: null, quantity: 1, unit: "盒", required: true }
      ],
      steps: [{ title: "煮汤底", body: "汤底煮开后放蘑菇和虾仁。", time: "15 分钟" }],
      notes: ["下次少放一点辣。"],
      history: []
    }
  ];
}

function sameDate(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function syncWeekDaysWithToday() {
  const freshDays = makeWeekDays();
  const todayId = freshDays.find((day) => day.isToday)?.id || freshDays[0]?.id;
  const existingDays = new Map((state.days || []).map((day) => [day.id, day]));
  state.days = freshDays.map((freshDay) => {
    const existing = existingDays.get(freshDay.id);
    if (!existing) return freshDay;
    return {
      ...freshDay,
      meals: {
        ...freshDay.meals,
        ...(existing.meals || {})
      }
    };
  });
  if (state.lastSyncedTodayId !== todayId || !state.days.some((day) => day.id === state.selectedDayId)) {
    state.selectedDayId = todayId;
    state.lastSyncedTodayId = todayId;
  }
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.schemaVersion !== SCHEMA_VERSION) return makeDefaultData();
    return { ...makeDefaultData(), ...saved, toast: "", drawer: null, cooking: null, editingIngredientId: null, editingMealId: null, editingRecipeId: null, scheduleRecipeId: null };
  } catch {
    return makeDefaultData();
  }
}

function persist() {
  const snapshot = { ...state, toast: "", drawer: null, cooking: null, editingIngredientId: null, editingMealId: null, editingRecipeId: null, scheduleRecipeId: null };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  queueCloudSave();
}

function closeDrawer() {
  state.drawer = null;
  state.editingIngredientId = null;
  state.editingMealId = null;
  state.editingMealDayId = null;
  state.editingRecipeId = null;
}

function render() {
  syncWeekDaysWithToday();
  app.innerHTML = `
    <div class="app-shell">
      ${renderTopbar()}
      <main class="main-view">
        ${state.activeTab === "fridge" ? renderFridgePage() : ""}
        ${state.activeTab === "table" ? renderTablePage() : ""}
        ${state.activeTab === "recipes" ? renderRecipesPage() : ""}
      </main>
      ${renderBottomNav()}
      ${renderDrawer()}
      ${state.cooking ? renderCookingMode() : ""}
      ${state.toast ? `<div class="toast">${state.toast}</div>` : ""}
    </div>
  `;
}

function renderTopbar() {
  const shoppingCount = state.shopping.filter((item) => !item.bought).length;
  return `
    <header class="topbar">
      <div class="topbar-row">
        <div>
          <p class="eyebrow">Kitchen Diary for Two</p>
          <h1 class="app-title">双人小餐桌</h1>
        </div>
        <div class="top-actions">
          <button class="icon-button ${state.sound ? "is-on" : ""}" data-action="toggle-sound" aria-label="音效开关">${icon("sound")}</button>
          <button class="icon-button record-icon ${state.music ? "is-on" : ""}" data-action="open-drawer" data-drawer="music" aria-label="唱片机">${icon("music")}</button>
          <button class="icon-button ${syncUser ? "is-on" : ""}" data-action="open-drawer" data-drawer="sync" aria-label="双人同步">${icon("sync")}</button>
          <button class="icon-button" data-action="open-drawer" data-drawer="shopping" aria-label="购物清单">
            ${icon("basket")}
            ${shoppingCount ? `<span class="badge-dot">${shoppingCount}</span>` : ""}
          </button>
        </div>
      </div>
      <div class="member-row" aria-label="共同管理人">
        ${state.members.map(renderMemberChip).join("")}
      </div>
    </header>
  `;
}

function renderMemberChip(member) {
  return `
    <button class="member-chip ${member.id === state.activeMember ? "is-active" : ""}" data-action="set-member" data-member="${member.id}">
      ${renderAvatar(member)}
      <span>${escapeHtml(member.name)}</span>
    </button>
  `;
}

function renderAvatar(member) {
  if (member.photo) {
    return `
      <span class="avatar avatar-photo" style="--avatar-color:${member.color}">
        <img src="${member.photo}" alt="${escapeAttribute(member.name)}的头像" />
      </span>
    `;
  }
  return `
    <span class="avatar shape-${member.shape} hair-${member.hair} expression-${member.expression || "smile"}" style="--avatar-color:${member.color}">
      <span class="mouth"></span>
    </span>
  `;
}

function renderFridgePage() {
  const items = state.ingredients.filter((item) => item.zone === state.selectedZone);
  const hasFridgeAsset = Boolean(illustrationAssets.fridgeOpen || illustrationAssets.fridgeClosed || illustrationAssets.fridge);
  const fridgeOpen = state.fridgeOpen !== false;
  const openContent = `
    ${renderZoneSelector()}

    <section class="content-card">
      <div class="section-row">
        <div>
          <h3>${zoneLabels[state.selectedZone]}</h3>
          <p>${items.length ? "这些食材现在放在这里。" : "这里还是空的，可以先加一点东西。"}</p>
        </div>
      </div>
      <div class="item-list">
        ${items.map(renderIngredientCard).join("") || `<div class="empty-state">空空的，也挺清爽。</div>`}
      </div>
    </section>
  `;
  return `
    <section class="page-head">
      <div>
        <p class="eyebrow">现在家里有什么</p>
        <h2>我的冰箱</h2>
        <button class="editable-copy" type="button" data-action="open-drawer" data-drawer="fridgeIntro" aria-label="编辑冰箱说明">
          ${escapeHtml(state.fridgeIntro || defaultFridgeIntro)}
        </button>
      </div>
      <button class="paper-button" data-action="new-ingredient">添加食材</button>
    </section>

    <section class="fridge-stage ${hasFridgeAsset ? "has-asset" : ""}">${renderFridgeVisual()}</section>
    <div class="fridge-toggle-row">
      <button class="paper-button fridge-toggle-button" type="button" data-action="toggle-fridge">
        ${fridgeOpen ? "关上冰箱" : "打开冰箱"}
      </button>
    </div>
    ${openContent}
  `;
}

function renderZoneSelector() {
  return `
    <section class="zone-strip" aria-label="冰箱区域">
      ${Object.entries(zoneLabels)
        .map(([id, label]) => `<button class="${state.selectedZone === id ? "is-active" : ""}" data-action="select-zone" data-zone="${id}">${label}</button>`)
        .join("")}
    </section>
  `;
}

function renderFridgeVisual() {
  const fridgeOpen = state.fridgeOpen !== false;
  const fridgeSrc = fridgeOpen
    ? illustrationAssets.fridgeOpen || illustrationAssets.fridge
    : illustrationAssets.fridgeClosed || illustrationAssets.fridgeOpen || illustrationAssets.fridge;

  if (fridgeSrc) {
    return `
      <div class="illustration-shell fridge-asset-shell ${fridgeOpen ? "is-open" : "is-closed"}">
        <button class="fridge-asset-button" type="button" data-action="toggle-fridge" aria-label="${fridgeOpen ? "关上冰箱" : "打开冰箱"}" aria-pressed="${fridgeOpen ? "true" : "false"}">
          <img class="fridge-state-image" src="${fridgeSrc}" alt="${fridgeOpen ? "打开的冰箱" : "关门的冰箱"}" data-fallback-src="${illustrationAssets.fridge || ""}" decoding="async" fetchpriority="high" />
        </button>
        ${
          fridgeOpen
            ? `
              <div class="fridge-food-layer">${renderFridgeAssetStickers()}</div>
              <div class="zone-overlay">
                ${Object.keys(zoneLabels).map((id) => `<button class="${state.selectedZone === id ? "is-selected" : ""}" data-action="select-zone" data-zone="${id}">${zoneLabels[id]}</button>`).join("")}
              </div>
            `
            : `<div class="fridge-closed-hint">点一下打开冰箱</div>`
        }
      </div>
    `;
  }

  return `
    <div class="simple-fridge ${fridgeOpen ? "is-open" : ""}">
      <span class="fridge-inside">${fridgeSections.map(renderFridgeSection).join("")}</span>
    </div>
  `;
}

function renderFridgeAssetStickers() {
  const grouped = state.ingredients.reduce((acc, item) => {
    acc[item.zone] = acc[item.zone] || [];
    acc[item.zone].push(item);
    return acc;
  }, {});
  return Object.entries(grouped)
    .map(([zone, items]) => {
      const visible = items.slice(0, 3);
      const hiddenCount = Math.max(0, items.length - visible.length);
      return `
        ${visible
          .map(
            (item, order) => `
              <button class="fridge-food-sticker zone-${item.zone} offset-${order}" data-action="select-zone" data-zone="${item.zone}" title="${item.name}">
                ${foodIcon(item.category)}
                <span>${item.quantity}${item.unit}</span>
              </button>
            `
          )
          .join("")}
        ${
          hiddenCount
            ? `<button class="fridge-more-bubble zone-${zone}" data-action="select-zone" data-zone="${zone}" title="还有 ${hiddenCount} 个">${hiddenCount > 9 ? "9+" : `+${hiddenCount}`}</button>`
            : ""
        }
      `;
    })
    .join("");
}

function renderFridgeSection(section) {
  return `
    <span class="fridge-section ${section.className}">
      <span class="fridge-section-title">${section.title}</span>
      ${section.zones.map(renderFridgeZone).join("")}
    </span>
  `;
}

function renderFridgeZone(id) {
  return `
    <span class="fridge-zone ${state.selectedZone === id ? "is-selected" : ""}" data-action="select-zone" data-zone="${id}">
      <strong>${zoneLabels[id]}</strong>
      <small>${state.ingredients.filter((item) => item.zone === id).length} 件</small>
    </span>
  `;
}

function renderIngredientCard(item) {
  return `
    <article class="item-card">
      <div class="food-badge">${foodIcon(item.category)}</div>
      <div>
        <h3>${item.name}</h3>
        <p>${categoryLabels[item.category] || "其他"} · ${item.quantity}${item.unit} · ${item.expiry}</p>
      </div>
      <div class="card-actions">
        <button class="mini-button" data-action="change-qty" data-id="${item.id}" data-delta="-1">−</button>
        <button class="mini-button" data-action="change-qty" data-id="${item.id}" data-delta="1">+</button>
        <button class="mini-button" data-action="edit-ingredient" data-id="${item.id}">编辑</button>
        <button class="mini-button" data-action="delete-ingredient" data-id="${item.id}">吃完</button>
      </div>
    </article>
  `;
}

function renderTablePage() {
  const day = getSelectedDay();
  const summaryRecipe = findRecipe("tomato-egg");
  return `
    <section class="page-head roomy">
      <div>
        <p class="eyebrow">${day.isToday ? "今天" : day.label}</p>
        <h2>${day.isToday ? "今日餐桌" : `${day.label}餐桌`}</h2>
        <p>可以先安排计划，吃完确认后才会扣冰箱库存。</p>
      </div>
      <button class="paper-button" data-action="open-meal-drawer" data-meal="dinner">添加菜</button>
    </section>

    ${renderWeekStrip()}
    ${renderDayTable(day)}

    <section class="content-card">
      <div class="section-row">
        <div>
          <h3>${summaryRecipe.name}食材检查</h3>
          <p>根据菜谱需求和当前冰箱库存自动估算。</p>
        </div>
      </div>
      <div class="check-list">${getRecipeChecks(summaryRecipe).map(renderCheckRow).join("")}</div>
      <div class="action-row">
        <button class="paper-button" data-action="open-schedule" data-recipe="${summaryRecipe.id}">安排这道菜</button>
        <button class="wood-button" data-action="start-cooking" data-recipe="${summaryRecipe.id}">开始做菜</button>
      </div>
    </section>

    <section class="content-card">
      <h3>最近记录</h3>
      <div class="activity-list">${state.activity.slice(-5).reverse().map((item) => `<p>${item}</p>`).join("")}</div>
    </section>
  `;
}

function renderWeekStrip() {
  return `
    <section class="week-strip" aria-label="日期选择">
      ${state.days
        .map((day) => {
          const plannedCount = Object.values(day.meals).reduce((sum, meal) => sum + meal.planned.length, 0);
          return `
            <button class="week-card ${state.selectedDayId === day.id ? "is-selected" : ""}" data-action="select-day" data-day="${day.id}">
              <strong>${day.isToday ? "今天" : day.label}</strong>
              <span>${day.dateLabel}</span>
              <small>${plannedCount ? `${plannedCount} 道已安排` : "还没安排"}</small>
            </button>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderDayTable(day) {
  return `
    <section class="table-mat">
      ${mealSlots.map((slot) => renderMealCard(day.meals[slot.id], day.id)).join("")}
    </section>
  `;
}

function renderMealCard(meal, dayId) {
  const arrangedBy = findMember(meal.arrangedBy);
  return `
    <article class="meal-card ${meal.status === "已完成" ? "is-done" : ""}">
      <div class="meal-head">
        <div>
          <h3>${meal.slot}</h3>
          <p>${meal.planned.length ? meal.planned.join("、") : "还没安排"}</p>
        </div>
        <span class="status-pill">${meal.status}</span>
      </div>
      <div class="meal-meta">${arrangedBy ? renderAvatar(arrangedBy) : ""}<span>${escapeHtml(arrangedBy?.name || "我们")} 安排</span></div>
      <div class="tag-row">
        ${(meal.reactions || [])
          .map((reaction) => {
            const member = findMember(reaction.memberId);
            return `<span class="soft-tag">${escapeHtml(member ? member.name : "有人")}：${escapeHtml(reaction.label)}</span>`;
          })
          .join("")}
      </div>
      <div class="action-row">
        <button class="paper-button" data-action="open-meal-drawer" data-day="${dayId}" data-meal="${meal.id}">添加菜</button>
        <button class="paper-button" data-action="react-meal" data-day="${dayId}" data-meal="${meal.id}" data-label="想吃">想吃</button>
        <button class="paper-button" data-action="react-meal" data-day="${dayId}" data-meal="${meal.id}" data-label="换一个吧">换一个吧</button>
        <button class="wood-button" data-action="finish-meal" data-day="${dayId}" data-meal="${meal.id}">吃完确认</button>
      </div>
    </article>
  `;
}

function renderRecipesPage() {
  const category = state.selectedRecipeCategory || "all";
  const recipes = category === "all" ? state.recipes : state.recipes.filter((recipe) => recipe.category === category);
  const selectedRecipe = findRecipe(state.selectedRecipeId);
  const selected = category === "all" ? selectedRecipe || recipes[0] : recipes.includes(selectedRecipe) ? selectedRecipe : recipes[0];
  return `
    <section class="page-head">
      <div>
        <p class="eyebrow">我们会做什么</p>
        <h2>我的菜谱</h2>
        <p>菜谱可以安排到任意一天任意一餐，也能进入做菜模式。</p>
      </div>
      <button class="paper-button" data-action="new-recipe">新建菜谱</button>
    </section>

    ${renderRecipeCategoryStrip()}
    <section class="recipe-list">${recipes.length ? recipes.map(renderRecipeCard).join("") : renderEmptyRecipes(category)}</section>
    ${selected ? renderRecipeDetail(selected) : ""}
    ${renderRecipeToolsPanel()}
  `;
}

function renderRecipeCategoryStrip() {
  const counts = state.recipes.reduce((memo, recipe) => {
    memo[recipe.category] = (memo[recipe.category] || 0) + 1;
    return memo;
  }, {});
  const items = [
    ["all", `全部 ${state.recipes.length}`],
    ...recipeCategories.map((category) => [category, `${category} ${counts[category] || 0}`])
  ];
  return `
    <section class="recipe-category-strip" aria-label="菜谱分类">
      ${items.map(([id, label]) => `<button class="${(state.selectedRecipeCategory || "all") === id ? "is-active" : ""}" data-action="select-recipe-category" data-category="${id}">${label}</button>`).join("")}
    </section>
  `;
}

function renderEmptyRecipes(category) {
  return `
    <div class="empty-state">
      <strong>${category === "all" ? "还没有菜谱" : `这个分类还没有菜谱`}</strong>
      <p>可以先新建一道，之后再慢慢补照片和步骤。</p>
      <button class="paper-button" data-action="new-recipe">新建菜谱</button>
    </div>
  `;
}

function renderFutureAssetNote(type, title, text) {
  if (illustrationAssets[type]) return `<section class="content-card"><img class="asset-image" src="${illustrationAssets[type]}" alt="${title}" /></section>`;
  return `<section class="illustration-slot" aria-label="${title}"><div><strong>${title}</strong><p>${text}</p></div></section>`;
}

function renderRecipeCard(recipe) {
  return `
    <article class="recipe-card ${state.selectedRecipeId === recipe.id ? "is-selected" : ""}">
      <button class="recipe-card-main" data-action="select-recipe" data-id="${recipe.id}">
        ${renderRecipeCover(recipe)}
        <div>
          <h3>${recipe.name}</h3>
          <p>${recipe.category} · ${recipe.difficulty} · ${recipe.time} · 做过 ${recipe.cookedCount} 次</p>
          <div class="tag-row">${recipe.tags.map((tag) => `<span class="soft-tag">${tag}</span>`).join("")}</div>
        </div>
      </button>
      <div class="recipe-card-actions">
        <button class="mini-button" data-action="edit-recipe" data-id="${recipe.id}">编辑</button>
        <button class="mini-button danger-button" data-action="delete-recipe" data-id="${recipe.id}">删除</button>
      </div>
    </article>
  `;
}

function renderRecipeCover(recipe) {
  if (recipe.image) {
    return `<div class="recipe-cover"><img src="${recipe.image}" alt="${recipe.name}照片" /></div>`;
  }
  return `<div class="recipe-cover recipe-cover-placeholder"><span>菜</span></div>`;
}

function renderRecipeDetail(recipe) {
  return `
    <section class="content-card">
      <div class="recipe-detail-photo">
        ${renderRecipeCover(recipe)}
        <label class="photo-picker">
          ${recipe.image ? "更换照片" : "添加照片"}
          <input type="file" accept="image/*" capture="environment" data-recipe-upload="${recipe.id}" />
        </label>
      </div>
      <div class="section-row">
        <div>
          <h3>${recipe.name}</h3>
          <p>${recipe.category} · ${recipe.time} · 上次做：${recipe.lastCooked}</p>
        </div>
        <span class="status-pill">${recipe.favorite ? "收藏" : "普通"}</span>
      </div>
      <h4>需要的食材</h4>
      <div class="check-list">${getRecipeChecks(recipe).map(renderCheckRow).join("") || `<p>这道菜还没记录食材。</p>`}</div>
      <h4>步骤</h4>
      <div class="step-list">
        ${recipe.steps.map((step, index) => `<article><strong>${index + 1}. ${step.title}</strong><p>${step.body}（${step.time}）</p></article>`).join("")}
      </div>
      <div class="action-row">
        <button class="paper-button" data-action="edit-recipe" data-id="${recipe.id}">编辑菜谱</button>
        <button class="paper-button" data-action="open-schedule" data-recipe="${recipe.id}">安排这道菜</button>
        <button class="wood-button" data-action="start-cooking" data-recipe="${recipe.id}">开始做菜</button>
        <button class="mini-button danger-button" data-action="delete-recipe" data-id="${recipe.id}">删除</button>
      </div>
      <h4>制作历史</h4>
      <div class="activity-list">${recipe.history.length ? recipe.history.map((item) => `<p>${item}</p>`).join("") : `<p>做完后会自动记到这里。</p>`}</div>
    </section>
  `;
}

function renderRecipeToolsPanel() {
  const favoriteCount = state.recipes.filter((recipe) => recipe.favorite).length;
  const cookedCount = state.recipes.reduce((sum, recipe) => sum + Number(recipe.cookedCount || 0), 0);
  const categoryCount = new Set(state.recipes.map((recipe) => recipe.category)).size;
  return `
    <section class="recipe-tools-panel">
      <div>
        <p class="eyebrow">菜谱整理</p>
        <h3>把常做的菜慢慢收好</h3>
        <p>现在可以按分类筛选，也可以直接编辑、删除、换照片。</p>
      </div>
      <div class="recipe-stat-grid">
        <span><strong>${state.recipes.length}</strong><small>道菜</small></span>
        <span><strong>${categoryCount}</strong><small>个分类</small></span>
        <span><strong>${favoriteCount}</strong><small>收藏</small></span>
        <span><strong>${cookedCount}</strong><small>次做过</small></span>
      </div>
      <button class="wood-button" data-action="new-recipe">继续加一道菜</button>
    </section>
  `;
}

function renderCheckRow(row) {
  const cls = row.status === "充足" ? "good" : row.status === "不足" ? "warn" : "miss";
  return `<div class="check-row"><span>${row.name} · 需要 ${row.need}</span><span class="status-pill ${cls}">${row.status}${row.have ? ` · 有 ${row.have}` : ""}</span></div>`;
}

function renderBottomNav() {
  return `
    <nav class="bottom-nav" aria-label="主导航">
      ${navItems
        .map((item) => `<button class="nav-button ${state.activeTab === item.id ? "is-active" : ""}" data-action="set-tab" data-tab="${item.id}">${icon(item.icon)}<span>${item.label}</span></button>`)
        .join("")}
    </nav>
  `;
}

function renderDrawer() {
  if (!state.drawer) return "";
  const drawers = {
    shopping: renderShoppingDrawer,
    music: renderMusicDrawer,
    sync: renderSyncDrawer,
    ingredient: renderIngredientDrawer,
    fridgeDoor: renderFridgeDoorDrawer,
    fridgeIntro: renderFridgeIntroDrawer,
    recipe: renderRecipeDrawer,
    avatar: renderAvatarDrawer,
    finishMeal: renderFinishMealDrawer,
    mealDish: renderMealDishDrawer,
    schedule: renderScheduleDrawer
  };
  return `
    <div class="drawer-backdrop" data-backdrop="drawer">
      <section class="drawer-card" role="dialog">
        ${drawers[state.drawer]?.() || ""}
      </section>
    </div>
  `;
}

function renderDrawerHead(title, note = "") {
  return `<div class="drawer-head"><div><p class="eyebrow">${note}</p><h2>${title}</h2></div><button class="mini-button close-button" type="button" data-action="close-drawer" aria-label="关闭">×</button></div>`;
}

function renderShoppingDrawer() {
  const items = state.shopping.filter((item) => !item.bought);
  return `
    ${renderDrawerHead("购物清单", "缺什么就写在小纸条上")}
    <div class="item-list">
      ${
        items.length
          ? items
              .map(
                (item) => `<article class="shopping-line"><div><h3>${item.name} ${item.quantity}${item.unit}</h3><p>${item.reason} · ${findMember(item.addedBy)?.name || "我们"} 添加</p></div><button class="paper-button" data-action="buy-item" data-id="${item.id}">放进冰箱</button></article>`
              )
              .join("")
          : `<div class="empty-state">清单空了，今天很轻松。</div>`
      }
    </div>
  `;
}

function renderMusicDrawer() {
  return `
    ${renderDrawerHead("小唱片机", "可以放默认氛围音乐，也可以拖进自己的歌")}
    <div class="record-player ${state.music ? "is-playing" : ""}">
      <button class="record-disc" data-action="toggle-music" aria-label="${state.music ? "暂停音乐" : "播放音乐"}">
        <span></span>
      </button>
      <div>
        <h3>${customMusicName || "Soft kitchen jazz"}</h3>
        <p>${customMusicName ? "正在使用你拖进来的音乐。" : "默认是一段轻轻的内置氛围循环。"}</p>
      </div>
    </div>
    <label class="music-drop-zone">
      <strong>把音频拖到这里</strong>
      <span>也可以点这里选择 mp3 / m4a / wav</span>
      <input type="file" accept="audio/*" data-music-upload />
    </label>
    <div class="action-row">
      <button class="wood-button" data-action="toggle-music">${state.music ? "暂停" : "播放"}</button>
      ${customMusicName ? `<button class="paper-button" data-action="clear-custom-music">换回默认音乐</button>` : ""}
    </div>
  `;
}

function renderSyncDrawer() {
  const settings = loadSyncSettings();
  const projectReady = Boolean(settings.url && settings.key);
  return `
    ${renderDrawerHead("双人同步", "两个人用同一个小家暗号就能同步")}
    <div class="sync-status-card ${syncUser ? "is-online" : ""}">
      <strong>${syncUser ? "已经登录" : projectReady ? "可以注册或登录" : "同步项目还没配置好"}</strong>
      <p>${escapeHtml(syncMessage)}</p>
      ${syncUser ? `<small>${escapeHtml(syncUser.email || "")} · 家庭码 ${escapeHtml(syncHouseholdId || settings.householdId || "未设置")}</small>` : ""}
    </div>
    <form class="form-card sync-login-card" data-form="syncLogin">
      <label>你的邮箱<input name="email" type="email" required value="${escapeAttribute(settings.email || "")}" placeholder="比如 name@example.com" /></label>
      <label>设置一个密码<input name="password" type="password" required minlength="6" autocomplete="current-password" placeholder="至少 6 位，自己记住" /></label>
      <label>小家暗号<input name="householdId" value="${escapeAttribute(settings.householdId || "our-kitchen")}" placeholder="两个人填一样，比如 our-kitchen" /></label>
      <p class="form-hint">第一次用点“注册账号”，然后去邮箱确认；确认后回到这里点“登录”。另一个人用自己的邮箱注册，但“小家暗号”填一样。</p>
      <div class="action-row">
        <button class="wood-button" type="submit" name="mode" value="signIn">登录</button>
        <button class="paper-button" type="submit" name="mode" value="signUp">注册账号</button>
      </div>
    </form>
    <div class="action-row">
      <button class="paper-button" data-action="cloud-pull">从云端刷新</button>
      <button class="paper-button" data-action="cloud-push">上传当前数据</button>
      ${syncUser ? `<button class="mini-button" data-action="cloud-signout">退出登录</button>` : ""}
    </div>
    <details class="sync-advanced">
      <summary>高级设置：Supabase 连接</summary>
      <form class="form-card" data-form="syncProject">
        <label>Supabase URL<input name="url" value="${escapeAttribute(settings.url || "")}" placeholder="https://xxxx.supabase.co" /></label>
        <label>Anon Key<input name="key" value="${escapeAttribute(settings.key || "")}" placeholder="项目里的 anon public key" /></label>
        <label>默认小家暗号<input name="householdId" value="${escapeAttribute(settings.householdId || "our-kitchen")}" placeholder="比如 our-kitchen" /></label>
        <button class="paper-button" type="submit">保存高级设置</button>
      </form>
    </details>
  `;
}

function renderIngredientDrawer() {
  const item = state.editingIngredientId ? findIngredient(state.editingIngredientId) : null;
  const selectedCategory = state.draftIngredientCategory || item?.category || "vegetable";
  return `
    ${renderDrawerHead(item ? "编辑食材" : "添加食材", item ? "修改数量、位置或提醒" : "先做最常用字段")}
    <form class="form-card" data-form="ingredient">
      <input type="hidden" name="id" value="${item?.id || ""}" />
      <input type="hidden" name="category" value="${selectedCategory}" />
      <input type="hidden" name="unit" value="${item?.unit || "份"}" />
      <label>名称<input name="name" required value="${item?.name || ""}" placeholder="比如 西兰花" /></label>
      <div class="field-block">
        <p>类别</p>
        <div class="category-wheel">
          ${Object.entries(categoryLabels)
            .map(
              ([id, label]) => `
                <button type="button" class="category-choice ${selectedCategory === id ? "is-active" : ""}" data-action="set-ingredient-category" data-category="${id}">
                  ${foodIcon(id)}
                  <span>${label}</span>
                </button>
              `
            )
            .join("")}
        </div>
      </div>
      <label>数量<input name="quantity" type="number" min="0" step="0.5" value="${item?.quantity ?? 1}" /></label>
      <label>存放区域<select name="zone">${Object.entries(zoneLabels).map(([id, label]) => `<option value="${id}" ${item?.zone === id || (!item && state.selectedZone === id) ? "selected" : ""}>${label}</option>`).join("")}</select></label>
      <label>提醒<input name="expiry" value="${item?.expiry || "这两天记得吃"}" /></label>
      <label class="checkbox-line"><input name="opened" type="checkbox" ${item?.opened ? "checked" : ""} /> 已经开封</label>
      <button class="wood-button" type="submit">${item ? "保存修改" : "放进冰箱"}</button>
    </form>
  `;
}

function renderMealDishDrawer() {
  const meal = getMeal(state.editingMealDayId || state.selectedDayId, state.editingMealId || "dinner");
  return `
    ${renderDrawerHead("添加菜", `${getDayLabel(state.editingMealDayId || state.selectedDayId)} · ${meal.slot}`)}
    <form class="form-card" data-form="mealDish">
      <input type="hidden" name="dayId" value="${state.editingMealDayId || state.selectedDayId}" />
      <input type="hidden" name="mealId" value="${meal.id}" />
      <label>从菜谱选择
        <select name="recipeId">
          <option value="">不选菜谱，临时记录</option>
          ${state.recipes.map((recipe) => `<option value="${recipe.id}">${recipe.name}</option>`).join("")}
        </select>
      </label>
      <label>临时菜名<input name="customName" placeholder="比如 外卖、煎牛排、水果" /></label>
      <button class="wood-button" type="submit">加入这一餐</button>
    </form>
  `;
}

function renderScheduleDrawer() {
  const recipe = findRecipe(state.scheduleRecipeId || state.selectedRecipeId);
  return `
    ${renderDrawerHead("安排这道菜", recipe?.name || "菜谱")}
    <form class="form-card" data-form="schedule">
      <input type="hidden" name="recipeId" value="${recipe?.id || ""}" />
      <label>哪一天<select name="dayId">${state.days.map((day) => `<option value="${day.id}" ${state.selectedDayId === day.id ? "selected" : ""}>${day.isToday ? "今天" : day.label} · ${day.dateLabel}</option>`).join("")}</select></label>
      <label>哪一餐<select name="mealId">${mealSlots.map((slot) => `<option value="${slot.id}" ${slot.id === "dinner" ? "selected" : ""}>${slot.label}</option>`).join("")}</select></label>
      <button class="wood-button" type="submit">安排好</button>
    </form>
  `;
}

function renderRecipeDrawer() {
  const recipe = state.editingRecipeId ? findRecipe(state.editingRecipeId) : null;
  const category = recipe?.category || state.selectedRecipeCategory !== "all" && state.selectedRecipeCategory || "快手菜";
  return `
    ${renderDrawerHead(recipe ? "编辑菜谱" : "新建菜谱", "分类、照片、食材和步骤都能补")}
    <form class="form-card" data-form="recipe">
      <input type="hidden" name="id" value="${escapeAttribute(recipe?.id || "")}" />
      <label>菜名<input name="name" required value="${escapeAttribute(recipe?.name || "")}" placeholder="比如 蒜蓉西兰花" /></label>
      <label>菜品照片<input name="image" type="file" accept="image/*" capture="environment" /></label>
      <div class="form-grid">
        <label>分类
          <select name="category">
            ${recipeCategories.map((item) => `<option value="${item}" ${category === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
        <label>难度
          <select name="difficulty">
            ${["简单", "中等", "复杂"].map((item) => `<option value="${item}" ${(recipe?.difficulty || "简单") === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
      </div>
      <label>时间<input name="time" value="${escapeAttribute(recipe?.time || "20 分钟")}" /></label>
      <label>标签<input name="tags" value="${escapeAttribute((recipe?.tags || ["家常", "快手"]).join(", "))}" /></label>
      <label class="checkbox-line"><input name="favorite" type="checkbox" ${recipe?.favorite ? "checked" : ""} /> 收藏这道菜</label>
      <label>所需食材<textarea name="ingredients" placeholder="番茄,2,个&#10;鸡蛋,3,个">${escapeHtml(recipeToIngredientLines(recipe))}</textarea></label>
      <label>步骤<textarea name="steps" placeholder="洗菜并切好｜5 分钟&#10;下锅翻炒｜8 分钟">${escapeHtml(recipeToStepLines(recipe))}</textarea></label>
      <div class="action-row">
        <button class="wood-button" type="submit">${recipe ? "保存修改" : "保存菜谱"}</button>
        ${recipe ? `<button class="paper-button danger-button" type="button" data-action="delete-recipe" data-id="${recipe.id}">删除这道菜</button>` : ""}
      </div>
    </form>
  `;
}

function renderAvatarDrawer() {
  const member = findMember(state.activeMember);
  return `
    ${renderDrawerHead("头像和名字", "可以上传照片，也可以继续用贴纸头像")}
    <div class="avatar-preview">${renderAvatar(member)}<strong>${escapeHtml(member.name)}</strong></div>
    <form class="form-card profile-form" data-form="memberProfile">
      <input type="hidden" name="memberId" value="${escapeAttribute(member.id)}" />
      <label>名字<input name="name" value="${escapeAttribute(member.name)}" maxlength="12" /></label>
      <label class="avatar-upload-label">上传头像照片<input name="photo" type="file" accept="image/*" /></label>
      <div class="action-row">
        <button class="wood-button" type="submit">保存资料</button>
        ${member.photo ? `<button class="paper-button" type="button" data-action="clear-avatar-photo">恢复贴纸头像</button>` : ""}
      </div>
    </form>
    <div class="avatar-editor">
      <p>颜色</p>
      <div class="color-grid">${["#d8e7e8", "#e2eadb", "#e8ded2", "#d9e1f2", "#eadbd5"].map((color) => `<button class="color-dot" style="background:${color}" data-action="set-avatar-color" data-color="${color}"></button>`).join("")}</div>
      <p>形状</p>
      <div class="choice-grid">
        ${["cloud", "drop", "round"].map((shape) => `<button class="${member.shape === shape ? "is-active" : ""}" data-action="set-avatar-prop" data-prop="shape" data-value="${shape}">${shape === "cloud" ? "软云" : shape === "drop" ? "水滴" : "圆圆"}</button>`).join("")}
      </div>
      <p>发型</p>
      <div class="choice-grid">
        ${["short", "tuft", "cap"].map((hair) => `<button class="${member.hair === hair ? "is-active" : ""}" data-action="set-avatar-prop" data-prop="hair" data-value="${hair}">${hair === "short" ? "短发" : hair === "tuft" ? "翘毛" : "小帽"}</button>`).join("")}
      </div>
      <p>表情</p>
      <div class="choice-grid">
        ${["smile", "yum", "calm", "spark"].map((expression) => `<button class="${(member.expression || "smile") === expression ? "is-active" : ""}" data-action="set-avatar-prop" data-prop="expression" data-value="${expression}">${expression === "smile" ? "微笑" : expression === "yum" ? "想吃" : expression === "calm" ? "淡定" : "开心"}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderFridgeIntroDrawer() {
  return `
    ${renderDrawerHead("冰箱说明", "改一下标题下面那句话")}
    <form class="form-card" data-form="fridgeIntro">
      <label>说明文字<textarea name="fridgeIntro" maxlength="80">${escapeHtml(state.fridgeIntro || defaultFridgeIntro)}</textarea></label>
      <button class="wood-button" type="submit">保存说明</button>
    </form>
  `;
}

function renderFridgeDoorDrawer() {
  return `
    ${renderDrawerHead("冰箱门贴", "改门上的便签和小贴纸")}
    <form class="form-card" data-form="fridgeDoor">
      <label>门上便签<input name="note" value="${state.fridgeDoor.note}" /></label>
      <label>贴纸，空格分隔<input name="stickers" value="${state.fridgeDoor.stickers.join(" ")}" placeholder="🍅 🥚 🌿" /></label>
      <button class="wood-button" type="submit">保存门贴</button>
    </form>
  `;
}

function renderFinishMealDrawer() {
  const meal = getMeal(state.finishMealDayId || state.selectedDayId, state.finishMealId || "dinner");
  return `
    ${renderDrawerHead("吃完确认", `${getDayLabel(state.finishMealDayId || state.selectedDayId)} · ${meal.slot}`)}
    <form class="form-card" data-form="finishMeal">
      <input type="hidden" name="dayId" value="${state.finishMealDayId || state.selectedDayId}" />
      <input type="hidden" name="mealId" value="${meal.id}" />
      ${
        meal.usages.length
          ? meal.usages
              .map((usage) => {
                const ingredient = findIngredient(usage.ingredientId);
                return `<label>${ingredient?.name || usage.name || "食材"} 实际用了多少<input name="${usage.ingredientId}" type="number" min="0" step="0.5" value="${usage.actual ?? usage.planned}" /></label>`;
              })
              .join("")
          : `<p>这一餐没有绑定冰箱食材，只记录完成状态。</p>`
      }
      <label>剩菜<select name="leftover"><option value="none">全部吃完</option><option value="little">剩下一点</option><option value="one">剩下一份</option></select></label>
      <label>评价<select name="rating"><option>超好吃</option><option>还不错</option><option>一般</option><option>翻车了</option></select></label>
      <label>下次记得<textarea name="note">番茄汁可以再多一点。</textarea></label>
      <button class="wood-button" type="submit">确认并更新冰箱</button>
    </form>
  `;
}

function renderCookingMode() {
  const recipe = findRecipe(state.cooking.recipeId);
  const step = recipe.steps[state.cooking.step];
  return `
    <section class="cooking-mode">
      <div class="cooking-top"><button class="mini-button" data-action="close-cooking">退出</button><span>${state.cooking.step + 1} / ${recipe.steps.length}</span></div>
      <div class="cooking-card"><p class="eyebrow">${recipe.name}</p><h2>${step.title}</h2><p>${step.body}</p><div class="timer-bubble">${step.time}</div></div>
      <div class="cooking-bottom"><button class="paper-button" data-action="prev-step">上一步</button><button class="wood-button" data-action="next-step">${state.cooking.step === recipe.steps.length - 1 ? "做好啦" : "下一步"}</button></div>
    </section>
  `;
}

function getSelectedDay() {
  return state.days.find((day) => day.id === state.selectedDayId) || state.days[0];
}

function getMeal(dayId, mealId) {
  const day = state.days.find((entry) => entry.id === dayId) || getSelectedDay();
  return day.meals[mealId];
}

function getDayLabel(dayId) {
  const day = state.days.find((entry) => entry.id === dayId);
  if (!day) return "今天";
  return `${day.isToday ? "今天" : day.label} ${day.dateLabel}`;
}

function findMember(id) {
  return state.members.find((member) => member.id === id);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function findIngredient(id) {
  return state.ingredients.find((item) => item.id === id);
}

function findRecipe(id) {
  return state.recipes.find((recipe) => recipe.id === id);
}

function getRecipeChecks(recipe) {
  if (!recipe) return [];
  return recipe.ingredients
    .filter((item) => item.ingredientId || item.name)
    .map((need) => {
      const ingredient = need.ingredientId ? findIngredient(need.ingredientId) : findIngredientByName(need.name);
      const have = ingredient ? Number(ingredient.quantity) : 0;
      return {
        name: need.name,
        need: `${need.quantity}${need.unit}`,
        have: `${have}${need.unit}`,
        status: have >= Number(need.quantity) ? "充足" : have > 0 ? "不足" : "缺少"
      };
    });
}

function findIngredientByName(name) {
  return state.ingredients.find((item) => item.name === name);
}

function makeUsagesFromRecipe(recipe) {
  return recipe.ingredients
    .map((need) => {
      const ingredientId = need.ingredientId || null;
      return ingredientId ? { ingredientId, planned: Number(need.quantity), actual: Number(need.quantity), unit: need.unit, name: need.name } : null;
    })
    .filter(Boolean);
}

function changeQuantity(id, delta) {
  const item = findIngredient(id);
  if (!item) return;
  item.quantity = Math.max(0, Number(item.quantity) + Number(delta));
  if (item.quantity === 0) softDeleteIngredient(id, `${item.name} 用完啦`);
  else addActivity(`${activeName()} 调整了 ${item.name} 数量。`);
}

function softDeleteIngredient(id, message = "已移出冰箱") {
  const index = state.ingredients.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [removed] = state.ingredients.splice(index, 1);
  state.undo = { type: "ingredient", item: removed, index };
  addActivity(`${activeName()} 把 ${removed.name} 标记为吃完。`);
  showToast(`${message} · 可撤销`, true);
}

function deleteRecipe(id) {
  const index = state.recipes.findIndex((recipe) => recipe.id === id);
  if (index < 0) return;
  const recipe = state.recipes[index];
  const ok = window.confirm(`确定删除「${recipe.name}」吗？已经安排到餐桌里的记录也会一起移除。`);
  if (!ok) {
    render();
    return;
  }
  state.recipes.splice(index, 1);
  state.days.forEach((day) => {
    Object.values(day.meals || {}).forEach((meal) => {
      meal.recipeIds = (meal.recipeIds || []).filter((recipeId) => recipeId !== id);
      meal.planned = (meal.planned || []).filter((name) => name !== recipe.name);
    });
  });
  if (state.selectedRecipeId === id) state.selectedRecipeId = state.recipes[0]?.id || "";
  state.editingRecipeId = null;
  state.drawer = null;
  addActivity(`${activeName()} 删除了菜谱：${recipe.name}。`);
  playSoftSound("done");
  showToast("菜谱已删除。");
}

function activeName() {
  return findMember(state.activeMember)?.name || "我们";
}

function addActivity(text) {
  state.activity.push(text);
  state.activity = state.activity.slice(-30);
}

function scheduleRecipeToMeal(recipeId, dayId, mealId) {
  const recipe = findRecipe(recipeId);
  const meal = getMeal(dayId, mealId);
  if (!recipe || !meal) return;
  if (!meal.planned.includes(recipe.name)) meal.planned.push(recipe.name);
  if (!meal.recipeIds.includes(recipe.id)) meal.recipeIds.push(recipe.id);
  meal.usages = mergeUsages(meal.usages, makeUsagesFromRecipe(recipe));
  meal.status = "计划中";
  meal.arrangedBy = state.activeMember;
  state.selectedDayId = dayId;
  addMissingToShopping(recipe);
  addActivity(`${activeName()} 把 ${recipe.name} 安排到${getDayLabel(dayId)} ${meal.slot}。`);
}

function mergeUsages(current, additions) {
  const merged = [...current];
  additions.forEach((usage) => {
    const existing = merged.find((item) => item.ingredientId === usage.ingredientId);
    if (existing) {
      existing.planned = Number(existing.planned) + Number(usage.planned);
      existing.actual = Number(existing.actual) + Number(usage.actual);
    } else {
      merged.push({ ...usage });
    }
  });
  return merged;
}

function addMissingToShopping(recipe) {
  getRecipeChecks(recipe)
    .filter((row) => row.status !== "充足")
    .forEach((row) => {
      const need = recipe.ingredients.find((item) => item.name === row.name);
      const ingredient = need.ingredientId ? findIngredient(need.ingredientId) : findIngredientByName(need.name);
      const missing = Math.max(0, Number(need.quantity) - (Number(ingredient?.quantity) || 0));
      const exists = state.shopping.some((item) => item.name === row.name && !item.bought);
      if (!exists && missing > 0) {
        state.shopping.push({ id: `shop-${Date.now()}-${row.name}`, name: row.name, quantity: missing, unit: need.unit, reason: `为了${recipe.name}`, addedBy: state.activeMember, bought: false });
      }
    });
}

function finishMeal(form) {
  const dayId = form.get("dayId");
  const mealId = form.get("mealId");
  const meal = getMeal(dayId, mealId);
  meal.usages.forEach((usage) => {
    const actual = Number(form.get(usage.ingredientId) || usage.actual || 0);
    usage.actual = actual;
    const ingredient = findIngredient(usage.ingredientId);
    if (ingredient) ingredient.quantity = Math.max(0, Number(ingredient.quantity) - actual);
  });
  meal.status = "已完成";
  meal.actual = [...meal.planned];
  meal.confirmedBy = state.activeMember;

  if (form.get("leftover") !== "none" && meal.planned.length) {
    state.ingredients.push({
      id: `leftover-${Date.now()}`,
      name: `${meal.planned[0]}（剩菜）`,
      category: "leftover",
      quantity: form.get("leftover") === "one" ? 1 : 0.5,
      unit: "份",
      zone: "freshTop",
      expiry: "明天之前吃掉",
      opened: true
    });
  }

  const rating = form.get("rating");
  const note = form.get("note");
  meal.recipeIds.forEach((recipeId) => {
    const recipe = findRecipe(recipeId);
    if (!recipe) return;
    recipe.cookedCount += 1;
    recipe.lastCooked = "今天";
    recipe.history.unshift(`${getDayLabel(dayId)} ${meal.slot} · ${activeName()} 确认 · ${rating} · ${note}`);
    recipe.notes.unshift(note);
  });
  addActivity(`${activeName()} 确认了${getDayLabel(dayId)} ${meal.slot}，冰箱库存已更新。`);
  state.drawer = null;
  state.finishMealDayId = null;
  state.finishMealId = null;
  playSoftSound("done");
  showToast("完成啦，冰箱和菜谱历史都更新了。");
}

function showToast(message, withUndo = false) {
  state.toast = withUndo ? `${message}（点这里撤销）` : message;
  persist();
  render();
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    state.toast = "";
    render();
  }, 2200);
}

function parseIngredientLines(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, quantity = "1", unit = "份"] = line.split(/[,，]/).map((part) => part.trim());
      const linked = findIngredientByName(name);
      return { name, ingredientId: linked?.id || null, quantity: Number(quantity) || 1, unit, required: true };
    });
}

function recipeToIngredientLines(recipe) {
  if (!recipe?.ingredients?.length) return "";
  return recipe.ingredients.map((item) => `${item.name},${item.quantity || 1},${item.unit || "份"}`).join("\n");
}

function parseStepLines(text) {
  const lines = String(text || "").split("\n").map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [{ title: "第一步", body: "先把准备工作做好。", time: "5 分钟" }];
  return lines.map((line, index) => {
    const [body, time = "5 分钟"] = line.split(/[|｜]/).map((part) => part.trim());
    return { title: `第 ${index + 1} 步`, body, time };
  });
}

function recipeToStepLines(recipe) {
  if (!recipe?.steps?.length) return "";
  return recipe.steps.map((step) => `${step.body || step.title || "步骤"}｜${step.time || "5 分钟"}`).join("\n");
}

function foodIcon(type) {
  const label = categoryLabels[type] || "食材";
  return `
    <span class="food-icon-wrap" aria-label="${label}贴纸">
      <span class="food-icon-fallback" aria-hidden="true">${categoryEmoji[type] || categoryEmoji.other}</span>
    </span>
  `;
}

function recipeIcon() {
  return `
    ${foodIcon("vegetable")}
    ${foodIcon("eggDairy")}
  `;
}

function icon(name) {
  const common = `fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  const icons = {
    sound: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M5 10v4h4l5 4V6l-5 4H5z"/><path ${common} d="M17 9c1.4 1.6 1.4 4.4 0 6"/></svg>`,
    music: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M9 18V6l10-2v12"/><circle ${common} cx="7" cy="18" r="2"/><circle ${common} cx="17" cy="16" r="2"/></svg>`,
    sync: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M7 17.5h10a4 4 0 0 0 .7-7.94A6 6 0 0 0 6.2 8.4 4.6 4.6 0 0 0 7 17.5z"/><path ${common} d="M8 13h4l-1.4-1.4M16 14h-4l1.4 1.4"/></svg>`,
    basket: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M6 10h12l-1.2 9H7.2L6 10z"/><path ${common} d="M9 10c.8-3 5.2-3 6 0"/><path ${common} d="M9 14h6"/></svg>`,
    fridge: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M7 3h10v18H7z"/><path ${common} d="M7 10h10"/><path ${common} d="M15 6v2M15 13v2"/></svg>`,
    table: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M4 12c3-5 13-5 16 0-2 5-14 5-16 0z"/><path ${common} d="M8 16l-2 4M16 16l2 4"/><path ${common} d="M10 11h4"/></svg>`,
    recipes: `<svg viewBox="0 0 24 24" aria-hidden="true"><path ${common} d="M6 4h10c1.1 0 2 .9 2 2v14H8c-1.1 0-2-.9-2-2V4z"/><path ${common} d="M9 8h6M9 12h5M9 16h4"/><path ${common} d="M6 18c.6-.7 1.4-1 2-1h10"/></svg>`
  };
  return icons[name] || "";
}

let appAudioContext = null;
const backgroundMusic = {
  gain: null,
  timer: null,
  step: 0
};

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!appAudioContext) appAudioContext = new AudioContext();
  if (appAudioContext.state === "suspended") appAudioContext.resume();
  return appAudioContext;
}

function playSoftSound(kind = "tap") {
  if (!state.sound) return;
  const context = getAudioContext();
  if (!context) return;
  const now = context.currentTime;
  if (kind === "fridge-open" || kind === "fridge-close" || kind === "fridge") {
    playFridgeDoorSound(context, now, kind === "fridge-close");
    return;
  }
  if (kind === "place") {
    playTone(context, 360, 520, 0.1, 0.02, now);
    playTone(context, 620, 480, 0.12, 0.015, now + 0.055);
    return;
  }
  if (kind === "pop") {
    playTone(context, 620, 820, 0.08, 0.026, now);
    playTone(context, 820, 620, 0.1, 0.018, now + 0.06);
    return;
  }
  if (kind === "done") {
    playTone(context, 520, 660, 0.12, 0.022, now);
    playTone(context, 700, 880, 0.16, 0.016, now + 0.1);
    return;
  }
  playTone(context, 420, 280, 0.14, 0.026, now);
}

function playFridgeDoorSound(context, now, closing = false) {
  const duration = closing ? 0.24 : 0.32;
  playFilteredNoise(context, now, duration, closing ? 520 : 760, closing ? 0.11 : 0.082);
  if (closing) {
    playTone(context, 130, 92, 0.13, 0.058, now + 0.08);
    playTone(context, 72, 58, 0.18, 0.034, now + 0.16);
  } else {
    playTone(context, 105, 150, 0.16, 0.032, now + 0.04);
    playTone(context, 260, 190, 0.08, 0.022, now + 0.18);
  }
}

function playFilteredNoise(context, start, duration, frequency, volume) {
  const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    const fade = 1 - i / data.length;
    data[i] = (Math.random() * 2 - 1) * fade;
  }
  const noise = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  noise.buffer = noiseBuffer;
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(frequency, start);
  filter.frequency.exponentialRampToValueAtTime(Math.max(120, frequency * 0.55), start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  noise.start(start);
  noise.stop(start + duration + 0.02);
}

function playTone(context, from, to, duration, volume, start) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.02);
}

function toggleBackgroundMusic() {
  state.music = !state.music;
  if (state.music) {
    startBackgroundMusic();
    showToast("轻轻的背景音乐打开了");
  } else {
    stopBackgroundMusic();
    showToast("背景音乐关掉了");
  }
}

function startBackgroundMusic() {
  if (customAudio) {
    customAudio.loop = true;
    customAudio.volume = 0.42;
    customAudio.play().catch(() => {});
    return;
  }
  const context = getAudioContext();
  if (!context || backgroundMusic.timer) return;
  backgroundMusic.gain = context.createGain();
  backgroundMusic.gain.gain.setValueAtTime(0.0001, context.currentTime);
  backgroundMusic.gain.gain.exponentialRampToValueAtTime(0.038, context.currentTime + 0.8);
  backgroundMusic.gain.connect(context.destination);
  backgroundMusic.step = 0;
  scheduleJazzBar();
  backgroundMusic.timer = window.setInterval(scheduleJazzBar, 1900);
}

function stopBackgroundMusic() {
  if (customAudio) {
    customAudio.pause();
    return;
  }
  if (backgroundMusic.timer) window.clearInterval(backgroundMusic.timer);
  backgroundMusic.timer = null;
  if (backgroundMusic.gain && appAudioContext) {
    const gain = backgroundMusic.gain;
    gain.gain.exponentialRampToValueAtTime(0.0001, appAudioContext.currentTime + 0.35);
    window.setTimeout(() => gain.disconnect(), 420);
  }
  backgroundMusic.gain = null;
}

function setCustomMusic(file) {
  if (!file) return;
  if (customMusicUrl) URL.revokeObjectURL(customMusicUrl);
  if (backgroundMusic.timer || backgroundMusic.gain) stopBackgroundMusic();
  customMusicUrl = URL.createObjectURL(file);
  customMusicName = file.name;
  if (customAudio) customAudio.pause();
  customAudio = new Audio(customMusicUrl);
  customAudio.loop = true;
  customAudio.volume = 0.42;
  if (state.music) customAudio.play().catch(() => {});
  showToast(`唱片换成：${customMusicName}`);
  render();
}

function clearCustomMusic() {
  if (customMusicUrl) URL.revokeObjectURL(customMusicUrl);
  customMusicUrl = "";
  customMusicName = "";
  if (customAudio) customAudio.pause();
  customAudio = null;
  if (state.music) {
    stopBackgroundMusic();
    startBackgroundMusic();
  }
  showToast("换回默认背景音乐。");
}

function loadSyncSettings() {
  try {
    return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(localStorage.getItem(SYNC_SETTINGS_KEY)) };
  } catch {
    return { ...DEFAULT_SYNC_SETTINGS, email: "" };
  }
}

function saveSyncSettings(settings) {
  const next = { ...loadSyncSettings(), ...settings };
  localStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(next));
  syncHouseholdId = next.householdId || "our-kitchen";
  return next;
}

async function ensureSyncClient() {
  if (syncClient) return syncClient;
  const settings = loadSyncSettings();
  if (!settings.url || !settings.key) {
    syncMessage = "先保存 Supabase URL 和 anon key。";
    return null;
  }
  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    syncClient = createClient(settings.url, settings.key);
    syncHouseholdId = settings.householdId || "our-kitchen";
    const { data } = await syncClient.auth.getSession();
    syncUser = data.session?.user || null;
    syncMessage = syncUser ? "云同步已连接。" : "项目已连接，请登录或注册。";
    return syncClient;
  } catch {
    syncMessage = "连接 Supabase 失败，请检查 URL 和 anon key。";
    return null;
  }
}

async function bootCloudSync() {
  if (syncBooted) return;
  syncBooted = true;
  const client = await ensureSyncClient();
  if (!client || !syncUser) {
    render();
    return;
  }
  await pullCloudState(false);
}

function queueCloudSave() {
  if (!syncClient || !syncUser || !syncHouseholdId) return;
  window.clearTimeout(syncSaveTimer);
  syncSaveTimer = window.setTimeout(() => pushCloudState(false), 900);
}

function makeCloudPayload() {
  return {
    ...state,
    toast: "",
    drawer: null,
    cooking: null,
    editingIngredientId: null,
    editingMealId: null,
    editingRecipeId: null,
    scheduleRecipeId: null
  };
}

async function pushCloudState(announce = true) {
  const client = await ensureSyncClient();
  if (!client || !syncUser) {
    if (announce) showToast("请先登录云同步。");
    return;
  }
  const settings = loadSyncSettings();
  syncHouseholdId = settings.householdId || syncHouseholdId || "our-kitchen";
  const { error } = await client.from("duo_kitchen_households").upsert({
    id: syncHouseholdId,
    payload: makeCloudPayload(),
    updated_by: syncUser.id,
    updated_at: new Date().toISOString()
  });
  if (error) {
    syncMessage = `上传失败：${error.message}`;
    if (announce) showToast("云端上传失败。");
    render();
    return;
  }
  syncMessage = `已同步到云端：${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (announce) showToast("当前数据已上传。");
}

async function pullCloudState(announce = true) {
  const client = await ensureSyncClient();
  if (!client || !syncUser) {
    if (announce) showToast("请先登录云同步。");
    return;
  }
  const settings = loadSyncSettings();
  syncHouseholdId = settings.householdId || syncHouseholdId || "our-kitchen";
  const { data, error } = await client.from("duo_kitchen_households").select("payload, updated_at").eq("id", syncHouseholdId).maybeSingle();
  if (error) {
    syncMessage = `刷新失败：${error.message}`;
    if (announce) showToast("云端刷新失败。");
    render();
    return;
  }
  if (!data?.payload) {
    await pushCloudState(false);
    syncMessage = "云端还没有数据，已上传当前页面。";
    if (announce) showToast("已创建云端厨房。");
    render();
    return;
  }
  state = { ...makeDefaultData(), ...data.payload, toast: "", drawer: null, cooking: null };
  syncWeekDaysWithToday();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(makeCloudPayload()));
  syncMessage = `已从云端刷新：${new Date(data.updated_at).toLocaleString()}`;
  if (announce) playSoftSound("done");
  render();
}

async function signInToCloud(formData) {
  const client = await ensureSyncClient();
  if (!client) {
    showToast("先保存 Supabase 配置。");
    return;
  }
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const mode = formData.get("mode") || "signIn";
  const householdId = String(formData.get("householdId") || "").trim() || loadSyncSettings().householdId || "our-kitchen";
  saveSyncSettings({ email, householdId });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    syncMessage = "先填一个正确的邮箱地址。";
    showToast("邮箱格式不对。");
    return;
  }
  if (password.length < 6) {
    syncMessage = "先在密码框里填一个至少 6 位的密码。注册和以后登录都要用这个密码。";
    showToast("先填密码，至少 6 位。");
    return;
  }
  syncMessage = mode === "signUp" ? "正在注册账号..." : "正在登录...";
  render();
  const result = mode === "signUp"
    ? await client.auth.signUp({ email, password })
    : await client.auth.signInWithPassword({ email, password });
  if (result.error) {
    syncUser = null;
    syncMessage = friendlyAuthError(result.error.message, mode);
    showToast(mode === "signUp" ? "注册失败，原因已经写在同步卡片里。" : "登录失败，原因已经写在同步卡片里。");
    return;
  }
  syncUser = result.data.session?.user || null;
  if (mode === "signUp" && !result.data.session) {
    syncMessage = "注册邮件已发出。请先去邮箱点确认链接，然后回到这里用同一邮箱和密码点“登录”。如果邮箱已经注册过，也可以直接点“登录”。";
    showToast("请先确认邮箱。");
    render();
    return;
  }
  syncMessage = "登录成功，正在同步。";
  if (syncUser) await pullCloudState(false);
  playSoftSound("done");
  showToast("云同步已登录。");
}

function friendlyAuthError(message, mode) {
  const text = String(message || "");
  const lower = text.toLowerCase();
  if (lower.includes("password should be at least") || lower.includes("weak_password")) return "密码至少要 6 位。请换一个 6 位以上的密码再试。";
  if (lower.includes("invalid login credentials")) return "邮箱或密码不对。如果刚注册，请先去邮箱点确认邮件，再回来登录。";
  if (lower.includes("email not confirmed")) return "这个邮箱还没有确认。请去邮箱里点 Supabase 发来的确认链接。";
  if (lower.includes("already registered") || lower.includes("user already registered")) return "这个邮箱已经注册过了，直接点“登录”就行。";
  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) return "Supabase 后台关闭了注册，需要在 Authentication 里打开 Email Signup。";
  if (lower.includes("rate limit") || lower.includes("too many")) return "尝试太频繁了，Supabase 暂时限流。等一两分钟再试。";
  if (lower.includes("network") || lower.includes("failed to fetch")) return "网络连 Supabase 失败。换个网络或稍后再试。";
  return `${mode === "signUp" ? "注册" : "登录"}失败：${text || "未知错误"}`;
}

async function signOutCloud() {
  const client = await ensureSyncClient();
  if (client) await client.auth.signOut();
  syncUser = null;
  syncMessage = "已退出云同步。";
  showToast("已退出云同步。");
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function imageFileToDataUrl(file) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) return fileToDataUrl(file);
  const raw = await fileToDataUrl(file);
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 1200;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(raw);
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    image.onerror = () => resolve(raw);
    image.src = raw;
  });
}

function scheduleJazzBar() {
  const context = appAudioContext;
  if (!context || !backgroundMusic.gain) return;
  const now = context.currentTime;
  const chords = [
    [196, 246.94, 293.66, 392],
    [174.61, 220, 261.63, 349.23],
    [185, 233.08, 277.18, 369.99],
    [164.81, 207.65, 246.94, 329.63]
  ];
  const chord = chords[backgroundMusic.step % chords.length];
  chord.forEach((frequency, index) => {
    playMusicTone(context, frequency, now + index * 0.035, 1.6, 0.018 / (index + 1));
  });
  playMusicTone(context, chord[0] / 2, now + 0.06, 1.25, 0.014);
  backgroundMusic.step += 1;
}

function playMusicTone(context, frequency, start, duration, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(backgroundMusic.gain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

app.addEventListener("click", (event) => {
  const actionTarget = event.target.closest("[data-action]");
  const pendingAction = actionTarget?.dataset.action || "";
  if (state.music && pendingAction !== "toggle-music") startBackgroundMusic();

  if (event.target.closest(".toast") && state.undo) {
    state.ingredients.splice(state.undo.index, 0, state.undo.item);
    state.undo = null;
    state.toast = "";
    persist();
    render();
    return;
  }

  if (event.target.dataset?.backdrop === "drawer") {
    closeDrawer();
    persist();
    render();
    return;
  }

  const target = actionTarget;
  if (!target) return;
  const action = target.dataset.action;
  if (!["toggle-sound", "toggle-music"].includes(action)) {
    playSoftSound(action === "toggle-fridge" ? (state.fridgeOpen === false ? "fridge-open" : "fridge-close") : action === "select-zone" || action === "buy-item" ? "place" : "tap");
  }

  if (action === "set-tab") state.activeTab = target.dataset.tab;
  if (action === "set-member") {
    state.activeMember = target.dataset.member;
    state.drawer = "avatar";
  }
  if (action === "open-drawer") state.drawer = target.dataset.drawer;
  if (action === "close-drawer") closeDrawer();
  if (action === "toggle-fridge") {
    state.fridgeOpen = !state.fridgeOpen;
  }
  if (action === "new-recipe") {
    state.editingRecipeId = null;
    state.drawer = "recipe";
  }
  if (action === "new-ingredient") {
    state.editingIngredientId = null;
    state.draftIngredientCategory = "vegetable";
    state.drawer = "ingredient";
  }
  if (action === "edit-ingredient") {
    state.editingIngredientId = target.dataset.id;
    state.draftIngredientCategory = findIngredient(target.dataset.id)?.category || "vegetable";
    state.drawer = "ingredient";
  }
  if (action === "toggle-sound") {
    state.sound = !state.sound;
    if (state.sound) playSoftSound("pop");
    showToast(state.sound ? "轻柔音效打开了" : "音效关掉了");
    return;
  }
  if (action === "toggle-music") {
    toggleBackgroundMusic();
    return;
  }
  if (action === "clear-custom-music") {
    clearCustomMusic();
    persist();
    render();
    return;
  }
  if (action === "cloud-pull") {
    pullCloudState(true);
    return;
  }
  if (action === "cloud-push") {
    pushCloudState(true);
    return;
  }
  if (action === "cloud-signout") {
    signOutCloud();
    return;
  }
  if (action === "edit-fridge-door") {
    event.stopPropagation();
    state.drawer = "fridgeDoor";
  }
  if (action === "select-zone") {
    state.selectedZone = target.dataset.zone;
    state.activeTab = "fridge";
  }
  if (action === "set-ingredient-category") {
    state.draftIngredientCategory = target.dataset.category;
  }
  if (action === "change-qty") changeQuantity(target.dataset.id, target.dataset.delta);
  if (action === "delete-ingredient") softDeleteIngredient(target.dataset.id);
  if (action === "select-day") {
    state.selectedDayId = target.dataset.day;
  }
  if (action === "select-recipe-category") {
    state.selectedRecipeCategory = target.dataset.category || "all";
    const nextRecipes = state.selectedRecipeCategory === "all" ? state.recipes : state.recipes.filter((recipe) => recipe.category === state.selectedRecipeCategory);
    if (nextRecipes.length) state.selectedRecipeId = nextRecipes[0].id;
  }
  if (action === "open-meal-drawer") {
    state.editingMealDayId = target.dataset.day || state.selectedDayId;
    state.editingMealId = target.dataset.meal || "dinner";
    state.drawer = "mealDish";
  }
  if (action === "open-schedule") {
    state.scheduleRecipeId = target.dataset.recipe;
    state.drawer = "schedule";
  }
  if (action === "finish-meal") {
    state.finishMealDayId = target.dataset.day || state.selectedDayId;
    state.finishMealId = target.dataset.meal || "dinner";
    state.drawer = "finishMeal";
  }
  if (action === "select-recipe") state.selectedRecipeId = target.dataset.id;
  if (action === "edit-recipe") {
    state.editingRecipeId = target.dataset.id;
    state.selectedRecipeId = target.dataset.id;
    state.drawer = "recipe";
  }
  if (action === "delete-recipe") {
    deleteRecipe(target.dataset.id);
    return;
  }
  if (action === "react-meal") {
    const meal = getMeal(target.dataset.day || state.selectedDayId, target.dataset.meal);
    const exists = meal.reactions.some((reaction) => reaction.memberId === state.activeMember && reaction.label === target.dataset.label);
    if (!exists) meal.reactions.push({ memberId: state.activeMember, label: target.dataset.label });
    addActivity(`${activeName()} 点了：${target.dataset.label}。`);
  }
  if (action === "buy-item") {
    const item = state.shopping.find((entry) => entry.id === target.dataset.id);
    if (item) {
      item.bought = true;
      state.ingredients.push({
        id: `ing-${Date.now()}`,
        name: item.name,
        category: item.name.includes("蛋") ? "eggDairy" : "other",
        quantity: item.quantity,
        unit: item.unit,
        zone: item.name.includes("蛋") ? "doorMiddle" : "freshMiddle",
        expiry: "新买的",
        opened: false
      });
      addActivity(`${activeName()} 买到了 ${item.name}，放进冰箱。`);
      showToast(`${item.name} 已放进冰箱。`);
      return;
    }
  }
  if (action === "start-cooking") state.cooking = { recipeId: target.dataset.recipe, step: 0 };
  if (action === "close-cooking") state.cooking = null;
  if (action === "prev-step" && state.cooking) state.cooking.step = Math.max(0, state.cooking.step - 1);
  if (action === "next-step" && state.cooking) {
    const recipe = findRecipe(state.cooking.recipeId);
    if (state.cooking.step >= recipe.steps.length - 1) {
      state.cooking = null;
      state.drawer = "finishMeal";
      state.finishMealDayId = state.selectedDayId;
      state.finishMealId = "dinner";
    } else {
      state.cooking.step += 1;
    }
  }
  if (action === "set-avatar-color") {
    const member = findMember(state.activeMember);
    if (member) member.color = target.dataset.color;
  }
  if (action === "set-avatar-prop") {
    const member = findMember(state.activeMember);
    if (member) member[target.dataset.prop] = target.dataset.value;
  }
  if (action === "clear-avatar-photo") {
    const member = findMember(state.activeMember);
    if (member) {
      member.photo = "";
      showToast("已恢复贴纸头像。");
      return;
    }
  }
  if (action === "toast") {
    showToast(target.dataset.message || "已记下。");
    return;
  }
  persist();
  render();
});

app.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  if (form.dataset.form === "ingredient") {
    const id = formData.get("id");
    const payload = {
      id: id || `ing-${Date.now()}`,
      name: formData.get("name"),
      category: formData.get("category"),
      quantity: Number(formData.get("quantity") || 1),
      unit: formData.get("unit") || "份",
      zone: formData.get("zone"),
      expiry: formData.get("expiry") || "这两天记得吃",
      opened: formData.get("opened") === "on"
    };
    const existingIndex = id ? state.ingredients.findIndex((item) => item.id === id) : -1;
    if (existingIndex >= 0) state.ingredients.splice(existingIndex, 1, payload);
    else state.ingredients.push(payload);
    state.selectedZone = payload.zone;
    state.drawer = null;
    state.editingIngredientId = null;
    addActivity(`${activeName()} ${existingIndex >= 0 ? "更新了" : "放进冰箱"} ${payload.name}。`);
    playSoftSound("done");
    showToast(`${payload.name} 已保存。`);
    return;
  }

  if (form.dataset.form === "syncProject") {
    syncClient = null;
    syncUser = null;
    saveSyncSettings({
      url: String(formData.get("url") || "").trim(),
      key: String(formData.get("key") || "").trim(),
      householdId: String(formData.get("householdId") || "").trim() || "our-kitchen"
    });
    syncMessage = "同步配置已保存，请登录或注册账号。";
    playSoftSound("done");
    showToast("同步配置保存好了。");
    return;
  }

  if (form.dataset.form === "syncLogin") {
    await signInToCloud(formData);
    return;
  }

  if (form.dataset.form === "fridgeDoor") {
    state.fridgeDoor.note = String(formData.get("note") || "").trim() || "今天也要好好吃饭";
    state.fridgeDoor.stickers = String(formData.get("stickers") || "")
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
    state.drawer = null;
    addActivity(`${activeName()} 换了冰箱门贴。`);
    playSoftSound("done");
    showToast("冰箱门贴保存好了。");
    return;
  }

  if (form.dataset.form === "fridgeIntro") {
    state.fridgeIntro = String(formData.get("fridgeIntro") || "").trim().slice(0, 80) || defaultFridgeIntro;
    state.drawer = null;
    playSoftSound("done");
    showToast("冰箱说明保存好了。");
    return;
  }

  if (form.dataset.form === "memberProfile") {
    const member = findMember(formData.get("memberId") || state.activeMember);
    if (member) {
      member.name = String(formData.get("name") || "").trim().slice(0, 12) || member.name;
      const photoFile = formData.get("photo");
      if (photoFile && photoFile.size) member.photo = await imageFileToDataUrl(photoFile);
      state.activeMember = member.id;
      state.drawer = null;
      addActivity(`${member.name} 更新了头像资料。`);
      playSoftSound("done");
      showToast("头像资料保存好了。");
    }
    return;
  }

  if (form.dataset.form === "mealDish") {
    const dayId = formData.get("dayId");
    const mealId = formData.get("mealId");
    const recipeId = formData.get("recipeId");
    const customName = String(formData.get("customName") || "").trim();
    if (recipeId) scheduleRecipeToMeal(recipeId, dayId, mealId);
    if (customName) {
      const meal = getMeal(dayId, mealId);
      meal.planned.push(customName);
      meal.status = "计划中";
      meal.arrangedBy = state.activeMember;
      addActivity(`${activeName()} 把 ${customName} 加到${getDayLabel(dayId)} ${meal.slot}。`);
    }
    state.drawer = null;
    playSoftSound("done");
    showToast("这一餐安排好了。");
    return;
  }

  if (form.dataset.form === "schedule") {
    scheduleRecipeToMeal(formData.get("recipeId"), formData.get("dayId"), formData.get("mealId"));
    state.drawer = null;
    playSoftSound("done");
    showToast("菜谱已安排到餐桌。");
    return;
  }

  if (form.dataset.form === "recipe") {
    const id = formData.get("id");
    const existing = id ? findRecipe(id) : null;
    const imageFile = formData.get("image");
    const image = imageFile && imageFile.size ? await imageFileToDataUrl(imageFile) : "";
    const recipe = {
      id: existing?.id || `recipe-${Date.now()}`,
      name: String(formData.get("name") || "").trim(),
      image: image || existing?.image || "",
      category: formData.get("category") || "家常",
      time: formData.get("time") || "20 分钟",
      difficulty: formData.get("difficulty") || "简单",
      favorite: formData.get("favorite") === "on",
      cookedCount: existing?.cookedCount || 0,
      lastCooked: existing?.lastCooked || "还没做过",
      tags: String(formData.get("tags") || "新菜谱").split(/[,，]/).map((tag) => tag.trim()).filter(Boolean),
      ingredients: parseIngredientLines(formData.get("ingredients")),
      steps: parseStepLines(formData.get("steps")),
      notes: existing?.notes || [],
      history: existing?.history || []
    };
    if (!recipe.name) return;
    const existingIndex = state.recipes.findIndex((item) => item.id === recipe.id);
    if (existingIndex >= 0) state.recipes.splice(existingIndex, 1, recipe);
    else state.recipes.push(recipe);
    state.selectedRecipeId = recipe.id;
    state.selectedRecipeCategory = recipe.category;
    state.drawer = null;
    state.editingRecipeId = null;
    addActivity(`${activeName()} ${existingIndex >= 0 ? "更新了" : "新建了"}菜谱：${recipe.name}。`);
    playSoftSound("done");
    showToast(existingIndex >= 0 ? "菜谱修改好了。" : "菜谱保存好了。");
    return;
  }

  if (form.dataset.form === "finishMeal") {
    finishMeal(formData);
    persist();
    render();
  }
});

app.addEventListener("change", async (event) => {
  const recipeUpload = event.target.closest("[data-recipe-upload]");
  if (recipeUpload) {
    const file = recipeUpload.files?.[0];
    const recipe = findRecipe(recipeUpload.dataset.recipeUpload);
    if (file && recipe) {
      recipe.image = await imageFileToDataUrl(file);
      addActivity(`${activeName()} 给 ${recipe.name} 换了照片。`);
      playSoftSound("done");
      showToast("菜谱照片已保存。");
    }
    return;
  }

  const musicUpload = event.target.closest("[data-music-upload]");
  if (musicUpload) {
    setCustomMusic(musicUpload.files?.[0]);
  }
});

app.addEventListener(
  "error",
  (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;
    if (image.dataset.foodIcon !== undefined) {
      image.hidden = true;
      return;
    }
    const fallback = image.dataset.fallbackSrc;
    if (fallback && image.src !== new URL(fallback, window.location.href).href) {
      image.src = fallback;
    }
  },
  true
);

app.addEventListener("dragover", (event) => {
  if (event.target.closest(".music-drop-zone")) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }
});

app.addEventListener("drop", (event) => {
  if (!event.target.closest(".music-drop-zone")) return;
  event.preventDefault();
  const file = [...event.dataTransfer.files].find((entry) => entry.type.startsWith("audio/"));
  setCustomMusic(file);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    window.setTimeout(() => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }, 2500);
  });
}

setInterval(() => {
  const before = state.days.map((day) => `${day.id}:${day.isToday}`).join("|");
  syncWeekDaysWithToday();
  const after = state.days.map((day) => `${day.id}:${day.isToday}`).join("|");
  if (before !== after) {
    persist();
    render();
  }
}, 60 * 1000);

render();
const startCloudSync = () => {
  window.setTimeout(() => {
    bootCloudSync();
  }, 1800);
};

if ("requestIdleCallback" in window) {
  window.requestIdleCallback(startCloudSync, { timeout: 3600 });
} else {
  startCloudSync();
}
