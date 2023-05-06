import { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import styles from './index.module.less';
import {
  createLine,
  translatePosition,
  routePlan,
  routePlanDijkstra,
  clickPosition,
} from '@/utils';
import { Button, Select, Tooltip } from 'antd';

export enum BgLayoutItemType {
  empty = 0,
  obstacle = 1,
  start = 2,
  end = 3,
  route = 4,
  round = 5,
}

interface RectGraphics extends PIXI.Graphics {
  rectType: BgLayoutItemType;
  paramX: number;
  paramY: number;
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

const Index = () => {
  const [app, setApp] = useState<PIXI.Application>();
  const isAddObstacle = useRef(true);
  // 背景条纹容器
  const bgContainer = useRef<PIXI.Container>(new PIXI.Container());
  // 方格容器
  const rectContainer = useRef<PIXI.Container>(new PIXI.Container());
  // 路径和周围容器
  const routeRoundContainer = useRef<PIXI.Container>(new PIXI.Container());
  // 二维数组
  const bgLayout = useRef<BgLayoutItemType[][]>(obstacleAll);
  // 寻路模式，A*寻路和Dijkstra寻路
  const [routeType, setRouteType] = useState<'aStar' | 'dijkstra'>('aStar');
  const [isStart, setIsStart] = useState(false);
  const [selectType, setSelectType] = useState('one');
  const [step, setStep] = useState(0);
  const [startRect, setStartRect] = useState<{ x: number; y: number }>({
    x: 3,
    y: 5,
  });
  const [endRect, setEndRect] = useState<{ x: number; y: number }>({
    x: 20,
    y: 22,
  });
  const timer = useRef<NodeJS.Timeout[]>([]);

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
    drawObstacleArr();
  }, [app]);

  useEffect(() => {
    if (!isStart) {
      return;
    }
    setIsStart(false);
    drawRoute();
  }, [isStart]);

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
      type: BgLayoutItemType.start,
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
      type: BgLayoutItemType.end,
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
        type: BgLayoutItemType.obstacle,
      });
    });
  };

  /**
   * 绘制路径
   */
  const drawRoute = () => {
    isAddObstacle.current = false;
    if (routeType === 'dijkstra') {
      const list: any = routePlanDijkstra({
        start: startRect,
        end: endRect,
        obstacleAll: bgLayout.current,
        plan: selectType,
      });

      if (!list.length) {
        alert('不好意思，走不通呀！！！');
        return;
      }
      setStep(list.length);
      list.forEach((item: any, index: number) => {
        const _timer = setTimeout(() => {
          createRect({
            position: translatePosition({
              width: WIDTH,
              height: HEIGHT,
              itemRows: GRIDROWS,
              rows: item[1],
              columns: item[0],
            }),
            color: 0xf6f61f,
            type: BgLayoutItemType.route,
          });
          bgLayout.current[item[1]][item[0]] = BgLayoutItemType.route;
        }, 200 * index);
        timer.current.push(_timer);
      });
    } else {
      const routeList = routePlan({
        start: startRect,
        end: endRect,
        obstacleAll: bgLayout.current,
        plan: selectType,
      });
      setStep(routeList.length);
      let prohibitDraw = [
        BgLayoutItemType.start,
        BgLayoutItemType.end,
        BgLayoutItemType.obstacle,
        BgLayoutItemType.route,
      ];
      routeList.forEach((routeRowList, index) => {
        const _timer = setTimeout(() => {
          routeRowList.forEach((item) => {
            if (prohibitDraw.includes(bgLayout.current[item.y][item.x])) {
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
              color: item.type === 'route' ? 0xf6f61f : 0x6dffd6,
              type:
                item.type === 'route'
                  ? BgLayoutItemType.route
                  : BgLayoutItemType.round,
            });
            if (item.type === 'route') {
              bgLayout.current[item.y][item.x] = BgLayoutItemType.route;
            } else {
              bgLayout.current[item.y][item.x] = BgLayoutItemType.round;
            }
          });
        }, 200 * index);
        timer.current.push(_timer);
      });
    }
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

    // 点击事件生成障碍物，再次点击障碍物将障碍物消掉
    app!.renderer.plugins.interaction.on(
      'pointerdown',
      (event: PIXI.InteractionEvent) => {
        if (!isAddObstacle.current) {
          return;
        }
        let position = event.data.getLocalPosition(bgContainer.current!);
        const { x, y, relativeX, relativeY } = clickPosition({
          width: WIDTH,
          height: HEIGHT,
          itemRows: GRIDROWS,
          y: position.y,
          x: position.x,
        });

        const filterArr = rectContainer.current.children.filter(
          (item) =>
            (item as RectGraphics).rectType === BgLayoutItemType.obstacle &&
            Math.floor((item as RectGraphics).paramX / GRIDWIDTH) ===
              relativeX &&
            Math.floor((item as RectGraphics).paramY / GRIDHEIGHT) === relativeY
        );

        if (filterArr.length) {
          rectContainer.current.removeChild(filterArr[0]);
          bgLayout.current[relativeY][relativeX] = BgLayoutItemType.empty;
        } else {
          if (
            (relativeX === startRect.x && relativeY === startRect.y) ||
            (relativeX === endRect.x && relativeY === endRect.y)
          ) {
            return;
          }
          createRect({
            position: { x, y },
            color: 0xcccccc,
            type: BgLayoutItemType.obstacle,
          });
          bgLayout.current[relativeY][relativeX] = BgLayoutItemType.obstacle;
        }
      }
    );
  };

  /**
   * 创建格子
   * @param param0
   */
  const createRect = ({
    position,
    color = 0x000000,
    type = BgLayoutItemType.obstacle,
  }: {
    position: { x: number; y: number };
    color?: number;
    type?: BgLayoutItemType;
  }) => {
    const { x, y } = position;
    let rectangle = new PIXI.Graphics() as RectGraphics;
    rectangle.lineStyle(1, 0x000000, 1);
    rectangle.beginFill(color);
    rectangle.drawRect(
      x - (x % GRIDWIDTH),
      y - (y % GRIDHEIGHT),
      GRIDWIDTH,
      GRIDHEIGHT
    );
    rectangle.endFill();
    rectangle.paramX = x;
    rectangle.paramY = y;
    rectangle.rectType = type;
    if (type === BgLayoutItemType.route || type === BgLayoutItemType.round) {
      routeRoundContainer.current.addChild(rectangle);
      app?.stage.addChild(routeRoundContainer.current!);
    } else {
      rectContainer.current?.addChild(rectangle);
      app?.stage.addChild(rectContainer.current!);
    }
  };

  const playStart = () => {
    clearRoute();
    setIsStart(true);
  };

  /**
   * 清除路径
   */
  const clearRoute = () => {
    timer.current.forEach((timerItem) => clearTimeout(timerItem));
    timer.current = [];
    routeRoundContainer.current.children.forEach((item) => {
      bgLayout.current[Math.floor((item as RectGraphics).paramY / GRIDHEIGHT)][
        Math.floor((item as RectGraphics).paramX / GRIDWIDTH)
      ] = 0;
    });
    routeRoundContainer.current.removeChild(
      ...routeRoundContainer.current.children
    );
    app?.stage.removeChild(routeRoundContainer.current);
    isAddObstacle.current = true;
  };

  const handleChange = (value: string) => {
    setSelectType(value);
  };

  return (
    <div className={styles.indexMain}>
      <div className={styles.main}>
        <div className={styles.topBox}>
          <div>
            寻路模式：
            <Select
              defaultValue={routeType}
              style={{ width: 120 }}
              onChange={(value) => setRouteType(value)}
              options={[
                { value: 'aStar', label: 'A*寻路算法' },
                { value: 'dijkstra', label: 'Dijkstra寻路算法' },
              ]}
            />
          </div>
          <Button onClick={playStart}>开始</Button>
          <Button onClick={clearRoute}>清除路径</Button>
          {routeType === 'aStar' && (
            <Select
              defaultValue={selectType}
              style={{ width: 120 }}
              onChange={handleChange}
              options={[
                { value: 'one', label: '对角线距离' },
                { value: 'two', label: '曼哈顿距离' },
                { value: 'three', label: '斜线距离' },
              ]}
            />
          )}
          <div>
            总共步数：<b className={styles.stepValue}>{step || 0}</b>
          </div>
          <Tooltip
            placement="right"
            title="点击屏幕的区域可以绘制障碍物，再次点击障碍物会消除障碍物，请先清除路径之后添加或删除障碍物"
          >
            规则说明
          </Tooltip>
        </div>
        <canvas id="mainCanvas"></canvas>
      </div>
    </div>
  );
};

export default Index;
