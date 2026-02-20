"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Tilt from 'react-parallax-tilt';
import { Card } from './Card';
import './PackOpeningAnimation.css';

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

const PACK_MAX_WIDTH = 400;
const ANGLE_AT_MAX = 36; // ширина уголка/ленточки при макс. размере пака

/** Вычисляемая ширина пака — синхронно с CSS */
const getPackWidth = () => Math.min(PACK_MAX_WIDTH, Math.max(150, window.innerWidth - 64));

/** Размер уголка пропорционально ширине пака */
const getAngleSize = (packWidth: number) => packWidth * ANGLE_AT_MAX / PACK_MAX_WIDTH;

export const PackOpeningAnimation: React.FC<PackOpeningAnimationProps> = ({ 
  cards = [] 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [progress, setProgress] = useState(() => ({ 
    x: getAngleSize(typeof window !== 'undefined' ? getPackWidth() : PACK_MAX_WIDTH) 
  }));
  const [distance, setDistance] = useState(() => 
    getAngleSize(typeof window !== 'undefined' ? getPackWidth() : PACK_MAX_WIDTH)
  );
  const [dragginStarted, setDragginStarted] = useState(false);
  const [packOpened, setPackOpened] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());
  const [flippingCards, setFlippingCards] = useState<Set<number>>(new Set());
  const [containerScale, setContainerScale] = useState(1);
  const [packWidth, setPackWidth] = useState(() => 
    typeof window !== 'undefined' ? getPackWidth() : PACK_MAX_WIDTH
  );
  const [isDesktop, setIsDesktop] = useState(() => 
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
  );

  const angleSize = getAngleSize(packWidth);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const containerRef = useRef<any>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const packRectRef = useRef<DOMRect | null>(null);
  const angleContainerRef = useRef<HTMLDivElement>(null);
  const angleElementRef = useRef<HTMLDivElement>(null);
  const topElementRef = useRef<HTMLDivElement>(null);
  const parallaxElementRef = useRef<HTMLElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const animationRafIdRef = useRef<number | null>(null);
  const animationStartTimeRef = useRef<number | null>(null);
  const animationStartProgressRef = useRef<number>(ANGLE_AT_MAX);
  const animationStartDistanceRef = useRef<number>(ANGLE_AT_MAX);
  
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
    if (progress.x <= angleSize) {
      return 'linear-gradient(135deg,rgba(155, 156, 152, 0.5) 50%, rgba(255, 250, 250, 0.6) 60%, rgba(176, 174, 174, 0.5) 73%, rgba(153, 153, 153, 0.6) 88%, rgba(115, 112, 112, 0.7) 100%)';
    }
    
    const angleElement = angleElementRef.current;
    const angleContainer = angleContainerRef.current;
    if (!angleElement || !angleContainer) {
      return 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(243, 243, 243, 0.6) 45%, rgba(221, 221, 221, 0.5) 50%, rgba(170, 170, 170, 0.4) 50%, rgba(187, 187, 187, 0.5) 56%, rgba(204, 204, 204, 0.6) 62%, rgba(243, 243, 243, 0.6) 80%, rgba(255, 255, 255, 0.7) 100%)';
    }
    
    const height = angleContainer.style.height.replace('px', '');
    const gradientOffset = 16 * angleSize / ANGLE_AT_MAX;
    const startGradient = 100 - (parseFloat(height) - gradientOffset) / parseFloat(height) * 100;
    const diagonalAngle = 135 - rotationAngle * 0.5;
    return `linear-gradient(${diagonalAngle}deg, 
      rgba(155, 156, 152, 0.5) ${startGradient}%, 
      rgba(255, 250, 250, 0.6) ${startGradient + 10}%, 
      rgba(176, 174, 174, 0.5) ${startGradient + 23}%, 
      rgba(153, 153, 153, 0.6) 88%, 
      rgba(115, 112, 112, 0.7) 100%)`;
  }, [progress.x, rotationAngle, angleSize]);
  
  // Обновляем градиент при изменении состояния
  useEffect(() => {
    if (angleElementRef.current && volumeGradient) {
      angleElementRef.current.style.setProperty('--volume-gradient', volumeGradient);
    }
  }, [volumeGradient]);
  
  // Мемоизируем clipPath
  const clipPath = useMemo(() => {
    if (!dragginStarted || progress.x < angleSize) {
      return '50% 50%';
    }
    return `0px ${angleSize + rotationAngle * 0.4}px`;
  }, [dragginStarted, progress.x, rotationAngle, angleSize]);

  const openThreshold = packWidth * 0.97;

  // Вычисляем opacity для glow-rays на основе distance
  const glowRaysOpacity = useMemo(() => {
    const minDistance = angleSize;
    const maxDistance = packWidth;
    const normalized = Math.max(0, Math.min(1, (distance - minDistance) / (maxDistance - minDistance)));
    const eased = 1 - Math.pow(1 - normalized, 2);
    return eased;
  }, [distance, packWidth, angleSize]);

  // Easing функция для плавной анимации
  const easeOutCubic = useCallback((t: number) => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  // Функция анимации открытия пакета до конца
  const animateToEnd = useCallback(() => {
    const duration = 400;
    const target = packWidth;

    const animate = (currentTime: number) => {
      if (!animationStartTimeRef.current) {
        animationStartTimeRef.current = currentTime;
      }

      const elapsed = currentTime - animationStartTimeRef.current;
      const progressValue = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progressValue);

      const currentProgressX = animationStartProgressRef.current + 
        (target - animationStartProgressRef.current) * easedProgress;
      const currentDistance = animationStartDistanceRef.current + 
        (target - animationStartDistanceRef.current) * easedProgress;

      setProgress({ x: currentProgressX });
      setDistance(currentDistance);
      
      setMousePos(prev => ({ x: 1000, y: prev.y }));

      if (progressValue < 1) {
        animationRafIdRef.current = requestAnimationFrame(animate);
      } else {
        setPackOpened(true);
        setProgress({ x: target });
        setDistance(target);
        
        animationStartTimeRef.current = null;
        animationRafIdRef.current = null;
      }
    };

    animationRafIdRef.current = requestAnimationFrame(animate);
  }, [easeOutCubic, packWidth]);

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
        const maxDist = rect.width;
        const minDist = getAngleSize(rect.width);
        const coords = getEventCoordinates(e);
        const relativeX = coords.x - rect.left;
        const relativeY = coords.y - rect.top;
        const relativeZ = Math.sqrt(relativeX * relativeX + relativeY * relativeY);

        const alpha = Math.min(Math.PI / 4, Math.max(0, Math.atan(relativeY / relativeX)));
        const newDistance = Math.min(maxDist, Math.max(minDist, relativeZ / (2 * Math.cos(alpha))));
        const newProgressX = Math.min(maxDist, Math.max(minDist, relativeX));

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleEnd = useCallback((_e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
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
  
  // Открытие пака по кнопке / Space
  const triggerOpenPack = useCallback(() => {
    if (packOpened || animationRafIdRef.current) return;

    setDragginStarted(true);
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    if (isDragging) setIsDragging(false);

    const packElement = getParallaxElement();
    if (packElement) {
      const rect = packElement.getBoundingClientRect();
      packRectRef.current = rect;
      setMousePos({ x: rect.left, y: rect.top });
    }

    animationStartProgressRef.current = progress.x;
    animationStartDistanceRef.current = distance;
    animationStartTimeRef.current = null;
    animateToEnd();
  }, [packOpened, isDragging, progress.x, distance, animateToEnd, getParallaxElement]);

  // Обработчик клика для переворота карточки
  const handleCardFlip = useCallback((index: number) => {
    if (flippedCards.has(index)) return;
    
    setFlippingCards(prev => new Set(prev).add(index));
    
    setTimeout(() => {
      setFlippedCards(prev => new Set(prev).add(index));
    }, 0);
  }, [flippedCards]);
  
  // Расчет scale для адаптации под размер экрана
  const calculateScale = useCallback(() => {
    const maxCardsWidth = 2000;
    const padding = 64;
    const availableWidth = window.innerWidth - padding;
    const scale = Math.min(1, availableWidth / maxCardsWidth);
    const minScale = 0.6;
    return Math.max(minScale, scale);
  }, []);

  // Обновление scale, packWidth и isDesktop при изменении размера окна
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const update = () => {
      setContainerScale(calculateScale());
      setPackWidth(getPackWidth());
      setIsDesktop(mediaQuery.matches);
    };

    update();
    mediaQuery.addEventListener('change', update);
    window.addEventListener('resize', update);
    return () => {
      mediaQuery.removeEventListener('change', update);
      window.removeEventListener('resize', update);
    };
  }, [calculateScale]);

  // Сброс progress/distance при ресайзе, если пак закрыт
  useEffect(() => {
    if (!packOpened && !isDragging) {
      setProgress({ x: angleSize });
      setDistance(angleSize);
    }
  }, [packWidth, packOpened, isDragging, angleSize]);

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
        if (e.repeat) return;
        e.preventDefault();

        if (!packOpened) {
          triggerOpenPack();
        } else {
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
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [packOpened, flippedCards, triggerOpenPack]);

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
        <div 
          ref={cardsContainerRef}
          className={`cards-container ${packOpened ? 'pack-opened' : ''}`}
          style={{
            '--container-scale': containerScale,
            // '--container-scale': 0.9,
          } as React.CSSProperties}
        >
          {cards.map((cardData, index) => {
            const transform = !packOpened 
              ? `translateX(calc(-50% + ${index * 2}px)) translateY(${50 - index * 3}px) rotate(${(index - 2) * 0.5}deg)` : 
                undefined;
            
            const glowType = glowMap[cardData?.rarity_name as keyof typeof glowMap] || 'silver';
            const glowClass = glowType ? `glow-${glowType}` : '';
            const isFlipping = flippingCards.has(index);
            const isFlipped = flippedCards.has(index);
            
            const cardImageUrl = '/card1.png'; 
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
          className={`glow-backlight-particles ${distance >= openThreshold && !isDragging ? 'pack-opened' : ''}`}
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
          className={`glow-backlight ${distance >= openThreshold && !isDragging ? 'pack-opened' : ''}`}
        >
          <div className="glow-ellipse glow-ellipse-1"></div>
          <div className="glow-ellipse glow-ellipse-2"></div>
          <div className="glow-ellipse glow-ellipse-3"></div>
        </div>
        <div 
          className={`animation-container ${distance >= openThreshold && !isDragging ? 'pack-opened' : ''}`}
          style={{ '--angle-size': `${angleSize}px` } as React.CSSProperties}
        >
          <div className={`glow-effect ${distance >= openThreshold ? 'pack-opened' : ''}`}>
            <div style={dragginStarted ? {} : { opacity: 1 }} className="glow-center">
            </div>
          </div>
          <Tilt
            ref={(node) => {
              containerRef.current = node;
              parallaxElementRef.current = node as unknown as HTMLElement;
            }}
            className={`tilt-wrapper parallax-effect glare-scale ${distance >= openThreshold ? 'pack-opened' : ''}`}
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
              className={`top ${distance >= openThreshold ? 'pack-opened' : ''}`} 
              ref={topElementRef}
              onMouseDown={(e) => handleStart(e)}
              onTouchStart={(e) => handleStart(e)}
              style={{ width: `calc(100% - ${distance}px)` }}
            > 
              <div
                ref={angleContainerRef}
                style={{ 
                  height: Math.max(angleSize, distance - angleSize), 
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
       {!packOpened && !dragginStarted && (
          isDesktop ? (
            <div
              className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-fit mx-auto mt-12 px-4 py-2 text-sm font-medium text-white/80 rounded-[12px] border border-white/20 z-10"
              style={{ backgroundColor: "rgba(213, 141, 69, 0.3)" }}
            >
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/20 font-mono text-xs">Space</kbd> to open pack
            </div>
          ) : (
            <button
              type="button"
              onClick={triggerOpenPack}
              className="pack-open-btn-pulse block absolute bottom-[5%] left-1/2 -translate-x-1/2 w-fit mx-auto mt-12 px-6 py-3 text-lg font-medium text-white hover:opacity-90 rounded-[15px] transition-opacity active:scale-[0.98] cursor-pointer z-10"
              style={{
                backgroundColor: "rgb(213, 141, 69)",
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
              }}
              aria-label="Open pack"
            >
              Open pack
            </button>
          )
        )}
    </div>
  );
};
