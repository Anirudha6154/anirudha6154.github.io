
import React from 'react';
import { Card as CardType, CardValue, CardColor } from '../types';

interface CardProps {
  card: CardType;
  activeSide: 'light' | 'dark';
  onClick?: () => void;
  isPlayable?: boolean;
  isHidden?: boolean; 
  className?: string;
  style?: React.CSSProperties;
}

const getSymbol = (val: CardValue) => {
  switch (val) {
    case CardValue.SKIP: return '⊘';
    case CardValue.REVERSE: return '⇄';
    case CardValue.DRAW_TWO: return '+2';
    case CardValue.WILD: return '🌈';
    case CardValue.WILD_DRAW_FOUR: return '+4';
    case CardValue.WILD_DRAW_SIX: return '+6';
    case CardValue.WILD_DRAW_TEN: return '+10';
    case CardValue.DRAW_FIVE: return '+5';
    case CardValue.SKIP_EVERYONE: return '⏭';
    case CardValue.DISCARD_ALL: return '♻';
    case CardValue.FLIP: return 'FLIP';
    default: return val;
  }
};

export const Card: React.FC<CardProps> = ({ card, activeSide, onClick, isPlayable, isHidden, className, style }) => {
  const face = activeSide === 'light' ? card.light : card.dark;
  const symbol = getSymbol(face.value);
  
  // Mapping global CSS classes
  const colorClass = face.color; // The enum values (red, blue, etc.) match the CSS classes

  if (isHidden) {
    // Render Back of card
    const isDark = activeSide === 'dark';
    return (
      <div 
        className={`card ${isDark ? 'purple' : 'black'} ${className || ''}`}
        onClick={onClick}
        style={style}
      >
        <div className="card-inner" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: '1.5rem', fontStyle: 'italic', fontWeight: 'bold' }}>UNO</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`card ${colorClass} ${!isPlayable ? 'disabled' : ''} ${className || ''}`}
      onClick={isPlayable ? onClick : undefined}
      style={style}
    >
      <div className="tiny tl">{symbol}</div>
      <div className="card-inner">
        {symbol}
      </div>
      <div className="tiny br">{symbol}</div>
    </div>
  );
};
