import { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import styles from './index.module.less';
import { createLine, translatePosition, routePlan } from '@/utils';

export enum BgLayoutItemType {
  empty = 0,
  obstacle = 1,
  start = 2,
  end = 3,
  route = 4,
  round = 5,
}

const WIDTH = 700;
const HEIGHT = 700;
const GRIDROWS = 25;
const GRIDWIDTH = WIDTH / GRIDROWS;
const GRIDHEIGHT = HEIGHT / GRIDROWS;

const obstacleArr = [
  { x: 10, y: 10 },
  { x: 6, y: 3 },
  { x: 6, y: 4 },
  { x: 6, y: 5 },
  { x: 6, y: 6 },
  { x: 6, y: 7 },
  { x: 8, y: 7 },
  { x: 8, y: 9 },
  { x: 8, y: 11 },
  { x: 15, y: 12 },
  { x: 15, y: 16 },
  { x: 15, y: 17 },
  { x: 15, y: 19 },
  { x: 15, y: 21 },
  { x: 15, y: 22 },
  { x: 15, y: 23 },
  { x: 15, y: 24 },
];

let obstacleAll: BgLayoutItemType[][] = [];
for (let i = 0; i < GRIDROWS; i++) {
  obstacleAll.push(new Array(25).fill(0));
}

obstacleArr.forEach((item) => {
  obstacleAll[item.y][item.x] = 1;
});
console.log(obstacleAll);

const Index = () => {
  const [app, setApp] = useState<PIXI.Application>();
  const bgContainer = useRef<PIXI.Container>(new PIXI.Container());
  const rectContainer = useRef<PIXI.Container>(new PIXI.Container());
  const bgLayout = useRef<BgLayoutItemType[][]>(obstacleAll);
  const [startRect, setStartRect] = useState<{ x: number; y: number }>({
    x: 3,
    y: 5,
  });
  const [endRect, setEndRect] = useState<{ x: number; y: number }>({
    x: 20,
    y: 22,
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
    bgLayout.current[startRect.y][startRect.x] = BgLayoutItemType.start;
    bgLayout.current[endRect.y][endRect.x] = BgLayoutItemType.end;
    initLine();
    drawStartEnd();
    drawRoute();
    drawObstacleArr();
  }, [app]);

  /**
   * 绘制起点和终点
   */
  const drawStartEnd = () => {
    createRect({
      position: translatePosition({
        width: WIDTH,
        height: HEIGHT,
        itemRows: GRIDROWS,
        rows: startRect.y,
        columns: startRect.x,
      }),
    });
    createRect({
      position: translatePosition({
        width: WIDTH,
        height: HEIGHT,
        itemRows: GRIDROWS,
        rows: endRect.y,
        columns: endRect.x,
      }),
      color: 0xe4393c,
    });
  };

  /**
   * 绘制障碍物
   */
  const drawObstacleArr = () => {
    obstacleArr.forEach((item) => {
      createRect({
        position: translatePosition({
          width: WIDTH,
          height: HEIGHT,
          itemRows: GRIDROWS,
          rows: item.y,
          columns: item.x,
        }),
        color: 0xcccccc,
      });
    });
  };

  /**
   * 绘制路径
   */
  const drawRoute = () => {
    const routeList = routePlan({
      start: startRect,
      end: endRect,
      obstacleAll: bgLayout.current,
    });
    routeList.forEach((routeRowList, index) => {
      setTimeout(() => {
        routeRowList.forEach((item) => {
          if (bgLayout.current[item.y][item.x] !== BgLayoutItemType.empty) {
            return;
          }

          createRect({
            position: translatePosition({
              width: WIDTH,
              height: HEIGHT,
              itemRows: GRIDROWS,
              rows: item.y,
              columns: item.x,
            }),
            color: item.type === 'route' ? 0xff4400 : 0x6dffd6,
          });
          if (item.type === 'route') {
            bgLayout.current[item.y][item.x] = BgLayoutItemType.route;
          } else {
            bgLayout.current[item.y][item.x] = BgLayoutItemType.round;
          }
        });
      }, 500 * index);
    });
  };

  /**
   * 初始化网格
   */
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

  /**
   * 创建格子
   * @param param0
   */
  const createRect = ({
    position,
    color = 0x000000,
  }: {
    position: { x: number; y: number };
    color?: number;
  }) => {
    const { x, y } = position;
    let rectangle = new PIXI.Graphics();
    rectangle.lineStyle(1, 0x000000, 1);
    rectangle.beginFill(color);
    rectangle.drawRect(
      x - (x % GRIDWIDTH),
      y - (y % GRIDHEIGHT),
      GRIDWIDTH,
      GRIDHEIGHT
    );
    rectangle.endFill();
    rectContainer.current?.addChild(rectangle);
    app?.stage.addChild(rectContainer.current!);
  };

  return (
    <div className={(styles as any).indexMain}>
      <canvas id="mainCanvas"></canvas>
    </div>
  );
};

export default Index;
