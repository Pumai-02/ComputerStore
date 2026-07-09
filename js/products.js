/* ==========================================================================
   TechNova — Product Catalog
   Central product data source + card rendering helpers.
   ========================================================================== */

const CATEGORIES = [
  { id: "gaming-laptops", name: "Gaming Laptops", icon: "fa-laptop" },
  { id: "business-laptops", name: "Business Laptops", icon: "fa-briefcase" },
  { id: "desktop-pcs", name: "Desktop PCs", icon: "fa-desktop" },
  { id: "gaming-pcs", name: "Gaming PCs", icon: "fa-gamepad" },
  { id: "monitors", name: "Monitors", icon: "fa-tv" },
  { id: "graphics-cards", name: "Graphics Cards", icon: "fa-microchip" },
  { id: "motherboards", name: "Motherboards", icon: "fa-server" },
  { id: "ram", name: "RAM", icon: "fa-memory" },
  { id: "ssd", name: "SSD", icon: "fa-hard-drive" },
  { id: "hdd", name: "HDD", icon: "fa-database" },
  { id: "power-supply", name: "Power Supply", icon: "fa-plug" },
  { id: "pc-cases", name: "PC Cases", icon: "fa-box" },
  { id: "cooling", name: "Cooling", icon: "fa-fan" },
  { id: "keyboard", name: "Keyboards", icon: "fa-keyboard" },
  { id: "mouse", name: "Mice", icon: "fa-computer-mouse" },
  { id: "headsets", name: "Headsets", icon: "fa-headphones" },
  { id: "webcam", name: "Webcams", icon: "fa-camera" },
  { id: "accessories", name: "Accessories", icon: "fa-plug-circle-bolt" },
];

const BRANDS = ["ASUS", "MSI", "Dell", "Apple", "Lenovo", "Acer", "HP", "ROG"];

/* ---- Product imagery -------------------------------------------------
   Images are pulled from a free keyword-based photo service (LoremFlickr)
   using a category keyword, with a locked seed so each product always
   shows the same photo. To use your own product photography instead,
   just set an explicit `image: "https://..."` field on that product —
   productImageUrl() below will use it automatically and skip the
   generated link.
   ------------------------------------------------------------------- */
const CATEGORY_IMAGE_KEYWORDS = {
  "gaming-laptops": "gaming-laptop",
  "business-laptops": "laptop",
  "desktop-pcs": "desktop-computer",
  "gaming-pcs": "gaming-pc",
  "monitors": "computer-monitor",
  "graphics-cards": "graphics-card",
  "motherboards": "motherboard",
  "ram": "ram-memory",
  "ssd": "ssd-drive",
  "hdd": "hard-drive",
  "power-supply": "power-supply",
  "pc-cases": "computer-case",
  "cooling": "cpu-cooler",
  "keyboard": "keyboard",
  "mouse": "computer-mouse",
  "headsets": "headphones",
  "webcam": "webcam",
  "accessories": "usb-hub",
};

function seedFromId(id) {
  return parseInt(String(id).replace(/\D/g, ""), 10) || 1;
}

/**
 * Returns an image URL for a product. `variant` (0-3) selects a different
 * locked photo for the same keyword, used for the gallery thumbnails on
 * the product details page.
 */
function productImageUrl(product, variant = 0) {
  if (product.image) return product.image;
  const keyword = CATEGORY_IMAGE_KEYWORDS[product.category] || "computer";
  const seed = seedFromId(product.id) + variant * 101;
  return `https://loremflickr.com/640/480/${keyword}?lock=${seed}`;
}

