
import React, { useEffect, useState } from 'react';
import { useGameStore, checkPlayable } from '../store/gameStore';
import { Card } from './Card';
import { CardColor } from '../types';

export const GameBoard: React.FC = () => {
  const store = useGameStore();
  const { players, discardPile, currentPlayerIndex, activeSide, lastActionDescription, pendingAction, currentColor, drawStack, direction, myId } = store;
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Identify Me
  const myIndex = players.findIndex(p => p.id === myId);
  const player = players[myIndex] || players[0]; // Fallback if something weird happens

  const topCard = discardPile[discardPile.length - 1];

  // Bots (Host Only runs logic, handled in store)
  useEffect(() => {
    if (store.status === 'PLAYING') {
      store.botTurn();
    }
  }, [currentPlayerIndex, store.status, store]);

  // Theme Sync
  useEffect(() => {
    if (activeSide === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [activeSide]);

  // Modals
  const isPickingColor = pendingAction.type === 'PICK_COLOR';
  const colors = activeSide === 'light' 
    ? [CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW]
    : [CardColor.PINK, CardColor.TEAL, CardColor.PURPLE, CardColor.ORANGE];

  const isSwapping = pendingAction.type === 'SWAP_HANDS';
  const swapTargets = players.filter(p => p.id !== player.id);

  // Helper for glow
  const activeColorHex = {
    [CardColor.RED]: '#ff5555', [CardColor.BLUE]: '#5555ff', [CardColor.GREEN]: '#55aa55', [CardColor.YELLOW]: '#ffaa00',
    [CardColor.PURPLE]: '#aa00ff', [CardColor.ORANGE]: '#ff6600', [CardColor.TEAL]: '#00aaaa', [CardColor.PINK]: '#ff00aa',
    [CardColor.WILD]: '#fff', [CardColor.WILD_DARK]: '#fff'
  }[currentColor] || '#fff';

  // Calculate Opponents Order (Rotated so I am always bottom)
  const opponents = [];
  const count = players.length;
  if (count > 0) {
      for (let i = 1; i < count; i++) {
          const idx = (myIndex + i) % count;
          opponents.push(players[idx]);
      }
  }

  // --- DYNAMIC HAND LAYOUT CALCULATION ---
  const handSize = player.hand.length;
  const cardWidth = 90; 
  const containerPadding = 20;
  const maxHandWidth = Math.min(windowWidth - containerPadding, 1000); 
  
  let marginLeft = -40; // Default overlap
  let scale = 1;

  if (handSize > 1) {
      // Calculate how much space we have per card
      // total width = cardWidth + (handSize - 1) * (cardWidth + margin)
      // (handSize - 1) * (cardWidth + margin) = maxHandWidth - cardWidth
      // cardWidth + margin = (maxHandWidth - cardWidth) / (handSize - 1)
      const spacePerCard = (maxHandWidth - cardWidth) / (handSize - 1);
      
      // The overlapping margin is spacePerCard - cardWidth
      let calculatedMargin = spacePerCard - cardWidth;
      
      // Clamp the margin. 
      // Ensure they don't spread out too much (max -40px means at least 40px overlap)
      if (calculatedMargin > -40) calculatedMargin = -40;
      
      // If cards are too tight (less than 20px visible), start scaling down
      if (calculatedMargin < -70) {
          calculatedMargin = -70; // Cap overlap
          // Apply scale if we still don't fit? 
          // For now, capping overlap at -70 ensures 20px visible strip.
          // If 20px strip is too wide for screen, we might overflow, but overflow-x is hidden on body.
          // Let's rely on flex shrink if needed, but manual calculation is cleaner.
      }
      marginLeft = calculatedMargin;
  }

  return (
    <div id="game-layout">
      
      {/* 1. Opponents Row */}
      <div id="opponents-row">
        {opponents.map((opp) => {
           // Calculate if it is their turn
           const isTurn = players[currentPlayerIndex]?.id === opp.id;
           return (
             <div key={opp.id} className={`opponent ${isTurn ? 'active' : ''}`}>
                <div className="avatar">{opp.name[0]}</div>
                <div style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{opp.name}</div>
                <div style={{fontSize: '1.2rem'}} className={opp.cardCount >= 20 ? 'mercy-warning' : ''}>
                    {opp.cardCount}
                </div>
             </div>
           );
        })}
      </div>

      {/* 2. Center Table */}
      <div id="center-table">
          <div id="direction-badge">{direction === 1 ? '↻' : '↺'}</div>
          
          {drawStack > 0 && (
             <div id="stack-badge">STACK +{drawStack}</div>
          )}

          {/* Status Text */}
          <div className="info-badge" style={{ top: -80, opacity: 0.7 }}>
             {lastActionDescription}
          </div>

          {/* Draw Pile */}
          <div className="pile" id="draw-pile" onClick={() => store.drawCard(player.id)}>
             <div style={{color:'white', fontWeight:'bold'}}>DRAW</div>
          </div>

          {/* Discard Pile */}
          <div 
            className="pile" 
            id="discard-pile"
            style={{ 
                borderColor: activeColorHex, 
                boxShadow: `0 0 20px ${activeColorHex}40` 
            }}
          >
             {topCard && <Card card={topCard} activeSide={activeSide} isPlayable={false} style={{transform: 'scale(0.9)'}} />}
          </div>
      </div>

      {/* 3. Player Hand */}
      <div id="player-hand">
         {player.hand.map((card, idx) => {
             const isMyTurn = players[currentPlayerIndex]?.id === player.id;
             const isValidMove = checkPlayable(card, store);
             const canPlay = isMyTurn && isValidMove;
             
             // Apply dynamic margin to all cards except the first one
             const style: React.CSSProperties = {
                 zIndex: idx,
                 marginLeft: idx === 0 ? 0 : `${marginLeft}px`,
             };

             return (
                 <Card 
                    key={card.id}
                    card={card}
                    activeSide={activeSide}
                    isPlayable={canPlay}
                    onClick={() => store.playCard(player.id, card.id)}
                    style={style}
                 />
             )
         })}
      </div>

      {/* MODALS */}
      {isPickingColor && (
          <div className="modal">
              <div className="panel">
                  <h2>Pick a Color</h2>
                  <div className="grid-2">
                      {colors.map(c => (
                          <div 
                             key={c} 
                             className={`c-btn bg-${c}`} 
                             onClick={() => store.resolveColorSelection(c)}
                          />
                      ))}
                  </div>
              </div>
          </div>
      )}

      {isSwapping && (
          <div className="modal">
              <div className="panel">
                  <h2>Swap Hands With:</h2>
                  <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'20px'}}>
                      {swapTargets.map(p => (
                          <button key={p.id} onClick={() => store.resolveSwap(p.id)}>
                              {p.name} ({p.cardCount})
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {store.winner && (
          <div className="modal">
              <div className="panel">
                  <h1 style={{fontSize:'3rem', color:'var(--yellow)'}}>
                      {store.winner.id === player.id ? 'YOU WIN!' : `${store.winner.name} WINS!`}
                  </h1>
                  <button onClick={store.resetGame}>BACK TO LOBBY</button>
              </div>
          </div>
      )}
    </div>
  );
};
