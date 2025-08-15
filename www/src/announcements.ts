import { StorageKeysEnum, getStorage, setStorage } from './storage';

export const AnnouncementsEnum = {
  Opening: 'opening',
  Surroundings: 'surroundings',
  None: 'none',
} as const;

type Announcement = (typeof AnnouncementsEnum)[keyof typeof AnnouncementsEnum];

const ORDERED_ANNOUNCEMENTS = [
  AnnouncementsEnum.Opening,
  AnnouncementsEnum.Surroundings,
  AnnouncementsEnum.None,
] as const;

export const getAnnouncement = () => {
  return getStorage(StorageKeysEnum.ANNOUNCEMENT);
};

const setAnnouncement = (announcement: Announcement) => {
  setStorage(StorageKeysEnum.ANNOUNCEMENT, announcement);
};

export const initializeAnnouncements = () => {
  const currentAnnouncement = getAnnouncement();

  if (!currentAnnouncement) {
    setAnnouncement(AnnouncementsEnum.Opening);
  }
};

export const advanceAnnouncements = () => {
  const currentAnnouncement = getStorage(StorageKeysEnum.ANNOUNCEMENT);

  const announcementIdx =
    ORDERED_ANNOUNCEMENTS.findIndex((a) => a === currentAnnouncement) || 0;
  const nextAnnouncementIdx = Math.min(
    announcementIdx + 1,
    ORDERED_ANNOUNCEMENTS.length - 1,
  );

  const nextAnnouncement = ORDERED_ANNOUNCEMENTS[nextAnnouncementIdx];

  setStorage(
    StorageKeysEnum.ANNOUNCEMENT,
    nextAnnouncement || AnnouncementsEnum.None,
  );
};

export const announcementFactory = (sentences: string[]) => {
  // state for announcementAdvancer
  let isInitialized = false;
  let sentenceIdx = 0;
  let isReadyToAdvance = false;

  // state for charAdvancer
  let charIdx = 0;

  const getNextSentence = () => {
    charIdx = 0;
    // don't increment index if this is the same sentence but fast forwarded
    sentenceIdx = isReadyToAdvance
      ? Math.min(sentenceIdx + 1, sentences.length - 1)
      : sentenceIdx;

    if (!isInitialized) {
      isInitialized = true;
    } else {
      // flip isReadyToAdvance so next execution will quick finish the sentence
      isReadyToAdvance = !isReadyToAdvance;
    }

    return {
      isDone: sentenceIdx === sentences.length - 1,
    };
  };

  const getStreamingSentence = () => {
    const sentence = sentences[sentenceIdx] || '';
    charIdx = isReadyToAdvance
      ? sentence.length
      : Math.min(charIdx + 1, sentence.length);

    isReadyToAdvance = charIdx >= sentence.length - 1;
    return {
      content: sentence.slice(0, charIdx),
      isSentenceComplete: isReadyToAdvance,
    };
  };

  return {
    getNextSentence,
    getStreamingSentence,
  };
};
