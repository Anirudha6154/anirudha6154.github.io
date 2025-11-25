import { Card, CardColor, CardValue, GameMode, CardFace } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Helper to create a card
const createCard = (light: CardFace, dark?: CardFace): Card => {
  return {
    id: uuidv4(),
    light,
    dark: dark || { color: CardColor.ORANGE, value: CardValue.ONE, type: 'number' }, // Fallback for non-flip modes
  };
};

export const generateDeck = (mode: GameMode): Card[] => {
  let deck: Card[] = [];
  const colors = [CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW];
  const darkColors = [CardColor.ORANGE, CardColor.PINK, CardColor.TEAL, CardColor.PURPLE];

  // Basic number generation (Simplification for brevity, usually 0-9 with dupes of 1-9)
  colors.forEach((color, idx) => {
    const darkColor = darkColors[idx];

    // Numbers 0-9
    for (let i = 0; i <= 9; i++) {
      // In a real deck, 1-9 appear twice, 0 once.
      // We'll do single set for demo lightness, double for gameplay feel
      const count = i === 0 ? 1 : 2;
      for (let c = 0; c < count; c++) {
        const valStr = i.toString() as CardValue;
        deck.push(createCard(
          { color, value: valStr, type: 'number' },
          { color: darkColor, value: valStr, type: 'number' } // Flip mapping usually differs, simplifying here
        ));
      }
    }

    // Actions (Skip, Reverse, Draw 2)
    [CardValue.SKIP, CardValue.REVERSE, CardValue.DRAW_TWO].forEach(action => {
      for (let c = 0; c < 2; c++) {
        deck.push(createCard(
          { color, value: action, type: 'action' },
          { color: darkColor, value: action === CardValue.DRAW_TWO ? CardValue.DRAW_FIVE : CardValue.SKIP_EVERYONE, type: 'action' } // Making Dark side meaner
        ));
      }
    });
  });

  // Wilds
  for (let c = 0; c < 4; c++) {
    deck.push(createCard(
      { color: CardColor.WILD, value: CardValue.WILD, type: 'wild' },
      { color: CardColor.WILD_DARK, value: CardValue.WILD, type: 'wild' }
    ));
    deck.push(createCard(
      { color: CardColor.WILD, value: CardValue.WILD_DRAW_FOUR, type: 'wild' },
      { color: CardColor.WILD_DARK, value: CardValue.WILD_DRAW_COLOR, type: 'wild' }
    ));
  }

  // Mode Specific Additions
  if (mode === GameMode.FLIP) {
    // Add Flip Cards
    colors.forEach((color, idx) => {
      for (let c = 0; c < 2; c++) {
        deck.push(createCard(
           { color, value: CardValue.FLIP, type: 'action' },
           { color: darkColors[idx], value: CardValue.FLIP, type: 'action' }
        ));
      }
    });
  }
  
  if (mode === GameMode.NO_MERCY) {
      // Add Discard Alls, etc. (Simulated by reusing existing slots for demo or adding extra)
      colors.forEach(color => {
         deck.push(createCard({ color, value: CardValue.DISCARD_ALL, type: 'action' }));
      });
  }

  return shuffle(deck);
};

export const shuffle = (cards: Card[]): Card[] => {
  const newCards = [...cards];
  for (let i = newCards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
  }
  return newCards;
};