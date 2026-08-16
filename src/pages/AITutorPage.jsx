import 'regenerator-runtime/runtime'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition'
import {
  Send,
  MessageCircle,
  Trash2,
  Plus,
  X,
  Camera,
  FileText,
  Mic,
  MicOff,
  Sparkles
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const API_BASE = '/api/v1'

const initialSuggestedPrompts = [
  'Explain the accounting equation with an example',
  'What is the difference between demand and quantity demanded?',
  'Help me understand forms of business organisation',
  'Create a short revision plan for journal entries',
]

const welcomeMessage = {
  id: 1,
  text: "Hi! I'm Concepta's AI Tutor. I can help you understand concepts, solve complex problems, analyze images, read PDFs, and answer your questions. What would you like to learn today?",
  sender: 'ai',
  timestamp: new Date(),
}

export default function AITutorPage() {
  const { user } = useAuth()

  const userId = user?.uid || user?.email || 'guest'
  const [messages, setMessages] = useState([welcomeMessage])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [suggestedPrompts, setSuggestedPrompts] = useState(initialSuggestedPrompts)
  const [chats, setChats] = useState([])
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Speech Recognition Hooks
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition()

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/history/${userId}`)
      const data = await res.json()
      setChats(data)
    } catch (error) {
      console.error('History Error:', error)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  // Update input text when user speaks
  useEffect(() => {
    if (transcript) {
      setInput(transcript)
    }
  }, [transcript])

  // Mic Toggle Logic
  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening()
    } else {
      resetTranscript()
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' })
    }
  }

  const loadConversation = async (conversationId) => {
    try {
      const res = await fetch(`${API_BASE}/chat/conversation/${conversationId}`)
      const data = await res.json()

      if (!data || !data.messages) return

      const loadedMessages = data.messages.map((msg, index) => ({
        id: `${conversationId}-${index}`,
        text: msg.content,
        sender: msg.role === 'user' ? 'user' : 'ai',
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
      }))

      setMessages(loadedMessages)
      setCurrentConversationId(conversationId)
      setSuggestedPrompts([])
      removeSelectedFile()
    } catch (error) {
      console.error('Load Conversation Error:', error)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]

    if (!file) return

    setSelectedFile(file)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file))
    } else {
      setPreviewUrl(null)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const getFileIcon = (file) => {
    if (!file) return '📎'
    if (file.type.startsWith('image/')) return '📷'
    if (file.type === 'application/pdf') return '📄'
    if (file.name.endsWith('.docx')) return '📝'
    if (file.name.endsWith('.txt')) return '📃'
    return '📎'
  }

  const handleSendMessage = async (text) => {
    const messageText = text || input

    if (!messageText.trim() && !selectedFile) return

    // Stop listening when sending a message
    if (listening) {
      SpeechRecognition.stopListening()
    }

    const userMessage = {
      id: Date.now(),
      text: selectedFile
        ? `${getFileIcon(selectedFile)} ${selectedFile.name}\n\n${
            messageText || 'Analyze this uploaded file'
          }`
        : messageText,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    resetTranscript()
    setSuggestedPrompts([])
    setIsLoading(true)

    try {
      let response

      if (selectedFile) {
        const formData = new FormData()

        formData.append('user_id', userId)
        formData.append('message', messageText || 'Analyze this uploaded file')
        formData.append('subject', 'General')
        formData.append('conversation_id', currentConversationId || '')
        formData.append('file', selectedFile)

        response = await fetch(`${API_BASE}/chat/upload`, {
          method: 'POST',
          body: formData,
        })
      } else {
        response = await fetch(`${API_BASE}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            message: messageText,
            subject: 'General',
            context_topics: [],
            conversation_id: currentConversationId,
          }),
        })
      }

      if (!response.ok) {
        throw new Error('Backend request failed')
      }

      const data = await response.json()

      setCurrentConversationId(data.conversation_id)

      const aiResponse = {
        id: Date.now() + 1,
        text: data.reply || 'Sorry, I could not generate a response.',
        sender: 'ai',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiResponse])
      removeSelectedFile()
      await loadHistory()
    } catch (error) {
      console.error('API Error:', error)

      const errorMessage = {
        id: Date.now() + 2,
        text: 'Failed to connect to backend server.',
        sender: 'ai',
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([
      {
        ...welcomeMessage,
        timestamp: new Date(),
      },
    ])
    setCurrentConversationId(null)
    setInput('')
    resetTranscript()
    if (listening) SpeechRecognition.stopListening()
    removeSelectedFile()
    setSuggestedPrompts(initialSuggestedPrompts)
  }

  const clearSidebarOnly = () => {
    setChats([])
  }

  const quickImageActions = [
    'Solve this',
    'Explain this',
    'Summarize this',
    'Create notes',
  ]

  return (
    /* h-screen prevents page scrolling, pt-16 clears the fixed navbar */
    <div className="product-page pt-16 h-screen bg-slate-50 dark:bg-slate-950 flex overflow-hidden">
      
      {/* Sidebar for Chat History */}
      <motion.div
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden lg:flex flex-col shrink-0 z-10"
      >
        <div className="p-5 border-b border-slate-200 dark:border-slate-800">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Chat
          </motion.button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider">
            Recent Conversations
          </p>

          <div className="space-y-1.5">
            {chats.length === 0 && (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No recent chats</p>
            )}

            {chats.map((chat) => (
              <motion.button
                key={chat.conversation_id}
                whileHover={{ x: 4 }}
                onClick={() => loadConversation(chat.conversation_id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
                  currentConversationId === chat.conversation_id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <p className="truncate text-sm font-medium">
                  {chat.title || chat.conversation_id}
                </p>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={clearSidebarOnly}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl font-medium transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear History
          </motion.button>
        </div>
      </motion.div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 relative">
        
        {/* Chat Header (Static, not sticky, avoids overlapping) */}
        <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0 shadow-sm z-10">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Smart AI Tutor</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ask questions with Voice, Images, and PDFs
            </p>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-2xl px-5 py-3.5 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-sm shadow-md shadow-indigo-500/20'
                      : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-sm border border-slate-200 dark:border-slate-800 shadow-sm'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                    {message.text}
                  </p>
                  <span className={`text-[11px] mt-2 block ${message.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white dark:bg-slate-900 px-5 py-4 rounded-2xl rounded-bl-sm border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.15,
                        repeat: Infinity,
                      }}
                      className="w-2 h-2 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Prompts (Only show if no messages sent yet) */}
          {suggestedPrompts.length > 0 && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Try asking:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {suggestedPrompts.map((prompt, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-left p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500/50 hover:shadow-sm transition-all text-sm text-slate-600 dark:text-slate-300"
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-4 py-4 md:px-6">
          
          {/* File Preview Area */}
          {selectedFile && (
            <div className="max-w-4xl mx-auto mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3">
              <div className="flex gap-4">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                )}

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {getFileIcon(selectedFile)} {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={removeSelectedFile}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedFile.type.startsWith('image/') && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {quickImageActions.map((action) => (
                        <button
                          key={action}
                          type="button"
                          onClick={() => handleSendMessage(action)}
                          disabled={isLoading}
                          className="px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Input Controls */}
          <div className="flex gap-2 items-end max-w-4xl mx-auto">
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*,.pdf,.txt,.doc,.docx"
              onChange={handleFileChange}
            />
            <input
              type="file"
              ref={cameraInputRef}
              hidden
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 transition-colors"
              title="Upload file"
            >
              <Plus className="w-5 h-5" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 transition-colors hidden sm:block"
              title="Take photo"
            >
              <Camera className="w-5 h-5" />
            </motion.button>

            {browserSupportsSpeechRecognition && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={toggleListening}
                className={`p-3.5 rounded-xl border transition-all ${
                  listening
                    ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:border-indigo-200'
                }`}
                title={listening ? 'Stop listening' : 'Start speaking'}
              >
                {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </motion.button>
            )}

            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  listening
                    ? 'Listening...'
                    : selectedFile
                    ? 'Ask about this uploaded file...'
                    : 'Message Concepta (Type or use Mic)...'
                }
                className={`w-full px-4 py-3.5 rounded-xl border focus:outline-none transition-colors text-[15px] ${
                  listening
                    ? 'bg-red-50/50 border-red-200 text-slate-900'
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                }`}
              />
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSendMessage()}
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 hover:shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </div>

          <p className="text-[11px] text-center text-slate-400 mt-3 max-w-4xl mx-auto font-medium">
            Concepta can make mistakes. Consider verifying important information.
          </p>
        </div>
      </div>
    </div>
  )
}
