const stockTable = document.querySelector("#stockTable tbody");
const marketplace = document.getElementById("marketplace");
const donations = document.getElementById("donations");

fetch("http://localhost:5000/api/stock")
  .then(res => res.json())
  .then(items => {
    items.forEach(item => {
      addStockRow(item);

      if (item.route === "Marketplace") addToMarketplace(item);
      if (item.route === "NGO") addDonation(item);
    });
  })
  .catch(err => {
    console.error("Error fetching stock:", err);
  });

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB"); // DD/MM/YYYY
}

function addStockRow(item) {
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${item.name}</td>
    <td>${item.currentStock}/${item.totalStock}</td>
    <td>${formatDate(item.arrivalDate)}</td>
    <td>${formatDate(item.expiryDate)}</td>
    <td>${item.daysToExpiry}</td>
    <td>₹${item.marketValue}</td>
    <td>₹${item.finalPrice}</td>
    <td>${item.status}</td>
    <td>${item.route}</td>
  `;

  stockTable.appendChild(row);
}

function addToMarketplace(item) {
  const card = document.createElement("div");
  card.className = "card";

  card.innerHTML = `
    <h3>${item.name}</h3>
    <p>Stock: ${item.currentStock}</p>
    <p class="old-price">₹${item.price}</p>
    <p class="price">₹${item.finalPrice}</p>
    <p>${item.status}</p>
    <button>Buy Now</button>
  `;

  marketplace.appendChild(card);
}

function addDonation(item) {
  const li = document.createElement("li");
  li.textContent = `${item.name} → Routed to NGO`;
  donations.appendChild(li);
}
