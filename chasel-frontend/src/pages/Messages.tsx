import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PageHeading from '../components/editorial/PageHeading';
import ConversationList from '../components/messages/ConversationList';
import type { FolderFilter } from '../components/messages/ConversationList';
import MessageThread from '../components/messages/MessageThread';
import ConversationDetail from '../components/messages/ConversationDetail';
import Composer from '../components/messages/Composer';
import {
  SAMPLE_CONVERSATIONS,
  hydrateConversations,
  lastMessageOf,
} from '../data/conversations';
import type { Conversation } from '../data/conversations';
import type { Listing } from '../types/listing';
import './Messages.css';

const timeNow = () =>
  new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

/**
 * Direct correspondence between buyer and seller.
 *
 * There is no messaging API yet, so threads come from `data/conversations`
 * and sends are applied to local state only. The listings shown in each
 * thread are hydrated from the real catalogue when it loads.
 */
function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>(SAMPLE_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState(SAMPLE_CONVERSATIONS[0].id);
  const [folder, setFolder] = useState<FolderFilter>('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get<Listing[]>('/listings')
      .then((response) =>
        setConversations((current) => hydrateConversations(current, response.data))
      )
      .catch((error) => console.error('Could not load listings for messages:', error));
  }, []);

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return conversations.filter((conversation) => {
      const matchesFolder =
        folder === 'all' ||
        (folder === 'unread' ? conversation.unread > 0 : conversation.folder === folder);

      const haystack = [
        conversation.name,
        conversation.listing.title,
        conversation.listing.brand,
        lastMessageOf(conversation)?.body,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesFolder && (!query || haystack.includes(query));
    });
  }, [conversations, folder, search]);

  const selected =
    conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];

  /** Opening a thread clears its unread count. */
  const openConversation = (id: string) => {
    setSelectedId(id);
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === id ? { ...conversation, unread: 0 } : conversation
      )
    );
  };

  const sendMessage = (body: string) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id !== selected.id
          ? conversation
          : {
              ...conversation,
              lastActivity: 'now',
              messages: [
                ...conversation.messages,
                {
                  id: `${conversation.id}-${Date.now()}`,
                  author: 'me' as const,
                  body,
                  day: 'Today',
                  time: timeNow(),
                  read: false,
                },
              ],
            }
      )
    );
  };

  const respondToOffer = (response: 'accept' | 'counter' | 'decline') => {
    const replies = {
      accept: `Accepted — ${selected.listing.title} is yours. I'll send the invoice shortly.`,
      counter: `Thanks for the offer on the ${selected.listing.title}. Could we meet in the middle?`,
      decline: `I'll hold at ${selected.listing.price} for now, but thank you for the offer.`,
    };

    sendMessage(replies[response]);
  };

  return (
    <div className="messages">
      <div className="messages-shell">
        <PageHeading
          kicker="Direct correspondence"
          title="Messages"
          size="panel"
        />

        <hr className="ed-rule messages-rule" />

        <div className="messages-layout">
          <ConversationList
            conversations={visibleConversations}
            selectedId={selected.id}
            onSelect={openConversation}
            search={search}
            onSearchChange={setSearch}
            folder={folder}
            onFolderChange={setFolder}
          />

          <div className="messages-centre">
            <MessageThread
              conversation={selected}
              onViewListing={(listingId) => navigate(`/items/${listingId}`)}
            />
            <Composer recipient={selected.name} onSend={sendMessage} />
          </div>

          <ConversationDetail
            conversation={selected}
            onViewListing={(listingId) => navigate(`/items/${listingId}`)}
            onRespondToOffer={respondToOffer}
          />
        </div>
      </div>
    </div>
  );
}

export default Messages;
