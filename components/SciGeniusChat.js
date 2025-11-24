

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { i18n } from '../constants.js';
import * as apiService from '../services/geminiService.js';
import * as historyService from '../services/historyService.js';
import { Spinner, SendIcon, AttachIcon, CloseIcon, HistoryIcon, FeatureToolbar, MicrophoneIcon } from './Shared.js';
import HistoryPanel from './HistoryPanel.js';


const AssistantView = ({ language, currentUser }) => {
  const t = i18n[language];
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [useWebSearch, setUseWebSearch] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isVoiceSessionActive, setIsVoiceSessionActive] = useState(false);
  
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const fullscreenRef = useRef(null);
  const contentRef = useRef(null);
  const SERVICE_ID = 'assistant';

  // Refs for voice chat
  const sessionPromiseRef = useRef(null);
  const inputAudioContextRef = useRef(null);
  const outputAudioContextRef = useRef(null);
  const microphoneStreamRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const sourcesRef = useRef(new Set());
  const nextStartTimeRef = useRef(0);
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  // Toolbar state and handlers
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isEditing, setIsEditing] = useState(false);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.7));
  const handleToggleEdit = () => setIsEditing(prev => !prev);
  const handleExport = () => window.print();
  
  const isGeminiConfigured = apiService.isModelConfigured('gemini');

  useEffect(() => {
    setChat(apiService.createChatSession());
    setMessages([{
        sender: 'model',
        text: t.assistantDescription,
    }]);
  }, [t.assistantDescription]);

  useEffect(() => {
    if (currentUser) {
      setHistory(historyService.getHistory(currentUser.email, SERVICE_ID));
    }
  }, [currentUser]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const stopSession = useCallback(() => {
    if (sessionPromiseRef.current) {
        sessionPromiseRef.current.then(session => session.close());
        sessionPromiseRef.current = null;
    }
    if (microphoneStreamRef.current) {
        microphoneStreamRef.current.getTracks().forEach(track => track.stop());
        microphoneStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
        scriptProcessorRef.current.disconnect();
        scriptProcessorRef.current = null;
    }
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
        inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
        outputAudioContextRef.current.close();
    }
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    
    setMessages(prev => prev.filter(m => !m.isListening));
    setIsVoiceSessionActive(false);
  }, []);

  const onVoiceMessage = useCallback(async (message) => {
    let hasContent = false;
    if (message.serverContent?.inputTranscription) {
        hasContent = true;
        currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
    }
    if (message.serverContent?.outputTranscription) {
        hasContent = true;
        currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
    }

    if (hasContent) {
        setMessages(prev => prev.filter(m => !m.isListening));
    }

    if (message.serverContent?.turnComplete) {
        const fullInput = currentInputTranscriptionRef.current.trim();
        const fullOutput = currentOutputTranscriptionRef.current.trim();
        
        if (fullInput || fullOutput) {
            const newMessages = [];
            if (fullInput) newMessages.push({ sender: 'user', text: fullInput });
            if (fullOutput) newMessages.push({ sender: 'model', text: fullOutput });

            setMessages(prev => [...prev, ...newMessages]);
            
            if (currentUser && fullInput && fullOutput) {
                const historyItem = { user: fullInput, model: fullOutput, file: null, sources: [] };
                historyService.addHistoryItem(currentUser.email, SERVICE_ID, historyItem);
                setHistory(historyService.getHistory(currentUser.email, SERVICE_ID));
            }
        }
        currentInputTranscriptionRef.current = '';
        currentOutputTranscriptionRef.current = '';
        setMessages(prev => [...prev, { sender: 'model', text: 'Listening...', isListening: true }]);
    }
    
    const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
    if (base64Audio) {
        const outputCtx = outputAudioContextRef.current;
        if (outputCtx.state === 'suspended') {
            outputCtx.resume();
        }
        const nextStartTime = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
        const audioBuffer = await apiService.decodeAudioData(apiService.decode(base64Audio), outputCtx, 24000, 1);
        const source = outputCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(outputCtx.destination);
        source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
        source.start(nextStartTime);
        nextStartTimeRef.current = nextStartTime + audioBuffer.duration;
        sourcesRef.current.add(source);
    }
    
    if (message.serverContent?.interrupted) {
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }
  }, [currentUser]);
  
  const startSession = useCallback(async () => {
    setMessages(prev => [...prev, { sender: 'model', text: 'Listening...', isListening: true }]);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        microphoneStreamRef.current = stream;

        inputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
        
        const callbacks = {
            onopen: () => {
                const source = inputAudioContextRef.current.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                scriptProcessorRef.current = scriptProcessor;

                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = apiService.createPcmBlob(inputData);
                    if (sessionPromiseRef.current) {
                         sessionPromiseRef.current.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    }
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContextRef.current.destination);
                setIsVoiceSessionActive(true);
            },
            onmessage: onVoiceMessage,
            onerror: (e) => {
                console.error('Voice session error:', e);
                setMessages(prev => [...prev.filter(m => !m.isListening), { sender: 'model', text: 'Voice chat error. Please try again.' }]);
                stopSession();
            },
            onclose: () => {
                stopSession();
            }
        };
        sessionPromiseRef.current = apiService.startVoiceSession(callbacks);
    } catch (error) {
        console.error('Failed to start voice session:', error);
        setMessages(prev => [...prev.filter(m => !m.isListening), { sender: 'model', text: 'Could not access microphone.' }]);
    }
  }, [stopSession, onVoiceMessage]);
  
  const handleToggleVoiceChat = useCallback(() => {
    if (isVoiceSessionActive) {
        stopSession();
    } else {
        startSession();
    }
  }, [isVoiceSessionActive, startSession, stopSession]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
    }
  };

  const handleSendMessage = useCallback(async (messageText) => {
    if (!messageText.trim() || isLoading) return;
    
    const userMessage = { sender: 'user', text: messageText };
    if (file) {
        userMessage.file = file.name;
    }
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    const currentFile = file;
    setFile(null); 
    setIsLoading(true);

    try {
      const result = await apiService.sendChatMessage(chat, messageText, currentFile, useWebSearch);

      if (result.isStream) {
        let responseText = '';
        setMessages(prev => [...prev, { sender: 'model', text: '' }]);
        for await (const chunk of result.stream) {
          responseText += chunk.text;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = responseText;
            return newMessages;
          });
        }
        if (currentUser) {
            const historyItem = { user: messageText, model: responseText, file: currentFile ? currentFile.name : null, sources: [] };
            historyService.addHistoryItem(currentUser.email, SERVICE_ID, historyItem);
            setHistory(historyService.getHistory(currentUser.email, SERVICE_ID));
        }
      } else {
        const modelMessage = { sender: 'model', text: result.text, sources: result.sources };
        setMessages(prev => [...prev, modelMessage]);
        if (currentUser) {
            const historyItem = { user: messageText, model: result.text, file: currentFile ? currentFile.name : null, sources: result.sources };
            historyService.addHistoryItem(currentUser.email, SERVICE_ID, historyItem);
            setHistory(historyService.getHistory(currentUser.email, SERVICE_ID));
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { sender: 'model', text: t.errorOccurred }]);
    } finally {
      setIsLoading(false);
    }
  }, [chat, file, useWebSearch, isLoading, t.errorOccurred, currentUser]);

  const handleHistoryItemClick = (item) => {
      setChat(apiService.createChatSession());
      const newMessages = [
        { sender: 'user', text: item.user, file: item.file },
        { sender: 'model', text: item.model, sources: item.sources }
      ];
      setMessages(newMessages);
      setIsHistoryOpen(false);
  };

  const handleClearHistory = () => {
    if (currentUser) {
        setHistory(historyService.clearHistory(currentUser.email, SERVICE_ID));
    }
  };

  const renderHistoryItem = (item) => (
    React.createElement('div', {
        key: item.id,
        onClick: () => handleHistoryItemClick(item),
        className: "p-3 bg-dark-card-solid border border-dark-border rounded-lg cursor-pointer hover:bg-white/10"
      },
        React.createElement('p', { className: "text-sm font-semibold text-brand-text truncate" }, item.user),
        React.createElement('p', { className: "text-xs text-brand-text-light mt-1 truncate" }, item.model)
    )
  );

  return React.createElement('div', { ref: fullscreenRef, className: "h-full flex flex-col relative bg-dark-card text-white printable-container" },
    React.createElement(FeatureToolbar, {
        title: t.assistantTitle,
        containerRef: fullscreenRef,
        onZoomIn: handleZoomIn,
        onZoomOut: handleZoomOut,
        onToggleEdit: handleToggleEdit,
        isEditing: isEditing,
        onExport: handleExport
    }),
    React.createElement('div', { className: 'flex-grow p-6 min-h-0 overflow-y-auto' },
        React.createElement('div', {
            ref: contentRef,
            className: 'printable-content h-full flex flex-col',
            style: { transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.2s ease' },
            contentEditable: isEditing,
            suppressContentEditableWarning: true
        },
            currentUser && React.createElement('button', {
                onClick: () => setIsHistoryOpen(true),
                'aria-label': t.history,
                className: `absolute top-5 ${language === 'ar' ? 'left-24' : 'right-24'} z-10 p-2 text-brand-text-light hover:bg-white/20 rounded-full transition-colors non-printable`
            },
            React.createElement(HistoryIcon, null)
            ),
            React.createElement('div', { className: "flex flex-col flex-grow bg-dark-card-solid/80 rounded-2xl overflow-hidden" },
                React.createElement('div', { ref: chatContainerRef, className: "flex-grow p-4 space-y-4 overflow-y-auto" },
                    messages.map((msg, index) => (
                    React.createElement('div', { key: index, className: `flex ${msg.sender === 'user' ? (language === 'ar' ? 'justify-start' : 'justify-end') : (language === 'ar' ? 'justify-end' : 'justify-start')}` },
                        React.createElement('div', { className: `relative max-w-xl p-3 rounded-2xl shadow-md ${msg.sender === 'user' ? 'bg-brand-purple text-white' : 'bg-dark-card text-brand-text'}` },
                        msg.file && React.createElement('div', {className: "text-xs italic opacity-80 mb-1 border-b border-white/20 pb-1"}, `Attached: ${msg.file}`),
                        React.createElement('p', { className: `whitespace-pre-wrap` }, msg.text),
                        msg.sources && msg.sources.length > 0 && (
                            React.createElement('div', { className: "mt-3 pt-2 border-t border-white/20" },
                            React.createElement('h4', { className: "font-semibold text-sm mb-1" }, t.sources),
                            React.createElement('div', { className: "flex flex-wrap gap-2" },
                                msg.sources.map((source, i) => (
                                React.createElement('a', { key: i, href: source.web?.uri, target: "_blank", rel: "noopener noreferrer", className: "text-xs bg-white/10 hover:bg-white/20 py-1 px-2 rounded-full transition-colors truncate" },
                                    source.web?.title || new URL(source.web?.uri || '').hostname
                                )
                                ))
                            )
                            )
                        )
                        )
                    )
                    )),
                    isLoading && (
                    React.createElement('div', { className: "flex justify-start p-4" },
                        React.createElement('div', { className: "bg-dark-card p-3 rounded-2xl flex items-center space-x-2" },
                        React.createElement(Spinner, { size: "5" }),
                        React.createElement('span', { className: "text-brand-text-light" }, t.thinking)
                        )
                    )
                    )
                ),
                React.createElement('div', { className: "p-4 border-t border-dark-border bg-dark-card/50 non-printable" },
                    !isGeminiConfigured && React.createElement('div', { className: "text-center bg-red-500/10 p-2 rounded-md mb-2 text-xs text-red-400 font-semibold" },
                        "Gemini API Key is not configured."
                    ),
                    file && React.createElement('div', { className: "flex items-center justify-between bg-black/20 text-sm py-1 px-3 rounded-md mb-2" },
                        React.createElement('span', { className: "truncate" }, file.name),
                        React.createElement('button', { onClick: () => setFile(null) }, React.createElement(CloseIcon, { className: "h-4 w-4" }))
                    ),
                    React.createElement('div', { className: 'space-y-2' },
                        React.createElement('div', { className: `flex items-end gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}` },
                            React.createElement('button', {
                                onClick: handleToggleVoiceChat,
                                disabled: !isGeminiConfigured,
                                'aria-label': isVoiceSessionActive ? 'Stop voice chat' : 'Start voice chat',
                                className: `h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${isVoiceSessionActive ? 'bg-red-500 text-white animate-pulse-fast' : 'bg-dark-card-solid text-brand-text-light hover:bg-white/10'}`
                            }, React.createElement(MicrophoneIcon, { className: "h-5 w-5" })),
                            React.createElement('div', { className: `relative flex items-center flex-grow` },
                                React.createElement('textarea', {
                                    value: userInput, onChange: (e) => setUserInput(e.target.value),
                                    onKeyDown: (e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(userInput);
                                        }
                                    },
                                    placeholder: isVoiceSessionActive ? "Listening..." : "Ask about project status...",
                                    rows: 1,
                                    className: "w-full bg-dark-bg border border-dark-border rounded-full py-2.5 resize-none focus:ring-2 focus:ring-brand-purple focus:outline-none transition-all shadow-inner placeholder-slate-500 text-white disabled:bg-slate-800/70",
                                    style: language === 'ar' ? { paddingLeft: '3.5rem', paddingRight: '1rem' } : { paddingLeft: '1rem', paddingRight: '3.5rem' },
                                    disabled: isLoading || !isGeminiConfigured || isVoiceSessionActive
                                }),
                                React.createElement('button', {
                                    onClick: () => handleSendMessage(userInput), disabled: !userInput.trim() || isLoading || !isGeminiConfigured || isVoiceSessionActive,
                                    className: `absolute h-8 w-8 rounded-full flex items-center justify-center bg-button-gradient hover:opacity-90 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all ${language === 'ar' ? 'left-2' : 'right-2'}`
                                }, React.createElement(SendIcon, { className: "h-5 w-5 text-white" }))
                            )
                        ),
                        !isVoiceSessionActive && React.createElement('div', { className: `flex items-center justify-between mt-2 px-2 ${language === 'ar' ? 'flex-row-reverse' : ''}` },
                            React.createElement('button', { onClick: () => fileInputRef.current?.click(), className: "flex items-center gap-2 text-sm text-brand-text-light hover:text-white transition-colors"},
                                React.createElement(AttachIcon, { className: "h-5 w-5"}), t.attachFile
                            ),
                            React.createElement('input', { type: "file", ref: fileInputRef, onChange: handleFileChange, className: "hidden" }),
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('label', { htmlFor: "web-search", className: 'text-sm text-brand-text-light cursor-pointer' }, t.searchWeb),
                                React.createElement('input', { type: "checkbox", id: "web-search", checked: useWebSearch, onChange: (e) => setUseWebSearch(e.target.checked),
                                    className: "w-4 h-4 rounded text-brand-purple bg-dark-card-solid border-dark-border focus:ring-brand-purple"
                                })
                            )
                        )
                    )
                )
            )
        )
    ),
    currentUser && React.createElement(HistoryPanel, {
        isOpen: isHistoryOpen,
        onClose: () => setIsHistoryOpen(false),
        title: t.history,
        items: history,
        renderItem: renderHistoryItem,
        onClear: handleClearHistory,
        language: language
    })
  );
};

export default AssistantView;