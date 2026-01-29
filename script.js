const stockTable = document.querySelector("#stockTable tbody");
const marketplace = document.getElementById("marketplace");
const donations = document.getElementById("donations");

// Fetch from backend (DB)
fetch("http://localhost:5000/api/stock")
  .then(res => res.json())
  .then(stockItems => {
    stockItems.forEach(item => {
      let status = "Normal";

      if (item.expiryDays <= 3) {
        status = "Donate";
        addDonation(item);
      } 
      else if (item.expiryDays <= 7) {
        status = "Discounted";
        addToMarketplace(item);
      }

      addStockRow(item, status);
    });
  });

function addStockRow(item, status) {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.name}</td>
    <td>${item.quantity}</td>
    <td>${item.expiryDays} days</td>
    <td>₹${item.price}</td>
    <td>${status}</td>
  `;
  stockTable.appendChild(row);
}

function addToMarketplace(item) {
  const discountedPrice = Math.round(item.price * 0.7);

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <h3>${item.name}</h3>
    <p>Qty: ${item.quantity}</p>
    <p class="old-price">₹${item.price}</p>
    <p class="price">₹${discountedPrice}</p>
    <button>Buy Now</button>
  `;
  marketplace.appendChild(card);
}

function addDonation(item) {
  const li = document.createElement("li");
  li.textContent = `${item.name} → Routed to NGO`;
  donations.appendChild(li);
}
