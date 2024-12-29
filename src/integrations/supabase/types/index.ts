export interface JumbleWord {
  id: string;
  puzzle_id: string;
  jumbled_word: string;
  answer: string;
  created_at: string;
}

export interface DailyPuzzle {
  id: string;
  date: string;
  caption: string;
  image_url: string;
  solution: string;
  created_at: string;
  final_jumble: string | null;
  final_jumble_answer: string | null;
  jumble_words: JumbleWord[];
}

export * from './admin.types';
export * from './base.types';
export * from './database.types';
export * from './model.types';
export * from './puzzle.types';
export * from './table.types';