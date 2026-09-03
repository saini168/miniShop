(function(){
  "use strict";

  const products = [
    {id:1, name:"Sourdough Starter Kit", cat:"Pantry", price:18, icon:"🥖", bg:"#F3E4BE", rating:4.6, reviews:128, tag:"Best seller"},
    {id:2, name:"Single-Origin Coffee Beans, 12oz", cat:"Pantry", price:14, icon:"☕", bg:"#E4D3C2", rating:4.8, reviews:342, tag:null},
    {id:3, name:"Raw Wildflower Honey", cat:"Pantry", price:11, icon:"🍯", bg:"#F5E2AC", rating:4.7, reviews:89, tag:null},
    {id:4, name:"Sea Salt Crackers, 3-Pack", cat:"Pantry", price:9, icon:"🍘", bg:"#EFE6D2", rating:4.3, reviews:54, tag:null},
    {id:5, name:"Cast Iron Skillet, 10in", cat:"Home", price:34, icon:"🍳", bg:"#DDD7CC", rating:4.9, reviews:551, tag:"Best seller"},
    {id:6, name:"Linen Dish Towels, Set of 4", cat:"Home", price:22, icon:"🧺", bg:"#EAE2D0", rating:4.5, reviews:76, tag:null},
    {id:7, name:"Beeswax Taper Candles", cat:"Home", price:16, icon:"🕯️", bg:"#F2E7C4", rating:4.4, reviews:43, tag:null},
    {id:8, name:"Mechanical Desk Lamp", cat:"Home", price:32, icon:"💡", bg:"#E9D9D2", rating:4.7, reviews:150, tag:"New"},
    {id:9, name:"Claw Hammer, 16oz", cat:"Tools", price:19, icon:"🔨", bg:"#DEDEDE", rating:4.7, reviews:204, tag:null},
    {id:10, name:"Adjustable Wrench Set", cat:"Tools", price:27, icon:"🔧", bg:"#D8DEDD", rating:4.6, reviews:98, tag:null},
    {id:11, name:"Canvas Tool Apron", cat:"Tools", price:24, icon:"🧰", bg:"#E6D9C4", rating:4.5, reviews:61, tag:null},
    {id:12, name:"Folding Utility Knife", cat:"Tools", price:13, icon:"🗡️", bg:"#DEDEDE", rating:4.2, reviews:37, tag:null},
    {id:13, name:"Field Notes Journal, 3-Pack", cat:"Books", price:10, icon:"📓", bg:"#E5DFD0", rating:4.8, reviews:412, tag:null},
    {id:14, name:"The Kitchen Almanac", cat:"Books", price:21, icon:"📗", bg:"#D9E1D5", rating:4.6, reviews:58, tag:null},
    {id:15, name:"Star Atlas for Beginners", cat:"Books", price:26, icon:"📘", bg:"#D6DCE6", rating:4.9, reviews:33, tag:"New"},
    {id:16, name:"Wireless Earbuds, Compact", cat:"Tech", price:49, icon:"🎧", bg:"#E1E1E1", rating:4.3, reviews:901, tag:null},
    {id:17, name:"USB-C Fast Charger, 30W", cat:"Tech", price:17, icon:"🔌", bg:"#E1E1E1", rating:4.5, reviews:312, tag:null},
    {id:18, name:"Portable Bluetooth Speaker", cat:"Tech", price:39, icon:"🔊", bg:"#D9E1D5", rating:4.4, reviews:267, tag:null},
  ];

  const categories = ["All", ...Array.from(new Set(products.map(p => p.cat)))];

  // ---- state (in-memory only; resets on reload) ----
  let cart = {};          // { productId: qty }
  let activeCategory = "All";
  let searchTerm = "";
  let sortMode = "featured";
  let orderCounter = 1042;

  // ---- elements ----
  const tabsEl = document.getElementById("tabs");
  const gridEl = document.getElementById("grid");
  const resultCountEl = document.getElementById("resultCount");
  const searchEl = document.getElementById("search");
  const sortEl = document.getElementById("sort");
  const cartCountEl = document.getElementById("cartCount");
  const overlayEl = document.getElementById("overlay");
  const drawerEl = document.getElementById("drawer");
  const drawerItemsEl = document.getElementById("drawerItems");
  const subtotalAmountEl = document.getElementById("subtotalAmount");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const openCartBtn = document.getElementById("openCartBtn");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalCloseBtn = document.getElementById("modalCloseBtn");
  const orderNoEl = document.getElementById("orderNo");

  function money(n){ return "$" + n.toFixed(2); }

  function stars(rating){
    const full = Math.round(rating);
    return "★★★★★".slice(0, full) + "☆☆☆☆☆".slice(0, 5 - full);
  }

  // ---- render category tabs ----
  function renderTabs(){
    tabsEl.innerHTML = "";
    categories.forEach(cat => {
      const btn = document.createElement("button");
      btn.className = "tab" + (cat === activeCategory ? " active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        activeCategory = cat;
        renderTabs();
        renderGrid();
      });
      tabsEl.appendChild(btn);
    });
  }

  // ---- filtering / sorting ----
  function getVisibleProducts(){
    let list = products.filter(p => {
      const inCat = activeCategory === "All" || p.cat === activeCategory;
      const inSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.cat.toLowerCase().includes(searchTerm.toLowerCase());
      return inCat && inSearch;
    });
    if(sortMode === "price-asc") list.sort((a,b) => a.price - b.price);
    else if(sortMode === "price-desc") list.sort((a,b) => b.price - a.price);
    else if(sortMode === "rating") list.sort((a,b) => b.rating - a.rating);
    return list;
  }

  // ---- render product grid ----
  function renderGrid(){
    const list = getVisibleProducts();
    resultCountEl.textContent = list.length + (list.length === 1 ? " item" : " items");

    if(list.length === 0){
      gridEl.innerHTML = "";
      gridEl.insertAdjacentHTML("afterend", "");
      gridEl.style.display = "none";
      let existing = document.querySelector(".empty-state");
      if(!existing){
        existing = document.createElement("div");
        existing.className = "empty-state";
        gridEl.insertAdjacentElement("afterend", existing);
      }
      existing.innerHTML = "<h2>Nothing matches</h2><p>Try a different search term or category.</p>";
      return;
    } else {
      gridEl.style.display = "grid";
      const existing = document.querySelector(".empty-state");
      if(existing) existing.remove();
    }

    gridEl.innerHTML = list.map(p => `
      <article class="card">
        <div class="card-media" style="background:${p.bg}">
          ${p.tag ? `<span class="card-tag">${p.tag}</span>` : ""}
          <span aria-hidden="true">${p.icon}</span>
        </div>
        <div class="card-body">
          <div class="card-cat">${p.cat}</div>
          <h3 class="card-title">${p.name}</h3>
          <div class="card-rating">
            <span class="stars" aria-hidden="true">${stars(p.rating)}</span>
            <span>${p.rating} (${p.reviews})</span>
          </div>
          <div class="card-price-row">
            <span class="price">${money(p.price)}</span>
            <button class="add-btn" data-id="${p.id}">Add to basket</button>
          </div>
        </div>
      </article>
    `).join("");

    gridEl.querySelectorAll(".add-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        addToCart(id);
        btn.textContent = "Added";
        btn.classList.add("added");
        setTimeout(() => {
          btn.textContent = "Add to basket";
          btn.classList.remove("added");
        }, 900);
      });
    });
  }

  // ---- cart logic ----
  function addToCart(id){
    cart[id] = (cart[id] || 0) + 1;
    renderCart();
  }
  function changeQty(id, delta){
    if(!cart[id]) return;
    cart[id] += delta;
    if(cart[id] <= 0) delete cart[id];
    renderCart();
  }
  function removeFromCart(id){
    delete cart[id];
    renderCart();
  }
  function cartEntries(){
    return Object.keys(cart).map(id => {
      const product = products.find(p => p.id === Number(id));
      return { product, qty: cart[id] };
    }).filter(e => e.product);
  }
  function cartTotalItems(){
    return Object.values(cart).reduce((sum, q) => sum + q, 0);
  }
  function cartSubtotal(){
    return cartEntries().reduce((sum, e) => sum + e.product.price * e.qty, 0);
  }

  function renderCart(){
    const entries = cartEntries();
    cartCountEl.textContent = cartTotalItems();
    subtotalAmountEl.textContent = money(cartSubtotal());
    checkoutBtn.disabled = entries.length === 0;

    if(entries.length === 0){
      drawerItemsEl.innerHTML = `<div class="drawer-empty">Your basket is empty.<br>Find something you like on the shelf.</div>`;
      return;
    }

    drawerItemsEl.innerHTML = entries.map(e => `
      <div class="cart-row" data-id="${e.product.id}">
        <div class="thumb" style="background:${e.product.bg}">${e.product.icon}</div>
        <div class="cart-row-info">
          <p class="name">${e.product.name}</p>
          <p class="unit">${money(e.product.price)} each</p>
          <div class="qty-control">
            <button class="qty-minus" aria-label="Decrease quantity">&minus;</button>
            <span>${e.qty}</span>
            <button class="qty-plus" aria-label="Increase quantity">&plus;</button>
          </div>
        </div>
        <div class="cart-row-right">
          <span class="line-total">${money(e.product.price * e.qty)}</span>
          <button class="remove-btn">Remove</button>
        </div>
      </div>
    `).join("");

    drawerItemsEl.querySelectorAll(".cart-row").forEach(row => {
      const id = Number(row.dataset.id);
      row.querySelector(".qty-plus").addEventListener("click", () => changeQty(id, 1));
      row.querySelector(".qty-minus").addEventListener("click", () => changeQty(id, -1));
      row.querySelector(".remove-btn").addEventListener("click", () => removeFromCart(id));
    });
  }

  // ---- drawer open/close ----
  function openDrawer(){
    drawerEl.classList.add("open");
    overlayEl.classList.add("open");
  }
  function closeDrawer(){
    drawerEl.classList.remove("open");
    overlayEl.classList.remove("open");
  }
  openCartBtn.addEventListener("click", openDrawer);
  closeCartBtn.addEventListener("click", closeDrawer);
  overlayEl.addEventListener("click", () => {
    closeDrawer();
    closeModal();
  });
  document.addEventListener("keydown", e => {
    if(e.key === "Escape"){ closeDrawer(); closeModal(); }
  });

  // ---- checkout modal ----
  function openModal(){
    orderNoEl.textContent = "#" + (orderCounter++);
    modalOverlay.classList.add("open");
  }
  function closeModal(){
    modalOverlay.classList.remove("open");
  }
  checkoutBtn.addEventListener("click", () => {
    if(cartTotalItems() === 0) return;
    openModal();
    cart = {};
    renderCart();
    closeDrawer();
  });
  modalCloseBtn.addEventListener("click", closeModal);

  // ---- search / sort ----
  searchEl.addEventListener("input", () => {
    searchTerm = searchEl.value;
    renderGrid();
  });
  sortEl.addEventListener("change", () => {
    sortMode = sortEl.value;
    renderGrid();
  });

  // ---- init ----
  renderTabs();
  renderGrid();
  renderCart();
})();
