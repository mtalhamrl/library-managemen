import React, { useEffect, useState } from "react";
import axios from "axios";

function BookList() {
  const [books, setBooks] = useState([]);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/books`) // Management portunu kontrol edin
      .then((response) => {
        console.log(response.data); // API yanıtını konsola logla
        setBooks(response.data);
      })
      .catch((error) =>
        console.error("There was an error fetching the books!", error)
      ); // Hata durumunda logla
  }, []);

  return (
    <div>
      <h2>Books</h2>
      <ul>
        {books.map((book) => (
          <li key={book.title}>
            {book.title} - {book.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BookList;
