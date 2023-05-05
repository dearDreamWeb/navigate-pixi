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

interface Position {
  x: number;
  y: number;
}

interface RoutePlanProps {
  start: Position;
  end: Position;
  obstacleAll: number[][];
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
  obstacleAll,
}: RoutePlanProps): NexStepReturn[] => {
  const { x: startX, y: startY } = start;
  const { x: endX, y: endY } = end;
  const direction: any = {
    topLeft: { x: startX - 1, y: startY - 1, gValue: Math.sqrt(2) },
    topRight: { x: startX + 1, y: startY - 1, gValue: Math.sqrt(2) },
    bottomLeft: { x: startX - 1, y: startY + 1, gValue: Math.sqrt(2) },
    bottomRight: { x: startX + 1, y: startY + 1, gValue: Math.sqrt(2) },
    top: { x: startX, y: startY - 1, gValue: 1 },
    bottom: { x: startX, y: startY + 1, gValue: 1 },
    left: { x: startX - 1, y: startY, gValue: 1 },
    right: { x: startX + 1, y: startY, gValue: 1 },
  };
  let arr: NexStepReturn[] = [];
  for (let key in direction) {
    const { x, y, gValue } = direction[key];
    if (x < 0 || y < 0 || obstacleAll[y][x] === BgLayoutItemType.obstacle) {
      continue;
    }
    let hValue = Math.sqrt(
      Math.pow(Math.abs(endX - x), 2) + Math.pow(Math.abs(endY - y), 2)
    );
    arr.push({ x, y, gValue, hValue, value: gValue + hValue, type: 'round' });
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
export const routePlan = ({ start, end, obstacleAll }: RoutePlanProps) => {
  let arr: NexStepReturn[][] = [[]];
  function loop({
    start,
    end,
    obstacleAll,
  }: RoutePlanProps): NexStepReturn[][] {
    let nextPositionArr = nexStep({ start, end, obstacleAll });
    let nextPosition = nextPositionArr.filter(
      (item) => item.type === 'route'
    )[0];
    if (nextPosition.x === end.x && nextPosition.y === end.y) {
      return arr;
    }
    let position = { x: nextPosition.x, y: nextPosition.y };
    arr.push(nextPositionArr);
    return loop({ start: position, end, obstacleAll });
  }

  return loop({ start, end, obstacleAll });
};
