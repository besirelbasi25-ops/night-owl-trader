import { useState, useCallback, useRef, useEffect } from "react";

interface UseChartInteractionOptions {
  dataLength: number;
  minVisibleCandles?: number;
  maxVisibleCandles?: number;
}

interface ChartInteractionState {
  startIndex: number;
  endIndex: number;
  priceScaleFactor: number; // 1 = normal, <1 = zoomed out, >1 = zoomed in
  priceOffset: number; // vertical pan offset as fraction
}

export function useChartInteraction({ dataLength, minVisibleCandles = 20, maxVisibleCandles }: UseChartInteractionOptions) {
  const effectiveMax = maxVisibleCandles || dataLength;

  const [state, setState] = useState<ChartInteractionState>({
    startIndex: 0,
    endIndex: dataLength,
    priceScaleFactor: 1,
    priceOffset: 0,
  });

  // Reset when data changes significantly
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      startIndex: 0,
      endIndex: dataLength,
    }));
  }, [dataLength]);

  const isDragging = useRef(false);
  const isPriceDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragStartState = useRef(state);

  const clampRange = useCallback(
    (start: number, end: number): [number, number] => {
      let s = Math.round(start);
      let e = Math.round(end);
      const width = e - s;

      if (width < minVisibleCandles) {
        const center = (s + e) / 2;
        s = Math.round(center - minVisibleCandles / 2);
        e = s + minVisibleCandles;
      }
      if (width > effectiveMax) {
        const center = (s + e) / 2;
        s = Math.round(center - effectiveMax / 2);
        e = s + effectiveMax;
      }
      if (s < 0) { e -= s; s = 0; }
      if (e > dataLength) { s -= (e - dataLength); e = dataLength; }
      if (s < 0) s = 0;

      return [s, e];
    },
    [dataLength, minVisibleCandles, effectiveMax]
  );

  // Time axis: mouse wheel to zoom
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      setState((prev) => {
        const visibleWidth = prev.endIndex - prev.startIndex;
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        const newWidth = Math.round(visibleWidth * zoomFactor);
        const center = (prev.startIndex + prev.endIndex) / 2;
        const [s, end] = clampRange(center - newWidth / 2, center + newWidth / 2);
        return { ...prev, startIndex: s, endIndex: end };
      });
    },
    [clampRange]
  );

  // Time axis: drag to pan
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only left button, not on right price axis
      if (e.button !== 0) return;
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartState.current = { ...state };
      e.preventDefault();
    },
    [state]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent, chartWidth: number) => {
      if (isDragging.current) {
        const dx = e.clientX - dragStartX.current;
        const visibleWidth = dragStartState.current.endIndex - dragStartState.current.startIndex;
        // Map pixels to candle indices
        const candlesPerPixel = visibleWidth / (chartWidth - 80); // subtract axis width
        const shift = Math.round(-dx * candlesPerPixel);
        const [s, end] = clampRange(
          dragStartState.current.startIndex + shift,
          dragStartState.current.endIndex + shift
        );
        setState((prev) => ({ ...prev, startIndex: s, endIndex: end }));
      }
      if (isPriceDragging.current) {
        const dy = e.clientY - dragStartY.current;
        const scaleDelta = dy * 0.005; // drag down = zoom out, drag up = zoom in
        const newScale = Math.max(0.2, Math.min(5, dragStartState.current.priceScaleFactor + scaleDelta));
        setState((prev) => ({ ...prev, priceScaleFactor: newScale }));
      }
    },
    [clampRange]
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
    isPriceDragging.current = false;
  }, []);

  // Price axis: drag to scale
  const onPriceAxisMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isPriceDragging.current = true;
      dragStartY.current = e.clientY;
      dragStartState.current = { ...state };
    },
    [state]
  );

  // Price axis: wheel to zoom
  const onPriceAxisWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((prev) => {
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      return { ...prev, priceScaleFactor: Math.max(0.2, Math.min(5, prev.priceScaleFactor * factor)) };
    });
  }, []);

  // Double click to reset
  const onDoubleClick = useCallback(() => {
    setState({ startIndex: 0, endIndex: dataLength, priceScaleFactor: 1, priceOffset: 0 });
  }, [dataLength]);

  return {
    visibleStart: state.startIndex,
    visibleEnd: state.endIndex,
    priceScaleFactor: state.priceScaleFactor,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onPriceAxisMouseDown,
    onPriceAxisWheel,
    onDoubleClick,
  };
}
