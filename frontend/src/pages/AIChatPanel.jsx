import { useState } from "react";
import Layout from "../components/Layout.jsx";
import api from "../services/api.js";
import { MessageSquare, Send, Sparkles, User, Bot } from "lucide-react";

export default function AIChatPanel() {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! I am your Enterprise QA AI Copilot. Ask me anything about test execution, Cypress/Playwright scripts, bug descriptions, or QA strategies.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat", { message: userMsg });
      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, I ran into an error communicating with the AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-500" />
            AI QA Copilot & Assistant
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Real-time chat assistant for test generation, bug writing, and framework architecture advice.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800/80 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/60 h-[550px] flex flex-col overflow-hidden">
        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${
                m.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white"
                }`}
              >
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div
                className={`max-w-xl p-4 rounded-2xl text-sm leading-relaxed ${
                  m.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200/50 dark:border-gray-800"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <Bot className="w-4 h-4 animate-bounce" />
              Copilot is thinking...
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/40 flex items-center gap-3">
          <input
            type="text"
            placeholder="Type your QA or automation question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl text-sm transition flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send
          </button>
        </form>
      </div>
    </Layout>
  );
}
