import React, { Fragment, useState, useEffect } from "react";
import "./pointofSale.css";
import cart_logo from "../icon/cart_logo.png";
import delete_logo from "../icon/delete_logo.png";
import jsPDF from "jspdf";

const PointofSale = () => {

  const [cartItems, setCartItems] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [specialDiscount, setSpecialDiscount] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedProductPrice, setSelectedProductPrice] = useState(0);

  function generateBillId() {
    const timestamp = Date.now().toString(36);
    const randomNum = Math.random().toString(36).substr(2, 5);
    return `${timestamp}-${randomNum}`;
  }

  function getCurrentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  function getCurrentTime() {
    const currentTime = new Date();
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const seconds = String(currentTime.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  
  
  
  const handlePrintBill = async () => {
    const pdf = new jsPDF();

    const customerDetails = `Customer Name: ${customerName}\nCustomer Number: ${customerNumber}`;
    pdf.text(customerDetails, 20, 10);
    pdf.text("-------------------------------", 20, 30);
  
    // Add cart items to the PDF
    cartItems.forEach((item, index) => {
      const yPos = 40 + index * 10;
      pdf.text(
        `${item.name} - ${item.qty} x ${item.price} = Rs. ${item.amount}`,
        20,
        yPos
      );
    });
  
    // Add subtotal, special discount, grand total, etc. to the PDF
    const yPosTotal = 40 + cartItems.length * 10;
    pdf.text("-------------------------------", 20, yPosTotal);
    pdf.text(`Sub Total: Rs. ${calculateSubTotal()}`, 20, yPosTotal + 10);
    pdf.text(`Special Discount: ${specialDiscount} %`, 20, yPosTotal + 20);
    pdf.text(`Grand Total: Rs. ${calculateGrandTotal().toFixed(2)}`, 20, yPosTotal + 30);
    pdf.text(`Total Payable: Rs. ${Math.round(calculateGrandTotal())}`, 20, yPosTotal + 40);
  
    // Save the PDF and open print dialog
    // pdf.save("bill_summary.pdf");
    pdf.output("dataurlnewwindow");
  
    // Update MongoDB data in 'Product Inventory' collection
    try {
      const updateResponse = await fetch('https://point-of-sale-r286.onrender.com/api/update-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cartItems,
        }),
      });
  
      if (!updateResponse.ok) {
        console.error('Failed to update MongoDB data in Product Inventory');
      }
    } catch (error) {
      console.error('Error updating MongoDB data in Product Inventory:', error);
    }
  
    // Save details in 'Sales' collection
    if (customerName && customerNumber && calculateSubTotal() && calculateGrandTotal()) {
      try {
        const salesData = {
          customerName,
          customerNumber,
          billId: generateBillId(), // Use the generateBillId function
          date: getCurrentDate(),
          time: getCurrentTime(),
          products: cartItems.map(item => ({
            name: item.name,
            quantity: item.qty,
            price: item.price,
          })),
          subtotal: calculateSubTotal(),
          discount: specialDiscount,
          grandTotal: calculateGrandTotal(),
          Total: Math.round(calculateGrandTotal()),
        };
  
        const salesResponse = await fetch('https://point-of-sale-r286.onrender.com/api/save-sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(salesData),
        });
  
        if (!salesResponse.ok) {
          console.error('Failed to save data in Sales collection');
        }
      } catch (error) {
        console.error('Error saving data in Sales collection:', error);
      }
    }
  
    // Clear the cart and billing information after successful update
    clearCartAndBilling();
  };

  
  const clearCartAndBilling = () => {
    // Clear cart summary
    setCartItems([]);
    setQuantity(1);
  
    // Clear billing cart
    setCustomerName("");
    setCustomerNumber("");
    setSpecialDiscount(0);
    setSearchValue("");
    setSuggestions([]);
    setIsFocused(false);
    setSelectedProductPrice(0);
  };
  

  useEffect(() => {
    const subTotal = calculateSubTotal();
  }, [cartItems]);

  const calculateSubTotal = () => {
    return cartItems.reduce((total, item) => total + item.amount, 0);
  };
  const calculateGrandTotal = () => {
    const subTotal = calculateSubTotal();
    const grandTotal = subTotal - (subTotal * specialDiscount) / 100;
    return grandTotal;
  };

  const handleDeleteCartItem = (index) => {
    const updatedCartItems = [...cartItems];
    updatedCartItems.splice(index, 1);
    setCartItems(updatedCartItems);
  };

  const handleAddToCart = () => {
    if (!searchValue.trim() || quantity <= 0) {
      alert("Please enter a valid item name and quantity.");
      return;
    }
  
    const newItem = {
      name: searchValue,
      qty: quantity,  // Set qty based on user input
      price: selectedProductPrice,  // Set price based on the selected item
      amount: quantity * selectedProductPrice,  // Automatically calculate amount
    };
  
    setCartItems([...cartItems, newItem]);
    setSearchValue("");
    setQuantity(1);
  };

