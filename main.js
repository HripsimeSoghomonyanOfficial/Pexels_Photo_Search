const API_KEY = "ZpJX3cXA19hEpAMHTz6AfHq8W8FTYnvaGOBworIs2x2mSqMSrc8gLoiF";

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const filtersDiv = document.getElementById("filters");
const orientationFilter = document.getElementById("orientationFilter");
const minHeightFilter = document.getElementById("minHeightFilter");
const avgColorFilter = document.getElementById("avgColorFilter");
const favoritesDiv = document.getElementById("favorites");

let photos = [];
let filteredPhotos = [];
let favorites = [];

function createColorSquare(color) {
  const sq = document.createElement("span");
  sq.title = color;
  return sq;
}

function updateFilterOptions() {
  const heights = [...new Set(photos.map((p) => p.height))].sort((a, b) => a - b);
  minHeightFilter.innerHTML = '<option value="">Any Min Height</option>';
  heights.forEach((h) => {
    const opt = document.createElement("option");
    opt.value = h;
    opt.textContent = h + " px";
    minHeightFilter.appendChild(opt);
  });

  const colors = [...new Set(photos.map((p) => p.avg_color.toLowerCase()))];
  avgColorFilter.innerHTML = '<option value="">Any Avg Color</option>';
  colors.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c;
    const colorSquare = createColorSquare(c);
    opt.appendChild(colorSquare);
    const textNode = document.createTextNode(" " + c);
    opt.appendChild(textNode);
    avgColorFilter.appendChild(opt);
  });
}

function applyFilters() {
  filteredPhotos = photos.filter((photo) => {
    if (orientationFilter.value) {
      if (orientationFilter.value === "landscape" && !(photo.width > photo.height)) return false;
      if (orientationFilter.value === "portrait" && !(photo.height > photo.width)) return false;
      if (orientationFilter.value === "square" && !(photo.width === photo.height)) return false;
    }
    if (minHeightFilter.value && photo.height < parseInt(minHeightFilter.value)) return false;
    if (avgColorFilter.value && photo.avg_color.toLowerCase() !== avgColorFilter.value.toLowerCase()) return false;
    return true;
  });
  renderPhotos(filteredPhotos);
}

function renderPhotos(photoList) {
  resultsDiv.innerHTML = "";
  if (photoList.length === 0) {
    resultsDiv.textContent = "Nothing found.";
    return;
  }
  photoList.forEach((photo) => {
    const img = document.createElement("img");
    img.src = photo.src.medium;
    img.alt = photo.photographer;
    img.id = photo.id;
    img.title = `Photographer: ${photo.photographer}\nHeight: ${photo.height}px\nAvg Color: ${photo.avg_color}`;
    img.addEventListener("click", () => selectPhoto(photo));
    resultsDiv.appendChild(img);
  });
}

function selectPhoto(photo) {
  let modal = document.getElementById("modal");
  if (!modal) {
    modal = createModal();
  }
  showModal(photo);
}

function createModal() {
  const modal = document.createElement("div");
  modal.id = "modal";

  const modalContent = document.createElement("div");
  modalContent.id = "modalContent";

  const closeButton = document.createElement("button");
  closeButton.className = "closeBtn";
  closeButton.textContent = "✕";
  closeButton.addEventListener("click", closeModal);

  modal.appendChild(modalContent);
  modalContent.appendChild(closeButton);
  document.body.appendChild(modal);
  return modal;
}

function showModal(photo) {
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  modal.style.visibility = "visible";

  const closeBtn = modalContent.querySelector(".closeBtn");
  modalContent.innerHTML = "";
  modalContent.appendChild(closeBtn);

  const largeImg = document.createElement("img");
  largeImg.src = photo.src.large;
  largeImg.alt = photo.photographer;
  largeImg.draggable = false;
  largeImg.style.position = "relative";
  modalContent.appendChild(largeImg);

  let isDragging = false;
  let startX, startY, origX = 0, origY = 0;

  largeImg.addEventListener("mousedown", (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    origX = parseInt(largeImg.style.left) || 0;
    origY = parseInt(largeImg.style.top) || 0;
    e.preventDefault();
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    largeImg.style.left = origX + dx + "px";
    largeImg.style.top = origY + dy + "px";
  });

  const favBtn = document.createElement("button");
  favBtn.textContent = favorites.find((f) => f.id === photo.id) ? "Remove from Favorites" : "Add to Favorites";
  modalContent.appendChild(favBtn);

  favBtn.addEventListener("click", () => {
    const index = favorites.findIndex((f) => f.id === photo.id);
    if (index >= 0) {
      favorites.splice(index, 1);
      favBtn.textContent = "Add to Favorites";
    } else {
      favorites.push(photo);
      favBtn.textContent = "Remove from Favorites";
    }
    renderFavorites();
  });
}

function closeModal() {
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modalContent");
  if (modal) {
    modal.style.visibility = "hidden";
    modalContent.innerHTML = "";
  }
}

function renderFavorites() {
  favoritesDiv.innerHTML = "";
  if (favorites.length === 0) {
    favoritesDiv.textContent = "No favorites yet.";
    return;
  }
  favorites.forEach((photo) => {
    const img = document.createElement("img");
    img.src = photo.src.small;
    img.alt = photo.photographer;
    img.title = `Photographer: ${photo.photographer}`;
    favoritesDiv.appendChild(img);
  });
}

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (!query) return;

  resultsDiv.textContent = "Loading...";
  filtersDiv.style.display = "none";
  photos = [];
  filteredPhotos = [];

  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=50`,
      {
        headers: { Authorization: API_KEY },
      }
    );
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    photos = data.photos || [];
    if (photos.length === 0) {
      resultsDiv.textContent = "Nothing found.";
      return;
    }
    updateFilterOptions();
    filtersDiv.style.display = "flex";
    applyFilters();
  } catch (err) {
    resultsDiv.textContent = "Error loading photos.";
    console.error(err);
  }
});

orientationFilter.addEventListener("change", applyFilters);
minHeightFilter.addEventListener("change", applyFilters);
avgColorFilter.addEventListener("change", applyFilters);

filtersDiv.style.display = "none";

renderFavorites();

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeModal();
  }
});
