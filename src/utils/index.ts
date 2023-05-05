import { Graphics, Application } from 'pixi.js';
import { BgLayoutItemType } from '@/pages/index';

interface CreateLine {
  moveToX: number;
  moveToY: number;
  lineToX: number;
  lineToY: number;
  lineColor?: number;
  lineWidth?: number;
}

interface TranslatePositionProps {
  width: number;
  height: number;
  itemRows: number;
  rows: number;
  columns: number;
}

interface ClickPositionProps extends Position {
  width: number;
  height: number;
  itemRows: number;
}

interface Position {
  x: number;
  y: number;
}

interface RoutePlanProps {
  start: Position;
  end: Position;
  centerPosition: Position;
  obstacleAll: BgLayoutItemType[][];
}

interface NexStepReturn extends Position {
  gValue: number;
  hValue: number;
  value: number;
  type: 'route' | 'round';
}

export const createLine = ({
  moveToX,
  moveToY,
  lineToX,
  lineToY,
  lineColor = 0x000000,
  lineWidth = 1,
}: CreateLine) => {
  let line = new Graphics();
  line.lineStyle(lineWidth, lineColor, 1);
  line.moveTo(moveToX, moveToY);
  line.lineTo(lineToX, lineToY);
  return line;
};

/**
 * 路径坐标转换
 * @param param0
 * @returns
 */
export const translatePosition = ({
  width,
  height,
  itemRows,
  rows,
  columns,
}: TranslatePositionProps) => {
  const itemWidth = width / itemRows;
  const itemHeight = height / itemRows;
  return { x: itemWidth * columns, y: itemHeight * rows };
};

/**
 * 点击事件转换坐标
 */
export const clickPosition = ({
  width,
  height,
  itemRows,
  x,
  y,
}: ClickPositionProps) => {
  const itemWidth = width / itemRows;
  const columns = Math.floor(x / itemWidth);
  const rows = Math.floor(y / itemWidth);
  return {
    ...translatePosition({ width, height, itemRows, rows, columns }),
    relativeX: columns,
    relativeY: rows,
  };
};

/**
 * 计算出下一步
 * f(n) = g(n) + h(n)，取f(n)最小值
 * g(n) 指的是从起始格子到格子n的实际代价，而 h(n) 指的是从格子n到终点格子的估计代价。
 * 当f(n)相等，取最小的g
 * @param param0
 * @returns
 */
const nexStep = ({
  start,
  end,
  centerPosition,
  obstacleAll,
}: RoutePlanProps): NexStepReturn[] => {
  const { x: startX, y: startY } = start;
  const { x: endX, y: endY } = end;
  const { x: centerX, y: centerY } = centerPosition;
  const direction: any = {
    topLeft: { x: centerX - 1, y: centerY - 1 },
    topRight: { x: centerX + 1, y: centerY - 1 },
    bottomLeft: { x: centerX - 1, y: centerY + 1 },
    bottomRight: { x: centerX + 1, y: centerY + 1 },
    top: { x: centerX, y: centerY - 1 },
    bottom: { x: centerX, y: centerY + 1 },
    left: { x: centerX - 1, y: centerY },
    right: { x: centerX + 1, y: centerY },
  };
  let arr: NexStepReturn[] = [];
  for (let key in direction) {
    const { x, y } = direction[key];
    if (
      x < 0 ||
      y < 0 ||
      obstacleAll[y][x] === BgLayoutItemType.obstacle ||
      obstacleAll[y][x] === BgLayoutItemType.route
    ) {
      continue;
    }

    let gValue = Math.sqrt(Math.pow(startX - x, 2) + Math.pow(startY - y, 2));

    // 对角线距离
    let max = Math.max(Math.abs(endX - x), Math.abs(endY - y));
    let min = Math.min(Math.abs(endX - x), Math.abs(endY - y));
    let hValue = Math.sqrt(Math.pow(min, 2) + Math.pow(min, 2)) + max - min;

    // 曼哈顿距离
    // let hValue = Math.abs(endX - x) + Math.abs(endY - y);

    // 斜线距离
    // let hValue = Math.sqrt(
    //   Math.pow(Math.abs(endX - x), 2) + Math.pow(Math.abs(endY - y), 2)
    // );

    arr.push({ x, y, gValue, hValue, value: gValue + hValue, type: 'round' });
  }
  if (!arr.length) {
    return arr;
  }
  arr = arr.sort((a, b) => a.value - b.value);
  arr[0].type = 'route';
  let result = arr[0];
  for (let i = 0; i < arr.length; i++) {
    if (
      i !== 0 &&
      arr[i].value === result.value &&
      arr[i].gValue < result.gValue
    ) {
      result = arr[i];
      arr[i].type = 'route';
    }
  }
  arr.forEach((item, i) => {
    if (arr[i].x !== result.x || arr[i].y !== result.y) {
      arr[i].type = 'round';
    }
  });
  return arr;
};

/**
 * 路径计算
 * @param param0
 * @returns
 */
export const routePlan = ({
  start,
  end,
  obstacleAll,
}: Omit<RoutePlanProps, 'centerPosition'>) => {
  let arr: NexStepReturn[][] = [[]];
  const bgLayout = JSON.parse(JSON.stringify(obstacleAll));
  let centerPosition = start;
  function loop({
    start,
    end,
    obstacleAll,
    centerPosition,
  }: RoutePlanProps): NexStepReturn[][] {
    let nextPositionArr = nexStep({ start, end, centerPosition, obstacleAll });
    if (!nextPositionArr.length) {
      alert('不好意思，走不通呀！！！');
      return arr;
    }
    let nextPosition = nextPositionArr.filter(
      (item) => item.type === 'route'
    )[0];
    if (nextPosition.x === end.x && nextPosition.y === end.y) {
      return arr;
    }
    obstacleAll[nextPosition.y][nextPosition.x] = BgLayoutItemType.route;
    let position = { x: nextPosition.x, y: nextPosition.y };
    arr.push(nextPositionArr);
    return loop({
      start: position,
      end,
      centerPosition: nextPosition,
      obstacleAll,
    });
  }

  return loop({ start, end, centerPosition, obstacleAll: bgLayout });
};
