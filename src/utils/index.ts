import { Graphics, Application } from 'pixi.js';
import { BgLayoutItemType } from '@/pages/index';
import { message } from 'antd';

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
  plan: string;
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
  plan,
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
      x >= 25 ||
      y < 0 ||
      y >= 25 ||
      obstacleAll[y][x] === BgLayoutItemType.obstacle ||
      obstacleAll[y][x] === BgLayoutItemType.route
    ) {
      continue;
    }

    let gValue = Math.sqrt(Math.pow(startX - x, 2) + Math.pow(startY - y, 2));

    let hValue = 0;

    if (plan === 'one') {
      // 对角线距离
      let max = Math.max(Math.abs(endX - x), Math.abs(endY - y));
      let min = Math.min(Math.abs(endX - x), Math.abs(endY - y));
      hValue = Math.sqrt(Math.pow(min, 2) + Math.pow(min, 2)) + max - min;
    } else if (plan === 'two') {
      // 曼哈顿距离
      hValue = Math.abs(endX - x) + Math.abs(endY - y);
    } else {
      // 斜线距离
      hValue = Math.sqrt(
        Math.pow(Math.abs(endX - x), 2) + Math.pow(Math.abs(endY - y), 2)
      );
    }

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
  plan,
}: Omit<RoutePlanProps, 'centerPosition'>) => {
  let arr: NexStepReturn[][] = [[]];
  const bgLayout = JSON.parse(JSON.stringify(obstacleAll));
  let centerPosition = start;

  function loop({
    start,
    end,
    obstacleAll,
    centerPosition,
  }: Omit<RoutePlanProps, 'plan'>): NexStepReturn[][] {
    let nextPositionArr = nexStep({
      start,
      end,
      centerPosition,
      obstacleAll,
      plan,
    });
    if (!nextPositionArr.length) {
      message.info('不好意思，走不通呀！！！');
      return arr;
    }
    let nextPosition = nextPositionArr.filter(
      (item) => item.type === 'route'
    )[0];
    if (nextPosition.x === end.x && nextPosition.y === end.y) {
      return arr;
    }
    // console.log(nextPosition, nextPositionArr);
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

/**
 * Dijkstra算法
 * 广度搜索算法
 * @param param0
 * @returns
 */
export const routePlanDijkstra = ({
  start,
  end,
  obstacleAll,
}: Omit<RoutePlanProps, 'centerPosition'>) => {
  const bg = JSON.parse(JSON.stringify(obstacleAll));
  // 定义网格单元类
  class Cell {
    x: number;
    y: number;
    distance: number;
    is_obstacle: boolean;
    visited: boolean;
    is_start: boolean;
    is_end: boolean;
    prev_cell: any;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      this.is_obstacle = obstacleAll[y][x] === BgLayoutItemType.obstacle;
      this.is_start = obstacleAll[y][x] === BgLayoutItemType.start;
      this.is_end = obstacleAll[y][x] === BgLayoutItemType.end;
      this.distance = Infinity; // 到起点的距离
      this.visited = false; // 是否已访问
      this.prev_cell = null; // 前一个网格单元
    }

    compareTo(other: Cell) {
      return this.distance - other.distance;
    }
  }

  obstacleAll.forEach((item, i) => {
    item.forEach((subItem, j) => {
      bg[j][i] = new Cell(i, j);
    });
  });
  // 初始化起点
  const start_cell = bg[start.y][start.x];
  start_cell.distance = 0;

  // 创建优先队列
  const pq = [start_cell];

  // Dijkstra算法
  while (pq.length) {
    const curr_cell = pq.shift();
    curr_cell.visited = true;

    // 找到终点，回溯路径
    if (curr_cell.x === end.x && curr_cell.y === end.y) {
      let path = [];
      let cell = curr_cell;
      while (cell) {
        path.push([cell.x, cell.y]);
        cell = cell.prev_cell;
      }
      path.reverse();
      if (path.length) {
        path = path.slice(1, path.length - 1);
      }
      return path;
    }

    // 计算相邻单元的距离
    for (const [dx, dy] of [
      [-1, 0],
      [1, 0],
      [0, -1],
      [0, 1],
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1],
    ]) {
      const x = curr_cell.x + dx;
      const y = curr_cell.y + dy;
      if (x < 0 || x >= 25 || y < 0 || y >= 25) {
        continue;
      }
      const neighbor_cell = bg[y][x];
      if (neighbor_cell.visited || neighbor_cell.is_obstacle) {
        continue;
      }
      const distance =
        curr_cell.distance +
        (dx !== 0 && dy !== 0 ? Math.sqrt(dx ** 2 + dy ** 2) : 1); // 距离公式，考虑斜向单元
      if (distance < neighbor_cell.distance) {
        neighbor_cell.distance = distance;
        neighbor_cell.prev_cell = curr_cell;
        pq.push(neighbor_cell);
        pq.sort((a, b) => a.compareTo(b));
      }
    }
  }
  return [];
};
