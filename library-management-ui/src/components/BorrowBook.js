import React, { useState } from "react";
import axios from "axios";

function BorrowBook() {
  const [title, setTitle] = useState("");
  const [borrowerName, setBorrowerName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`http://localhost:3001/borrows`, {
        // BorrowManagement portunu kontrol edin
        title,
        borrowerName,
        borrowDate: new Date().toISOString(),
        returnDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 gün sonrası
      });
      console.log(response.data); // API yanıtını konsola logla
      alert("Book borrowed successfully");
    } catch (error) {
      console.error("Error borrowing book:", error); // Hata durumunda logla
      alert("Error borrowing book");
    }
  };

  return (
    <div>
      <h2>Borrow Book</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label>Borrower Name</label>
          <input
            type="text"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
          />
        </div>
        <button type="submit">Borrow</button>
      </form>
    </div>
  );
}

export default BorrowBook;
