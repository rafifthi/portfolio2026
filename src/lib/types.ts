export interface WindowState {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
}

export interface AppDefinition {
  id: string;
  name: string;
  icon: string;
  color: string;
  component: React.ComponentType<{ windowId: string; onClose: () => void }>;
}

export interface DesktopItem {
  id: string;
  label: string;
  image: string;
  x: number;
  y: number;
  width: number;
  appId: string;
}

export interface FinderItem {
  id: string;
  name: string;
  type: "folder" | "file" | "image" | "pdf" | "app";
  date: string;
  size?: string;
}

export interface Note {
  id: string;
  folder: string;
  title: string;
  content: string;
  date: string;
}

export interface Photo {
  id: string;
  src: string;
  title: string;
  date: string;
}

export interface MailMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: string;
  read: boolean;
}

export interface TerminalLine {
  id: string;
  type: "input" | "output" | "error";
  text: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: string;
  color: string;
  cover: string;
  songs: Song[];
}

export interface Song {
  id: string;
  title: string;
  duration: string;
  track: number;
  audioUrl: string;
}

export interface Playlist {
  id: string;
  name: string;
  icon: string;
  color: string;
  songIds: string[];
}

export type NotionBlock =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "blockquote"; text: string }
  | { type: "bulleted_list"; items: string[] }
  | { type: "numbered_list"; items: string[] }
  | { type: "code"; language: string; code: string }
  | { type: "callout"; icon: string; text: string }
  | { type: "divider" }
  | { type: "image"; src: string; caption?: string };

export interface StudyCase {
  id: string;
  title: string;
  banner: string;
  meta: { label: string; value: string }[];
  blocks: NotionBlock[];
}
