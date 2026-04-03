"use client";

import React, { useRef } from 'react';

interface CardProps {
  index: number;
  transform?: string;
  glowClass: string;
  isFlipping: boolean;
  isFlipped: boolean;
  packOpened: boolean;
  onFlip: (index: number) => void;
  cardImageUrl?: string;
  cardBackImageUrl?: string;
}

export const Card: React.FC<CardProps> = ({
  index,
  transform,
  glowClass,
  isFlipping,
  isFlipped,
  packOpened,
  onFlip,
  cardImageUrl,
  cardBackImageUrl,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const foilRef = useRef<HTMLDivElement>(null);
  const tiltRafRef = useRef<number | null>(null);

  const handleCardMouseEnter = () => {
    if (!cardRef.current) return;
  };

  const handleCardMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || !foilRef.current) return;

    const clientX = e.clientX;
    const clientY = e.clientY;

    if (tiltRafRef.current !== null) {
      cancelAnimationFrame(tiltRafRef.current);
    }

    tiltRafRef.current = requestAnimationFrame(() => {
      tiltRafRef.current = null;
      if (!cardRef.current || !foilRef.current) return;

      const card = cardRef.current;
      const foil = foilRef.current;

      const rect = card.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const midX = rect.width / 2;
      const midY = rect.height / 2;

      const tiltIntensity = packOpened ? 0.4 : 1.0;

      const rotateY = ((x - midX) / midX) * 10 * tiltIntensity;
      const rotateX = -((y - midY) / midY) * 10 * tiltIntensity;

      card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      foil.style.backgroundPosition = `${50 + rotateY * 5}% ${50 + rotateX * 5}%`;
    });
  };

  const handleCardMouseLeave = () => {
    if (tiltRafRef.current !== null) {
      cancelAnimationFrame(tiltRafRef.current);
      tiltRafRef.current = null;
    }
    if (!cardRef.current) return;
    cardRef.current.style.transform = '';
  };

  return (
    <div
      onClick={() => onFlip(index)}
      data-ph-capture-attribute-button="pack-card-flip"
      onMouseEnter={handleCardMouseEnter}
      onMouseMove={handleCardMouseMove}
      onMouseLeave={handleCardMouseLeave} 
      className={`card card-${index + 1} ${glowClass} ${isFlipping ? 'flipping' : ''} ${isFlipped ? 'flipped' : ''} ${packOpened ? `card-fallen card-fall-${index}` : ''}`}
      style={{
        zIndex: 50 - index,
        ...(transform && { transform }),
      }}
    >
      <div ref={cardRef} className="card-container">
        <div className="card-shadow">
          <div 
            className={`card-wrapper ${isFlipped ? 'rotated' : ''}`}
            onDragStart={(e) => e.preventDefault()}
            style={{ pointerEvents: isFlipped ? 'none' : 'auto' }}
          >
            <div className="card-front">
              {cardImageUrl ? (
                <img 
                  src={cardImageUrl} 
                  alt={`Card ${index + 1}`}
                  draggable={false} 
                />
              ) : (
                <img 
                  src="/card1.png" 
                  alt={`Card ${index + 1}`}
                  draggable={false} 
                />
              )}
              <div ref={foilRef} className="foil"></div>
            </div>
            <div className="card-back">
              {cardBackImageUrl && (
                <img 
                  src={cardBackImageUrl} 
                  alt={`Card ${index + 1}`}
                  draggable={false} 
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
