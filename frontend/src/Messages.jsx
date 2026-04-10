import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import "./Messages.css";

const API = "http://localhost:8800";
const POLL_MS = 4000;

function avatarUrl(profilePicture) {
  if (!profilePicture) return null;
  return profilePicture.startsWith("/") ? `${API}${profilePicture}` : profilePicture;
}

function Avatar({ user, size = 40 }) {
  const url = avatarUrl(user?.profilePicture);
  return url ? (
    <img className="msg-avatar" src={url} alt={user?.username} style={{ width: size, height: size }} />
  ) : (
    <div className="msg-avatar msg-avatar-placeholder" style={{ width: size, height: size }}>
      <svg viewBox="0 0 24 24" fill="currentColor" width={size * 0.6} height={size * 0.6}>
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
      </svg>
    </div>
  );
}

export default function Messages() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [thread, setThread] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const threadEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!userId) navigate("/login");
  }, [userId, navigate]);

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${API}/messages/conversations`, {
        headers: { "x-user-id": userId },
      });
      if (!res.ok) return;
      setConversations(await res.json());
    } catch (_) {}
  };

  const fetchThread = async (conv) => {
    if (!conv) return;
    try {
      const res = await fetch(
        `${API}/messages/thread/${conv.otherUser._id}/${conv.book._id}`,
        { headers: { "x-user-id": userId } }
      );
      if (!res.ok) return;
      setThread(await res.json());
    } catch (_) {}
  };

  const markRead = async (conv) => {
    if (!conv) return;
    try {
      await fetch(`${API}/messages/thread/${conv.otherUser._id}/${conv.book._id}/read`, {
        method: "PATCH",
        headers: { "x-user-id": userId },
      });
    } catch (_) {}
  };

  useEffect(() => {
    if (!userId) return;
    fetchConversations();
    pollRef.current = setInterval(() => {
      fetchConversations();
      if (selected) fetchThread(selected);
    }, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [userId, selected]);

  useEffect(() => {
    if (!selected) return;
    fetchThread(selected);
    markRead(selected);
  }, [selected]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleSelectConv = (conv) => {
    setSelected(conv);
    setInput("");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify({
          recipientId: selected.otherUser._id,
          bookId: selected.book._id,
          body: input.trim(),
        }),
      });
      if (res.ok) {
        setInput("");
        await fetchThread(selected);
        await fetchConversations();
      }
    } catch (_) {}
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) handleSend(e);
  };

  return (
    <>
      <Header />
      <div className="messages-page">
        <div className="messages-panel">
          {/* Sidebar */}
          <div className="messages-sidebar">
            <h2 className="messages-sidebar-title">Messages</h2>
            {conversations.length === 0 && (
              <p className="messages-empty-sidebar">No conversations yet</p>
            )}
            {conversations.map((conv, i) => {
              const isSelected =
                selected &&
                selected.otherUser._id === conv.otherUser._id &&
                selected.book._id === conv.book._id;
              return (
                <div
                  key={i}
                  className={`messages-conv-item${isSelected ? " selected" : ""}`}
                  onClick={() => handleSelectConv(conv)}
                >
                  <Avatar user={conv.otherUser} size={42} />
                  <div className="messages-conv-info">
                    <span className="messages-conv-name">{conv.otherUser.username}</span>
                    <span className="messages-conv-book">{conv.book.title}</span>
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="messages-badge">{conv.unreadCount}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Chat panel */}
          <div className="messages-chat">
            {!selected ? (
              <div className="messages-no-conv">Select a conversation to start chatting</div>
            ) : (
              <>
                <div className="messages-chat-header">
                  <Avatar user={selected.otherUser} size={36} />
                  <div>
                    <span className="messages-chat-name">{selected.otherUser.username}</span>
                    <span className="messages-chat-book">re: {selected.book.title}</span>
                  </div>
                </div>

                <div className="messages-thread">
                  {thread.map((msg) => {
                    const isMe =
                      msg.sender._id === userId ||
                      msg.sender._id?.toString() === userId;
                    return (
                      <div
                        key={msg._id}
                        className={`messages-bubble-row${isMe ? " me" : " them"}`}
                      >
                        {!isMe && <Avatar user={msg.sender} size={30} />}
                        <div className={`messages-bubble${isMe ? " bubble-me" : " bubble-them"}`}>
                          {msg.body}
                        </div>
                        {isMe && <Avatar user={msg.sender} size={30} />}
                      </div>
                    );
                  })}
                  <div ref={threadEndRef} />
                </div>

                <form className="messages-input-row" onSubmit={handleSend}>
                  <input
                    className="messages-input"
                    type="text"
                    placeholder="Type here then press enter to chat!"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={sending}
                    autoFocus
                  />
                  <button
                    className="messages-send-btn"
                    type="submit"
                    disabled={!input.trim() || sending}
                  >
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
