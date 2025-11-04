import React, { useEffect, useState } from "react";
import { MdRestaurantMenu } from "react-icons/md";
import { FaTrash, FaQrcode, FaWallet } from "react-icons/fa";
import { useSelector } from "react-redux";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import BottomNav from "../components/shared/BottomNav";
import BackButton from "../components/shared/BackButton";
import { addDoc, serverTimestamp } from "firebase/firestore";
import CheckoutModal from "../components/CheckoutModal";


const Menu = () => {
  const customerData = useSelector((state) => state.customer);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('gcash'); // 'gcash' or 'cash'
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  // ✅ Fetch menu items from Firestore
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "menuItems"));
        const items = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMenuItems(items);
      } catch (error) {
        console.error("Error fetching menu items:", error);
      }
    };
    fetchMenuItems();
  }, []);

  // ✅ Add item to cart
  const addToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find((i) => i.id === item.id);
      if (existing) {
        return prevCart.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      } else {
        return [...prevCart, { ...item, qty: 1 }];
      }
    });
  };

  // ✅ Remove item from cart
  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  // ✅ Calculate total
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleProceedToCheckout = () => {
    if (cart.length === 0) return;
    
    // Generate order number
    const newOrderNumber = `ORD-${Date.now()}`;
    setOrderNumber(newOrderNumber);
    setShowCheckoutModal(true);
  };

  const handlePaymentSuccess = async (amount) => {
    try {
      // Save order to Firebase
      await addDoc(collection(db, "orders"), {
        customerName: customerData?.customerName || "Unknown",
        customerId: customerData?.customerId || null,
        orderId: orderNumber,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
          subtotal: item.price * item.qty,
        })),
        totalAmount: total,
        paymentMethod: paymentMethod,
        createdAt: serverTimestamp(),
        status: "Completed"
      });

      // TODO: Update vendor points based on amount
      // This would typically update a vendor document in Firestore
      console.log(`Updating vendor points by ${amount} for payment method: ${paymentMethod}`);

      alert("Order successfully placed!");
      setCart([]); // ✅ Clear cart after placing order
      setShowCheckoutModal(false);
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order!");
    }
  };

  const getReceipt = () => {
    return cart.map(item => ({
      name: item.name,
      qty: item.qty,
      subtotal: item.price * item.qty,
    }));
  };
  
  return (
    <section className="bg-[#1f1f1f] h-[calc(100vh-4rem)] overflow-hidden flex gap-3 pb-20">
      {/* LEFT SIDE (Menu List) */}
      <div className="flex-[4] overflow-hidden flex flex-col h-full">
        <div className="flex items-center justify-between px-10 py-4 flex-shrink-0">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-[#f5f5f5] text-2xl font-bold tracking-wider">
              Menu
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <MdRestaurantMenu className="text-[#f5f5f5] text-3xl" />
            <div className="flex flex-col items-start">
              <h1 className="text-md text-[#f5f5f5] font-semibold">
                {customerData.customerName || "Customer Name"}
              </h1>
            </div>
          </div>
        </div>

        {/* ✅ MENU GRID */}
        <div className="grid grid-cols-3 gap-4 px-10 overflow-y-auto flex-1 pb-6 min-h-0">
          {menuItems.length > 0 ? (
            menuItems.map((item) => (
              <div
                key={item.id}
                className="bg-[#2a2a2a] rounded-lg p-4 flex flex-col justify-between shadow-md hover:scale-105 transition-transform"
              >
                <div>
                  <img
                    src={item.imageUrl || "/placeholder.png"}
                    alt={item.name}
                    className="h-32 w-full object-cover rounded-md mb-3"
                  />
                  <h2 className="text-[#f5f5f5] text-lg font-semibold">
                    {item.name}
                  </h2>
                  <p className="text-[#ababab] text-sm mb-2">
                    {item.description || "No description available."}
                  </p>
                  <p className="text-[#f5f5f5] font-bold">₱{item.price}</p>
                </div>
                <button
                  onClick={() => addToCart(item)}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  Add to Cart
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 col-span-3 text-center mt-20">
              Loading menu items...
            </p>
          )}
        </div>
      </div>

      {/* RIGHT SIDE (Cart) */}
      <div className="flex-[1] bg-[#1a1a1a] rounded-lg pt-4 px-4 flex flex-col h-full max-h-full">
        <h2 className="text-[#f5f5f5] text-xl font-semibold mb-4 text-center flex-shrink-0">
          Cart
        </h2>
        
        {/* Cart Items - Scrollable */}
        <div className="flex-1 overflow-y-auto mb-4 min-h-0">
          {cart.length > 0 ? (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center bg-[#2a2a2a] rounded-md px-3 py-2"
                >
                  <div>
                    <h3 className="text-[#f5f5f5] font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-400">
                      ₱{item.price} × {item.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCart((prev) =>
                          prev.map((i) =>
                            i.id === item.id && i.qty > 1
                              ? { ...i, qty: i.qty - 1 }
                              : i
                          )
                        )
                      }
                      className="bg-gray-600 px-2 rounded text-white"
                    >
                      -
                    </button>
                    <span className="text-white">{item.qty}</span>
                    <button
                      onClick={() =>
                        setCart((prev) =>
                          prev.map((i) =>
                            i.id === item.id ? { ...i, qty: i.qty + 1 } : i
                          )
                        )
                      }
                      className="bg-gray-600 px-2 rounded text-white"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center mt-10">Cart is empty</p>
          )}
        </div>

        {/* ✅ BILL SECTION - Fixed at bottom */}
        <div className="border-t border-gray-700 pt-4 pb-4 flex-shrink-0">
          <h3 className="text-[#f5f5f5] text-lg font-semibold mb-2">Total</h3>
          <p className="text-2xl font-bold text-yellow-400 mb-4">₱{total}</p>
          
          {/* Payment Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('gcash')}
                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === 'gcash'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-gray-600 bg-[#2a2a2a] hover:border-gray-500'
                }`}
              >
                <FaQrcode
                  className={`text-xl ${
                    paymentMethod === 'gcash' ? 'text-blue-400' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    paymentMethod === 'gcash' ? 'text-blue-400' : 'text-gray-400'
                  }`}
                >
                  GCash
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  paymentMethod === 'cash'
                    ? 'border-green-500 bg-green-500/20'
                    : 'border-gray-600 bg-[#2a2a2a] hover:border-gray-500'
                }`}
              >
                <FaWallet
                  className={`text-xl ${
                    paymentMethod === 'cash' ? 'text-green-400' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    paymentMethod === 'cash' ? 'text-green-400' : 'text-gray-400'
                  }`}
                >
                  Cash
                </span>
              </button>
            </div>
          </div>

          <button
            onClick={handleProceedToCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              cart.length === 0
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        orderNumber={orderNumber}
        receipt={getReceipt()}
        paymentMethod={paymentMethod}
        totalAmount={total}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <BottomNav />
    </section>
  );
};

export default Menu;
