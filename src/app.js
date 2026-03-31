(() => {
  /** 全量景点数据（从 spots.json 读取后缓存，用于搜索过滤） */
  let allSpots = [];
  /** 已选中的标签集合（支持多选） */
  const selectedTags = new Set();

  /**
   * 格式化价格显示。
   * @param {number|string|null|undefined} price - 门票价格；0 表示免费
   * @returns {string} 用于展示的价格文本（如“免费”“¥199”）
   */
  function formatPrice(price) {
    if (price === 0) return "免费";
    if (typeof price === "number" && Number.isFinite(price)) return `¥${price}`;
    return String(price ?? "");
  }

  /**
   * 格式化评分显示（保留 1 位小数）。
   * @param {number|string|null|undefined} rating - 评分值
   * @returns {string} 用于展示的评分文本（如“4.7”）
   */
  function formatRating(rating) {
    const n = typeof rating === "number" ? rating : Number(rating);
    return Number.isFinite(n) ? n.toFixed(1) : "";
  }

  /**
   * 渲染景点列表到页面。
   * @param {Array<object>} spots - 需要渲染的景点数组（通常是全量或搜索过滤后的结果）
   */
  function renderSpots(spots) {
    const listEl = document.getElementById("spotsList");
    if (!listEl) return;

    listEl.textContent = "";

    if (!Array.isArray(spots) || spots.length === 0) {
      const li = document.createElement("li");
      li.textContent = "暂无匹配的景点";
      listEl.appendChild(li);
      return;
    }

    for (const spot of spots) {
      const li = document.createElement("li");
      li.className = "spot-card";

      const img = document.createElement("img");
      img.src = spot.image ?? "";
      img.alt = spot.name ?? "spot";
      img.loading = "lazy";
      img.className = "spot-image";

      const title = document.createElement("h3");
      title.textContent = spot.name ?? "";
      title.className = "spot-title";

      const city = document.createElement("div");
      city.textContent = spot.city ?? "";
      city.className = "spot-city";

      const tags = document.createElement("div");
      tags.className = "spot-tags";
      for (const t of Array.isArray(spot.tags) ? spot.tags : []) {
        const pill = document.createElement("span");
        pill.className = "tag-pill";
        pill.textContent = String(t);
        tags.appendChild(pill);
      }

      const rating = document.createElement("div");
      rating.textContent = `评分：${formatRating(spot.rating)}`;
      rating.className = "spot-rating";

      const price = document.createElement("div");
      price.textContent = `价格：${formatPrice(spot.price)}`;
      price.className = "spot-price";

      const openTime = document.createElement("div");
      openTime.textContent = `开放：${spot.open_time ?? ""}`;
      openTime.className = "spot-open-time";

      li.append(img, title, city, tags, rating, price, openTime);
      listEl.appendChild(li);
    }
  }

  /**
   * 从景点数组中提取 tags 并去重。
   * @param {Array<object>} spots - 景点数组
   * @returns {string[]} 去重后的标签列表
   */
  function extractUniqueTags(spots) {
    const set = new Set();
    for (const s of Array.isArray(spots) ? spots : []) {
      for (const t of Array.isArray(s?.tags) ? s.tags : []) set.add(String(t));
    }
    return Array.from(set);
  }

  /**
   * 渲染标签按钮到页面。
   * @param {string[]} tags - 标签列表（已去重）
   */
  function renderTagButtons(tags) {
    const wrap = document.getElementById("tagFilters");
    if (!wrap) return;

    wrap.textContent = "";
    for (const tag of Array.isArray(tags) ? tags : []) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.tag = tag;
      btn.textContent = tag;
      btn.setAttribute("aria-pressed", selectedTags.has(tag) ? "true" : "false");
      if (selectedTags.has(tag)) btn.classList.add("is-selected");
      wrap.appendChild(btn);
    }
  }

  /**
   * 初始化标签多选：点击按钮切换选中状态（支持多个同时选中）。
   */
  function initTagMultiSelect() {
    const wrap = document.getElementById("tagFilters");
    if (!wrap) return;

    wrap.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button");
      const tag = btn?.dataset?.tag;
      if (!btn || !tag) return;

      const isSelected = selectedTags.has(tag);
      if (isSelected) selectedTags.delete(tag);
      else selectedTags.add(tag);

      // 仅更新按钮选中样式（筛选联动在后续子目标实现）
      btn.classList.toggle("is-selected", !isSelected);
      btn.setAttribute("aria-pressed", (!isSelected).toString());

      // 触发一次列表更新：在当前搜索词基础上叠加标签筛选
      const input = document.getElementById("searchInput");
      applySearch(input?.value ?? "");
    });
  }

  /**
   * 统一文本归一化：转字符串、去空格、转小写，方便做模糊匹配。
   * @param {unknown} v - 任意输入值
   * @returns {string} 归一化后的文本
   */
  function normalizeText(v) {
    return String(v ?? "").trim().toLowerCase();
  }

  /**
   * 判断某个景点是否满足“已选标签”条件。
   * 规则：未选任何标签 -> 全部通过；选了多个标签 -> 命中任意一个即可（OR）。
   * @param {object} spot - 单个景点对象
   * @returns {boolean} 是否通过标签筛选
   */
  function matchSelectedTags(spot) {
    if (selectedTags.size === 0) return true;
    const tags = Array.isArray(spot?.tags) ? spot.tags : [];
    return tags.some((t) => selectedTags.has(String(t)));
  }

  /**
   * 过滤景点数据：同时满足“搜索 AND 标签”。
   * - 搜索：模糊匹配 name 或 city
   * - 标签：命中任意已选标签即可（OR），但整体与搜索是 AND
   * @param {Array<object>} spots - 全量景点数组
   * @param {string} query - 搜索词
   * @returns {Array<object>} 过滤后的景点数组
   */
  function filterSpots(spots, query) {
    const q = normalizeText(query);
    const needSearch = Boolean(q);

    return (Array.isArray(spots) ? spots : []).filter((s) => {
      // 标签条件
      if (!matchSelectedTags(s)) return false;

      // 搜索条件（name/city 模糊匹配）；无搜索词则视为通过
      if (!needSearch) return true;
      const name = normalizeText(s?.name);
      const city = normalizeText(s?.city);
      return name.includes(q) || city.includes(q);
    });
  }

  /**
   * 根据搜索词过滤并更新列表（模糊匹配：name 或 city 包含即可）。
   * @param {string} query - 输入框当前值
   */
  function applySearch(query) {
    renderSpots(filterSpots(allSpots, query));
  }

  /**
   * 初始化搜索：监听输入框的 input 事件，实时触发过滤。
   */
  function initSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    input.addEventListener("input", (e) => {
      applySearch(e.target?.value);
    });
  }

  /**
   * 初始化重置：清空搜索、清空标签选中、恢复全量列表。
   */
  function initReset() {
    const btn = document.getElementById("resetBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      const input = document.getElementById("searchInput");
      if (input) input.value = "";

      selectedTags.clear();
      renderTagButtons(extractUniqueTags(allSpots));
      renderSpots(allSpots);
    });
  }

  /**
   * 从 spots.json 读取数据并渲染初始列表。
   * 说明：此阶段只做数据读取 + 渲染，不包含筛选等后续功能。
   */
  async function loadSpots() {
    try {
      const res = await fetch("../spots.json");
      if (!res.ok) throw new Error(`Failed to fetch spots.json: ${res.status} ${res.statusText}`);

      const data = await res.json();
      console.log("[spots.json]", data);
      allSpots = Array.isArray(data?.spots) ? data.spots : [];
      renderTagButtons(extractUniqueTags(allSpots));
      renderSpots(allSpots);
    } catch (err) {
      console.error("[spots.json] fetch error", err);
    }
  }

  initSearch();
  initTagMultiSelect();
  initReset();
  void loadSpots();
})();