const PRODUCTS = [
  {
    id: "p01", name: "ROG Strix Scar 16", brand: "ROG", category: "gaming-laptops",
    image: "https://i.pinimg.com/1200x/40/47/76/404776ccc189f14664abcf6f6ae36a11.jpg",
    specs: "Core i9-14900HX · RTX 4080 · 32GB RAM · 1TB SSD · 16\" QHD 240Hz",
    price: 2799, oldPrice: 3199, rating: 4.8, reviews: 214, stock: 12,
    badge: "sale", tag: "bestseller", color: "#0f172a", added: "2026-06-20",
    description: "Built for competitive play and heavy creative workloads, the Scar 16 pairs a 14th-gen Intel Core i9 with an RTX 4080 for uncompromising frame rates at QHD resolution.",
    specTable: { "Processor": "Intel Core i9-14900HX", "Graphics": "NVIDIA RTX 4080 12GB", "Memory": "32GB DDR5 5600MHz", "Storage": "1TB PCIe Gen4 SSD", "Display": "16\" QHD+ 240Hz", "Battery": "90Wh, up to 8 hrs" }
  },
  {
    id: "p02", name: "ZenBook Pro 14 Duo", brand: "ASUS", category: "business-laptops",
    image: "https://i.pinimg.com/736x/9d/f3/85/9df3857bc0095fcf8a83ff6c4f6f862f.jpg",
    specs: "Core i7-14700H · RTX 4060 · 16GB RAM · 512GB SSD · Dual OLED",
    price: 1899, oldPrice: 2099, rating: 4.6, reviews: 132, stock: 8,
    badge: "sale", tag: "new", color: "#1e293b", added: "2026-06-28",
    description: "A dual-screen creative powerhouse with a vibrant OLED main display and a secondary ScreenPad Plus for extended workflows on the go.",
    specTable: { "Processor": "Intel Core i7-14700H", "Graphics": "NVIDIA RTX 4060 8GB", "Memory": "16GB LPDDR5", "Storage": "512GB PCIe SSD", "Display": "14.5\" 2.8K OLED + 12.7\" Screenpad", "Battery": "76Wh, up to 10 hrs" }
  },
  {
    id: "p03", name: "Titan GT77 HX", brand: "MSI", category: "gaming-pcs",
    image: "https://i.pinimg.com/736x/1d/82/bf/1d82bf6a34cbbc8c9f7eedd73771245c.jpg",
    specs: "Core i9-14900HX · RTX 4090 · 64GB RAM · 2TB SSD · Mini LED",
    price: 4299, oldPrice: null, rating: 4.9, reviews: 87, stock: 4,
    badge: "hot", tag: "bestseller", color: "#111827", added: "2026-05-10",
    description: "The flagship of desktop-replacement gaming, engineered with a per-key RGB mechanical keyboard and desktop-class RTX 4090 performance.",
    specTable: { "Processor": "Intel Core i9-14900HX", "Graphics": "NVIDIA RTX 4090 16GB", "Memory": "64GB DDR5", "Storage": "2TB NVMe SSD", "Display": "17.3\" Mini LED 4K 144Hz", "Battery": "99.9Wh" }
  },
  {
    id: "p04", name: "MacBook Pro 14 M4", brand: "Apple", category: "business-laptops",
    image: "https://i.pinimg.com/1200x/18/30/7d/18307dfde0f655618d822607bda8c931.jpg",
    specs: "Apple M4 Pro · 24GB RAM · 512GB SSD · Liquid Retina XDR",
    price: 2199, oldPrice: 2399, rating: 4.9, reviews: 356, stock: 20,
    badge: "sale", tag: "bestseller", color: "#e5e7eb", added: "2026-04-02",
    description: "Exceptional battery life and studio-grade performance in a fanless-quiet chassis, ideal for professionals who need power without compromise.",
    specTable: { "Processor": "Apple M4 Pro (12-core)", "Graphics": "18-core GPU", "Memory": "24GB Unified", "Storage": "512GB SSD", "Display": "14.2\" Liquid Retina XDR", "Battery": "Up to 18 hrs" }
  },
  {
    id: "p05", name: "Legion Pro 7i", brand: "Lenovo", category: "gaming-laptops",
    image: "https://i.pinimg.com/1200x/65/72/f1/6572f199913792926966bee4926e903f.jpg",
    specs: "Core i9-14900HX · RTX 4070 · 32GB RAM · 1TB SSD · 16\" WQXGA",
    price: 2399, oldPrice: 2699, rating: 4.7, reviews: 198, stock: 15,
    badge: "sale", tag: null, color: "#1f2937", added: "2026-06-12",
    description: "A legion-class gaming laptop with an advanced vapor chamber cooling system and a per-key RGB keyboard for serious competitive edge.",
    specTable: { "Processor": "Intel Core i9-14900HX", "Graphics": "NVIDIA RTX 4070 8GB", "Memory": "32GB DDR5", "Storage": "1TB SSD", "Display": "16\" WQXGA 240Hz", "Battery": "99.9Wh" }
  },
  {
    id: "p06", name: "Predator Orion 7000", brand: "Acer", category: "desktop-pcs",
    image: "https://i.pinimg.com/736x/80/18/d6/8018d61ea8325a2162126e8e53f33dd9.jpg",
    specs: "Core i9-14900K · RTX 4080 · 32GB RAM · 2TB SSD",
    price: 3199, oldPrice: null, rating: 4.6, reviews: 64, stock: 6,
    badge: null, tag: "new", color: "#111827", added: "2026-06-30",
    description: "A tool-free chassis desktop with front mesh airflow, liquid cooling, and room to grow with tri-mode M.2 storage expansion.",
    specTable: { "Processor": "Intel Core i9-14900K", "Graphics": "NVIDIA RTX 4080 16GB", "Memory": "32GB DDR5", "Storage": "2TB NVMe SSD", "Cooling": "360mm AIO Liquid Cooler", "PSU": "850W Gold" }
  },
  {
    id: "p07", name: "OMEN 45L", brand: "HP", category: "gaming-pcs",
    image: "https://i.pinimg.com/1200x/93/fd/30/93fd30ba2dbf4459819914acac193410.jpg",
    specs: "Ryzen 9 7900X · RTX 4070 Ti · 32GB RAM · 1TB SSD",
    price: 2599, oldPrice: 2899, rating: 4.5, reviews: 91, stock: 9,
    badge: "sale", tag: null, color: "#1e293b", added: "2026-05-22",
    description: "Cryo Chamber cooling technology keeps thermals in check while the tempered glass panel shows off every component.",
    specTable: { "Processor": "AMD Ryzen 9 7900X", "Graphics": "NVIDIA RTX 4070 Ti 12GB", "Memory": "32GB DDR5", "Storage": "1TB NVMe SSD", "Cooling": "Cryo Chamber", "PSU": "800W Gold" }
  },
  {
    id: "p08", name: "UltraSharp 32 4K", brand: "Dell", category: "monitors",
    image: "https://i.pinimg.com/736x/32/6c/68/326c680bdb55476e95a7dcfed48a8aca.jpg",
    specs: "32\" 4K UHD IPS · 98% DCI-P3 · USB-C 90W · HDR400",
    price: 799, oldPrice: 949, rating: 4.7, reviews: 143, stock: 25,
    badge: "sale", tag: "bestseller", color: "#0f172a", added: "2026-03-18",
    description: "Factory colour-calibrated for creative professionals, with a single USB-C cable delivering video, data, and up to 90W of charging.",
    specTable: { "Panel": "32\" 4K UHD IPS Black", "Refresh": "60Hz", "Color": "98% DCI-P3, Delta E<2", "Ports": "USB-C 90W, HDMI 2.1, DP 1.4", "Stand": "Height, tilt, swivel, pivot" }
  },
  {
    id: "p09", name: "GeForce RTX 4070 Ti Super", brand: "ASUS", category: "graphics-cards",
    image: "https://i.pinimg.com/736x/da/8f/5b/da8f5b3af56452f8923829278f09294e.jpg",
    specs: "16GB GDDR6X · Triple Fan · PCIe 4.0",
    price: 899, oldPrice: 999, rating: 4.8, reviews: 176, stock: 18,
    badge: "sale", tag: null, color: "#111827", added: "2026-06-05",
    description: "Axial-tech triple fan cooling and a reinforced frame keep this card running cool and quiet under sustained ray-traced workloads.",
    specTable: { "Memory": "16GB GDDR6X", "Interface": "PCIe 4.0 x16", "Cooling": "Triple Axial Fan", "Outputs": "3x DP 1.4a, 1x HDMI 2.1", "Length": "343mm" }
  },
  {
    id: "p10", name: "MEG Z790 Ace", brand: "MSI", category: "motherboards",
    image: "https://i.pinimg.com/1200x/90/7e/8b/907e8b95d5f63f75840cdec17c8af964.jpg",
    specs: "LGA1700 · DDR5 · PCIe 5.0 · Wi-Fi 7",
    price: 549, oldPrice: null, rating: 4.6, reviews: 58, stock: 14,
    badge: null, tag: "new", color: "#1f2937", added: "2026-06-25",
    description: "An enthusiast-grade Z790 board with a 24+1+2 power-stage design and full PCIe 5.0 support for next-generation GPUs and SSDs.",
    specTable: { "Socket": "LGA1700", "Chipset": "Intel Z790", "Memory": "DDR5, up to 192GB", "Expansion": "PCIe 5.0 x16", "Networking": "Wi-Fi 7, 5GbE LAN" }
  },
  {
    id: "p11", name: "Trident Z5 RGB 32GB", brand: "ASUS", category: "ram",
    image: "https://i.pinimg.com/1200x/1f/69/86/1f6986e1ae1f2846bea9fbdbb84b192b.jpg",
    specs: "32GB (2x16GB) DDR5-6400 · CL32 · RGB",
    price: 189, oldPrice: 229, rating: 4.7, reviews: 210, stock: 40,
    badge: "sale", tag: "bestseller", color: "#0f172a", added: "2026-04-14",
    description: "Hand-binned ICs and a dynamic RGB light bar deliver both tight-timing performance and a striking visual centrepiece.",
    specTable: { "Capacity": "32GB (2x16GB)", "Speed": "DDR5-6400", "Latency": "CL32-39-39-102", "Voltage": "1.4V" }
  },
  {
    id: "p12", name: "Nova SSD Pro 2TB", brand: "HP", category: "ssd",
    image: "https://i.pinimg.com/1200x/1c/3d/b0/1c3db03dd1a7b76af12e7cb072d533b7.jpg",
    specs: "2TB NVMe Gen4 · 7300MB/s Read",
    price: 149, oldPrice: 179, rating: 4.5, reviews: 302, stock: 55,
    badge: "sale", tag: null, color: "#111827", added: "2026-02-11",
    description: "A slim M.2 2280 drive with an integrated graphene heat spreader for sustained peak transfer speeds under heavy load.",
    specTable: { "Capacity": "2TB", "Interface": "PCIe Gen4 x4 NVMe", "Read Speed": "7300 MB/s", "Write Speed": "6500 MB/s", "Form Factor": "M.2 2280" }
  },
  {
    id: "p13", name: "IronClad 4TB HDD", brand: "Dell", category: "hdd",
    image: "https://i.pinimg.com/736x/37/92/34/379234c9227ebd4f6e0daff5ae733e6d.jpg",
    specs: "4TB 7200RPM · SATA III · 256MB Cache",
    price: 89, oldPrice: null, rating: 4.3, reviews: 121, stock: 60,
    badge: null, tag: null, color: "#1e293b", added: "2026-01-20",
    description: "A dependable bulk-storage drive built for NAS and desktop workloads with a large cache buffer for smoother file transfers.",
    specTable: { "Capacity": "4TB", "Interface": "SATA III 6Gb/s", "RPM": "7200", "Cache": "256MB" }
  },
  {
    id: "p14", name: "Prime PSU 850W Gold", brand: "ASUS", category: "power-supply",
    image: "https://i.pinimg.com/736x/96/25/d4/9625d48fd37767180eec1cc44db0922e.jpg",
    specs: "850W 80+ Gold · Fully Modular",
    price: 139, oldPrice: 159, rating: 4.6, reviews: 88, stock: 30,
    badge: "sale", tag: null, color: "#111827", added: "2026-05-30",
    description: "Fully modular cabling and a fluid-dynamic bearing fan keep power delivery clean, quiet, and efficient at every load.",
    specTable: { "Wattage": "850W", "Efficiency": "80+ Gold", "Modularity": "Fully Modular", "Fan": "135mm FDB" }
  },
  {
    id: "p15", name: "Aero Flow ATX Case", brand: "Lenovo", category: "pc-cases",
    image: "https://i.pinimg.com/1200x/8f/1b/30/8f1b301893fe1451854eb949cb032d07.jpg",
    specs: "Mid-Tower · Tempered Glass · 4x ARGB Fans",
    price: 119, oldPrice: null, rating: 4.4, reviews: 76, stock: 22,
    badge: "new", tag: "new", color: "#1f2937", added: "2026-06-29",
    description: "A high-airflow mesh front panel paired with a tempered glass side reveals your build while keeping thermals firmly in check.",
    specTable: { "Form Factor": "Mid-Tower ATX", "Fans Included": "4x 120mm ARGB", "Front Panel": "Mesh, high-airflow", "Max GPU Length": "400mm" }
  },
  {
    id: "p16", name: "CryoFreeze 360 AIO", brand: "MSI", category: "cooling",
    image: "https://i.pinimg.com/1200x/96/c1/b3/96c1b315260383b93b4c7ffb74d9bdee.jpg",
    specs: "360mm AIO · ARGB Pump · PWM",
    price: 169, oldPrice: 199, rating: 4.7, reviews: 104, stock: 17,
    badge: "sale", tag: null, color: "#0f172a", added: "2026-03-02",
    description: "A 360mm radiator liquid cooler with an ARGB pump cap and low-noise PWM fans engineered for high-TDP flagship CPUs.",
    specTable: { "Radiator": "360mm", "Fans": "3x 120mm PWM", "Pump Speed": "3200 RPM", "Socket Support": "LGA1700 / AM5" }
  },
  {
    id: "p17", name: "ROG Azoth Keyboard", brand: "ROG", category: "keyboard",
    image: "https://i.pinimg.com/1200x/80/c9/f3/80c9f3b8d535019af3e250475e96fef9.jpg",
    specs: "75% Hot-Swap · Gasket Mount · OLED Display",
    price: 249, oldPrice: 279, rating: 4.9, reviews: 267, stock: 33,
    badge: "sale", tag: "bestseller", color: "#111827", added: "2026-05-08",
    description: "A gasket-mounted hot-swappable keyboard with pre-lubed stabilizers and a mini OLED display for at-a-glance system stats.",
    specTable: { "Layout": "75%, Hot-swappable", "Switches": "ROG NX Snow (included)", "Connectivity": "2.4GHz / Bluetooth / Wired", "Extras": "OLED display, volume knob" }
  },
  {
    id: "p18", name: "Air Precision Mouse", brand: "HP", category: "mouse",
    image: "https://i.pinimg.com/1200x/64/9e/b2/649eb297c2705db580aeef8a09551bd5.jpg",
    specs: "Wireless · 26000 DPI · 55g Ultralight",
    price: 79, oldPrice: 99, rating: 4.6, reviews: 189, stock: 48,
    badge: "sale", tag: null, color: "#1e293b", added: "2026-04-19",
    description: "An ultralight honeycomb shell paired with a flagship optical sensor for precise, fatigue-free tracking during long sessions.",
    specTable: { "Sensor": "26,000 DPI Optical", "Weight": "55g", "Connectivity": "2.4GHz Wireless", "Battery": "Up to 70 hrs" }
  },
  {
    id: "p19", name: "SoundWave Pro Headset", brand: "Acer", category: "headsets",
    image: "https://i.pinimg.com/736x/31/e2/d7/31e2d78f02eda836c7e22aeb20239604.jpg",
    specs: "Wireless · 7.1 Surround · Noise-Cancelling Mic",
    price: 129, oldPrice: 159, rating: 4.5, reviews: 154, stock: 26,
    badge: "sale", tag: null, color: "#111827", added: "2026-02-27",
    description: "Memory-foam earcups and virtual 7.1 surround sound make this headset comfortable for marathon sessions and competitive play alike.",
    specTable: { "Driver": "50mm Neodymium", "Surround": "Virtual 7.1", "Mic": "Detachable, noise-cancelling", "Battery": "Up to 24 hrs" }
  },
  {
    id: "p20", name: "ClearView 4K Webcam", brand: "Dell", category: "webcam",
    image: "https://i.pinimg.com/736x/70/a3/88/70a3881b93bf15967425e674ba907d19.jpg",
    specs: "4K30 · Auto-Focus · Dual Mic",
    price: 99, oldPrice: null, rating: 4.4, reviews: 97, stock: 37,
    badge: null, tag: "new", color: "#1f2937", added: "2026-06-27",
    description: "Crisp 4K video with auto-framing and HDR exposure balancing, plus dual microphones for clear calls without extra hardware.",
    specTable: { "Resolution": "4K @ 30fps", "Field of View": "90°", "Focus": "Auto-focus", "Mic": "Dual, noise-reducing" }
  },
  {
    id: "p21", name: "PowerHub 10-in-1 Dock", brand: "ASUS", category: "accessories",
    image: "https://i.pinimg.com/1200x/0a/95/d0/0a95d0e8d899024ecae0f4032db2834b.jpg",
    specs: "USB-C · 100W PD · HDMI 4K · SD/microSD",
    price: 69, oldPrice: 89, rating: 4.3, reviews: 112, stock: 44,
    badge: "sale", tag: null, color: "#111827", added: "2026-01-30",
    description: "A compact aluminum dock that turns a single USB-C port into ten, with pass-through power delivery for laptops.",
    specTable: { "Ports": "HDMI, USB-A x3, USB-C, SD, microSD, LAN", "Power Delivery": "100W Pass-through", "Video": "4K@60Hz" }
  },
  {
    id: "p22", name: "Swift Edge Business 14", brand: "Acer", category: "business-laptops",
    image: "https://laptopmedia.com/wp-content/uploads/2025/07/acer-swift-edge-14-ai-sfe14-51t-with-fingerprint-with-backlit-wp-oled-pearl-white-luxury-gold-02-custom-scaled-e1753636835106.jpg",
    specs: "Core Ultra 7 · Iris Xe · 16GB RAM · 1TB SSD · 2.8K OLED",
    price: 1499, oldPrice: 1699, rating: 4.5, reviews: 73, stock: 19,
    badge: "sale", tag: null, color: "#0f172a", added: "2026-06-01",
    description: "A sub-1kg magnesium-alloy chassis with MIL-STD durability, built for professionals who travel light without losing display quality.",
    specTable: { "Processor": "Intel Core Ultra 7", "Graphics": "Intel Iris Xe", "Memory": "16GB LPDDR5X", "Storage": "1TB SSD", "Display": "14\" 2.8K OLED 120Hz", "Weight": "0.99kg" }
  },
  {
    id: "p23", name: "Spectre Fold Desktop Mini", brand: "HP", category: "desktop-pcs",
    image: "https://i.pinimg.com/736x/e7/cc/68/e7cc68baad3bd0e97aa6257cb1777055.jpg",
    specs: "Core i7-14700 · 16GB RAM · 512GB SSD · Compact ITX",
    price: 999, oldPrice: null, rating: 4.4, reviews: 41, stock: 16,
    badge: null, tag: null, color: "#1e293b", added: "2026-03-25",
    description: "A whisper-quiet mini-ITX desktop that fits behind any monitor, ideal for office and home-productivity setups.",
    specTable: { "Processor": "Intel Core i7-14700", "Graphics": "Integrated", "Memory": "16GB DDR5", "Storage": "512GB SSD", "Form Factor": "Mini-ITX" }
  },
  {
    id: "p24", name: "Studio Display 27 5K", brand: "Apple", category: "monitors",
    image: "https://i.pinimg.com/736x/ab/8a/9f/ab8a9fe449402eea451a64e9330ebb52.jpg",
    specs: "27\" 5K Retina · 600 nits · Center Stage Camera",
    price: 1599, oldPrice: 1699, rating: 4.7, reviews: 165, stock: 11,
    badge: "sale", tag: null, color: "#e5e7eb", added: "2026-05-15",
    description: "A 5K Retina display with true tone and a wide colour gamut, plus a built-in camera and studio-quality microphone array.",
    specTable: { "Panel": "27\" 5K Retina", "Brightness": "600 nits", "Color": "P3 wide gamut, True Tone", "Camera": "12MP Center Stage" }
  }
];

