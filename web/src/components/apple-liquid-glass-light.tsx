/*
 *  Copyright 2026 The InfiniFlow Authors. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { useEffect } from 'react';

const SpecularSelector = '[data-apple-specular]';

/**
 * Tracks fine-pointer motion across opt-in Liquid Glass surfaces and cards,
 * updating `--glass-x` / `--glass-y` CSS custom properties with a single
 * rAF-throttled listener and zero React re-renders.
 */
export function AppleLiquidGlassLight() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(pointer: fine)');
    if (reducedMotion.matches || !finePointer.matches) {
      return;
    }

    let rafId = 0;
    let pendingTarget: HTMLElement | null = null;
    let pendingX = 0;
    let pendingY = 0;

    const flush = () => {
      rafId = 0;
      if (!pendingTarget || !pendingTarget.isConnected) {
        return;
      }
      const rect = pendingTarget.getBoundingClientRect();
      pendingTarget.style.setProperty(
        '--glass-x',
        `${Math.round(pendingX - rect.left)}px`,
      );
      pendingTarget.style.setProperty(
        '--glass-y',
        `${Math.round(pendingY - rect.top)}px`,
      );
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return;
      }
      const rawTarget = event.target;
      if (!(rawTarget instanceof Element)) {
        return;
      }
      const surface = rawTarget.closest<HTMLElement>(SpecularSelector);
      if (!surface) {
        return;
      }
      pendingTarget = surface;
      pendingX = event.clientX;
      pendingY = event.clientY;
      if (!rafId) {
        rafId = window.requestAnimationFrame(flush);
      }
    };

    document.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return null;
}
