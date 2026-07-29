import React from 'react';

/**
 * Publishes the height the software keyboard is stealing as `--kb-h`.
 *
 * `interactive-widget=resizes-content` in the viewport meta handles this on
 * Chromium, but iOS Safari ignores it: the layout viewport stays put and the
 * keyboard simply covers whatever is docked to the bottom. For an app whose
 * primary interaction is typing into a bottom dock, that is the largest
 * non-native defect there is.
 *
 * `visualViewport` is the only place the real offset is legible. On Android the
 * layout viewport has already shrunk, so this computes ~0 and nothing is
 * double-shifted.
 */
export function useKeyboardInset(): void {
  React.useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    let raf = 0;
    const publish = () => {
      const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      document.documentElement.style.setProperty('--kb-h', `${Math.round(inset)}px`);
    };
    const onChange = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(publish);
    };

    publish();
    vv.addEventListener('resize', onChange);
    vv.addEventListener('scroll', onChange);
    return () => {
      cancelAnimationFrame(raf);
      vv.removeEventListener('resize', onChange);
      vv.removeEventListener('scroll', onChange);
      document.documentElement.style.removeProperty('--kb-h');
    };
  }, []);
}
