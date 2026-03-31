(() => {
  /** 全量景点数据（从 spots.json 读取后缓存，用于搜索过滤） */
  let allSpots = [];
  /** 已选中的标签集合（支持多选） */
  const selectedTags = new Set();
  /** 已收藏景点 id 集合（localStorage 持久化） */
  const favoriteIds = new Set();

  const FAVORITES_KEY = "favoriteSpotIds";

  /**
   * 从 localStorage 读取收藏 id 列表到 favoriteIds。
   */
  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      favoriteIds.clear();
      for (const id of Array.isArray(arr) ? arr : []) favoriteIds.add(String(id));
    } catch {
      favoriteIds.clear();
    }
  }

  /**
   * 把当前 favoriteIds 写回 localStorage。
   */
  function saveFavorites() {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favoriteIds)));
  }

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

      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.className = "favorite-btn";
      favBtn.setAttribute("aria-label", "收藏");
      const spotId = String(spot?.id ?? "");
      favBtn.dataset.id = spotId;
      const isFav = spotId && favoriteIds.has(spotId);
      favBtn.setAttribute("aria-pressed", isFav ? "true" : "false");
      favBtn.textContent = isFav ? "★" : "☆";

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

      li.append(favBtn, img, title, city, tags, rating, price, openTime);
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
   * 是否开启“只看收藏”模式。
   * @returns {boolean} true 表示只展示已收藏景点
   */
  function isOnlyFavoritesEnabled() {
    const btn = document.getElementById("onlyFavoritesBtn");
    return btn?.getAttribute?.("aria-pressed") === "true";
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
    const onlyFav = isOnlyFavoritesEnabled();

    return (Array.isArray(spots) ? spots : []).filter((s) => {
      // 收藏条件（若开启“只看收藏”）
      if (onlyFav) {
        const id = String(s?.id ?? "");
        if (!id || !favoriteIds.has(id)) return false;
      }

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
   * 显示详情弹窗，并把当前景点信息填充进去。
   * @param {object} spot - 当前点击的景点数据
   */
  function showModal(spot) {
    const overlay = document.getElementById("detailOverlay");
    const modal = document.getElementById("detailModal");
    const content = document.getElementById("detailContent");
    if (!overlay || !modal || !content) return;

    content.textContent = "";

    const img = document.createElement("img");
    img.src = spot?.image ?? "";
    img.alt = spot?.name ?? "spot";
    img.loading = "lazy";
    img.className = "detail-image";
    img.addEventListener("click", () => {
      if (!img.src) return;
      showImageViewer(img.src, img.alt);
    });

    const title = document.createElement("h2");
    title.textContent = spot?.name ?? "";

    const desc = document.createElement("p");
    desc.textContent = spot?.description ?? "";

    const duration = document.createElement("div");
    const mins = spot?.visit_minutes;
    duration.textContent = `游玩时长：${Number.isFinite(mins) ? `${mins} 分钟` : ""}`;

    content.append(img, title, desc, duration);

    overlay.hidden = false;
    modal.hidden = false;
  }

  /**
   * 全屏展示图片（点击任意位置关闭）。
   * @param {string} src - 图片地址
   * @param {string} alt - 图片描述
   */
  function showImageViewer(src, alt) {
    let viewer = document.getElementById("imageViewer");
    if (!viewer) {
      viewer = document.createElement("div");
      viewer.id = "imageViewer";
      viewer.className = "image-viewer";
      viewer.hidden = true;

      const img = document.createElement("img");
      img.className = "image-viewer-img";
      viewer.appendChild(img);

      const hideViewer = () => {
        viewer.hidden = true;
      };

      // 点击任意位置关闭（包含点击图片本身）
      viewer.addEventListener("click", hideViewer);
      img.addEventListener("click", hideViewer);

      document.body.appendChild(viewer);
    }

    const imgEl = viewer.querySelector("img");
    if (imgEl) {
      imgEl.src = src;
      imgEl.alt = alt ?? "";
    }
    viewer.hidden = false;
  }

  /**
   * 关闭详情弹窗（隐藏遮罩层与弹窗）。
   */
  function hideModal() {
    const overlay = document.getElementById("detailOverlay");
    const modal = document.getElementById("detailModal");
    if (overlay) overlay.hidden = true;
    if (modal) modal.hidden = true;
  }

  /**
   * 初始化弹窗关闭：点击关闭按钮或遮罩层时关闭。
   */
  function initModalClose() {
    const overlay = document.getElementById("detailOverlay");
    const closeBtn = document.getElementById("detailCloseBtn");

    overlay?.addEventListener("click", hideModal);
    closeBtn?.addEventListener("click", hideModal);
  }

  /**
   * 初始化卡片点击：点击某个景点卡片时打印对应景点信息。
   * 说明：不修改 renderSpots 的结构，通过事件代理 + 文本匹配拿到当前景点数据。
   */
  function initCardClick() {
    const listEl = document.getElementById("spotsList");
    if (!listEl) return;

    listEl.addEventListener("click", (e) => {
      if (e.target?.closest?.(".favorite-btn")) return;
      const card = e.target?.closest?.("li");
      if (!card || card.parentElement !== listEl) return;
      if (card.textContent?.includes?.("暂无匹配的景点")) return;

      const name = card.querySelector?.("h3")?.textContent?.trim?.() ?? "";
      const city = card.querySelector?.(".spot-city")?.textContent?.trim?.() ?? "";

      const spot = allSpots.find((s) => (s?.name ?? "") === name && (s?.city ?? "") === city);
      if (spot) {
        console.log("[spot click]", spot);
        showModal(spot);
      }
      else console.log("[spot click] not found", { name, city });
    });
  }

  /**
   * 初始化收藏：点击收藏按钮切换收藏状态，并写入 localStorage。
   */
  function initFavorites() {
    loadFavorites();

    const listEl = document.getElementById("spotsList");
    if (!listEl) return;

    listEl.addEventListener("click", (e) => {
      const btn = e.target?.closest?.(".favorite-btn");
      if (!btn || btn.parentElement?.parentElement !== listEl) return;

      const id = String(btn.dataset?.id ?? "");
      if (!id) return;

      const isFav = favoriteIds.has(id);
      if (isFav) favoriteIds.delete(id);
      else favoriteIds.add(id);
      saveFavorites();

      btn.setAttribute("aria-pressed", (!isFav).toString());
      btn.textContent = !isFav ? "★" : "☆";
    });
  }

  /**
   * 初始化“只看收藏”按钮：切换时刷新列表（在当前搜索词/标签条件基础上生效）。
   */
  function initOnlyFavorites() {
    const btn = document.getElementById("onlyFavoritesBtn");
    if (!btn) return;

    btn.addEventListener("click", () => {
      // 若按钮在 HTML 里自带 aria-pressed 切换，这里等状态更新后再刷新
      queueMicrotask(() => {
        const input = document.getElementById("searchInput");
        applySearch(input?.value ?? "");
      });
    });
  }

  /**
   * 初始化主题切换：通过切换 body 的 dark-mode class 改变主题。
   */
  function initThemeToggle() {
    const btn = document.getElementById("themeToggleBtn");
    if (!btn) return;

    const THEME_KEY = "themeMode";
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark") document.body.classList.add("dark-mode");
    if (saved === "light") document.body.classList.remove("dark-mode");

    btn.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark-mode");
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
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

  initFavorites();
  initOnlyFavorites();
  initThemeToggle();
  initSearch();
  initTagMultiSelect();
  initReset();
  initCardClick();
  initModalClose();
  void loadSpots();
})();
