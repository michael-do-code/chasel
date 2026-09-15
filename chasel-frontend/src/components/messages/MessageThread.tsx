import { Fragment, useEffect, useRef } from 'react';
import Avatar from '../editorial/Avatar';
import type { Conversation, Message } from '../../data/conversations';

interface MessageThreadProps {
  conversation: Conversation;
  onViewListing: (listingId: number) => void;
}

/** The inline reference to the listing being negotiated. */
function ListingChip({
  conversation,
  onViewListing,
}: MessageThreadProps) {
  const { listing } = conversation;

  return (
    <button
      type="button"
      className="messages-listing-chip"
      onClick={() => onViewListing(listing.id)}
    >
      <span
        className="messages-listing-chip-thumb"
        style={listing.imageUrl ? { backgroundImage: `url(${listing.imageUrl})` } : undefined}
        aria-hidden="true"
      />
      <span>
        <span className="messages-listing-chip-label">Listing</span>
        <span className="messages-listing-chip-title">{listing.title}</span>
        <span className="messages-listing-chip-brand">{listing.brand}</span>
      </span>
    </button>
  );
}

/** Centre column: the correspondence itself, grouped by day. */
function MessageThread({ conversation, onViewListing }: MessageThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pin the newest message when switching threads or sending. Scrolling the
  // container directly rather than via scrollIntoView keeps the page itself
  // from jumping.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (scroller) scroller.scrollTop = scroller.scrollHeight;
  }, [conversation.id, conversation.messages.length]);

  const renderMessage = (message: Message, index: number, all: Message[]) => {
    // A day divider appears whenever the day changes from the previous message.
    const showDay = index === 0 || all[index - 1].day !== message.day;

    return (
      <Fragment key={message.id}>
        {showDay && (
          <p className="messages-day">
            <span>{message.day}</span>
          </p>
        )}

        {message.attachedListing && (
          <ListingChip conversation={conversation} onViewListing={onViewListing} />
        )}

        <div className={`messages-row messages-row-${message.author}`}>
          <div className="messages-bubble">{message.body}</div>
          <p className="messages-stamp">
            {message.time}
            {message.author === 'me' && message.read && (
              <span className="messages-receipt" title="Read">✓✓</span>
            )}
          </p>
        </div>
      </Fragment>
    );
  };

  return (
    <section className="messages-thread" aria-label={`Conversation with ${conversation.name}`}>
      <header className="messages-thread-header">
        <Avatar name={conversation.name} online={conversation.online} />
        <div>
          <h2>{conversation.name}</h2>
          <p className="ed-kicker">
            {conversation.online ? 'Online now' : 'Offline'} · {conversation.location}
          </p>
        </div>
        <button
          type="button"
          className="ed-btn ed-btn-outline"
          onClick={() => onViewListing(conversation.listing.id)}
        >
          View listing
        </button>
      </header>

      <div className="messages-scroll" ref={scrollRef}>
        {conversation.messages.map(renderMessage)}

        {conversation.typing && (
          <p className="messages-typing" aria-live="polite">
            <span className="messages-typing-dots" aria-hidden="true">
              <i /><i /><i />
            </span>
            {conversation.name} is typing…
          </p>
        )}

      </div>
    </section>
  );
}

export default MessageThread;