/*  Helpers*/

function formatPrice(value) {
  return "$" + value.toLocaleString("en-US");
}

function starRating(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  let html = "";
  for (let i = 0; i < full; i++) html += '<i class="fa-solid fa-star"></i>';
  if (half) html += '<i class="fa-solid fa-star-half-stroke"></i>';
  for (let i = full + (half ? 1 : 0); i < 5; i++) html += '<i class="fa-regular fa-star"></i>';
  return html;
}

function stockLabel(stock) {
  if (stock <= 0) return '<span class="stock out">Out of Stock</span>';
  if (stock <= 5) return `<span class="stock low">Only ${stock} left</span>`;
  return '<span class="stock in">In Stock</span>';
}

function badgeHtml(product) {
  if (product.badge === "sale" && product.oldPrice) {
    const pct = Math.round(100 - (product.price / product.oldPrice) * 100);
    return `<span class="product-badge badge-sale">-${pct}%</span>`;
  }
  if (product.badge === "hot") return '<span class="product-badge badge-hot">Hot</span>';
  if (product.badge === "new") return '<span class="product-badge badge-new">New</span>';
  return "";
}

function productCard(product) {
  const wished = isInWishlist(product.id);
  return `
  <article class="product-card fade-up" data-id="${product.id}">
    ${badgeHtml(product)}
    <button class="icon-btn wishlist-btn ${wished ? "active" : ""}" data-id="${product.id}" aria-label="Toggle wishlist" title="Add to wishlist">
      <i class="fa-${wished ? "solid" : "regular"} fa-heart"></i>
    </button>
    <a href="product-details.html?id=${product.id}" class="product-media" style="background:${product.color}">
      <img src="${productImageUrl(product)}" alt="${product.name}" loading="lazy"
           onerror="this.remove()">
      <i class="fa-solid ${categoryIcon(product.category)} placeholder-icon"></i>
      <span class="quick-view" data-id="${product.id}">Quick View</span>
    </a>
    <div class="product-body">
      <span class="product-brand">${product.brand}</span>
      <h3 class="product-name"><a href="product-details.html?id=${product.id}">${product.name}</a></h3>
      <p class="product-specs">${product.specs}</p>
      <div class="product-rating">
        <span class="stars">${starRating(product.rating)}</span>
        <span class="rating-count">(${product.reviews})</span>
      </div>
      <div class="product-price-row">
        <span class="price-now">${formatPrice(product.price)}</span>
        ${product.oldPrice ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ""}
      </div>
      ${stockLabel(product.stock)}
      <button class="btn btn-primary btn-block add-to-cart-btn" data-id="${product.id}" ${product.stock <= 0 ? "disabled" : ""}>
        <i class="fa-solid fa-cart-plus"></i> Add to Cart
      </button>
    </div>
  </article>`;
}

function categoryIcon(catId) {
  const c = CATEGORIES.find((c) => c.id === catId);
  return c ? c.icon : "fa-box";
}

function renderProductGrid(container, list) {
  if (!container) return;
  if (!list.length) {
    container.innerHTML = `<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><p>No products match your filters.</p></div>`;
    return;
  }
  container.innerHTML = list.map(productCard).join("");
}