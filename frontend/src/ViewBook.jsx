
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import "./ViewBook.css";


export default function ViewBook() {
	const { id } = useParams();
	const [message, setMessage] = useState("");
	const [sent, setSent] = useState(false);
	const [book, setBook] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchBook = async () => {
			setLoading(true);
			setError("");

			try {
				// Pull full book details based on the dynamic route param (/books/:id).
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

	const handleSend = () => {
		// Placeholder for sending message logic
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
					<h2>{book.title}</h2>
					<p><strong>Author:</strong> {book.author}</p>
					<p><strong>Description:</strong> {book.description}</p>
					<p><strong>Published Date:</strong> {publishedDate}</p>
					<p><strong>ISBN:</strong> {book.isbn || "N/A"}</p>
					<p><strong>Condition:</strong> {book.condition || "N/A"}</p>
					<p><strong>Price:</strong> ${book.price}</p>
					<p><strong>Owner:</strong> {ownerName}{ownerEmail ? ` (${ownerEmail})` : ""}</p>
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
				</>
			)}
		</div>
		<Footer />
		</>
	);
}
