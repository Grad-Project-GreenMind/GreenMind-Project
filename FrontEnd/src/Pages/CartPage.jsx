import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { BASE_URL } from "../api/endpoints";
//////////////////\\
function CartPage() {
  const navigate = useNavigate();
  const { cartItems, updateQuantity, removeItem, clearCart } = useCart();
  const API_BASE = BASE_URL;
  const token = localStorage.getItem("token");

  useEffect(() => {
    document.title = "Cart ";
    window.scrollTo(0, 0);
  }, []);

  const subTotal = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  const discount = 100;
  const shipping = 0;
  const taxes = 0;
  const total = Math.max(subTotal - discount + shipping + taxes, 0);
  const itemsCount = cartItems.length;

  // دالة تحديث الكمية في السيرفر
  const handleUpdateQty = async (id, delta) => {
    const item = cartItems.find((i) => i.id === id);
    const newQty = item.quantity + delta;
    if (newQty < 1) return;

    try {
      await fetch(`${API_BASE}/api/Cart/update-quantity`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ productId: id, quantity: newQty }),
      });
    } catch (err) {
      console.log("Sync failed");
    }
    updateQuantity(id, delta);
  };

  // دالة مسح السلة في السيرفر
  const handleClearCart = async () => {
    try {
      await fetch(`${API_BASE}/api/Cart/clear`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "ngrok-skip-browser-warning": "true",
        },
      });
    } catch (err) {
      console.log("Clear failed");
    }
    clearCart();
  };

  const handleCheckout = () => {
    navigate("/checkout", {
      state: {
        itemsCount,
        subTotal,
        discount,
        shipping,
        taxes,
        total,
        cartItems,
      },
    });
  };

  return (
    <>
      <style>{`
        .cart-main { background-color: #F7FEF4; padding: 60px 8% 60px 8%; min-height: 100vh; }
        .cart-title { color: #683A2F; font-size: 48px; font-weight: 800; text-align: center; margin-bottom: 60px; }
        .cart-container { display: flex; gap: 40px; align-items: flex-start; }
        .cart-table-section { flex: 2.5; display: flex; flex-direction: column; }
        .table-header { display: grid; grid-template-columns: 3fr 1fr 1.2fr 1fr; background-color: #E3D1C8; padding: 15px 25px; border-radius: 12px; color: #683A2F; font-weight: 700; font-size: 24px; }
        .text-center { text-align: center; }
        .items-list { min-height: 300px; display: flex; flex-direction: column; }
        .cart-item { display: grid; grid-template-columns: 0.3fr 2.7fr 1fr 1.2fr 1fr; align-items: center; padding: 20px 10px; border-bottom: 1px solid #E3D1C8; }
        .remove-btn { cursor: pointer; color: #000; font-weight: bold; }
        .product-info { display: flex; align-items: center; gap: 15px; }
        .product-img-file { width: 60px; height: 60px; object-fit: contain; background: white; border: 1px solid #D1D1D1; border-radius: 10px; }
        .product-name { color: #4B4B4B; font-weight: 600; font-size: 18px; text-align: left; }
        .item-price, .item-subtotal { color: #4B4B4B; font-weight: 600; }
        .quantity-wrapper { display: flex; justify-content: center; }
        .quantity-controls-split { display: flex; align-items: center; border: 1px solid #D1D1D1; border-radius: 20px; overflow: hidden; width: 110px; background: transparent; }
        .qty-btn { flex: 1; border: none; background: transparent; color: #8E8E8E; font-size: 20px; cursor: pointer; padding: 5px 0; }
        .qty-val-box { flex: 1; text-align: center; border-left: 1px solid #D1D1D1; border-right: 1px solid #D1D1D1; color: #683A2F; font-weight: 700; font-size: 18px; }
        .clear-cart-container { text-align: right; margin-top: auto; padding-top: 30px; }
        .clear-cart-link { text-decoration: underline; color: #683A2F; font-weight: 700; cursor: pointer; font-size: 16px; }
        .order-summary-card { flex: 1; background-color: transparent; border: 1px solid #E3D1C8; border-radius: 15px; padding: 20px; }
        .summary-title { color: #683A2F; font-size: 24px; font-weight: 700; margin-bottom: 10px; }
        .title-divider { border: 0; border-top: 1px solid #E3D1C8; margin-bottom: 20px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px; color: #4B4B4B; }
        .num-gray { color: #4B4B4B; font-weight: 600; }
        .summary-divider { border: 0; border-top: 1px solid #E3D1C8; margin: 15px 0; }
        .total-final { font-weight: 800; color: #683A2F; font-size: 20px; }
        .checkout-btn { width: 100%; background-color: #683A2F; color: white; border: none; padding: 12px; border-radius: 25px; font-weight: 800; font-size: 18px; cursor: pointer; margin-top: 15px; transition: background-color 0.2s; }
        .checkout-btn:active { background-color: #3e221b; }
      `}</style>

      <div className="page-wrapper">
        <main className="cart-main">
          <h1 className="cart-title">Shopping Cart</h1>
          {cartItems.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                marginTop: "50px",
                fontSize: "1.2rem",
                color: "#683A2F",
              }}
            >
              Your cart is empty!
            </p>
          ) : (
            <div className="cart-container">
              <div className="cart-table-section">
                <div className="table-header">
                  <span className="col-prod">Product</span>
                  <span className="text-center">Price</span>
                  <span className="text-center">Quantity</span>
                  <span className="text-center">SubTotal</span>
                </div>
                <div className="items-list">
                  {cartItems.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <span
                        className="remove-btn"
                        onClick={() => removeItem(item.id)}
                      >
                        x
                      </span>
                      <div className="product-info">
                        <img
                          src={
                            item.img.startsWith("http")
                              ? item.img
                              : `${API_BASE}${item.img.startsWith("/") ? item.img : "/" + item.img}`
                          }
                          alt={item.name}
                          className="product-img-file"
                        />
                        <span className="product-name">{item.name}</span>
                      </div>
                      <span className="item-price text-center">
                        EG{item.price}
                      </span>
                      <div className="quantity-wrapper">
                        <div className="quantity-controls-split">
                          <button
                            className="qty-btn"
                            onClick={() => handleUpdateQty(item.id, -1)}
                          >
                            −
                          </button>
                          <span className="qty-val-box">{item.quantity}</span>
                          <button
                            className="qty-btn"
                            onClick={() => handleUpdateQty(item.id, 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <span className="item-subtotal text-center">
                        EG{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="clear-cart-container">
                  <span className="clear-cart-link" onClick={handleClearCart}>
                    Clear Shopping Cart
                  </span>
                </div>
              </div>
              <aside className="order-summary-card">
                <h3 className="summary-title">Order Summary</h3>
                <hr className="title-divider" />
                <div className="summary-row">
                  <span>Items</span>
                  <span className="num-gray">{itemsCount}</span>
                </div>
                <div className="summary-row">
                  <span>Sub Total</span>
                  <span className="num-gray">EG{subTotal.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span className="num-gray">EG{shipping.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Taxes</span>
                  <span className="num-gray">EG{taxes.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Discount</span>
                  <span className="num-gray">-EG{discount.toFixed(2)}</span>
                </div>
                <hr className="summary-divider" />
                <div className="summary-row total-final">
                  <span>Total</span>
                  <span>EG{total.toFixed(2)}</span>
                </div>
                <button className="checkout-btn" onClick={handleCheckout}>
                  Proceed to payment
                </button>
              </aside>
            </div>
          )}
        </main>
      </div>
    </>
  );
}

export default CartPage;
