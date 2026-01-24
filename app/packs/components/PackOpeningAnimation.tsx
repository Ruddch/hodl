"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Tilt from 'react-parallax-tilt';
import { Card } from './Card';
import './PackOpeningAnimation.css';

// Временные импорты звуков - будут добавлены позже
// import wooshSound from '/sounds/woosh_3.mp3';
// import magicSound from '/sounds/magic_3.mp3';

interface PackOpeningAnimationProps {
  cards?: Array<{
    user_card_id: number;
    rendered_image_url?: string;
    token_symbol: string;
    rarity_color: string;
    rarity_name: string;
  }>;
}

const glowMap = {
  'gold': 'gold',
  'purple': 'purple',
  'blue': 'blue',
  'common': 'silver',
};

export const PackOpeningAnimation: React.FC<PackOpeningAnimationProps> = ({ 
  cards = [] 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState({ x: 36 });
  const [distance, setDistance] = useState(36);
  const [dragginStarted, setDragginStarted] = useState(false);
  const [packOpened, setPackOpened] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [flippingCards, setFlippingCards] = useState<Set<number>>(new Set());

  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<any>(null);
  const packRectRef = useRef<DOMRect | null>(null);
  const angleContainerRef = useRef<HTMLDivElement>(null);
  const angleElementRef = useRef<HTMLDivElement>(null);
  const topElementRef = useRef<HTMLDivElement>(null);
  const parallaxElementRef = useRef<HTMLElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const animationRafIdRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const animationStartProgressRef = useRef<number>(36);
  const animationStartDistanceRef = useRef<number>(36);
  
  // Вспомогательная функция для безопасного получения DOM элемента
  const getParallaxElement = useCallback(() => {
    if (parallaxElementRef.current && typeof parallaxElementRef.current.getBoundingClientRect === 'function') {
      return parallaxElementRef.current;
    }
    if (containerRef.current) {
      const element = containerRef.current.querySelector?.('.parallax-effect') || containerRef.current;
      if (element && typeof element.getBoundingClientRect === 'function') {
        return element;
      }
    }
    const element = document.querySelector('.parallax-effect');
    return element && typeof element.getBoundingClientRect === 'function' ? element : null;
  }, []);
  
  // Вычисляем угол поворота для направления правой стороны элемента к вершине вектора
  const calculateRotationAngle = useCallback(() => {
    if (!dragginStarted || !packRectRef.current || !topElementRef.current) return 0;
    
    const topRect = topElementRef.current.getBoundingClientRect();
    const packRect = packRectRef.current;
    
    const topLeftX = topRect.left - packRect.left;
    const topLeftY = topRect.top - packRect.top;
    
    const angleContainerRightX = topLeftX;
    const angleContainerRightY = topLeftY;
    
    const dx = mousePos.x - angleContainerRightX;
    const dy = mousePos.y - angleContainerRightY;
    
    const angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
    
    return Math.max(-90, Math.min(0, angle));
  }, [dragginStarted, mousePos.x, mousePos.y]);
  
  // Мемоизируем угол поворота
  const rotationAngle = useMemo(() => {
    return calculateRotationAngle();
  }, [calculateRotationAngle]);
  
  // Мемоизируем вычисление градиента
  const volumeGradient = useMemo(() => {
    if (progress.x <= 36) {
      return 'linear-gradient(135deg,rgba(155, 156, 152, 0.5) 50%, rgba(255, 250, 250, 0.6) 60%, rgba(176, 174, 174, 0.5) 73%, rgba(153, 153, 153, 0.6) 88%, rgba(115, 112, 112, 0.7) 100%)';
    }
    
    const angleElement = angleElementRef.current;
    const angleContainer = angleContainerRef.current;
    if (!angleElement || !angleContainer) {
      return 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(243, 243, 243, 0.6) 45%, rgba(221, 221, 221, 0.5) 50%, rgba(170, 170, 170, 0.4) 50%, rgba(187, 187, 187, 0.5) 56%, rgba(204, 204, 204, 0.6) 62%, rgba(243, 243, 243, 0.6) 80%, rgba(255, 255, 255, 0.7) 100%)';
    }
    
    const height = angleContainer.style.height.replace('px', '');
    const startGradient = 100 - (parseFloat(height) - 16) / parseFloat(height) * 100;
    const diagonalAngle = 135 - rotationAngle * 0.5;
    return `linear-gradient(${diagonalAngle}deg, 
      rgba(155, 156, 152, 0.5) ${startGradient}%, 
      rgba(255, 250, 250, 0.6) ${startGradient + 10}%, 
      rgba(176, 174, 174, 0.5) ${startGradient + 23}%, 
      rgba(153, 153, 153, 0.6) 88%, 
      rgba(115, 112, 112, 0.7) 100%)`;
  }, [progress.x, rotationAngle]);
  
  // Обновляем градиент при изменении состояния
  useEffect(() => {
    if (angleElementRef.current && volumeGradient) {
      angleElementRef.current.style.setProperty('--volume-gradient', volumeGradient);
    }
  }, [volumeGradient]);
  
  // Мемоизируем clipPath
  const clipPath = useMemo(() => {
    if (!dragginStarted || progress.x < 36) {
      return '50% 50%';
    }
    return `0px ${36 + rotationAngle * 0.4}px`;
  }, [dragginStarted, progress.x, rotationAngle]);

  // Вычисляем opacity для glow-rays на основе distance
  const glowRaysOpacity = useMemo(() => {
    const minDistance = 36;
    const maxDistance = 473;
    const normalized = Math.max(0, Math.min(1, (distance - minDistance) / (maxDistance - minDistance)));
    const eased = 1 - Math.pow(1 - normalized, 2);
    return eased;
  }, [distance]);

  // Easing функция для плавной анимации
  const easeOutCubic = useCallback((t: number) => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  // Функция анимации открытия пакета до конца
  const animateToEnd = useCallback(() => {
    const duration = 400;
    const targetProgress = 473;
    const targetDistance = 473;

    const animate = (currentTime: number) => {
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = currentTime;
      }

      const elapsed = currentTime - animationStartTimeRef.current;
      const progressValue = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progressValue);

      const currentProgressX = animationStartProgressRef.current + 
        (targetProgress - animationStartProgressRef.current) * easedProgress;
      const currentDistance = animationStartDistanceRef.current + 
        (targetDistance - animationStartDistanceRef.current) * easedProgress;

      setProgress({ x: currentProgressX });
      setDistance(currentDistance);
      
      setMousePos(prev => ({ x: 1000, y: prev.y }));

      if (progressValue < 1) {
        animationRafIdRef.current = requestAnimationFrame(animate);
      } else {
        setPackOpened(true);
        setProgress({ x: targetProgress });
        setDistance(targetDistance);
        
        animationStartTimeRef.current = null;
        animationRafIdRef.current = null;
      }
    };

    animationRafIdRef.current = requestAnimationFrame(animate);
  }, [easeOutCubic]);

  // Универсальная функция для получения координат из события
  const getEventCoordinates = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  }, []);

  // Оптимизированный обработчик движения мыши/касания
  const handleMove = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      const packElement = getParallaxElement();
      if (packElement) {
        const rect = packElement.getBoundingClientRect();
        packRectRef.current = rect;
        const coords = getEventCoordinates(e);
        const relativeX = coords.x - rect.left;
        const relativeY = coords.y - rect.top;
        const relativeZ = Math.sqrt(relativeX * relativeX + relativeY * relativeY);

        const alpha = Math.min(Math.PI / 4, Math.max(0, Math.atan(relativeY / relativeX)));
        const newDistance = Math.min(473, Math.max(36, relativeZ / (2 * Math.cos(alpha))));
        const newProgressX = Math.min(473, Math.max(36, relativeX));

        setMousePos({ x: relativeX, y: relativeY });
        setProgress({ x: newProgressX });
        setDistance(newDistance);
      }
    });
  }, [isDragging, getParallaxElement, getEventCoordinates]);

  const handleStart = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (animationRafIdRef.current) {
      cancelAnimationFrame(animationRafIdRef.current);
      animationRafIdRef.current = null;
      animationStartTimeRef.current = null;
    }

    setIsDragging(true);
    setDragginStarted(true);
    
    const packElement = getParallaxElement();
    if (packElement) {
      const rect = packElement.getBoundingClientRect();
      packRectRef.current = rect;
      const coords = getEventCoordinates(e);
      const relativeX = coords.x - rect.left;
      const relativeY = coords.y - rect.top;
      setMousePos({ x: relativeX, y: relativeY });
    }
  }, [getParallaxElement, getEventCoordinates]);

  const handleEnd = useCallback((e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    animationStartProgressRef.current = progress.x;
    animationStartDistanceRef.current = distance;
    animationStartTimeRef.current = null;

    animateToEnd();
  }, [isDragging, progress.x, distance, animateToEnd]);
  
  // Обработчик клика для переворота карточки
  const handleCardFlip = useCallback((index: number) => {
    if (flippedCards.has(index)) return;
    
    setFlippingCards(prev => new Set(prev).add(index));
    
    setTimeout(() => {
      setFlippedCards(prev => new Set(prev).add(index));
    }, 0);
  }, [flippedCards]);
  
  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (animationRafIdRef.current) {
        cancelAnimationFrame(animationRafIdRef.current);
      }
    };
  }, []);

  // Обработчик пробела: открытие пака и переворот карт
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (e.repeat) {
          return;
        }
        
        e.preventDefault();
        
        if (!packOpened && !animationRafIdRef.current) {
          setDragginStarted(true);
          
          if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
          }
          
          if (isDragging) {
            setIsDragging(false);
          }
          
          const packElement = getParallaxElement();
          if (packElement) {
            const rect = packElement.getBoundingClientRect();
            packRectRef.current = rect;
            const relativeX = rect.left;
            const relativeY = rect.top;
            setMousePos({ x: relativeX, y: relativeY });
          }
          
          animationStartProgressRef.current = progress.x;
          animationStartDistanceRef.current = distance;
          animationStartTimeRef.current = null;
          
          animateToEnd();
        } else if (packOpened) {
          for (let i = 0; i < 5; i++) {
            if (!flippedCards.has(i)) {
              setFlippedCards(prev => new Set(prev).add(i));
              break;
            }
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [packOpened, progress.x, distance, animateToEnd, isDragging, flippedCards, getParallaxElement]);

  // Глобальные обработчики событий
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => handleMove(e);
    const handleGlobalMouseUp = (e: MouseEvent) => handleEnd(e);
    const handleGlobalTouchMove = (e: TouchEvent) => handleMove(e);
    const handleGlobalTouchEnd = (e: TouchEvent) => handleEnd(e);

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalTouchMove);
    window.addEventListener('touchend', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [handleMove, handleEnd]);

  return (
    <div className="app">
      <div className="wrapper">
        <div className={`cards-container ${packOpened ? 'pack-opened' : ''}`}>
          {cards.map((cardData, index) => {
            const transform = !packOpened 
              ? `translateX(calc(-50% + ${index * 2}px)) translateY(${50 - index * 3}px) rotate(${(index - 2) * 0.5}deg)` : 
                undefined;
            
            const glowType = glowMap[cardData?.rarity_name as keyof typeof glowMap] || 'silver';
            const glowClass = glowType ? `glow-${glowType}` : '';
            const isFlipping = flippingCards.has(index);
            const isFlipped = flippedCards.has(index);
            
            const cardImageUrl = 'card1.png'; 
            const cardBackImageUrl = cardData?.rendered_image_url;
            
            return (
              <Card
                key={index}
                index={index}
                transform={transform}
                glowClass={glowClass}
                isFlipping={isFlipping}
                isFlipped={isFlipped}
                packOpened={packOpened}
                onFlip={handleCardFlip}
                cardImageUrl={cardImageUrl}
                cardBackImageUrl={cardBackImageUrl}
              />
            );
          })}
        </div>
        <div 
          style={{ opacity: glowRaysOpacity }} 
          className={`glow-backlight-particles ${distance >= 460 && !isDragging ? 'pack-opened' : ''}`}
        >
          <div className="backlight-particle backlight-particle-1"></div>
          <div className="backlight-particle backlight-particle-2"></div>
          <div className="backlight-particle backlight-particle-3"></div>
          <div className="backlight-particle backlight-particle-4"></div>
          <div className="backlight-particle backlight-particle-5"></div>
          <div className="backlight-particle backlight-particle-6"></div>
          <div className="backlight-particle backlight-particle-7"></div>
          <div className="backlight-particle backlight-particle-8"></div>
        </div>
        <div 
          style={{ opacity: glowRaysOpacity }} 
          className={`glow-backlight ${distance >= 460 && !isDragging ? 'pack-opened' : ''}`}
        >
          <div className="glow-ellipse glow-ellipse-1"></div>
          <div className="glow-ellipse glow-ellipse-2"></div>
          <div className="glow-ellipse glow-ellipse-3"></div>
        </div>
        <div className={`animation-container ${distance >= 460 && !isDragging ? 'pack-opened' : ''}`}>
          <div className={`glow-effect ${distance >= 460 ? 'pack-opened' : ''}`}>
            <div style={dragginStarted ? {} : { opacity: 1 }} className="glow-center">
            </div>
          </div>
          <Tilt
            ref={(node) => {
              containerRef.current = node;
              parallaxElementRef.current = node as unknown as HTMLElement;
            }}
            className={`tilt-wrapper parallax-effect glare-scale ${distance >= 460 ? 'pack-opened' : ''}`}
            tiltEnable={!packOpened}
            tiltMaxAngleX={dragginStarted ? 0 : 10}
            tiltMaxAngleY={dragginStarted ? 0 : 10}
            perspective={1000}
            glareEnable={!dragginStarted}
            glareColor={dragginStarted ? 'transparent' : 'rgba(250, 195, 132, 0.3)'}
            glarePosition="bottom"
            glareBorderRadius="10px"
            scale={dragginStarted ? 1 : 1.02}
            transitionSpeed={1000}
          >
            <div 
              id="top" 
              className={`top ${distance >= 460 ? 'pack-opened' : ''}`} 
              ref={topElementRef}
              onMouseDown={(e) => handleStart(e)}
              onTouchStart={(e) => handleStart(e)}
              style={{ width: `calc(100% - ${distance}px)` }}
            > 
              <div
                ref={angleContainerRef}
                style={{ 
                  height: Math.max(36, distance - 36), 
                  transform: `translateX(-100%) rotateZ(${dragginStarted ? rotationAngle : 0}deg)` 
                }}
                className={`angle-container ${dragginStarted ? 'active' : ''}`}
              >
                <div 
                  ref={angleElementRef}
                  style={{
                    ...(dragginStarted ? { clipPath: `polygon(${clipPath}, 100% 0, 100% 100%, 0% 100%)` } : {})
                  }}
                  className={`angle ${dragginStarted ? 'active' : ''}`}
                ></div>
              </div>
            </div>
            
            <div id="bottom" className="bottom">
              <div className="inner-element">
              </div>
            </div>
          </Tilt>
        </div>
      </div>
    </div>
  );
};
