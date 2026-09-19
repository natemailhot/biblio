import type { CanonScope } from "@/lib/types";
import { normalizeAnswer } from "@/lib/answers/normalize";

// 66-book Protestant canon, in canonical order.
export const PROTESTANT_66_BOOKS: string[] = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation",
];

// 73-book Catholic canon: the Protestant 39 Old Testament books plus the
// seven deuterocanonical books, in traditional (e.g. NAB) reading order,
// followed by the same 27 New Testament books.
export const CATHOLIC_73_BOOKS: string[] = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Tobit", "Judith", "Esther", "1 Maccabees",
  "2 Maccabees", "Job", "Psalms", "Proverbs", "Ecclesiastes",
  "Song of Solomon", "Wisdom", "Sirach", "Isaiah", "Jeremiah",
  "Lamentations", "Baruch", "Ezekiel", "Daniel", "Hosea",
  "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah",
  "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation",
];

const NEW_TESTAMENT_BOOK_COUNT = 27;

// Both canon lists end with the same 27 New Testament books, in the same
// order, so testament lookup is a simple tail check regardless of canon.
export function getTestamentForBook(canonScope: CanonScope, book: string): "Old" | "New" | null {
  const books = getBooksForCanon(canonScope);
  const normalized = normalizeAnswer(book);
  const index = books.findIndex((b) => normalizeAnswer(b) === normalized);
  if (index === -1) return null;
  return index >= books.length - NEW_TESTAMENT_BOOK_COUNT ? "New" : "Old";
}

export function getBooksForCanon(canonScope: CanonScope): string[] {
  switch (canonScope) {
    case "catholic-73":
      return CATHOLIC_73_BOOKS;
    case "protestant-66":
      return PROTESTANT_66_BOOKS;
    default:
      // Orthodox/custom canons aren't modeled yet; fall back to the wider
      // Catholic list so a valid book is never rejected client-side.
      return CATHOLIC_73_BOOKS;
  }
}
