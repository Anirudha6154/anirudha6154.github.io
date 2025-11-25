
import { create } from 'zustand';
import { GameState, GameMode, Card, CardColor, CardValue, INITIAL_GAME_STATE, Player, CardFace } from '../types';
import { generateDeck, shuffle } from '../services/deckFactory';
import { v4 as uuidv4 } from 'uuid';
import * as FB from '../services/firebase';

interface ExtendedGameState extends GameState {
    isBotThinking?: boolean;
}

interface GameActions {
  // Multiplayer Actions
  createRoom: (mode: GameMode, playerName: string) => Promise<string | void>;
  joinRoom: (roomId: string, playerName: string) => Promise<boolean>;
  leaveRoom: () => void;
  
  // Game Actions
  startLocalGame: (playerName: string, mode: GameMode) => void;
  startGame: () => void;
  playCard: (playerId: string, cardId: string) => void;
  drawCard: (playerId: string) => void;
  resolveColorSelection: (color: CardColor) => void;
  resolveSwap: (targetPlayerId: string) => void;
  resetGame: () => void;
  botTurn: () => void;
  
  // UNO Mechanics
  declareUno: (playerId: string) => void;
  challengeUno: (challengerId: string) => void;
}

// Map logical colors for Flip mode
const mapFlipColor = (c: CardColor): CardColor => {
    const map: Record<string, CardColor> = { 
        [CardColor.RED]: CardColor.TEAL, 
        [CardColor.BLUE]: CardColor.PINK, 
        [CardColor.GREEN]: CardColor.ORANGE, 
        [CardColor.YELLOW]: CardColor.PURPLE, 
        [CardColor.TEAL]: CardColor.RED, 
        [CardColor.PINK]: CardColor.BLUE, 
        [CardColor.ORANGE]: CardColor.GREEN, 
        [CardColor.PURPLE]: CardColor.YELLOW 
    };
    return map[c] || c;
};

// --- FIRESTORE HELPER ---
let unsubscribe: any = null;

const syncState = (state: Partial<ExtendedGameState>) => {
    const s = useGameStore.getState();
    if (s.roomId && FB.db) {
        // We never write 'myId' to the shared doc
        const { myId, roomId, pendingAction, isBotThinking, ...sharedState } = state as any;
        
        if (isBotThinking !== undefined) {
             useGameStore.setState({ isBotThinking });
        }

        const docRef = FB.doc(FB.db, 'games', s.roomId);
        FB.updateDoc(docRef, sharedState).catch(console.error);
    } else {
        useGameStore.setState(state);
    }
};

