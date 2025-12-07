function addToCart(productId) {
  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  if (!cart.includes(productId)) cart.push(productId);
  localStorage.setItem('cart', JSON.stringify(cart));
  alert('Товар додано у корзину!');
}

document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const productId = this.dataset.productId;
      addToCart(productId);
    });
  });
});