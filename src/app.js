(() => {
  function formatPrice(price) {
    if (price === 0) return "免费";
    if (typeof price === "number" && Number.isFinite(price)) return `¥${price}`;
    return String(price ?? "");
  }

  function formatRating(rating) {
    const n = typeof rating === "number" ? rating : Number(rating);
    return Number.isFinite(n) ? n.toFixed(1) : "";
  }

  function renderSpots(spots) {
    const listEl = document.getElementById("spotsList");
    if (!listEl) return;

    listEl.textContent = "";

    for (const spot of spots) {
      const li = document.createElement("li");

      const img = document.createElement("img");
      img.src = spot.image ?? "";
      img.alt = spot.name ?? "spot";
      img.loading = "lazy";

      const title = document.createElement("h3");
      title.textContent = spot.name ?? "";

      const city = document.createElement("div");
      city.textContent = `城市：${spot.city ?? ""}`;

      const tags = document.createElement("div");
      const tagText = Array.isArray(spot.tags) ? spot.tags.join(" / ") : "";
      tags.textContent = `标签：${tagText}`;

      const rating = document.createElement("div");
      rating.textContent = `评分：${formatRating(spot.rating)}`;

      const price = document.createElement("div");
      price.textContent = `价格：${formatPrice(spot.price)}`;

      const openTime = document.createElement("div");
      openTime.textContent = `开放时间：${spot.open_time ?? ""}`;

      li.append(img, title, city, tags, rating, price, openTime);
      listEl.appendChild(li);
    }
  }

  async function loadSpots() {
    try {
      const res = await fetch("../spots.json");
      if (!res.ok) throw new Error(`Failed to fetch spots.json: ${res.status} ${res.statusText}`);

      const data = await res.json();
      console.log("[spots.json]", data);
      renderSpots(Array.isArray(data?.spots) ? data.spots : []);
    } catch (err) {
      console.error("[spots.json] fetch error", err);
    }
  }

  void loadSpots();
})();
