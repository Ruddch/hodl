/** Конфигурация шага онбординга */
export type OnboardingStep = {
  /** CSS-селектор целевого элемента (например, "[data-onboarding='tournament-card']") */
  target: string;
  /** Заголовок tooltip */
  title: string;
  /** Описание */
  content: string;
  /** Позиция tooltip относительно элемента */
  placement?: "top" | "bottom" | "left" | "right";
  /** Border radius для spotlight (чтобы «дырка» повторяла скругление элемента). По умолчанию 0. */
  spotlightRadius?: number;
};

export type OnboardingConfig = OnboardingStep[];
