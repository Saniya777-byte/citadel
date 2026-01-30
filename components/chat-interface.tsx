// components/chat-interface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Shield, Trash2, Volume2, Globe } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'bot';
  text: string;
  lang?: string;
};

const LANGUAGES = [
  { code: 'en-US', name: 'English', label: 'English' },
  { code: 'hi-IN', name: 'Hindi', label: 'हिंदी' },
  { code: 'mr-IN', name: 'Marathi', label: 'मराठी' },
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Privacy: Clear chat on component unmount
  useEffect(() => {
    return () => setMessages([]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mutation B: Privacy-First - Sanitize input locally
  const sanitizeInput = (text: string) => {
    // Basic regex to remove email-like patterns and phone numbers
    // In a real hackathon, expand this regex list
    let cleaned = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL REDACTED]');
    cleaned = cleaned.replace(/\b\d{10}\b/g, '[PHONE REDACTED]');
    return cleaned;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const cleanText = sanitizeInput(input);
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: cleanText,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Simulate AI response for now (Replace with real API call)
    // In a real implementation, you'd send `cleanText` and `selectedLang` to your API
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: getMockResponse(cleanText, selectedLang.code),
        lang: selectedLang.code,
      };
      setMessages((prev) => [...prev, botResponse]);
      speak(botResponse.text, selectedLang.code);
    }, 1000);
  };

  // Mutation A: Voice Support (Text-to-Speech)
  const speak = (text: string, lang: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Mutation A: Voice Support (Speech-to-Text)
  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      // Logic to stop would go here if we held the recognition instance ref
      // For simplicity in this demo, we'll rely on the onresult event or auto-stop
    } else {
      setIsRecording(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = selectedLang.code;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsRecording(false);
      };

      recognition.onend = () => setIsRecording(false);
      recognition.onerror = () => setIsRecording(false);
      recognition.start();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    window.speechSynthesis.cancel();
  };

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto bg-gray-50 border-x border-gray-200">
      {/* Header */}
      <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="font-bold text-lg text-gray-800">Safety Companion</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="relative group">
            <button className="p-2 hover:bg-gray-100 rounded-full text-black">
              <Globe className="w-5 h-5" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-gray-200 shadow-lg rounded-lg hidden group-hover:block z-10">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang)}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-black ${
                    selectedLang.code === lang.code ? 'font-bold text-blue-600' : ''
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          
          <button 
            onClick={clearHistory} 
            title="Clear Chat (Privacy)"
            className="p-2 hover:bg-red-50 text-red-500 rounded-full"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Select your language and ask about digital safety.</p>
            <p className="text-xs mt-2 text-gray-400">
              <span className="font-semibold">Privacy Mode:</span> Chats are not stored on any server.
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              {msg.role === 'bot' && (
                <button 
                  onClick={() => speak(msg.text, msg.lang || 'en-US')}
                  className="mt-2 p-1 hover:bg-gray-100 rounded-full text-gray-500"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
          <button
            onClick={toggleRecording}
            className={`p-2 rounded-full transition-colors ${
              isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-blue-600'
            }`}
          >
            <Mic className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              selectedLang.code === 'hi-IN' ? 'सुरक्षा प्रशन पूछें...' : 
              selectedLang.code === 'mr-IN' ? 'सुरक्षा प्रश्न विचारा...' : 
              'Ask a safety question...'
            }
            className="flex-1 bg-transparent border-none focus:outline-none text-black placeholder-gray-500"
          />
          
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-center text-gray-400 mt-2">
          Detected sensitive info (emails, phones) will be redacted locally.
        </p>
      </div>
    </div>
  );
}

// Mock AI Logic (Replace with real API)
function getMockResponse(query: string, lang: string): string {
  const responses = {
    'en-US': {
      default: "I can help you with digital safety. Ask me about passwords, phishing, or privacy settings.",
      password: "To create a strong password, use at least 12 characters, mix uppercase, lowercase, numbers, and symbols. Avoid common words.",
      privacy: "Check your privacy settings regularly. Turn off location services for apps that don't need it.",
    },
    'hi-IN': {
      default: "मैं आपकी डिजिटल सुरक्षा में मदद कर सकता हूं। मुझसे पासवर्ड, फ़िशिंग या गोपनीयता सेटिंग्स के बारे में पूछें।",
      password: "एक मजबूत पासवर्ड बनाने के लिए, कम से कम 12 अक्षर, बड़े और छोटे अक्षर, संख्या और प्रतीकों का उपयोग करें।",
      privacy: "अपनी गोपनीयता सेटिंग्स की नियमित जांच करें। उन ऐप्स के लिए स्थान सेवाएं बंद करें जिन्हें इसकी आवश्यकता नहीं है।",
    },
    'mr-IN': {
      default: "मी तुम्हाला डिजिटल सुरक्षेत मदत करू शकतो. मला पासवर्ड, फिशिंग किंवा गोपनीयता सेटिंग्ज बद्दल विचारा.",
      password: "मजबूत पासवर्ड तयार करण्यासाठी, किमान 12 अक्षरे, मोठी आणि लहान अक्षरे, क्रमांक आणि चिन्हे वापरा.",
      privacy: "आपल्या गोपनीयता सेटिंग्ज नियमित तपासा. ज्या अ‍ॅप्सना गरज नाही त्यांच्यासाठी लोकेशन सेवा बंद करा.",
    }
  };

  const lowerQuery = query.toLowerCase();
  const langKey = lang as keyof typeof responses;
  const langResponses = responses[langKey] || responses['en-US'];

  if (lowerQuery.includes('password') || lowerQuery.includes('पासवर्ड')) return langResponses.password;
  if (lowerQuery.includes('privacy') || lowerQuery.includes('गोपनीयता')) return langResponses.privacy;
  
  return langResponses.default;
}
