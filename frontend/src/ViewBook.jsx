
import React, { useState } from "react";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import "./ViewBook.css";

//TODO: get book details from backend instead of hardcoding
const sampleBook = {
	title: "The Great Gatsby",
	author: "F. Scott Fitzgerald",
	description: "A novel set in the Roaring Twenties, exploring themes of wealth, love, and the American Dream.",
	publishedDate: "1925-04-10",
	isbn: "9780743273565",
	condition: "like new",
	price: 15.99,
	coverImage: "https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg",
	User: {
		name: "Jane Doe",
		email: "jane@example.com"
	}
};

export default function ViewBook() {
	const [message, setMessage] = useState("");
	const [sent, setSent] = useState(false);

	const handleSend = () => {
		// Placeholder for sending message logic
		setSent(true);
		setTimeout(() => setSent(false), 2000);
		setMessage("");
	};

	return (
		<>
		<Header />
		<div className="view-book-container">
			<div className="book-details">
				<img
					src={sampleBook.coverImage}
					alt={sampleBook.title}
					className="book-cover"
				/>
				<div className="book-info">
					<h2>{sampleBook.title}</h2>
					<p><strong>Author:</strong> {sampleBook.author}</p>
					<p><strong>Description:</strong> {sampleBook.description}</p>
					<p><strong>Published Date:</strong> {sampleBook.publishedDate}</p>
					<p><strong>ISBN:</strong> {sampleBook.isbn}</p>
					<p><strong>Condition:</strong> {sampleBook.condition}</p>
					<p><strong>Price:</strong> ${sampleBook.price}</p>
					<p><strong>Owner:</strong> {sampleBook.User.name} ({sampleBook.User.email})</p>
				</div>
			</div>
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
		</div>
		<Footer />
		</>
	);
}
