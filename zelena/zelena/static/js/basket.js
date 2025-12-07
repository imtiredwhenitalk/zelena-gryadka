function getCookie(name){
  var v = document.cookie.match('(^|;)\s*' + name + '\s*=\s*([^;]+)');
  return v ? decodeURIComponent(v.pop()) : null;
}

function addToBasket(id, title, price, image, description) {
  let basket = JSON.parse(localStorage.getItem('basket') || '[]');
  let item = basket.find(x => x.id === id);
  if(item){
    item.count++;
  } else {
    basket.push({id, title, price, image, description, count: 1});
  }
  localStorage.setItem('basket', JSON.stringify(basket));
  loadBasket();
}


function removeFromBasket(id){
  let basket = JSON.parse(localStorage.getItem('basket') || '[]');
  basket = basket.filter(x => x.id !== id);
  localStorage.setItem('basket', JSON.stringify(basket));
  loadBasket();
}


function loadBasket(){
  const basketDiv = document.getElementById('basket-list');
  if(!basketDiv) return;
  let basket = JSON.parse(localStorage.getItem('basket') || '[]');
  if(basket.length === 0){
    basketDiv.innerHTML = '<p style="text-align:center;color:#228B22;font-size:1.2rem;">Корзина порожня.</p>';
    return;
  }
  basketDiv.innerHTML = '';
  let total = 0;
  basket.forEach(item => {
    total += (parseFloat(item.price) || 0) * item.count;
    const card = document.createElement('div');
    card.className = 'product-card basket-product';
    card.innerHTML = `
      <img src="${item.image || '../img/noimg.png'}" alt="${item.title}">
      <h3>${item.title}</h3>
      <p>${item.description || ''}</p>
      <div style="display:flex;justify-content:center;gap:12px;margin:10px 0 0 0;">
        <span style="background:#eafbe6;color:#228B22;padding:4px 14px;border-radius:8px;font-weight:600;">Кількість: ${item.count}</span>
        <span style="background:#eafbe6;color:#228B22;padding:4px 14px;border-radius:8px;font-weight:600;">${item.price} грн</span>
      </div>
      <div class="btn-row" style="display:flex;gap:12px;margin-top:16px;">
        <button class="buy-btn" style="flex:1;background:linear-gradient(90deg,#1ca02c 60%,#228B22 100%);color:#fff;border:none;border-radius:8px;padding:10px 0;font-size:1.08rem;font-weight:700;cursor:pointer;" onclick="alert('Покупка: ${item.title}')">Купити</button>
        <button class="remove-btn" style="flex:1;background:#e53935;color:#fff;border:none;border-radius:8px;padding:10px 0;font-size:1.08rem;font-weight:700;cursor:pointer;" onclick="removeFromBasket('${item.id}')">Видалити</button>
      </div>
    `;
    basketDiv.appendChild(card);
  });
  // Показати суму
  const totalDiv = document.createElement('div');
  totalDiv.style = 'text-align:right;font-size:1.2rem;font-weight:700;color:#228B22;margin:24px 0 0 0;';
  totalDiv.innerHTML = `Сума: ${total.toFixed(2)} грн`;
  basketDiv.appendChild(totalDiv);
}

document.addEventListener('DOMContentLoaded', function(){
  if(document.getElementById('basket-list')){
    loadBasket();
  }
});
