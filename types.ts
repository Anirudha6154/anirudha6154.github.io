
export enum GameMode {
  CLASSIC = 'CLASSIC',
  NO_MERCY = 'NO_MERCY',
  FLIP = 'FLIP',
  SPEED = 'SPEED',
}

export enum CardColor {
  RED = 'red',
  BLUE = 'blue',
  GREEN = 'green',
  YELLOW = 'yellow',
  WILD = 'black', // Chaos style uses black for wild base
  
  // Flip Dark Side Colors
  ORANGE = 'orange',
  PINK = 'pink',
  TEAL = 'teal',
  PURPLE = 'purple',
  WILD_DARK = 'wild_dark',
}

export enum CardValue {
  ZERO = '0', ONE = '1', TWO = '2', THREE = '3', FOUR = '4',
  FIVE = '5', SIX = '6', SEVEN = '7', EIGHT = '8', NINE = '9',
  SKIP = 'skip',
  REVERSE = 'reverse',
  DRAW_TWO = '+2',
  WILD = 'wild',
  WILD_DRAW_FOUR = '+4',
  
  // No Mercy Specifics
  SKIP_EVERYONE = 'skip_all',
  DISCARD_ALL = 'discard_all',
  WILD_DRAW_SIX = '+6',
  WILD_DRAW_TEN = '+10',
  WILD_COLOR_ROULETTE = 'roulette',
  
  // Flip Specifics (Dark Side)
  DRAW_FIVE = '+5',
  FLIP = 'flip',
  WILD_DRAW_COLOR = 'wild_color',
}

export interface CardFace {
  color: CardColor;
  value: CardValue;
  type: 'number' | 'action' | 'wild';
}

export interface Card {
  id: string;
  isFlipped?: boolean; 
  light: CardFace;
  dark: CardFace; 
}

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  cardCount: number;
  hand: Card[];
  hasCalledUno: boolean; // New Flag for UNO logic
}

export interface GameState {
  gameMode: GameMode;
  status: 'LOBBY' | 'WAITING' | 'PLAYING' | 'GAME_OVER';
  
  // Multiplayer
  roomId: string | null;
  myId: string | null;
  hostId: string | null;

  // Core State
  deck: Card[];
  discardPile: Card[];
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1; 
  
  // Mechanics
  activeSide: 'light' | 'dark';
  drawStack: number;
  currentColor: CardColor; // Tracks the active color (important for Wilds)
  rouletteColor: CardColor | null; // Tracks target color for Roulette
  
  // Interruption States (Modals)
  pendingAction: {
    type: 'PICK_COLOR' | 'SWAP_HANDS' | null;
    cardId?: string; // The card that triggered it
  };

  // End State
  winner: Player | null;
  
  // UI State
  lastActionDescription: string;
}

export const INITIAL_GAME_STATE: GameState = {
  gameMode: GameMode.CLASSIC,
  status: 'LOBBY',
  roomId: null,
  myId: null,
  hostId: null,
  deck: [],
  discardPile: [],
  players: [],
  currentPlayerIndex: 0,
  direction: 1,
  activeSide: 'light',
  drawStack: 0,
  currentColor: CardColor.RED,
  rouletteColor: null,
  pendingAction: { type: null },
  winner: null,
  lastActionDescription: 'Welcome to Chaos UNO',
};
