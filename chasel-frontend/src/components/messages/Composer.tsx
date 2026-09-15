import { useState } from 'react';

interface ComposerProps {
  recipient: string;
  onSend: (body: string) => void;
}

/** Bottom of the centre column: attach, write, send. */
function Composer({ recipient, onSend }: ComposerProps) {
  const [draft, setDraft] = useState('');
  const canSend = draft.trim().length > 0;

  const send = () => {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft('');
  };

  return (
    <form
      className="messages-composer"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <button type="button" className="messages-attach" aria-label="Attach a file">
        ⏝
      </button>

      <textarea
        rows={1}
        value={draft}
        placeholder={`Message ${recipient}…`}
        aria-label={`Message ${recipient}`}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          // Enter sends; Shift+Enter starts a new line.
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
      />

      <button type="submit" className="messages-send" disabled={!canSend} aria-label="Send message">
        ➤
      </button>
    </form>
  );
}

export default Composer;