export const useGameStore = create<ExtendedGameState & GameActions>((set, get) => ({
  ...INITIAL_GAME_STATE,
  isBotThinking: false,

  createRoom: async (mode, playerName) => {
    if (!FB.isConfigured || !FB.db) {
        alert("Firebase not configured. Please add your API Key in services/firebase.ts or play Solo.");
        return;
    }
    
    try {
        await FB.signInAnonymously(FB.auth);
    } catch (e: any) {
        console.error("Auth Error:", e);
        alert(`Authentication Failed: ${e.message}`);
        return;
    }
    
    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    const myId = FB.auth.currentUser?.uid || uuidv4();
    
    const player: Player = { id: myId, name: playerName, isBot: false, cardCount: 0, hand: [], hasCalledUno: false };
    
    const initialState: Partial<GameState> = {
        roomId,
        hostId: myId,
        gameMode: mode,
        players: [player],
        status: 'WAITING',
        deck: [],
        discardPile: [],
    };

    try {
        await FB.setDoc(FB.doc(FB.db, 'games', roomId), initialState);
    } catch (e: any) {
        alert("Error creating room: " + e.message);
        return;
    }
    
    set({ ...INITIAL_GAME_STATE, ...initialState, myId });
    
    if (unsubscribe) unsubscribe();
    unsubscribe = FB.onSnapshot(FB.doc(FB.db, 'games', roomId), (doc: any) => {
        if (doc.exists()) {
            set((prev) => ({ ...prev, ...doc.data() }));
        }
    });

    return roomId;
  },

  joinRoom: async (roomId, playerName) => {
    if (!FB.isConfigured || !FB.db) {
        alert("Firebase not configured.");
        return false;
    }

    try {
        await FB.signInAnonymously(FB.auth);
    } catch (e: any) {
         console.error("Auth Error:", e);
         alert(`Authentication Failed: ${e.message}`);
         return false;
    }
    
    const myId = FB.auth.currentUser?.uid || uuidv4();
    const docRef = FB.doc(FB.db, 'games', roomId);
    
    try {
        const d = await FB.getDoc(docRef);
        if (!d.exists()) return false;
        
        const data = d.data() as GameState;
        const existing = data.players.find(p => p.id === myId);
        
        if (!existing) {
            const player: Player = { id: myId, name: playerName, isBot: false, cardCount: 0, hand: [], hasCalledUno: false };
            await FB.updateDoc(docRef, {
                players: FB.arrayUnion(player)
            });
        }
        
        set({ myId, roomId, status: 'WAITING' });
        
        if (unsubscribe) unsubscribe();
        unsubscribe = FB.onSnapshot(docRef, (doc: any) => {
            if (doc.exists()) {
                set((prev) => ({ ...prev, ...doc.data() }));
            }
        });
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
  },

  leaveRoom: () => {
      if (unsubscribe) unsubscribe();
      set(INITIAL_GAME_STATE);
  },

  startLocalGame: (playerName, mode) => {
     const myId = 'player-1';
     const player: Player = { id: myId, name: playerName || 'Player 1', isBot: false, cardCount: 0, hand: [], hasCalledUno: false };
     
     const players = [player];
     players.push({ id: 'bot-1', name: 'Bot Alpha', isBot: true, cardCount: 0, hand: [], hasCalledUno: false });
     players.push({ id: 'bot-2', name: 'Bot Beta', isBot: true, cardCount: 0, hand: [], hasCalledUno: false });
     players.push({ id: 'bot-3', name: 'Bot Gamma', isBot: true, cardCount: 0, hand: [], hasCalledUno: false });

     const deck = generateDeck(mode);
     players.forEach(p => { p.hand = deck.splice(0, 7); p.cardCount = 7; });

     let startCard = deck.pop()!;
     while (startCard.light.color === CardColor.WILD) {
         deck.unshift(startCard);
         startCard = deck.pop()!;
     }

     set({
       ...INITIAL_GAME_STATE,
       gameMode: mode,
       status: 'PLAYING',
       roomId: null,
       myId,
       hostId: myId,
       deck,
       players,
       discardPile: [startCard],
       currentPlayerIndex: 0,
       activeSide: 'light',
       currentColor: startCard.light.color,
       direction: 1,
       drawStack: 0,
       rouletteColor: null,
       winner: null,
       lastActionDescription: "Local Game Started!"
     });
  },

  startGame: () => {
    const state = get();
    if (state.roomId && state.hostId !== state.myId) return;
    
    const players = [...state.players];
    const deck = generateDeck(state.gameMode);
    
    players.forEach(p => {
      p.hand = deck.splice(0, 7);
      p.cardCount = 7;
      p.hasCalledUno = false;
    });

    let startCard = deck.pop()!;
    while (startCard.light.color === CardColor.WILD) {
        deck.unshift(startCard);
        startCard = deck.pop()!;
    }

    const newState: Partial<GameState> = {
      status: 'PLAYING',
      deck,
      players,
      discardPile: [startCard],
      currentPlayerIndex: 0,
      activeSide: 'light',
      currentColor: startCard.light.color,
      direction: 1,
      drawStack: 0,
      rouletteColor: null,
      winner: null,
      lastActionDescription: "Game Started!"
    };

    syncState(newState);
  },
  
  declareUno: (playerId: string) => {
      const state = get();
      const players = [...state.players];
      const p = players.find(p => p.id === playerId);
      if (p) {
          p.hasCalledUno = true;
          syncState({ players, lastActionDescription: `${p.name} shouted UNO!` });
      }
  },
  
  challengeUno: (challengerId: string) => {
      const state = get();
      const players = [...state.players];
      let caught = false;
      let description = "";

      players.forEach(p => {
          if (p.id !== challengerId && p.hand.length === 1 && !p.hasCalledUno) {
              performDraw({ ...state, players, deck: [...state.deck], discardPile: [...state.discardPile] }, players.indexOf(p), 2);
              description = `${p.name} caught not saying UNO! (+2)`;
              caught = true;
          }
      });
      
      if (caught) {
          syncState({ players, lastActionDescription: description, deck: state.deck, discardPile: state.discardPile });
      }
  },

  playCard: (playerId, cardId) => {
    const state = get();
    if (state.gameMode !== GameMode.SPEED) {
        const isMyTurn = state.players[state.currentPlayerIndex]?.id === playerId;
        if (!isMyTurn) return;
    }
    
    if (state.pendingAction.type && state.pendingAction.type !== 'PICK_COLOR' && state.pendingAction.type !== 'SWAP_HANDS') return;

    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    
    const player = state.players[playerIndex];
    const card = player.hand.find(c => c.id === cardId);
    if (!card) return;

    if (!checkPlayable(card, state)) return;

    const face = state.activeSide === 'light' ? card.light : card.dark;
    
    // --- INTERRUPTIONS (Local UI Only) ---
    if (face.color === CardColor.WILD || face.color === CardColor.WILD_DARK) {
         set({ pendingAction: { type: 'PICK_COLOR', cardId: card.id } });
         if (player.isBot) {
             const colors = state.activeSide === 'light' 
                ? [CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW]
                : [CardColor.PINK, CardColor.TEAL, CardColor.PURPLE, CardColor.ORANGE];
             const randomColor = colors[Math.floor(Math.random() * colors.length)];
             get().resolveColorSelection(randomColor);
         }
         return; 
    }

    if (state.gameMode === GameMode.NO_MERCY && face.value === CardValue.SEVEN) {
         set({ pendingAction: { type: 'SWAP_HANDS', cardId: card.id } });
         if (player.isBot) {
             const target = state.players.filter(p => p.id !== player.id)[0]; 
             get().resolveSwap(target.id);
         }
         return;
    }

    const updates = calculatePlayUpdates(state, playerIndex, card, face.color, null);
    syncState({ ...updates, isBotThinking: false });
  },

  resolveColorSelection: (color) => {
      const state = get();
      if (state.pendingAction.type !== 'PICK_COLOR') return;
      const playerIndex = state.currentPlayerIndex;
      const player = state.players[playerIndex];
      const card = player.hand.find(c => c.id === state.pendingAction.cardId);
      if (!card) return;

      set({ pendingAction: { type: null } });
      const updates = calculatePlayUpdates(state, playerIndex, card, color, null);
      syncState({ ...updates, isBotThinking: false });
  },

  resolveSwap: (targetPlayerId) => {
      const state = get();
      if (state.pendingAction.type !== 'SWAP_HANDS') return;
      const playerIndex = state.currentPlayerIndex;
      const player = state.players[playerIndex];
      const card = player.hand.find(c => c.id === state.pendingAction.cardId);
      if (!card) return;

      set({ pendingAction: { type: null } });
      const updates = calculatePlayUpdates(state, playerIndex, card, card.light.color, targetPlayerId);
      syncState({ ...updates, isBotThinking: false });
  },

  drawCard: (playerId) => {
    const state = get();
    if (state.gameMode !== GameMode.SPEED) {
        if (state.players[state.currentPlayerIndex]?.id !== playerId) return;
    }

    const pIndex = state.players.findIndex(p => p.id === playerId);
    const newState = { 
        ...state, 
        players: state.players.map(p => ({...p, hand: [...p.hand]})), 
        deck: [...state.deck], 
        discardPile: [...state.discardPile] 
    };
    const player = newState.players[pIndex];
    player.hasCalledUno = false;

    // SCENARIO 1: FORCED STACK / ROULETTE
    if (state.drawStack > 0 || state.rouletteColor) {
        
        // ROULETTE LOGIC: Draw until color
        if (state.rouletteColor) {
             let found = false;
             let count = 0;
             while (!found) {
                 const drawn = performDraw(newState, pIndex, 1);
                 if (drawn.length === 0) break;
                 count++;
                 const face = state.activeSide === 'light' ? drawn[0].light : drawn[0].dark;
                 if (face.color === state.rouletteColor || face.color === CardColor.WILD || face.color === CardColor.WILD_DARK) {
                     found = true;
                 }
                 if (state.gameMode === GameMode.NO_MERCY && player.hand.length >= 25) break;
             }
             
             if (state.gameMode === GameMode.NO_MERCY && player.hand.length >= 25) {
                 const updates = eliminatePlayer(newState, pIndex);
                 syncState({ ...updates, isBotThinking: false });
                 return;
             }

             const nextIdx = getNextIndex(state.players.length, state.currentPlayerIndex, state.direction);
             syncState({
                deck: newState.deck,
                discardPile: newState.discardPile,
                players: newState.players,
                rouletteColor: null, // Reset Roulette
                currentPlayerIndex: nextIdx,
                lastActionDescription: `${player.name} drew ${count} cards for Roulette!`,
                isBotThinking: false
             });
             return;
        }

        // STACK LOGIC
        performDraw(newState, pIndex, state.drawStack);
        if (state.gameMode === GameMode.NO_MERCY && player.hand.length >= 25) {
             const updates = eliminatePlayer(newState, pIndex);
             syncState({ ...updates, isBotThinking: false });
             return;
        }
        const nextIdx = getNextIndex(state.players.length, state.currentPlayerIndex, state.direction);
        syncState({
            deck: newState.deck,
            discardPile: newState.discardPile,
            players: newState.players,
            drawStack: 0,
            currentPlayerIndex: nextIdx,
            lastActionDescription: `${player.name} took +${state.drawStack} penalty!`,
            isBotThinking: false
        });
        return;
    }

    // SCENARIO 2: VOLUNTARY DRAW (Classic / No Mercy)
    if (state.gameMode === GameMode.NO_MERCY) {
        // Draw Until Playable
        let drawnCard: Card | null = null;
        let playFound = false;

        while (!playFound) {
            const drawn = performDraw(newState, pIndex, 1);
            if (drawn.length === 0) break;
            drawnCard = drawn[0];

            if (player.hand.length >= 25) {
                 const updates = eliminatePlayer(newState, pIndex);
                 syncState({ ...updates, isBotThinking: false });
                 return;
            }

            if (checkPlayable(drawnCard, state)) {
                playFound = true;
            }
        }

        if (playFound && drawnCard) {
            const face = state.activeSide === 'light' ? drawnCard.light : drawnCard.dark;
            if (face.color === CardColor.WILD || face.color === CardColor.WILD_DARK || face.value === CardValue.SEVEN) {
                 syncState({
                     deck: newState.deck,
                     discardPile: newState.discardPile,
                     players: newState.players,
                     lastActionDescription: `${player.name} drew until playable: ${face.value}`,
                     isBotThinking: false
                 });
                 setTimeout(() => { get().playCard(player.id, drawnCard!.id); }, 200);
                 return;
            }
            const updates = calculatePlayUpdates(newState as GameState, pIndex, drawnCard, face.color, null);
            syncState({ ...updates, isBotThinking: false });
        }
        return;
    } 
    
    // CLASSIC: Draw 1, Play if able
    else {
        const drawn = performDraw(newState, pIndex, 1);
        const drawnCard = drawn[0];
        
        if (drawnCard && checkPlayable(drawnCard, state)) {
            const face = state.activeSide === 'light' ? drawnCard.light : drawnCard.dark;
            if (face.color === CardColor.WILD || face.color === CardColor.WILD_DARK) {
                 syncState({
                     deck: newState.deck,
                     discardPile: newState.discardPile,
                     players: newState.players,
                     lastActionDescription: `${player.name} drew a Playable Wild!`,
                     isBotThinking: false
                 });
                 setTimeout(() => { get().playCard(player.id, drawnCard.id); }, 200);
                 return;
            }
            const updates = calculatePlayUpdates(newState as GameState, pIndex, drawnCard, face.color, null);
            syncState({ ...updates, isBotThinking: false });
        } else {
            const nextIdx = getNextIndex(state.players.length, state.currentPlayerIndex, state.direction);
            syncState({
                deck: newState.deck,
                discardPile: newState.discardPile,
                players: newState.players,
                currentPlayerIndex: nextIdx,
                lastActionDescription: `${player.name} drew and passed`,
                isBotThinking: false
            });
        }
    }
  },

  resetGame: () => {
      const s = get();
      if (s.roomId) {
           const newState: Partial<GameState> = {
                status: 'WAITING',
                deck: [],
                discardPile: [],
                winner: null,
                rouletteColor: null
            };
            syncState(newState);
      } else {
          set(INITIAL_GAME_STATE);
      }
  },
  
  botTurn: () => {
     const state = get();
     if (state.status !== 'PLAYING' || state.pendingAction.type) return;
     
     const isLocal = !state.roomId;
     const isHost = state.roomId && state.hostId === state.myId;
     if (!isLocal && !isHost) return;

     const currentPlayer = state.players[state.currentPlayerIndex];
     
     const vulnerable = state.players.find(p => p.hand.length === 1 && !p.hasCalledUno && p.id !== currentPlayer.id);
     if (vulnerable && Math.random() < 0.3) {
         get().challengeUno(currentPlayer.id);
         return; 
     }

     if (!currentPlayer?.isBot) return;
     if (state.isBotThinking) return;
     
     set({ isBotThinking: true });

     setTimeout(() => {
         const fresh = get();
         if (fresh.currentPlayerIndex !== state.currentPlayerIndex || fresh.status !== 'PLAYING') {
             set({ isBotThinking: false });
             return; 
         }
         
         if (currentPlayer.hand.length === 2 && Math.random() < 0.8) {
             fresh.declareUno(currentPlayer.id);
         }

         const hand = currentPlayer.hand;
         const playable = hand.filter(c => checkPlayable(c, fresh));
         
         if (playable.length > 0) {
             const move = playable[Math.floor(Math.random() * playable.length)];
             get().playCard(currentPlayer.id, move.id);
         } else {
             get().drawCard(currentPlayer.id);
         }
     }, 1000); 
  }
}));

const performDraw = (state: any, playerIdx: number, count: number) => {
    const drawn: Card[] = [];
    for(let i=0; i<count; i++) {
        if (state.deck.length === 0) {
            if (state.discardPile.length > 1) {
                const top = state.discardPile.pop()!;
                state.deck = shuffle(state.discardPile);
                state.discardPile = [top];
            } else {
                break; 
            }
        }
        drawn.push(state.deck.pop()!);
    }
    state.players[playerIdx].hand.push(...drawn);
    state.players[playerIdx].cardCount = state.players[playerIdx].hand.length;
    return drawn;
};

const eliminatePlayer = (state: any, pIdx: number) => {
    const player = state.players[pIdx];
    state.discardPile.push(...player.hand);
    player.hand = [];
    player.cardCount = 0;
    
    state.players.splice(pIdx, 1);
    
    let description = `${player.name} ELIMINATED (Mercy Rule)!`;
    let winner = null;
    
    if (state.players.length === 1) {
        winner = state.players[0];
        description += ` ${winner.name} Wins!`;
    }

    let nextIdx = pIdx;
    if (nextIdx >= state.players.length) nextIdx = 0;
    
    return {
        deck: state.deck,
        discardPile: state.discardPile,
        players: state.players,
        currentPlayerIndex: nextIdx,
        lastActionDescription: description,
        winner
    };
};

export const checkPlayable = (card: Card, state: GameState): boolean => {
    const { activeSide, currentColor, discardPile, drawStack, rouletteColor } = state;
    const top = discardPile[discardPile.length - 1];
    
    if (!top) return false;
    
    // If Roulette is active, NO card is playable. Must draw.
    if (rouletteColor) return false;

    const face = activeSide === 'light' ? card.light : card.dark;
    const topFace = activeSide === 'light' ? top.light : top.dark;

    if (drawStack > 0) {
        if (state.gameMode === GameMode.NO_MERCY) {
            const val = getStackValue(face.value);
            const topVal = getStackValue(topFace.value) || 2; 
            // Stacking: Can play if value is >= top value.
            // +10 >= +6 >= +4 >= +2
            if (val >= topVal) return true;
        } else {
            if (face.value === CardValue.DRAW_TWO && topFace.value === CardValue.DRAW_TWO) return true;
        }
        return false;
    }

    if (face.color === CardColor.WILD || face.color === CardColor.WILD_DARK) return true;
    if (face.color === currentColor) return true;
    if (face.value === topFace.value) return true;

    return false;
};

const getStackValue = (v: CardValue): number => {
    if (v === CardValue.WILD_DRAW_TEN) return 10;
    if (v === CardValue.WILD_DRAW_SIX) return 6;
    if (v === CardValue.WILD_DRAW_FOUR) return 4;
    if (v === CardValue.DRAW_TWO) return 2;
    if (v === CardValue.DRAW_FIVE) return 5;
    return 0;
};

const calculatePlayUpdates = (state: GameState, pIdx: number, card: Card, chosenColor: CardColor, swapTargetId: string | null): Partial<GameState> => {
    const players = JSON.parse(JSON.stringify(state.players));
    const player = players[pIdx];
    
    player.hand = player.hand.filter((c: Card) => c.id !== card.id);
    player.cardCount = player.hand.length;
    
    const face = state.activeSide === 'light' ? card.light : card.dark;
    let nextColor = chosenColor || face.color;
    let nextActiveSide = state.activeSide;
    let nextStack = state.drawStack;
    let nextDirection = state.direction;
    let nextTurnSkip = 0;
    let nextRouletteColor: CardColor | null = null;
    let description = `${player.name} played ${face.value}`;

    // Effects
    const stackVal = getStackValue(face.value);
    if (stackVal > 0) {
        nextStack += stackVal;
        description += ` (+${nextStack})`;
    }

    if (face.value === CardValue.SKIP) {
        nextTurnSkip = 1;
        description += " (Skip)";
    }
    if (face.value === CardValue.REVERSE) {
        nextDirection = nextDirection === 1 ? -1 : 1;
        if (players.length === 2) nextTurnSkip = 1;
        description += " (Reverse)";
    }
    
    // No Mercy +4 Reverse Logic
    if (state.gameMode === GameMode.NO_MERCY && face.value === CardValue.WILD_DRAW_FOUR) {
        nextDirection = nextDirection === 1 ? -1 : 1;
        description += " (Reverse +4)";
        if (players.length === 2) nextTurnSkip = 1; 
    }

    if (face.value === CardValue.SKIP_EVERYONE) {
        nextTurnSkip = -1; 
        description += " (SKIP ALL)";
    }
    if (face.value === CardValue.FLIP) {
        nextActiveSide = nextActiveSide === 'light' ? 'dark' : 'light';
        nextColor = mapFlipColor(nextColor); 
        description += " (FLIP)";
    }

    // Mercy Specials
    if (state.gameMode === GameMode.NO_MERCY) {
        if (face.value === CardValue.DISCARD_ALL) {
             const kept = player.hand.filter((c: Card) => {
                 const f = nextActiveSide === 'light' ? c.light : c.dark;
                 return f.color !== nextColor && f.color !== CardColor.WILD;
             });
             const tossed = player.hand.length - kept.length;
             player.hand = kept;
             player.cardCount = kept.length;
             description += ` (Discarded ${tossed})`;
        }
        if (face.value === CardValue.ZERO) {
            rotateHands(players, nextDirection);
            description += " (Hands Rotated)";
        }
        if (face.value === CardValue.SEVEN && swapTargetId) {
            const target = players.find((p: Player) => p.id === swapTargetId);
            if (target) {
                const temp = [...player.hand];
                player.hand = [...target.hand];
                target.hand = temp;
                player.cardCount = player.hand.length;
                target.cardCount = target.hand.length;
                description += ` (Swapped with ${target.name})`;
            }
        }
        // Wild Color Roulette
        if (face.value === CardValue.WILD_COLOR_ROULETTE) {
            nextRouletteColor = chosenColor;
            description += ` (Roulette: ${chosenColor})`;
        }
    }

    // Win Check
    let winner = null;
    if (player.hand.length === 0) winner = player;
    
    if (state.gameMode === GameMode.NO_MERCY && player.hand.length >= 25) {
        const elimResult = eliminatePlayer({ ...state, players, discardPile: [...state.discardPile, card] }, pIdx);
        if (players.length === 2) {
             winner = players.find((p: Player) => p.id !== player.id);
             return { ...elimResult, winner, lastActionDescription: description + " (ELIMINATED)" };
        }
        return { ...elimResult, lastActionDescription: description + " (ELIMINATED)" };
    }

    let nextIdx = state.currentPlayerIndex;
    if (nextTurnSkip === -1) {
        nextIdx = pIdx; 
    } else {
        const steps = 1 + nextTurnSkip;
        nextIdx = getNextIndex(players.length, pIdx, nextDirection, steps);
    }

    return {
        players,
        discardPile: [...state.discardPile, card],
        activeSide: nextActiveSide,
        currentColor: nextColor,
        direction: nextDirection,
        drawStack: nextStack,
        currentPlayerIndex: nextIdx,
        rouletteColor: nextRouletteColor,
        lastActionDescription: description,
        winner
    };
};

const getNextIndex = (total: number, current: number, dir: number, steps: number = 1) => {
    return (current + (steps * dir) + (total * 10)) % total;
};

const rotateHands = (players: Player[], dir: number) => {
    const hands = players.map(p => p.hand);
    if (dir === 1) {
        const last = hands.pop()!;
        hands.unshift(last);
    } else {
        const first = hands.shift()!;
        hands.push(first);
    }
    players.forEach((p, i) => {
        p.hand = hands[i];
        p.cardCount = hands[i].length;
    });
};
