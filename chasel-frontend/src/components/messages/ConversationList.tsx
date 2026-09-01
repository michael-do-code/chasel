import Avatar from '../editorial/Avatar';
import FilterTabs from '../editorial/FilterTabs';
import type { FilterOption } from '../editorial/FilterTabs';
import { lastMessageOf } from '../../data/conversations';
import type { Conversation } from '../../data/conversations';

export type FolderFilter = 'all' | 'unread' | 'offers' | 'sales';

const FOLDER_OPTIONS: FilterOption<FolderFilter>[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'offers', label: 'Offers' },
  { value: 'sales', label: 'Sales' },
];

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  folder: FolderFilter;
  onFolderChange: (folder: FolderFilter) => void;
}

/** Left column: search, folder tabs, and the conversation rows. */
function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  folder,
  onFolderChange,
}: ConversationListProps) {
  return (
    <aside className="messages-list" aria-label="Conversations">
      <div className="messages-search">
        <span className="messages-search-icon" aria-hidden="true" />
        <input
          type="search"
          value={search}
          placeholder="Search conversations"
          aria-label="Search conversations"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <FilterTabs
        ariaLabel="Filter conversations"
        variant="underline"
        options={FOLDER_OPTIONS}
        value={folder}
        onChange={onFolderChange}
      />

      <div className="messages-rows">
        {conversations.length === 0 && (
          <p className="messages-list-empty">No conversations here.</p>
        )}

        {conversations.map((conversation) => {
          const preview = lastMessageOf(conversation);
          const isSelected = conversation.id === selectedId;

          return (
            <button
              type="button"
              key={conversation.id}
              className={`ed-conversation ${isSelected ? 'active' : ''}`}
              aria-current={isSelected}
              onClick={() => onSelect(conversation.id)}
            >
              <Avatar name={conversation.name} online={conversation.online} />

              <span className="ed-conversation-body">
                <span className="ed-conversation-top">
                  <span className="ed-conversation-name">{conversation.name}</span>
                  <span className="ed-conversation-time">{conversation.lastActivity}</span>
                  {conversation.unread > 0 && (
                    <span className="ed-conversation-unread">
                      {conversation.unread}
                      <span className="visually-hidden"> unread messages</span>
                    </span>
                  )}
                </span>
                <span className="ed-conversation-subject">re: {conversation.listing.title}</span>
                <span className="ed-conversation-preview">{preview?.body}</span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export default ConversationList;
