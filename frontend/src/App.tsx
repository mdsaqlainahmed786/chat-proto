import { useState, useEffect } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000");

interface ChatMessage {
  id: string;
  text?: string;
  imageUrl?: string;
}

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [image, setImage] = useState<File | null>(null);

  useEffect(() => {
    socket.on("chat message", (msg: ChatMessage) => {
      setChat((prev) => [...prev, msg]);
      // Save locally
      localStorage.setItem("chat", JSON.stringify([...chat, msg]));
    });

    const saved = localStorage.getItem("chat");
    if (saved) setChat(JSON.parse(saved));

    return () => {
      socket.off("chat message");
    };
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const msg: ChatMessage = { id: socket.id ?? "", text: message };
      socket.emit("chat message", msg);
      setMessage("");
    }
  };

  const sendImage = async () => {
    if (!image) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      const res = await fetch("http://localhost:4000/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      const msg: ChatMessage = { id: socket.id ?? "", imageUrl: data.url };
      socket.emit("chat message", msg);
      setImage(null);
    };
    reader.readAsDataURL(image);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl mb-2">💬 Chat App</h1>
      <div className="border h-64 overflow-y-auto p-2 mb-2">
        {chat.map((c, i) => (
          <div key={i} className="mb-2">
            <strong>{c.id.slice(0, 4)}:</strong>{" "}
            {c.text && <span>{c.text}</span>}
            {c.imageUrl && (
              <div>
                <img
                  src={c.imageUrl}
                  alt="upload"
                  className="w-32 rounded mt-1"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="border p-1 flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button className="border px-2 py-1" onClick={sendMessage}>
          Send
        </button>
      </div>

      <div className="mt-2 flex gap-2">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />
        <button className="border px-2 py-1" onClick={sendImage}>
          Upload Image
        </button>
      </div>
    </div>
  );
}

export default App;
