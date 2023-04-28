import { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import styles from './index.less';
import { createLine } from '@/utils';

const WIDTH = 700;
const HEIGHT = 700;
const GRIDROWS = 25;
const GRIDWIDTH = WIDTH / GRIDROWS;
const GRIDHEIGHT = HEIGHT / GRIDROWS;

const Index = () => {
  const [app, setApp] = useState<PIXI.Application>();
  const bgContainer = useRef<PIXI.Container>();
  const [startRect, setStartRect] = useState<{ x: number; y: number }>({
    x: 28 * 3,
    y: 28 * 5,
  });
  const [endRect, setEndRect] = useState<{ x: number; y: number }>({
    x: 28 * 20,
    y: 28 * 22,
  });

  useEffect(() => {
    let _app = new PIXI.Application({
      width: WIDTH,
      height: HEIGHT,
      antialias: true,
      transparent: false,
      resolution: 1,
      backgroundColor: 0xffffff,
      view: document.getElementById('mainCanvas') as HTMLCanvasElement,
    });
    setApp(_app);
  }, []);

  useEffect(() => {
    if (!app) {
      return;
    }
    initLine();
    createRect({ position: startRect });
    createRect({ position: endRect, color: 0xe4393c });
  }, [app]);

  const initLine = () => {
    const container = new PIXI.Container();

    for (let i = 0; i < GRIDROWS + 1; i++) {
      const lineX = createLine({
        moveToX: 0,
        moveToY: i * GRIDHEIGHT,
        lineToX: WIDTH,
        lineToY: i * GRIDHEIGHT,
      });
      const lineY = createLine({
        moveToX: i * GRIDWIDTH,
        moveToY: 0,
        lineToX: i * GRIDWIDTH,
        lineToY: HEIGHT,
      });
      container.addChild(lineX);
      container.addChild(lineY);
    }
    bgContainer.current = container;
    app!.stage.addChild(container);
    // app!.renderer.plugins.interaction.on(
    //   'pointerdown',
    //   (event: PIXI.InteractionEvent) => {
    //     let position = event.data.getLocalPosition(bgContainer.current!);
    //     console.log(position);
    //     createRect(position);
    //   }
    // );
  };

  const createRect = ({
    position,
    color = 0x000000,
  }: {
    position: { x: number; y: number };
    color?: number;
  }) => {
    const { x, y } = position;
    let rectangle = new PIXI.Graphics();
    rectangle.beginFill(color);
    rectangle.drawRect(
      x - (x % GRIDWIDTH),
      y - (y % GRIDHEIGHT),
      GRIDWIDTH,
      GRIDHEIGHT
    );
    rectangle.endFill();
    app?.stage.addChild(rectangle);
  };

  return (
    <div className={(styles as any).indexMain}>
      <canvas id="mainCanvas"></canvas>
    </div>
  );
};

export default Index;
