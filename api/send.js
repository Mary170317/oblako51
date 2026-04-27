export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text, type } = req.body;
  
  const BOT_TOKEN = "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk";
  const CHAT_ID = "7766881831";

  const message = type === "chat"
    ? `💬 Сообщение с сайта:\n${text}`
    : `🛒 НОВЫЙ ЗАКАЗ!\n${text}`;

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });
    res.status(200).json({ status: "ok" });
  } catch (e) {
    res.status(500).json({ error: "Failed to send" });
  }
}