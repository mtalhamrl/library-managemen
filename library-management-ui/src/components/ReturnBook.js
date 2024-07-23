import React, { useState } from "react";
import axios from "axios";

function ReturnBook() {
  const [title, setTitle] = useState("");
  const [borrowerName, setBorrowerName] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.delete(`http://localhost:3001/borrows`, {
        // BorrowManagement portunu kontrol edin
        data: {
          title,
          borrowerName,
        },
      });
      console.log(response.data); // API yanıtını konsola logla
      alert("Book returned successfully");
    } catch (error) {
      console.error("Error returning book:", error); // Hata durumunda logla
      alert("Error returning book");
    }
  };

  return (
    <div>
      <h2>Return Book</h2>
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
        <button type="submit">Return</button>
      </form>
    </div>
  );
}

export default ReturnBook;
