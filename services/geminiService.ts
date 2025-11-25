import { GameState } from "../types";

// Static responses to replace AI
const TIPS = [
  "Match the color or the number!",
  "Save your Wild cards for emergencies.",
  "Try to keep a Skip card to block the next player.",
  "If you have a +2, play it now!",
  "Don't forget to call UNO (mentally)!",
  "Watch the turn order closely.",
  "In Speed mode, you gotta be fast!",
  "Dark side cards are more powerful, use them wisely."
];

const TAUNTS = [
  "Take that!",
  "Hope you like drawing cards!",
  "Skip you!",
  "Not so fast!",
  "My turn now!",
  "Better luck next time!",
  "Uno moment!",
  "You didn't see that coming!",
  "Just as I planned."
];

export const getStrategicAdvice = async (state: GameState): Promise<string> => {
  // Simple random advice since we removed the AI
  return TIPS[Math.floor(Math.random() * TIPS.length)];
};

export const getBotTrashTalk = async (state: GameState, action: string): Promise<string> => {
  // Return a random taunt
  return TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
};