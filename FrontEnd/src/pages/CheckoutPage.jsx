import React, { useState, useEffect } from "react"; // ضفنا useEffect
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext"; // استوردنا الـ hook عشان نفضي الكارت
import { BASE_URL } from "../api/endpoints";
//////////////////\\
const rawStyles = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
.checkout-wrapper { background-color: #F7FEF4; min-height: 100vh; font-family: 'Inter', sans-serif; }
.checkout-container { max-width: 900px; margin: 0 auto; padding-top: 30px; padding-bottom: 60px; padding-left: 20px; padding-right: 20px; }
.checkout-title { font-size: 49px; font-weight: 800; color: #683A2f; margin-bottom: 40px; margin-top: 60px; }
.checkout-row { display: flex; align-items: center; margin-bottom: 35px; }
.checkout-label { width: 120px; font-size: 24px; font-weight: 600; color: #683A2F; flex-shrink: 0; }
.checkout-line-input { flex: 1; border: none; border-bottom: 1.5px solid #C9C9C9; background: transparent; height: 40px; font-size: 22px; color: #683A2F; outline: none; padding-left: 20px; }
.checkout-textarea { height: 80px; resize: none; }
.payment-option { display: flex; align-items: center; gap: 15px; font-size: 24px; font-weight: 600; color: #683A2F; margin-left: 20px; }
.payment-option input[type="checkbox"] { width: 22px; height: 22px; cursor: pointer; }
.confirm-btn-container { display: flex; justify-content: center; width: 100%; margin-top: 60px; }
.confirm-btn { width: 280px; height: 60px; border-radius: 15px; background-color: #683A2F; color: #FFF; font-size: 20px; font-weight: 600; border: none; cursor: pointer; }
.cart-details-container { width: 100%; max-width: 500px; padding-left: 20px; }
.cart-row { display: flex; justify-content: space-between; margin-bottom: 15px; }
.cart-text { font-size: 22px; color: #4B4B4B; }
`;

if (typeof document !== "undefined") {
  const styleId = "injected-checkout-styles";
  let styleTag = document.getElementById(styleId);
  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = styleId;
    document.head.appendChild(styleTag);
  }
  styleTag.innerHTML = rawStyles;
}

function CartRow({ label, value, isTotal }) {
  return (
    <div className="cart-row">
      <span className="cart-text" style={{ fontWeight: isTotal ? 700 : 500 }}>
        {label}
      </span>
      <span className="cart-text" style={{ fontWeight: isTotal ? 700 : 500 }}>
        {value}
      </span>
    </div>
  );
}

function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { clearCart } = useCart(); // عشان نفضي الكارت من الـ State

  const API_BASE = BASE_URL;

  // حل مشكلة الصفحة بتبدأ من تحت (بتجبر المتصفح يطلع فوق أول ما الصفحة تفتح)
  useEffect(() => {
    document.title = "Checkout ";
    window.scrollTo(0, 0);
  }, []);

  const state = location.state || {};
  const {
    itemsCount = 0,
    subTotal = 0,
    discount = 0,
    shipping = 0,
    taxes = 0,
    total = 0,
    cartItems = [],
  } = state;

  const [errors, setErrors] = useState({});
  const [paymentChecked, setPaymentChecked] = useState(false);

  const handleConfirm = async () => {
    const inputs = document.querySelectorAll(".checkout-line-input");
    const name = inputs[0].value;
    const email = inputs[1].value;
    const phone = inputs[2].value;
    const city = inputs[3].value;
    const address = inputs[4].value;
    const notes = document.querySelector("textarea").value;

    let newErrors = {};
    if (!name.trim()) newErrors.name = "Required";
    if (!email.trim()) newErrors.email = "Required";

    const phoneRegex = /^01[0-9]{9}$/;
    if (!phone.trim()) {
      newErrors.phone = "Required";
    } else if (!phoneRegex.test(phone)) {
      newErrors.phone = "Must start with 01 and be 11 digits";
    }

    if (!city.trim()) newErrors.city = "Required";
    if (!address.trim()) newErrors.address = "Required";
    if (!paymentChecked) newErrors.payment = "Required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const savedToken = localStorage.getItem("token");
    const token = savedToken && savedToken !== "null" ? savedToken : null;
    const storedUserId = localStorage.getItem("userId");

    const orderData = {
      customerDetails: {
        userId: storedUserId ? Number(storedUserId) : null,
        name: name,
        email: email,
        phone: phone,
        city: city,
        address: address,
        notes: notes || "",
      },
      cartDetails: {
        itemsCount: Number(itemsCount),
        subTotal: Number(subTotal),
        shipping: Number(shipping),
        taxes: Number(taxes),
        discount: Number(discount),
        total: Number(total),
        items: cartItems.map((item) => ({
          productId: item.id,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      },
      paymentMethod: "Cash on delivery",
    };

    try {
      const response = await fetch(`${BASE_URL}/api/Order/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "*/*",
          "ngrok-skip-browser-warning": "true",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        alert("Done! Your order has been confirmed successfully ✅");

        // --- التعديلات المطلوبة ---
        clearCart(); // 1. بيفضي الكارت من الـ UI (context)
        localStorage.removeItem("cartItems"); // 2. بيفضي الكارت من الـ Storage عشان ميرجعش يلاقيها

        navigate("/"); // 3. بيرجع للهوم وهي بدروها هتفتح من فوق
      } else {
        const errorRes = await response.json().catch(() => ({}));
        console.log("Full Error Response:", errorRes);
        alert(
          `Order failed: ${errorRes.title || "Please check validation in console"}`,
        );
      }
    } catch (err) {
      alert("Network Error: Could not connect to the server.");
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        <h1 className="checkout-title">Checkout</h1>
        <div className="checkout-row">
          <label className="checkout-label">User</label>
          <input className="checkout-line-input" type="text" />
        </div>
        {errors.name && (
          <p style={{ color: "red", marginLeft: "120px", marginTop: "-25px" }}>
            {errors.name}
          </p>
        )}
        <div className="checkout-row">
          <label className="checkout-label">Email</label>
          <input className="checkout-line-input" type="email" />
        </div>
        {errors.email && (
          <p style={{ color: "red", marginLeft: "120px", marginTop: "-25px" }}>
            {errors.email}
          </p>
        )}
        <div className="checkout-row">
          <label className="checkout-label">Phone</label>
          <input className="checkout-line-input" type="text" />
        </div>
        {errors.phone && (
          <p style={{ color: "red", marginLeft: "120px", marginTop: "-25px" }}>
            {errors.phone}
          </p>
        )}
        <div className="checkout-row">
          <label className="checkout-label">City</label>
          <input className="checkout-line-input" type="text" />
        </div>
        {errors.city && (
          <p style={{ color: "red", marginLeft: "120px", marginTop: "-25px" }}>
            {errors.city}
          </p>
        )}
        <div className="checkout-row">
          <label className="checkout-label">Address</label>
          <input className="checkout-line-input" type="text" />
        </div>
        {errors.address && (
          <p style={{ color: "red", marginLeft: "120px", marginTop: "-25px" }}>
            {errors.address}
          </p>
        )}
        <div className="checkout-row" style={{ alignItems: "flex-start" }}>
          <label className="checkout-label">Notes</label>
          <textarea className="checkout-line-input checkout-textarea" />
        </div>
        <div className="checkout-row" style={{ marginTop: "40px" }}>
          <label className="checkout-label">Payment</label>
          <div className="payment-option">
            <input
              type="checkbox"
              id="cod"
              checked={paymentChecked}
              onChange={(e) => setPaymentChecked(e.target.checked)}
            />
            <label htmlFor="cod" style={{ cursor: "pointer" }}>
              Cash on delivery
            </label>
          </div>
        </div>
        {errors.payment && (
          <p style={{ color: "red", marginLeft: "120px" }}>{errors.payment}</p>
        )}
        <div
          className="checkout-row"
          style={{ marginTop: "40px", alignItems: "flex-start" }}
        >
          <label className="checkout-label">Cart</label>
          <div className="cart-details-container">
            <CartRow label="Items" value={itemsCount} />
            <CartRow
              label="Sub Total"
              value={`EG${Number(subTotal).toFixed(2)}`}
            />
            <CartRow
              label="Shipping"
              value={`EG${Number(shipping).toFixed(2)}`}
            />
            <CartRow label="Taxes" value={`EG${Number(taxes).toFixed(2)}`} />
            <CartRow
              label="Discount"
              value={`-EG${Number(discount).toFixed(2)}`}
            />
            <hr style={{ borderColor: "#E0E0E0", margin: "14px 0" }} />
            <CartRow
              label="Total"
              value={`EG${Number(total).toFixed(2)}`}
              isTotal
            />
          </div>
        </div>
        <div className="confirm-btn-container">
          <button className="confirm-btn" onClick={handleConfirm}>
            Confirm Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
