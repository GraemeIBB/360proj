
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import "./ViewBook.css";

function ViewBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editField, setEditField] = useState("");
  const [editValue, setEditValue] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`http://localhost:8800/books/${id}`);
        const data = await response.json();
        if (!response.ok) {
          setBook(null);
          setError(data?.error || "Unable to load this book.");
          return;
        }
        setBook(data);
      } catch (fetchError) {
        setBook(null);
        setError("Unable to load this book.");
      } finally {
        setLoading(false);
      }
    };
    if (!id) {
      setLoading(false);
      setError("Missing book id in URL.");
      return;
    }
    fetchBook();
  }, [id]);

  // Determine if viewer is owner
  const userId = localStorage.getItem('userId');
  const isOwner = book && book.owner && ((typeof book.owner === 'string' && book.owner === userId) || (typeof book.owner === 'object' && book.owner._id === userId));

  // Helper to update a book field
  const handleFieldEdit = (field, value) => {
    setEditField(field);
    setEditValue(value);
    setStatusMsg("");
  };

  const handleFieldSave = async () => {
    if (!editField) return;
    setStatusMsg("");
    try {
      const res = await fetch(`http://localhost:8800/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editField]: editValue })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Update failed');
      }
      setBook({ ...book, [editField]: editValue });
      setStatusMsg('Field updated!');
      setEditField("");
    } catch (err) {
      setStatusMsg(err.message || 'Update failed');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this book posting?')) return;
    setDeleting(true);
    setStatusMsg("");
    try {
      const res = await fetch(`http://localhost:8800/books/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Delete failed');
      }
      setStatusMsg('Book deleted.');
      setTimeout(() => navigate('/profile'), 1200);
    } catch (err) {
      setStatusMsg(err.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handleSend = () => {
    setSent(true);
    setTimeout(() => setSent(false), 2000);
    setMessage("");
  };

  // Accept either populated owner object or fallback shapes while backend evolves.
  const ownerName = book?.owner?.username || book?.User?.name || "Unknown owner";
  const ownerEmail = book?.owner?.email || book?.User?.email || "";
  const publishedDate = book?.publishedDate
    ? new Date(book.publishedDate).toLocaleDateString()
    : "N/A";
  const coverImage = book?.coverImage || "https://via.placeholder.com/200x300?text=No+Cover";

  return (
    <>
      <Header />
      <div className="view-book-container">
        {loading && <p>Loading book details...</p>}
        {error && <p>{error}</p>}

        {!loading && !error && book && (
          <>
            <div className="book-details">
              <img
                src={coverImage}
                alt={book.title}
                className="book-cover"
              />
              <div className="book-info">
                {/* Title */}
                <h2>
                  {editField === 'title' ? (
                    <>
                      <input
                        className="edit-input title-input"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                      />
                      <button className="edit-btn" onClick={handleFieldSave}>Save</button>
                      <button className="edit-btn" onClick={() => setEditField("")}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {book.title}
                      {isOwner && (
                        <button className="edit-btn" onClick={() => handleFieldEdit('title', book.title)}>Edit</button>
                      )}
                    </>
                  )}
                </h2>
                {/* Author */}
                <p>
                  <strong>Author:</strong> {editField === 'author' ? (
                    <>
                      <input className="edit-input" value={editValue} onChange={e => setEditValue(e.target.value)} />
                      <button className="edit-btn" onClick={handleFieldSave}>Save</button>
                      <button className="edit-btn" onClick={() => setEditField("")}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {book.author}
                      {isOwner && (
                        <button className="edit-btn" onClick={() => handleFieldEdit('author', book.author)}>Edit</button>
                      )}
                    </>
                  )}
                </p>
                {/* Description */}
                <p>
                  <strong>Description:</strong> {editField === 'description' ? (
                    <>
                      <textarea className="edit-input desc-input" value={editValue} onChange={e => setEditValue(e.target.value)} rows={2} />
                      <button className="edit-btn" onClick={handleFieldSave}>Save</button>
                      <button className="edit-btn" onClick={() => setEditField("")}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {book.description}
                      {isOwner && (
                        <button className="edit-btn" onClick={() => handleFieldEdit('description', book.description)}>Edit</button>
                      )}
                    </>
                  )}
                </p>
                {/* Published Date */}
                <p>
                  <strong>Published Date:</strong> {editField === 'publishedDate' ? (
                    <>
                      <input className="edit-input" type="date" value={editValue} onChange={e => setEditValue(e.target.value)} />
                      <button className="edit-btn" onClick={handleFieldSave}>Save</button>
                      <button className="edit-btn" onClick={() => setEditField("")}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {publishedDate}
                      {isOwner && (
                        <button className="edit-btn" onClick={() => handleFieldEdit('publishedDate', book.publishedDate ? book.publishedDate.substring(0, 10) : '')}>Edit</button>
                      )}
                    </>
                  )}
                </p>
                {/* ISBN */}
                <p>
                  <strong>ISBN:</strong> {editField === 'isbn' ? (
                    <>
                      <input className="edit-input" value={editValue} onChange={e => setEditValue(e.target.value)} />
                      <button className="edit-btn" onClick={handleFieldSave}>Save</button>
                      <button className="edit-btn" onClick={() => setEditField("")}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {book.isbn || "N/A"}
                      {isOwner && (
                        <button className="edit-btn" onClick={() => handleFieldEdit('isbn', book.isbn || '')}>Edit</button>
                      )}
                    </>
                  )}
                </p>
                {/* Condition */}
                <p>
                  <strong>Condition:</strong> {editField === 'condition' ? (
                    <>
                      <input className="edit-input" value={editValue} onChange={e => setEditValue(e.target.value)} />
                      <button className="edit-btn" onClick={handleFieldSave}>Save</button>
                      <button className="edit-btn" onClick={() => setEditField("")}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {book.condition || "N/A"}
                      {isOwner && (
                        <button className="edit-btn" onClick={() => handleFieldEdit('condition', book.condition || '')}>Edit</button>
                      )}
                    </>
                  )}
                </p>
                {/* Price */}
                <p>
                  <strong>Price:</strong> {editField === 'price' ? (
                    <>
                      <input className="edit-input" type="number" value={editValue} onChange={e => setEditValue(e.target.value)} />
                      <button className="edit-btn" onClick={handleFieldSave}>Save</button>
                      <button className="edit-btn" onClick={() => setEditField("")}>Cancel</button>
                    </>
                  ) : (
                    <>
                      ${book.price}
                      {isOwner && (
                        <button className="edit-btn" onClick={() => handleFieldEdit('price', book.price)}>Edit</button>
                      )}
                    </>
                  )}
                </p>
                {/* Owner */}
                <p>
                  <strong>Owner:</strong> {ownerName}{ownerEmail ? ` (${ownerEmail})` : ""}
                </p>
                {statusMsg && <div style={{ color: statusMsg.includes('fail') ? 'red' : 'green', margin: '10px 0' }}>{statusMsg}</div>}
                {isOwner && (
                  <button className="delete-btn" onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete Post'}
                  </button>
                )}
              </div>
            </div>
            {/* Message section only if not owner */}
            {!isOwner && (
              <div className="message-section">
                <h3>Contact Owner</h3>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your message here..."
                  rows={3}
                />
                <button onClick={handleSend} disabled={!message.trim()}>
                  Send Message
                </button>
                {sent && <span className="sent-confirmation" style={{ marginLeft: "10px" }}>Message sent!</span>}
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}

export default ViewBook;