//#############################################################################
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const response = await fetch('https://point-of-sale-r286.onrender.com/api/products');
        const data = await response.json();
  
        // Filter suggestions based on user input
        const filteredSuggestions = data.filter((item) =>
          item.name.toLowerCase().includes(searchValue.toLowerCase())
        );
  
        setSuggestions(filteredSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };
  
    if (searchValue.trim() !== '') {
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  
  }, [searchValue]);

  const handleInputChange = (event) => {
    setSearchValue(event.target.value);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchValue(suggestion.name);
    setSelectedProductPrice(suggestion.price); // Assuming the price is available in the suggestion object
    setSuggestions([]);
  };
  

  // #############################################################

  return (
    <div className="pos_Dashboard">
      <div className="pos_DashboardItem1">
        <lable className="customerDetailsItems sales">
          <p1>Sale - Booking-Order</p1>
        </lable>
        <lable className="customerDetailsItems cashTick">
          <input type="checkbox"></input>
          Cash
        </lable>
        <lable className="customerDetailsItems cusNum">
          <input
            type="text"
            placeholder="CUSTOMER NUMBER"
            value={customerNumber}
            onChange={(e) => setCustomerNumber(e.target.value)}
          ></input>
        </lable>
        <lable className="customerDetailsItems cusName">
          <input
            type="text"
            placeholder="CUSTOMER NAME"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          ></input>
        </lable>
      </div>

      <div className="pos_DashboardItem2">
      <lable className='customerDetailsItems search'>
      <div className='search-wrapper'>
        <input
          type='text'
          className='search-input'
          placeholder='Type to search...'
          value={searchValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
        />
      </div>
      {isFocused && suggestions.length > 0 && (
        <ul className='suggestion-list'>
          {suggestions.map((suggestion, index) => (
            <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
              {suggestion.name}
            </li>
          ))}
        </ul>
      )}
    </lable>
        <label className="customerDetailsItems quantity">
          <input
            type="number"
            min= '0'
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </label>
        <label className="customerDetailsItems total">
          <span className="totalPrice">
          <span className="totalPrice">{searchValue.trim() ? (quantity * selectedProductPrice).toFixed(2) : "Total"}</span>

          </span>
        </label>
        <label className="customerDetailsItems cusName">
          <button className="cartBtn" onClick={handleAddToCart}>
            Add
          </button>
        </label>
      </div>

      <div className="pos_DashboardItem3">
        <div className="pos_Cart heading">
        <div className="cartTitleContainer">
    <p1 className="cartTitle">Cart Summary</p1>
  </div>
  {/* <div className="cartLogoContainer">
    <img className='cart_logo' src={cart_logo} alt="C" />
    <p1 className='cart_item_count'>1</p1>
  </div> */}
        </div>
        <div className="pos_Cart body">
          <div className="pos_CartCol">NAME</div>
          <div className="pos_CartCol">QNTY</div>
          <div className="pos_CartCol">PRICE</div>
          <div className="pos_CartCol">AMOUNT</div>
          <div className="pos_CartCol">ACTION</div>

          {cartItems.map((item, index) => (
            <Fragment key={index}>
              <div className="pos_CartCell">{item.name}</div>
              <div className="pos_CartCell">{item.qty}</div>
              <div className="pos_CartCell">{item.price}</div>
              <div className="pos_CartCell">{(item.amount).toFixed(2)}</div>
              <div className="pos_CartCell">
                <img
                  className="delete_logo"
                  src={delete_logo}
                  alt="D"
                  onClick={() => handleDeleteCartItem(index)}
                ></img>
              </div>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="pos_DashboardItem4">
        <div className="billing_cart heading">
          <p1 className="cartTitle">Billing Summary</p1>
        </div>

        <div className="billing_Cart body">
          <div className="billing_CartItems">
            <span className="sub_total"> Sub Total </span>
            <span className="billingCartbox">{calculateSubTotal().toFixed(2)}</span>
          </div>

          <div
            className="billing_CartItems"
            style={{ display: "flex", alignItems: "center" }}>
            <span className="spl_dcnt"> Special Discount </span>
            <span className="billingCartbox">
              <input
                type="number"
                min='0'
                max={100}
                className="splDis"
                onChange={(e) => setSpecialDiscount(e.target.value)}
              />
            </span>
          </div>

          <div className="billing_CartItems">
            <span className="grd_ttl"> Grand Total </span>
            <span className="billingCartbox" style={{ textAlign: "center" }}>
              {calculateGrandTotal().toFixed(2)}
            </span>
          </div>

          <div className="billing_CartItems">
            <span className="pmnt_mod"> Payment Mode </span>
            <select className="billingCartbox">
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div className="billing_CartItems">
            <span className="ttl_rcvd"> Total Received </span>
            <span className="billingCartbox">{Math.round(calculateGrandTotal())}</span>
          </div>
        </div>

        <div className="billingCartBtns">
          <button className="billingCartBtn cancel" onClick={clearCartAndBilling}>Cancel</button>
          <button className="billingCartBtn confirm" onClick={handlePrintBill}>Confirm</button>
        </div>


      </div>
    </div>
  );
};

export default PointofSale;
