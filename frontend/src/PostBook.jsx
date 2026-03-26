
import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Button from './components/Button';
import './PostBook.css';


function PostBook() {
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [genre, setGenre] = useState('');
  const [condition, setCondition] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit book data to backend
    alert('Book posted!');
  };

  return (
    <>
      <Header />
      <div className="post-book-container">
        <form className="post-book-form" onSubmit={handleSubmit}>
          <div className="post-book-fields">
            <label htmlFor="book-title">Book Title</label>
            <input
              id="book-title"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />

            <label htmlFor="book-price">Price</label>
            <input
              id="book-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
            />

            <label htmlFor="book-genre">Genre</label>
            <select
              id="book-genre"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              required
            >
              <option value="">Select</option>
              <option value="fiction">Fiction</option>
              <option value="non-fiction">Non-Fiction</option>
              <option value="mystery">Mystery</option>
              <option value="romance">Romance</option>
              <option value="sci-fi">Science Fiction</option>
              <option value="fantasy">Fantasy</option>
              <option value="other">Other</option>
            </select>

            <label htmlFor="book-condition">Condition</label>
            <select
              id="book-condition"
              value={condition}
              onChange={e => setCondition(e.target.value)}
              required
            >
              <option value="">Select</option>
              <option value="new">New</option>
              <option value="lightly used">Lightly Used</option>
              <option value="worn">Worn</option>
            </select>
          </div>
          <div className="post-book-photo">
            <label htmlFor="book-photo" style={{marginBottom: '8px'}}>Book Photo</label>
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
              <div className="post-book-photo-preview">
                {photoPreview ? (
                  <img src={photoPreview} alt="Book preview" />
                ) : (
                  <span style={{color:'#bbb',fontSize:'0.9em', textAlign: 'center'}}>No photo selected</span>
                )}
              </div>
              <label htmlFor="book-photo" className="photo-upload-label" style={{background:'#b85c5a',color:'#fff',padding:'8px 16px',borderRadius:'4px',cursor:'pointer',fontWeight:500,marginTop:'8px'}}>Choose Photo
                <input
                  id="book-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{display:'none'}}
                />
              </label>
            </div>
          </div>
        </form>
        <div className="post-book-submit-button">
          <Button type="submit" title="Post Book" onClick={handleSubmit} />
        </div>
      </div>
      <Footer />
    </>
  );
}

export default PostBook;