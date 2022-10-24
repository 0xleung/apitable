import { range } from 'lodash';
import { ILinearRow, ViewType } from '@apitable/core';
import { colors } from '@vikadata/components';
import { KonvaDrawer } from '../../utils/drawer';
import { GRID_ADD_FIELD_BUTTON_WIDTH, GRID_GROUP_ADD_FIELD_BUTTON_WIDTH, GRID_GROUP_OFFSET } from '../../constant';

export class GridLayout extends KonvaDrawer {
  protected x = 0;
  protected y = 0;
  protected rowHeight = 0;
  protected columnWidth = 0;
  protected rowIndex = 0;
  protected columnIndex = 0;
  protected groupCount = 0;
  protected columnCount = 0;
  protected viewType: ViewType = ViewType.Grid;

  init({ x, y, rowIndex, columnIndex, rowHeight, columnWidth, groupCount, columnCount, viewType }) {
    this.x = x;
    this.y = y;
    this.rowIndex = rowIndex;
    this.columnIndex = columnIndex;
    this.rowHeight = rowHeight;
    this.columnWidth = columnWidth;
    this.groupCount = groupCount;
    this.columnCount = columnCount;
    this.viewType = viewType;
  }

  /**
   * 是否是行头
   */
  protected get isFirst() {
    return this.columnIndex === 0;
  }

  /**
   * 是否是行尾
   */
  protected get isLast() {
    return this.columnIndex === this.columnCount - 1;
  }

  /**
   * 添加列按钮宽度
   */
  protected get addBtnWidth() {
    return this.groupCount ? GRID_GROUP_ADD_FIELD_BUTTON_WIDTH : GRID_ADD_FIELD_BUTTON_WIDTH;
  }

  /**
   * 根据分组长度，获取对应背景色列表
   */
  private getGroupBackgrounds() {
    const length = this.groupCount;
    const backgrounds: string[] = [colors.defaultBg];
    if (length > 1) backgrounds.unshift(colors.fc8);
    if (length > 2) backgrounds.unshift(colors.highBg);
    return backgrounds;
  }

  /**
   * 根据对应的深度，获取对应的背景色
   */
  protected getGroupBackgroundByDepth(depth: number) {
    if (this.viewType === ViewType.Gantt) return colors.defaultBg;
    if (!this.groupCount) return colors.defaultBg;
    const backgrounds = this.getGroupBackgrounds();
    return backgrounds[depth];
  }

  // 渲染 "添加列" 区域的空白 UI
  protected renderAddFieldBlank(row: ILinearRow) {
    const width = this.addBtnWidth;
    const background = this.getGroupBackgroundByDepth(0);
    const x = this.x + this.columnWidth;
    const y = this.y;
    const rowHeight = this.rowHeight;
    this.rect({
      x: x + 0.5,
      y: y - 0.5,
      width,
      height: rowHeight + 1,
      fill: background,
    });
    this.line({
      x,
      y,
      points: [width, 0, width, rowHeight],
      stroke: colors.sheetLineColor
    });
  }

  /**
   * 渲染行头缩进区域
   */
  protected renderIndentFront(depth: number) {
    range(depth).forEach(i => {
      this.rect({
        x: i * GRID_GROUP_OFFSET,
        y: this.y - 0.5,
        width: GRID_GROUP_OFFSET,
        height: this.rowHeight,
        fill: this.getGroupBackgroundByDepth(i),
      });
      this.line({
        x: i * GRID_GROUP_OFFSET + 0.5,
        y: this.y,
        points: [0, 0, 0, this.rowHeight],
        stroke: colors.sheetLineColor,
      });
    });
  }

  /**
   * 渲染行尾缩进区域
   */
  protected renderIndentEnd(depth: number) {
    const x = this.x;
    const y = this.y;
    const rowHeight = this.rowHeight;
    const columnWidth = this.columnWidth;
    const tabSizeList = [40, GRID_GROUP_OFFSET, 0];
    range(depth).forEach(i => {
      const isFirstGroup = i === 0;
      const rectOffsetX = isFirstGroup ? 0 : - GRID_GROUP_OFFSET;
      const lineOffsetX = isFirstGroup ? 40 : 0;
      this.rect({
        x: x + columnWidth + rectOffsetX + 0.5,
        y: y - 0.5,
        width: tabSizeList[i],
        height: rowHeight,
        fill: this.getGroupBackgroundByDepth(i),
      });
      this.line({
        x: x + columnWidth + lineOffsetX,
        y,
        points: [0, 0, 0, rowHeight],
        stroke: colors.sheetLineColor,
      });
    });
  }
}
