
import React, { useEffect, useState } from 'react';
import { useGameStore, checkPlayable } from '../store/gameStore';
import { Card } from './Card';
import { CardColor } from '../types';

export const GameBoard: React.FC = () => {
  const store = useGameStore();
  const { players, discardPile, currentPlayerIndex, activeSide, lastActionDescription, pendingAction, currentColor, drawStack, rouletteColor, direction, myId } = store;
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const myIndex = players.findIndex(p => p.id === myId);
  const player = players[myIndex] || players[0]; 

  const topCard = discardPile[discardPile.length - 1];

  useEffect(() => {
    if (store.status === 'PLAYING') {
      store.botTurn();
    }
  }, [currentPlayerIndex, store.status, store]);

  useEffect(() => {
    if (activeSide === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [activeSide]);

  const isPickingColor = pendingAction.type === 'PICK_COLOR';
  const colors = activeSide === 'light' 
    ? [CardColor.RED, CardColor.BLUE, CardColor.GREEN, CardColor.YELLOW]
    : [CardColor.PINK, CardColor.TEAL, CardColor.PURPLE, CardColor.ORANGE];

  const isSwapping = pendingAction.type === 'SWAP_HANDS';
  const swapTargets = players.filter(p => p.id !== player.id);

  const activeColorHex = {
    [CardColor.RED]: '#ff5555', [CardColor.BLUE]: '#5555ff', [CardColor.GREEN]: '#55aa55', [CardColor.YELLOW]: '#ffaa00',
    [CardColor.PURPLE]: '#aa00ff', [CardColor.ORANGE]: '#ff6600', [CardColor.TEAL]: '#00aaaa', [CardColor.PINK]: '#ff00aa',
    [CardColor.WILD]: '#fff', [CardColor.WILD_DARK]: '#fff'
  }[currentColor] || '#fff';

  const opponents = [];
  const count = players.length;
  if (count > 0) {
      for (let i = 1; i < count; i++) {
          const idx = (myIndex + i) % count;
          opponents.push(players[idx]);
      }
  }

  const canCallUno = player.hand.length <= 2 && !player.hasCalledUno;
  const vulnerableOpponent = opponents.find(p => p.cardCount === 1 && !p.hasCalledUno);
  const showUnoBtn = canCallUno || vulnerableOpponent;
  const isCatchAction = !!vulnerableOpponent && !canCallUno;

  const handSize = player.hand.length;
  const cardWidth = 90; 
  const containerPadding = 20;
  const maxHandWidth = Math.min(windowWidth - containerPadding, 1000); 
  
  let marginLeft = -40; 
  if (handSize > 1) {
      const spacePerCard = (maxHandWidth - cardWidth) / (handSize - 1);
      let calculatedMargin = spacePerCard - cardWidth;
      if (calculatedMargin > -40) calculatedMargin = -40;
      if (calculatedMargin < -70) calculatedMargin = -70; 
      marginLeft = calculatedMargin;
  }

  return (
    <div id="game-layout">
      
      <div id="opponents-row">
        {opponents.map((opp) => {
           const isTurn = players[currentPlayerIndex]?.id === opp.id;
           return (
             <div key={opp.id} className={`opponent ${isTurn ? 'active' : ''}`}>
                <div className="avatar">{opp.name[0]}</div>
                <div style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{opp.name}</div>
                <div style={{fontSize: '1.2rem'}} className={opp.cardCount >= 20 ? 'mercy-warning' : ''}>
                    {opp.cardCount}
                </div>
                {opp.hasCalledUno && <div style={{position:'absolute', top:-10, right:-10, background:'red', borderRadius:'50%', padding:'2px 5px', fontSize:'0.7rem', fontWeight:'bold'}}>UNO</div>}
             </div>
           );
        })}
      </div>

      <div id="center-table">
          <div 
            id="direction-badge" 
            style={{ 
                transform: direction === 1 ? 'rotate(0deg)' : 'rotate(180deg)',
                opacity: 0.2
            }}
          >
            ↻
          </div>
          
          {drawStack > 0 && (
             <div id="stack-badge">STACK +{drawStack}</div>
          )}

          {rouletteColor && (
             <div id="stack-badge" style={{color: activeColorHex}}>TARGET: {rouletteColor}</div>
          )}

          <div className="info-badge" style={{ top: -80, opacity: 0.7 }}>
             {lastActionDescription}
          </div>

          <div className="pile" id="draw-pile" onClick={() => store.drawCard(player.id)}>
             <div style={{color:'white', fontWeight:'bold'}}>DRAW</div>
          </div>

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

      <div id="player-hand">
         {player.hand.map((card, idx) => {
             const isMyTurn = players[currentPlayerIndex]?.id === player.id;
             const isValidMove = checkPlayable(card, store);
             const canPlay = isMyTurn && isValidMove;
             
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

      {showUnoBtn && (
          <button 
            className={`uno-btn ${isCatchAction ? 'catch' : ''}`} 
            onClick={() => isCatchAction ? store.challengeUno(player.id) : store.declareUno(player.id)}
          >
              {isCatchAction ? 'CATCH!' : 'UNO!'}
          </button>
      )}

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
