import { FormEvent, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { timeAgo } from '../utils';

export default function ChatsPage() {
  const { threads, activeUid, activeMessages, openThread, sendMessage } = useChatStore();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const activeThread = threads.find((t) => t.uid === activeUid);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!activeUid || !text.trim()) return;
    setSending(true);
    try {
      await sendMessage(activeUid, text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Chats de soporte</h1>
      </div>

      <div className="chat-layout">
        <div className="chat-thread-list">
          {threads.length === 0 && <p style={{ color: 'var(--text-faint)', padding: 12 }}>Sin conversaciones todavía.</p>}
          {threads.map((t) => (
            <button
              key={t.uid}
              className={`chat-thread-item${activeUid === t.uid ? ' active' : ''}`}
              onClick={() => openThread(t.uid)}
            >
              <div className="row-icon" style={{ width: 38, height: 38, fontSize: 15 }}>
                {t.clientName.charAt(0).toUpperCase()}
              </div>
              <div className="row-info">
                <p className="row-title">{t.clientName}</p>
                <p className="row-sub" style={{ whiteSpace: 'normal' }}>{t.lastMessageText}</p>
              </div>
              {t.unreadByAdmin && <span className="chat-unread-dot" />}
            </button>
          ))}
        </div>

        <div className="chat-panel">
          {!activeThread ? (
            <div className="empty-box" style={{ margin: 'auto' }}>
              <p className="empty-title">Elegí una conversación</p>
            </div>
          ) : (
            <>
              <div className="chat-panel-header">
                <p className="row-title" style={{ margin: 0 }}>{activeThread.clientName}</p>
              </div>
              <div className="chat-messages">
                {activeMessages.map((m) => (
                  <div key={m.id} className={`chat-bubble-row${m.senderRole === 'admin' ? ' mine' : ''}`}>
                    <div className={`chat-bubble${m.senderRole === 'admin' ? ' mine' : ''}`}>
                      <p style={{ margin: 0 }}>{m.text}</p>
                      <span className="chat-bubble-time">{timeAgo(m.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <form className="chat-input-row" onSubmit={handleSend}>
                <input
                  className="input"
                  aria-label="Respuesta"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Escribí una respuesta…"
                />
                <button className="btn btn-primary btn-sm" type="submit" disabled={sending || !text.trim()}>
                  Enviar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
