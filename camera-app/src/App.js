import React, { useState } from 'react';
import Popup from 'reactjs-popup'
import axios from 'axios';
import './App.css';

function App() {
  const [items, setItems] = useState([]);
  const [SKUText, setSKUNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [formIsOpen, formSetIsOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState(''); //Alert popup message template
  const [selectedID, setSelectedID] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [nameText, setNameText] = useState('');
  const serverIP = '100.64.193.32';

  //inputted SKU number field event change
  const handleSKUInputChange = (event1) => {
    setSKUNumber(event1.target.value);
  };

  const toggleAlertPopup = (state, message = '') => {  // Added message parameter
    setIsOpen(state);
    setPopupMessage(message);  // Set the popup message
  };

  const toggleItemFormPopup = (state) => {
    formSetIsOpen(state);
  };

  //Non SKU number item name field event change
  const handleItemNameInputChange = (event4) => {
    setNameText(event4.target.value);
  };

  //Item type identifier field event change
  const handleIDChange = (event2) => {
    setSelectedID(event2.target.value);
    console.log(selectedID);
  };

  //Item location field event change
  const handleLocationChange = (event3) => {
    setSelectedLocation(event3.target.value);
    console.log(selectedLocation);
  };

  //fetches items from database through /api/pantry/debug endpoint
  const fetchItems = async () => {
    try {
      const response = await axios.get(`http://${serverIP}:5001/api/pantry/contents`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    }
  };



  //rename function, general add item. If sku field populated and response is 404: error popup. If name field populated instead: add item popup
  const addItem = async () => {
    try {
      if (nameText && SKUText) {
        toggleAlertPopup(true, 'Enter either the SKU number or the item name');
        setSKUNumber('');
        setNameText('');
      } else if (SKUText) {
        const response = await axios.get(`http://${serverIP}:5001/api/food-items/sku/${SKUText}`, {
          validateStatus: function (status) {
            return status === 404 || (status >= 200 && status < 300);
          }
        })
        if (response.status === 404){
          toggleAlertPopup(true, 'Item not found, please enter manually.');
        }
        else if (response.status === 200) {
          setNameText(response.data.item_name);
          toggleItemFormPopup(true);
        }
        setSKUNumber('');
      } else if (nameText){
        toggleItemFormPopup(true);
      } 
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const removeItem = async (uuid) => {
    try {
      const response = await axios.delete(`http://${serverIP}:5001/api/food-items/${uuid}`);
      fetchItems();
    } catch (error) {
      console.error('Error: ', error);
    }
  }

  const submitItem = async () => {
    try {
      const response = await axios.post(`http://${serverIP}:5001/api/food-items`, {
        food_name: nameText,
        location: selectedLocation,
        identifier: selectedID
      });
      
      setSKUNumber('');
      setNameText('');
      setSelectedID('');
      setSelectedLocation('');

      fetchItems();

    } catch (error) {
      console.error('Error: ', error);
    }
  }

  return (
    <div className="App">
  
      <main className={`main-content ${isOpen || formIsOpen ? 'blurred-background' : ''}`}>
      <header className="header">
        <h1>PantryAI Virtual Pantry</h1>
      </header>
      <button onClick={fetchItems} className="standard-button">Fetch Items</button>
    
      <div className="add-item-form">
        <label htmlFor="skuInput" className="form-label">
          Add new item:
          <input className='input-field' type="text" value={SKUText} onChange={handleSKUInputChange} placeholder='Barcode #'/>
          <label className='form-label'>or</label>
          <input name="itemName" placeholder='Item Name' className="input-field" value={nameText} onChange={handleItemNameInputChange} />
          <button onClick={addItem} className="standard-button">Add Item</button>
        </label>
      </div>


      <Popup
          open={isOpen}
          modal
          nested
          onClose={() => toggleAlertPopup(false)}>
          <div className="modal-overlay">
            <div className='modal'>
              <div className='content'>
                {popupMessage}
              </div>
              <div>
                <button className="standard-button" onClick={() => toggleAlertPopup(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </Popup>

      <Popup
        open={formIsOpen}
        modal
        nested
        onClose={() => toggleItemFormPopup(false)}>
        <div className='modal-overlay'>
          <div className='modal'>
            <div className='content'>
              <form>
                <input className='input-field' type='text' value={nameText} readOnly />
                <select id="identifier" name="identifier" value={selectedID} onChange={handleIDChange} required>
                  <option value="" disabled>Select identifier</option>
                  <option value="dairy">Dairy</option>
                  <option value="meat-seafood">Meat and Seafood</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="grains-carbs">Grains and Carbs</option>
                  <option value="fruits">Fruits</option>
                  <option value="legumes">Legumes</option>
                  <option value="nuts-seeds">Nuts and Seeds</option>
                  <option value="oil-fat">Oil and Fat</option>
                  <option value="condiments">Condiments and Sauces</option>
                  <option value="beverages">Beverages</option>
                </select>
                <select id="location" name="location" value={selectedLocation} onChange={handleLocationChange} required>
                  <option value="" disabled>Select location</option>
                  <option value="pantry">Pantry</option>
                  <option value="fridge">Fridge</option>
                  <option value="freezer">Freezer</option>
                </select>
              </form>
              </div>
              <div>
                <button className="standard-button" onClick={()=> {
                  submitItem();
                  toggleItemFormPopup(false);
                }}>
                  Submit
                </button>
              </div>
          </div>
        </div>
      </Popup>

      {/* Container for all items */}
      <div className="item-container">

        {/* Pantry Section */}
        <div className="section">
          <h2 className="section-title">Pantry Items</h2>
          <div className="items-row">
            {items.filter(item => item.location === 'pantry').map((item) => (
              <div key={item._id} className="item-box">
                <h3 className="item-name">{item.itemName}</h3>
                <p className="item-detail">Located in <b>{item.location}</b></p>
                <p className="item-detail">Item type: <b>{item.identifier}</b></p>
                
                {/* UUID Display */}
                <span className="item-uuid">{item.UUID}</span>

                <button className='remove-button' onClick={()=> removeItem(item.UUID)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Fridge Section */}
        <div className="section">
          <h2 className="section-title">Fridge Items</h2>
          <div className="items-row">
            {items.filter(item => item.location === 'fridge').map((item) => (
              <div key={item._id} className="item-box">
                <h3 className="item-name">{item.itemName}</h3>
                <p className="item-detail">Located in <b>{item.location}</b></p>
                <p className="item-detail">Item type: <b>{item.identifier}</b></p>
                
                {/* UUID Display */}
                <span className="item-uuid">{item.UUID}</span>

                <button className='remove-button' onClick={()=> removeItem(item.UUID)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Freezer Section */}
        <div className="section">
          <h2 className="section-title">Freezer Items</h2>
          <div className="items-row">
            {items.filter(item => item.location === 'freezer').map((item) => (
              <div key={item._id} className="item-box">
                <h3 className="item-name">{item.itemName}</h3>
                <p className="item-detail">Located in <b>{item.location}</b></p>
                <p className="item-detail">Item type: <b>{item.identifier}</b></p>

                {/* UUID Display */}
                <span className="item-uuid">{item.UUID}</span>

                <button className='remove-button' onClick={()=> removeItem(item.UUID)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </main>
  </div>
  );
}

export default App;