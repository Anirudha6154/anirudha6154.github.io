
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

  // Basic number generation
  colors.forEach((color, idx) => {
    const darkColor = darkColors[idx];

    // Numbers 0-9
    for (let i = 0; i <= 9; i++) {
      const count = i === 0 ? 1 : 2;
      for (let c = 0; c < count; c++) {
        const valStr = i.toString() as CardValue;
        deck.push(createCard(
          { color, value: valStr, type: 'number' },
          { color: darkColor, value: valStr, type: 'number' }
        ));
      }
    }

    // Actions (Skip, Reverse, Draw 2)
    [CardValue.SKIP, CardValue.REVERSE, CardValue.DRAW_TWO].forEach(action => {
      for (let c = 0; c < 2; c++) {
        deck.push(createCard(
          { color, value: action, type: 'action' },
          { color: darkColor, value: action === CardValue.DRAW_TWO ? CardValue.DRAW_FIVE : CardValue.SKIP_EVERYONE, type: 'action' }
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
      colors.forEach(color => {
         deck.push(createCard({ color, value: CardValue.DISCARD_ALL, type: 'action' }));
      });
      // Add No Mercy Wilds
      for (let i = 0; i < 4; i++) {
          deck.push(createCard({ color: CardColor.WILD, value: CardValue.WILD_DRAW_SIX, type: 'wild' }));
          deck.push(createCard({ color: CardColor.WILD, value: CardValue.WILD_DRAW_TEN, type: 'wild' }));
          deck.push(createCard({ color: CardColor.WILD, value: CardValue.WILD_COLOR_ROULETTE, type: 'wild' }));
      }
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
