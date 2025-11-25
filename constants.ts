import { CardColor, CardValue } from './types';

export const COLOR_MAP: Record<CardColor, string> = {
  [CardColor.RED]: 'bg-red-500',
  [CardColor.BLUE]: 'bg-blue-500',
  [CardColor.GREEN]: 'bg-green-500',
  [CardColor.YELLOW]: 'bg-yellow-400',
  [CardColor.WILD]: 'bg-slate-900 border-2 border-white',
  
  [CardColor.ORANGE]: 'bg-orange-500',
  [CardColor.PINK]: 'bg-pink-500',
  [CardColor.TEAL]: 'bg-teal-500',
  [CardColor.PURPLE]: 'bg-purple-600',
  [CardColor.WILD_DARK]: 'bg-slate-950 border-2 border-neon-pink', // Custom style needed
};

export const TEXT_COLOR_MAP: Record<CardColor, string> = {
  [CardColor.RED]: 'text-white',
  [CardColor.BLUE]: 'text-white',
  [CardColor.GREEN]: 'text-white',
  [CardColor.YELLOW]: 'text-black',
  [CardColor.WILD]: 'text-white',
  
  [CardColor.ORANGE]: 'text-white',
  [CardColor.PINK]: 'text-white',
  [CardColor.TEAL]: 'text-black',
  [CardColor.PURPLE]: 'text-white',
  [CardColor.WILD_DARK]: 'text-white',
};

// Map logical color to a displayable name
export const COLOR_NAMES: Record<CardColor, string> = {
  [CardColor.RED]: 'Red',
  [CardColor.BLUE]: 'Blue',
  [CardColor.GREEN]: 'Green',
  [CardColor.YELLOW]: 'Yellow',
  [CardColor.WILD]: 'Wild',
  [CardColor.ORANGE]: 'Orange',
  [CardColor.PINK]: 'Pink',
  [CardColor.TEAL]: 'Teal',
  [CardColor.PURPLE]: 'Purple',
  [CardColor.WILD_DARK]: 'Wild',
};

// For Gemini Prompting
export const GAME_MODE_DESCRIPTIONS = {
  CLASSIC: "Standard UNO rules.",
  NO_MERCY: "Brutal rules: +2 stacks on +4, Mercy rule (elimination at 25 cards), 7 swaps hands, 0 passes hands.",
  FLIP: "Double-sided cards. Light side is normal, Dark side has harsh penalties like +5 and Skip Everyone.",
  SPEED: "No turns needed if you have an exact match. Be fast!",
};