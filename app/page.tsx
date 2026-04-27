"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Minus, X, Phone, MapPin, Search, User, ExternalLink, MessageCircle, Send, Info, Check, AlertCircle } from "lucide-react";
import productsData from "@/data/products.json";
import { auth, registerUser, loginUser, logoutUser, onAuthChange, resetPassword } from "@/lib/firebase";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  description?: string;
  benefits?: string;
}

interface CartItem extends Product {
  quantity: number;
}

const BOT_TOKEN = "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk";
const CHAT_ID = "7766881831";

const categories = [
  { id: "all", name: "🛍️ Все товары" },
  { id: "fruits", name: "🍎 Фрукты" },
  { id: "vegetables", name: "🥕 Овощи" },
  { id: "nuts", name: "🥜 Орехи и сухофрукты" },
  { id: "grocery", name: "🍵 Бакалея и чай" },
  { id: "drinks", name: "🥤 Напитки" },
];

const deliveryZones = [
  { id: 1, name: "Октябрьский район", price: 0, color: "#4CAF50" },
  { id: 2, name: "Ленинский район", price: 200, color: "#FF9800" },
  { id: 3, name: "Центральный район", price: 150, color: "#2196F3" },
  { id: 4, name: "Другие районы", price: 0, color: "#9E9E9E", note: "по договорённости" },
];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatSent, setChatSent] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginForm, setLoginForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((user: any) => {
      if (user) {
        setFirebaseUser(user);
        setIsLoggedIn(true);
        setUserEmail(user.email || "");
        const savedData = localStorage.getItem(`user_${user.uid}`);
        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            setUserName(data.name || "");
            setUserAddress(data.address || "");
            setAddressConfirmed(data.addressConfirmed || false);
          } catch (e) {}
        }
      } else {
        setFirebaseUser(null);
        setIsLoggedIn(false);
        setUserName("");
        setUserEmail("");
        setUserAddress("");
        setAddressConfirmed(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => { setProducts(productsData); }, []);

  useEffect(() => {
    if (firebaseUser) {
      localStorage.setItem(`user_${firebaseUser.uid}`, JSON.stringify({ name: userName, address: userAddress, addressConfirmed }));
    }
  }, [userName, userAddress, addressConfirmed, firebaseUser]);

  const handleLogout = async () => { try { await logoutUser(); } catch (e) {} };

  const validateAddress = (address: string): boolean => {
    const addr = address.trim();
    if (addr.length < 10) return false;
    if (!/\d/.test(addr)) return false;
    return true;
  };

  const confirmAddress = () => {
    setAddressError("");
    if (!userAddress.trim()) return setAddressError("Введите адрес доставки");
    if (!validateAddress(userAddress)) return setAddressError("Введите настоящий адрес");
    setAddressConfirmed(true);
  };

  const getProductImage = (p: Product) => p.image?.startsWith("http") ? p.image : "https://placehold.co/400x400/4a7c59/white?text=" + encodeURIComponent(p.name);
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleLogin = async () => {
    setLoginError("");
    if (isRegistering) {
      if (!loginForm.name.trim()) return setLoginError("Введите имя");
      if (!validEmail(loginForm.email)) return setLoginError("Некорректный email");
      if (!loginForm.phone.trim()) return setLoginError("Введите телефон");
      if (loginForm.password.length < 6) return setLoginError("Пароль минимум 6 символов");
      try {
        await registerUser(loginForm.email, loginForm.password);
        setUserName(loginForm.name);
        setShowLogin(false);
        setLoginForm({ name: "", email: "", phone: "", password: "" });
      } catch (e: any) { setLoginError(e.code === "auth/email-already-in-use" ? "Email уже зарегистрирован" : "Ошибка регистрации"); }
    } else {
      try { await loginUser(loginForm.email, loginForm.password); setShowLogin(false); }
      catch (e: any) { setLoginError("Неверный email или пароль"); }
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) return;
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      setTimeout(() => { setResetSent(false); setForgotPassword(false); setResetEmail(""); }, 3000);
    } catch (e: any) { alert("Ошибка отправки письма. Проверьте email."); }
  };

  const filtered = products.filter(p => (selectedCategory === "all" || p.category === selectedCategory) && p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const addToCart = (p: Product) => setCart(prev => { const ex = prev.find(i => i.id === p.id); return ex ? prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i) : [...prev, { ...p, quantity: 1 }]; });
  const updQty = (id: number, d: number) => setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + d) } : i).filter(i => i.quantity > 0));
  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const items = cart.reduce((s, i) => s + i.quantity, 0);

  const sendTg = async (text: string) => {
  try {
    await fetch("https://oblako51-bot-mary17031725.waw0.amvera.tech/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    });
    return true;
  } catch (e) {
    console.error("Ошибка отправки в Telegram:", e);
    return false;
  }
};
const sendTg = async (text: string) => {
  try {
    await fetch("https://dostavka-mary17031725.waw0.amvera.tech/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: userName || "Гость",
        address: userAddress || "—",
        orderText: text,
        total: total,
      }),
    });
    return true;
  } catch (e) {
    console.error("Ошибка:", e);
    return false;
  }
};
const handleOrder = async () => {
  if (!isLoggedIn) { setShowLogin(true); return; }
  if (!userAddress.trim() || !addressConfirmed) { alert("Подтвердите адрес"); return; }
  if (!cart.length) { alert("Корзина пуста"); return; }
  const list = cart.map(i => `${i.name} — ${i.quantity} ${i.unit} × ${i.price} ₽ = ${i.quantity * i.price} ₽`).join("\n");
  const zone = selectedZone ? `\n🚚 ${deliveryZones.find(z => z.id === selectedZone)?.name}` : "";
  const message = `🛒 НОВЫЙ ЗАКАЗ!\n👤 ${userName}\n📧 ${userEmail}\n📍 ${userAddress}${zone}\n\n${list}\n💰 ИТОГО: ${total} ₽`;

  try {
    await fetch("https://dostavka-mary17031725.waw0.amvera.tech/order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    botToken: "8216611154:AAFoWsw_uIO6ipvDkzHRZC6lMxzFA3cWkMk",
    chatId: "7766881831",
    text: `💬 Сообщение с сайта:\n👤 ${userName || "Гость"}\n📍 ${userAddress || "—"}\n💬 ${chatMessage}`
  }),
});
    alert("✅ Заказ отправлен!");
    setCart([]);
    setIsCartOpen(false);
  } catch (e) {
    alert("Ошибка отправки заказа");
  }
};

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col">
      <header className="sticky top-0 z-20 bg-[#FFF8F0] border-b border-orange-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="bg-orange-100 p-2 rounded-2xl"><span className="text-3xl">🍎</span></div><div><h1 className="text-2xl font-bold text-[#4a7c59]">Облачная 51</h1><p className="text-sm text-gray-500">Свежие продукты каждый день</p></div></div>
          <div className="flex items-center gap-2">
            {isLoggedIn && <span className="text-sm bg-orange-50 px-3 py-1.5 rounded-full hidden sm:block">👋 {userName || userEmail}</span>}
            <button onClick={() => isLoggedIn ? handleLogout() : setShowLogin(true)} className="p-2.5 hover:bg-orange-50 rounded-full"><User className="w-5 h-5" /></button>
            <button onClick={() => setIsChatOpen(true)} className="p-2.5 hover:bg-orange-50 rounded-full"><MessageCircle className="w-5 h-5" /></button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2.5 hover:bg-orange-50 rounded-full"><ShoppingCart className="w-5 h-5" />{items > 0 && <span className="absolute -top-1 -right-1 bg-[#e87722] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">{items}</span>}</button>
          </div>
        </div>
      </header>

      <div className="w-full h-24 md:h-36 overflow-hidden rounded-b-3xl">
  <img 
    src="https://avatars.mds.yandex.net/i?id=1464f4f5e31f574205e1066475e11c4c37253dac-4955124-images-thumbs&n=13" 
    alt="Свежие продукты" 
    className="w-full h-full object-cover" 
  />
</div>

      <div className="bg-white border-b"><div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2"><span className="flex items-center gap-1.5 text-sm text-gray-600 bg-orange-50 px-3 py-2 rounded-xl"><MapPin className="w-4 h-4 text-[#e87722]" /> ул. Облачная, 51</span><span className="flex items-center gap-1.5 text-sm text-gray-600 bg-orange-50 px-3 py-2 rounded-xl"><Phone className="w-4 h-4 text-[#e87722]" /> +7 913 004 1112</span><button onClick={() => setIsMapVisible(true)} className="text-sm bg-[#e8f5e9] text-[#4a7c59] px-4 py-2 rounded-xl font-medium hover:bg-[#c8e6c9] flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Наш магазин тут</button><a href="https://t.me/fruktiovoshiOblachnaya51" target="_blank" className="text-sm bg-[#e3f2fd] text-[#1565c0] px-4 py-2 rounded-xl font-medium hover:bg-[#bbdefb] flex items-center gap-1.5"><ExternalLink className="w-4 h-4" /> Telegram</a></div></div>

      {isLoggedIn && (
        <div className="bg-[#FFF8E1] border-b border-orange-100">
          <div className="container mx-auto px-4 py-3 flex gap-3 items-center flex-wrap">
            <MapPin className="w-5 h-5 text-[#e87722]" /><input type="text" placeholder="📍 Введите адрес доставки" value={userAddress} onChange={e => { setUserAddress(e.target.value); setAddressConfirmed(false); }} className="bg-white border border-orange-200 rounded-xl px-4 py-2.5 outline-none flex-1 text-sm" />
            <button onClick={confirmAddress} className={`font-medium text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 ${addressConfirmed ? "bg-green-500 text-white" : "bg-[#e87722] text-white"}`}>{addressConfirmed ? <><Check className="w-4 h-4" /> Подтверждён</> : "Подтвердить"}</button>
          </div>
          {addressError && <div className="container mx-auto px-4 pb-2 text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {addressError}</div>}
        </div>
      )}

      <div className="container mx-auto px-4 py-6 flex gap-6 flex-1">
        <div className="hidden md:flex flex-col gap-2 w-56 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-1 px-2">Каталог</p>
          {categories.map(c => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`text-left px-4 py-3 rounded-2xl font-medium text-sm ${selectedCategory === c.id ? "bg-[#e87722] text-white shadow-lg" : "bg-white text-gray-700 hover:bg-orange-50 border"}`}>{c.name}</button>))}
          <div className="mt-4 bg-white rounded-2xl p-4 border"><h3 className="font-bold text-[#4a7c59] text-sm mb-2">🚚 Доставка</h3>{deliveryZones.map(z => (<button key={z.id} onClick={() => setSelectedZone(z.id)} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium mb-1 ${selectedZone === z.id ? "bg-[#e87722] text-white" : "bg-gray-50 text-gray-600"}`}>{z.name}: {z.price === 0 ? (z.note || "Бесплатно") : `${z.price} ₽`}</button>))}</div>
        </div>
        <div className="flex-1">
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 mb-4">{categories.map(c => (<button key={c.id} onClick={() => setSelectedCategory(c.id)} className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm ${selectedCategory === c.id ? "bg-[#e87722] text-white" : "bg-white text-gray-600 border"}`}>{c.name}</button>))}</div>
          <div className="flex items-center gap-3 bg-white border rounded-2xl px-4 py-3.5 mb-5"><Search className="w-5 h-5 text-gray-400" /><input type="text" placeholder="🔍 Поиск товаров..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent outline-none flex-1" /></div>
          {filtered.length === 0 ? <div className="text-center py-16 text-gray-400 bg-white rounded-3xl"><span className="text-5xl block mb-4">🍃</span><p>Ничего не найдено</p></div> : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-3xl shadow-sm border overflow-hidden hover:shadow-md group">
                  <div className="aspect-square bg-gradient-to-br from-green-50 to-orange-50 relative overflow-hidden"><img src={getProductImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" /></div>
                  <div className="p-4"><h3 className="font-semibold text-gray-800 text-sm line-clamp-2">{p.name}</h3><p className="text-xs text-gray-400 mt-1">за {p.unit}</p>
                    <div className="flex items-center justify-between mt-3"><span className="text-xl font-bold text-[#c0392b]">{p.price > 0 ? `${p.price} ₽` : "—"}</span><button onClick={() => addToCart(p)} className="bg-[#e87722] text-white rounded-full w-10 h-10 flex items-center justify-center shadow-md"><Plus className="w-5 h-5" /></button></div>
                    <button onClick={() => setSelectedProduct(p)} className="mt-3 w-full text-xs text-[#4a7c59] font-medium flex items-center justify-center gap-1 py-2 rounded-xl bg-green-50 hover:bg-green-100"><Info className="w-3.5 h-3.5" /> Характеристики</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="bg-[#2c3e50] text-white mt-auto"><div className="container mx-auto px-4 py-10"><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div><h3 className="text-xl font-bold mb-3 flex items-center gap-2"><span className="text-2xl">🍎</span> Облачная 51</h3><p className="text-gray-300 text-sm">Свежие продукты с доставкой по Новосибирску.</p></div><div><h4 className="font-semibold mb-3 text-green-300">Контакты</h4><ul className="space-y-2 text-sm text-gray-300"><li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> ул. Облачная, 51</li><li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +7 913 004 1112</li></ul></div><div><h4 className="font-semibold mb-3 text-green-300">Telegram</h4><a href="https://t.me/fruktiovoshiOblachnaya51" target="_blank" className="inline-flex items-center gap-2 bg-[#0088cc] text-white px-4 py-2 rounded-xl text-sm font-medium"><ExternalLink className="w-4 h-4" /> Подписаться</a></div></div><div className="border-t border-gray-600 mt-8 pt-6 text-center text-sm text-gray-400"><p>© 2026 Фрукты & Овощи | Облачная 51</p></div></div></footer>

      {/* Модалка карты */}
      {isMapVisible && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsMapVisible(false)}>
          <div className="bg-white rounded-3xl overflow-hidden w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between p-5"><h2 className="font-bold text-lg text-[#4a7c59]">📍 ул. Облачная, 51 — магазин</h2><button onClick={() => setIsMapVisible(false)}><X className="w-5 h-5" /></button></div><div className="h-72 bg-gray-200"><iframe src="https://yandex.ru/map-widget/v1/?ll=82.804277%2C54.977501&z=16&pt=82.804277,54.977501,pm2rdl" width="100%" height="100%" frameBorder="0" allowFullScreen></iframe></div><div className="p-5 text-sm text-gray-600"><p>📍 <strong>ул. Облачная, 51</strong>, Новосибирск, 630120</p><p className="mt-1">🚚 Введите адрес доставки вручную в поле выше.</p><div className="mt-3 space-y-1"><p className="font-medium text-[#4a7c59]">Зоны доставки:</p>{deliveryZones.map(z => <div key={z.id} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{backgroundColor: z.color}}></div><span>{z.name}: {z.price === 0 ? (z.note || "Бесплатно") : `${z.price} ₽`}</span></div>)}</div></div></div>
        </div>
      )}

      {/* Модалка Характеристик */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between p-5 border-b"><h2 className="font-bold text-lg text-[#4a7c59]">{selectedProduct.name}</h2><button onClick={() => setSelectedProduct(null)}><X className="w-5 h-5" /></button></div><div className="p-5"><img src={getProductImage(selectedProduct)} alt={selectedProduct.name} className="w-full h-48 object-cover rounded-2xl mb-4" /><p className="text-gray-700 text-sm mb-3">{selectedProduct.description || "Описание скоро появится."}</p>{selectedProduct.benefits && <div className="bg-green-50 rounded-2xl p-4"><p className="text-sm font-semibold text-[#4a7c59] mb-1">💚 Польза:</p><p className="text-sm text-gray-700">{selectedProduct.benefits}</p></div>}<div className="mt-4 flex items-center justify-between"><span className="text-2xl font-bold text-[#c0392b]">{selectedProduct.price > 0 ? `${selectedProduct.price} ₽` : "—"}</span><button onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }} className="bg-[#e87722] text-white px-6 py-3 rounded-2xl font-medium">🛒 В корзину</button></div></div></div>
        </div>
      )}

      {/* Модалка чата */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setIsChatOpen(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}><h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-[#4a7c59]"><MessageCircle className="w-5 h-5" /> Задать вопрос</h2>{chatSent ? <div className="text-center py-8"><span className="text-5xl block mb-3">✅</span><p className="text-green-600 font-medium">Сообщение отправлено!</p></div> : <><textarea placeholder="Где мой заказ? Есть ли доставка в мой район?" value={chatMessage} onChange={e => setChatMessage(e.target.value)} className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-3 h-32 resize-none outline-none focus:border-[#4a7c59]" /><button onClick={handleChat} className="w-full bg-[#4a7c59] text-white py-3 rounded-2xl font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Отправить</button></>}</div>
        </div>
      )}

      {/* Модалка входа */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => { setShowLogin(false); setForgotPassword(false); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            {forgotPassword ? (
              <>
                <h2 className="text-xl font-bold mb-4 text-center text-[#4a7c59]">🔑 Восстановление пароля</h2>
                {resetSent ? (
                  <div className="text-center py-8"><span className="text-5xl block mb-3">📧</span><p className="text-green-600 font-medium">Письмо отправлено!</p><p className="text-sm text-gray-500 mt-2">Проверьте почту и следуйте инструкции.</p></div>
                ) : (
                  <>
                    <p className="text-sm text-gray-500 mb-4 text-center">Введите email, и мы пришлём ссылку для сброса пароля.</p>
                    <input type="email" placeholder="Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-4 outline-none focus:border-[#4a7c59]" />
                    <button onClick={handleResetPassword} className="w-full bg-[#4a7c59] text-white py-3 rounded-2xl font-medium hover:bg-green-700 transition-all">Отправить ссылку</button>
                  </>
                )}
                <p className="text-center text-sm text-gray-500 mt-4"><button onClick={() => { setForgotPassword(false); setResetSent(false); }} className="text-[#4a7c59] font-medium underline">← Вернуться ко входу</button></p>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4 text-center text-[#4a7c59]">{isRegistering ? "📋 Регистрация" : "🔐 Вход"}</h2>
                {loginError && <p className="text-red-500 text-sm mb-3 text-center bg-red-50 py-2 rounded-xl">{loginError}</p>}
                {isRegistering && <input type="text" placeholder="Ваше имя" value={loginForm.name} onChange={e => setLoginForm({...loginForm, name: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-3 outline-none focus:border-[#4a7c59]" />}
                <input type="email" placeholder="Email" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-3 outline-none focus:border-[#4a7c59]" />
                {isRegistering && <input type="tel" placeholder="Телефон" value={loginForm.phone} onChange={e => setLoginForm({...loginForm, phone: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-3 outline-none focus:border-[#4a7c59]" />}
                <input type="password" placeholder="Пароль" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full border border-gray-200 rounded-2xl px-4 py-3 mb-4 outline-none focus:border-[#4a7c59]" />
                <button onClick={handleLogin} className="w-full bg-[#e87722] hover:bg-orange-600 text-white py-3.5 rounded-2xl font-medium transition-all shadow-lg shadow-orange-200">{isRegistering ? "Зарегистрироваться" : "Войти"}</button>
                {!isRegistering && (
                  <p className="text-center text-sm text-gray-500 mt-3"><button onClick={() => setForgotPassword(true)} className="text-[#4a7c59] font-medium underline">Забыли пароль?</button></p>
                )}
                <p className="text-center text-sm text-gray-500 mt-3">{isRegistering ? "Уже есть аккаунт?" : "Нет аккаунта?"} <button onClick={() => setIsRegistering(!isRegistering)} className="text-[#4a7c59] font-medium underline">{isRegistering ? "Войти" : "Зарегистрироваться"}</button></p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Корзина */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsCartOpen(false)}>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between p-5 bg-[#4a7c59] text-white"><h2 className="text-xl font-bold flex items-center gap-2"><ShoppingCart className="w-5 h-5" /> Корзина</h2><button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button></div><div className="flex-1 overflow-y-auto p-5">{cart.length === 0 ? <p className="text-gray-500 text-center py-16">Корзина пуста</p> : cart.map(i => (<div key={i.id} className="flex items-center gap-3 border-b pb-3"><img src={getProductImage(i)} alt={i.name} className="w-16 h-16 object-cover rounded-xl" /><div className="flex-1"><h4 className="font-medium text-sm">{i.name}</h4><p className="text-[#c0392b] font-bold">{i.price} ₽ / {i.unit}</p></div><div className="flex items-center gap-2"><button onClick={() => updQty(i.id, -1)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"><Minus className="w-4 h-4" /></button><span className="w-6 text-center font-medium">{i.quantity}</span><button onClick={() => updQty(i.id, 1)} className="w-8 h-8 rounded-full bg-[#e87722] text-white flex items-center justify-center hover:bg-orange-600"><Plus className="w-4 h-4" /></button></div></div>))}</div><div className="border-t p-5 bg-green-50"><div className="flex items-center justify-between mb-4"><span className="text-lg font-medium">Итого:</span><span className="text-2xl font-bold text-[#c0392b]">{total} ₽</span></div><button onClick={handleOrder} disabled={cart.length === 0} className="w-full bg-[#e87722] text-white py-4 text-lg rounded-2xl font-medium hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50">🚀 Оформить заказ</button><p className="text-xs text-gray-500 text-center mt-3">📍 {userAddress || "Адрес не указан"}</p></div></div>
        </div>
      )}
    </div>
  );
}