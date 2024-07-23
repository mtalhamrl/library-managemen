import React from "react";
import { Route, Routes } from "react-router-dom";
import BookList from "./components/BookList";
import BorrowBook from "./components/BorrowBook";
import ReturnBook from "./components/ReturnBook";
import Logs from "./components/Logs";

function App() {
  return (
    <div className="App">
      <h1>Library Management System</h1>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/books" element={<BookList />} />
        <Route path="/borrow" element={<BorrowBook />} />
        <Route path="/return" element={<ReturnBook />} />
        <Route path="/logs" element={<Logs />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h2>Welcome to the Library Management System</h2>
    </div>
  );
}

export default App;
