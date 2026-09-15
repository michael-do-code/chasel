import type { Listing } from '../types/listing';

/*
 * Placeholder correspondence data.
 *
 * The backend has no messaging domain yet (no Message/Conversation model or
 * controller under `com.app.chasel`), so the Messages page runs on this
 * scripted sample. `hydrateConversations` swaps the referenced listings for
 * real ones from `GET /listings` when any exist, so the page shows live
 * inventory even though the thread copy is fixed. Replace this module with an
 * API call once a `/messages` endpoint lands — the component contracts below
 * are what that endpoint should return.
 */

/** The listing a conversation is negotiating over. */
export interface ConversationListing {
  id: number;
  title: string;
  brand: string;
  price: number;
  size: string;
  condition: string;
  imageUrl?: string;
}

export interface Message {
  id: string;
  /** `me` renders right-aligned in ink; `them` left-aligned on paper. */
  author: 'me' | 'them';
  body: string;
  /** Display time, e.g. "10:24". */
  time: string;
  /** Day bucket the message belongs to, e.g. "Today". */
  day: string;
  /** Shows the read receipt on an outgoing message. */
  read?: boolean;
  /** Renders the inline listing reference above the bubble. */
  attachedListing?: boolean;
}

export type ConversationFolder = 'offers' | 'sales' | 'general';

export interface Conversation {
  id: string;
  name: string;
  location: string;
  online: boolean;
  unread: number;
  /** Display recency, e.g. "2h", "Yesterday", "2 days". */
  lastActivity: string;
  folder: ConversationFolder;
  /** Whether the counterparty is currently typing. */
  typing?: boolean;
  listing: ConversationListing;
  messages: Message[];
  /** Seller shown in the detail rail. */
  seller: { name: string; sales: number; rating: number };
}

export const SAMPLE_CONVERSATIONS: Conversation[] = [
  {
    id: 'julien',
    name: 'Julien R.',
    location: 'Antwerp, BE',
    online: true,
    unread: 2,
    lastActivity: '2h',
    folder: 'offers',
    typing: true,
    listing: {
      id: 1,
      title: 'Heavy Wool Trouser',
      brand: 'The Row',
      price: 480,
      size: '32',
      condition: 'Very good',
    },
    seller: { name: 'Ines M.', sales: 34, rating: 4.9 },
    messages: [
      {
        id: 'julien-1',
        author: 'them',
        day: 'Today',
        time: '10:24',
        body: "Hi Ines — I've been watching this trouser for a while. Is it still available?",
      },
      {
        id: 'julien-2',
        author: 'me',
        day: 'Today',
        time: '10:31',
        read: true,
        body: 'Hello Julien. Yes, still available — did you have a number in mind?',
      },
      {
        id: 'julien-3',
        author: 'them',
        day: 'Today',
        time: '10:33',
        attachedListing: true,
        body: 'I was thinking $440 including shipping to Antwerp — let me know.',
      },
      {
        id: 'julien-4',
        author: 'them',
        day: 'Today',
        time: '10:34',
        body: 'Would you take $440 shipped for the trouser?',
      },
    ],
  },
  {
    id: 'kenji',
    name: 'Kenji A.',
    location: 'Osaka, JP',
    online: false,
    unread: 0,
    lastActivity: 'Yesterday',
    folder: 'sales',
    listing: {
      id: 2,
      title: 'Archive Chelsea Boot 02',
      brand: 'Margiela',
      price: 620,
      size: '42',
      condition: 'Excellent',
    },
    seller: { name: 'Ines M.', sales: 34, rating: 4.9 },
    messages: [
      {
        id: 'kenji-1',
        author: 'them',
        day: 'Yesterday',
        time: '16:02',
        attachedListing: true,
        body: 'Could you show the sole before it ships? Want to check the resoling.',
      },
      {
        id: 'kenji-2',
        author: 'me',
        day: 'Yesterday',
        time: '18:40',
        read: true,
        body: 'Of course — taking them out of the box now.',
      },
      {
        id: 'kenji-3',
        author: 'them',
        day: 'Yesterday',
        time: '18:44',
        body: 'Sending additional photos of the resoling now.',
      },
    ],
  },
  {
    id: 'yara',
    name: 'Yara D.',
    location: 'Lisbon, PT',
    online: false,
    unread: 0,
    lastActivity: '2 days',
    folder: 'offers',
    listing: {
      id: 3,
      title: 'Architectural Silk Blouse',
      brand: 'Lemaire',
      price: 280,
      size: 'M',
      condition: 'Excellent',
    },
    seller: { name: 'Ines M.', sales: 34, rating: 4.9 },
    messages: [
      {
        id: 'yara-1',
        author: 'them',
        day: '2 days ago',
        time: '09:15',
        attachedListing: true,
        body: 'Happy with $260 shipped. Shall I send an invoice?',
      },
      {
        id: 'yara-2',
        author: 'me',
        day: '2 days ago',
        time: '11:02',
        read: true,
        body: "That works for me — send it over and I'll settle today.",
      },
    ],
  },
  {
    id: 'sofia',
    name: 'Sofia L.',
    location: 'Milan, IT',
    online: false,
    unread: 0,
    lastActivity: '5 days',
    folder: 'sales',
    listing: {
      id: 4,
      title: 'Ribbed Cashmere Knit',
      brand: 'Loro Piana',
      price: 340,
      size: 'S',
      condition: 'Very good',
    },
    seller: { name: 'Ines M.', sales: 34, rating: 4.9 },
    messages: [
      {
        id: 'sofia-1',
        author: 'them',
        day: '5 days ago',
        time: '14:20',
        attachedListing: true,
        body: 'Payment received — sending tracking tomorrow morning.',
      },
    ],
  },
];

/**
 * Points each sample conversation at a real listing where one is available,
 * so the thread and detail rail show live inventory and working images.
 */
export function hydrateConversations(
  conversations: Conversation[],
  listings: Listing[]
): Conversation[] {
  if (listings.length === 0) return conversations;

  return conversations.map((conversation, index) => {
    const listing = listings[index % listings.length];

    return {
      ...conversation,
      listing: {
        id: listing.id,
        title: listing.title,
        brand: listing.brand,
        price: listing.price,
        size: listing.size ?? conversation.listing.size,
        condition: listing.condition,
        imageUrl: listing.imageUrls?.[0],
      },
    };
  });
}

/** Preview line shown in the conversation list. */
export const lastMessageOf = (conversation: Conversation) =>
  conversation.messages[conversation.messages.length - 1];
