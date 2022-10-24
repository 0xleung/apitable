import { teal } from '@vikadata/components';
import { KONVA_DATASHEET_ID, RowHeight, Strings, t } from '@apitable/core';
import { CommentBjEntireFilled, DragOutlined, ExpandRecordOutlined } from '@vikadata/icons';
import dynamic from 'next/dynamic';
import { generateTargetName } from 'pc/components/gantt_view';
import { Icon, IconType, Rect, Text } from 'pc/components/konva_components';
import { GRID_GROUP_OFFSET, GRID_ROW_HEAD_WIDTH, GridCoordinate, KonvaGridContext, KonvaGridViewContext } from 'pc/components/konva_grid';
import { FC, memo, useContext } from 'react';

const Group = dynamic(() => import('pc/components/gantt_view/hooks/use_gantt_timeline/group'), { ssr: false });
interface IRowHeadOperationProps {
  instance: GridCoordinate;
  isChecked: boolean;
  isHovered: boolean;
  isActive: boolean;
  rowIndex: number;
  commentCount: number;
  isAllowDrag: boolean;
  isWillMove?: boolean;
  recordId: string;
}

// Icon Path
const DragOutlinedPath = DragOutlined.toString();
const ExpandRecordOutlinedPath = ExpandRecordOutlined.toString();
const CommentBjFilledPath = CommentBjEntireFilled.toString();

const ICON_SIZE = 16;

export const RowHeadOperation: FC<IRowHeadOperationProps> = memo((props) => {
  const { instance, isChecked, isHovered, isActive, rowIndex, commentCount, isAllowDrag, recordId } = props;
  const { rowHeight } = instance;
  const { setTooltipInfo, clearTooltipInfo, theme } = useContext(KonvaGridContext);
  const { allowShowCommentPane, linearRows } = useContext(KonvaGridViewContext);
  const commentVisible = allowShowCommentPane && Boolean(commentCount);
  const colors = theme.color;

  if (rowIndex == null) return null;
  const y = instance.getRowOffset(rowIndex);
  const iconOffsetY = (RowHeight.Short - 16) / 2;
  const { depth } = linearRows[rowIndex];
  const x = depth > 0 ? (depth - 1) * GRID_GROUP_OFFSET : 0;

  const onExpandMouseEnter = () => {
    setTooltipInfo({
      placement: 'bottom',
      title: commentVisible ? t(Strings.activity_marker) : t(Strings.expand_current_record),
      visible: true,
      width: ICON_SIZE,
      height: 1,
      x: x + 48,
      y: y + 24,
      coordXEnable: false
    });
  };

  const onDragMouseEnter = () => {
    if (isAllowDrag) return;
    setTooltipInfo({
      placement: 'top',
      title: t(Strings.grit_keep_sort_disable_drag),
      visible: true,
      width: ICON_SIZE,
      height: 1,
      x: x + 8,
      y,
      coordXEnable: false
    });
  };

  return (
    <Group
      x={x}
      y={y}
    >
      {/* 提供背景色 */}
      <Rect
        name={generateTargetName({
          targetName: KONVA_DATASHEET_ID.GRID_ROW_HEAD,
          recordId,
        })}
        width={GRID_ROW_HEAD_WIDTH + 1}
        height={rowHeight}
        fill={'transparent'}
      />

      {
        (isChecked || isHovered || isActive) &&
        <Group>
          {/* 拖拽行 */}
          <Icon
            name={generateTargetName({
              targetName: KONVA_DATASHEET_ID.GRID_ROW_DRAG_HANDLER,
              recordId,
            })}
            x={6}
            y={iconOffsetY + 4}
            data={DragOutlinedPath}
            fill={isChecked ? colors.defaultBg : colors.thirdLevelText}
            onMouseEnter={onDragMouseEnter}
            onMouseOut={clearTooltipInfo}
          />

          {/* 选中行 */}
          <Icon
            name={generateTargetName({
              targetName: KONVA_DATASHEET_ID.GRID_ROW_SELECT_CHECKBOX,
              recordId,
            })}
            x={27}
            y={iconOffsetY + 1}
            type={isChecked ? IconType.Checked : IconType.Unchecked}
            fill={isChecked ? colors.primaryColor : colors.thirdLevelText}
          />

          {/* 展开行/评论 */}
          <Group
            x={48}
            y={iconOffsetY}
            onMouseEnter={onExpandMouseEnter}
            onMouseOut={clearTooltipInfo}
          >
            {
              !commentVisible ?
                <Icon
                  x={1}
                  name={generateTargetName({
                    targetName: KONVA_DATASHEET_ID.GRID_ROW_EXPAND_RECORD,
                    recordId,
                  })}
                  data={ExpandRecordOutlinedPath}
                  fill={colors.primaryColor}
                /> :
                <>
                  <Icon
                    name={generateTargetName({
                      targetName: KONVA_DATASHEET_ID.GRID_ROW_EXPAND_RECORD,
                      recordId,
                    })}
                    data={CommentBjFilledPath}
                    fill={teal[50]}
                  />
                  <Text
                    x={-2}
                    width={22}
                    height={16}
                    text={String(commentCount)}
                    align={'center'}
                    fill={teal[500]}
                    listening={false}
                  />
                </>
            }
          </Group>
        </Group>
      }
    </Group>
  );
});
