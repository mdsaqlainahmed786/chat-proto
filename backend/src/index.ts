import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "diysvyrv6",
    api_key: process.env.CLOUDINARY_API_KEY || "325429828863713",
    api_secret: process.env.CLOUDINARY_API_SECRET || "vV5P_iIgz8ZBLuruQmxZlPu5O7c",
});


const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow all for dev
    },
});

interface ChatMessage {
    id: string;
    text?: string;
    imageUrl?: string;
}

io.on("connection", (socket) => {
    console.log("🔗 User connected:", socket.id);

    // text or image message
    socket.on("chat message", (msg: ChatMessage) => {
        console.log("💬 Message:", msg);
        io.emit("chat message", msg);
    });

    socket.on("disconnect", () => {
        console.log("❌ User disconnected:", socket.id);
    });
});
app.post("/upload", async (req, res) => {
    try {
        const { image } = req.body; // base64 string
        const result = await cloudinary.uploader.upload(image, {
            folder: "chat-app",
        });
        res.json({ url: result.secure_url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Upload failed" });
    }
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
