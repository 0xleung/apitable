import { CollaCommandName, IGroupInfo, Selectors, Strings, t, ViewType } from '@apitable/core';
import produce from 'immer';
import { useCallback, useRef } from 'react';
import * as React from 'react';
import { DropResult } from 'react-beautiful-dnd';
import { useSelector } from 'react-redux';
import { SyncViewTip } from '../../sync_view_tip';
import { CommonViewSet } from '../common_view_set';
import styles from '../style.module.less';
import { ViewFieldOptions } from '../view_field_options';
import { ComponentDisplay, ScreenSize } from 'pc/components/common/component_display';
import { PopUpTitle } from 'pc/components/common';
import { executeCommandWithMirror } from 'pc/utils/execute_command_with_mirror';
import { resourceService } from 'pc/resource_service';
import { IUseListenTriggerInfo, useListenVisualHeight } from '@vikadata/components';

interface IViewSetting {
  close(e: React.MouseEvent): void;
  triggerInfo?: IUseListenTriggerInfo;
}

const MIN_HEIGHT = 120;
const MAX_HEIGHT = 340;

export const ViewGroup: React.FC<IViewSetting> = props => {
  const { triggerInfo } = props;
  const activeViewGroupInfo = useSelector(state => Selectors.getActiveViewGroupInfo(state)); // store 总存储的数据
  const activityView = useSelector(state => Selectors.getCurrentView(state))!;

  const containerRef = useRef<HTMLDivElement | null>(null);
  const { style, onListenResize } = useListenVisualHeight({
    listenNode: containerRef,
    minHeight: MIN_HEIGHT,
    maxHeight: MAX_HEIGHT,
    triggerInfo,
  });

  const activityViewId = activityView.id;
  const exitFieldIds = activeViewGroupInfo.map(item => item.fieldId);
  const submitGroup = useCallback(
    (data: IGroupInfo | null) => {
      executeCommandWithMirror(
        () => {
          resourceService.instance!.commandManager.execute({
            cmd: CollaCommandName.SetGroup,
            viewId: activityViewId,
            data: data || undefined,
          });
        },
        {
          groupInfo: data || undefined,
        },
      );
    },
    [activityViewId],
  );
  // 相册仅支持一级分组
  const fieldSelectVisible = [ViewType.Gallery].includes(activityView.type)
    ? !activeViewGroupInfo.length
    : activeViewGroupInfo && activeViewGroupInfo.length < 3;

  function setGroupField(index: number, fieldId: string) {
    submitGroup(
      produce(activeViewGroupInfo, draft => {
        if (!exitFieldIds.length) {
          // 第一次添加
          draft.push({ fieldId, desc: false });
        } else {
          // 第二次更新，刷新数据
          draft[index] = { fieldId, desc: false };
        }
        return draft;
      }),
    );
  }

  // 拖动结束之后修改顺序
  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination } = result;
      if (!destination) {
        return;
      }
      submitGroup(
        produce(activeViewGroupInfo, draft => {
          draft.splice(destination.index, 0, draft.splice(source.index, 1)[0]);
          return draft;
        }),
      );
    },
    [submitGroup, activeViewGroupInfo],
  );

  function setGroupRules(index: number, desc: boolean) {
    submitGroup(
      produce(activeViewGroupInfo, draft => {
        return draft.map((item, idx) => {
          if (idx === index) {
            return { ...item, desc };
          }
          return item;
        });
      }),
    );
  }

  function deleteItem(index: number) {
    const result = activeViewGroupInfo.filter((item, idx) => idx !== index);
    submitGroup(result.length ? result : null);
  }

  React.useEffect(() => {
    onListenResize();
  }, [activeViewGroupInfo, onListenResize]);

  return (
    <div className={styles.viewSort} style={style} ref={containerRef}>
      <ComponentDisplay minWidthCompatible={ScreenSize.md}>
        <PopUpTitle title={t(Strings.set_grouping)} infoUrl={t(Strings.group_help_url)} variant={'h7'} className={styles.boxTop} />
        <SyncViewTip style={{ paddingLeft: 20 }} />
      </ComponentDisplay>

      <main>
        <CommonViewSet
          onDragEnd={onDragEnd}
          dragData={activeViewGroupInfo}
          setField={setGroupField}
          existFieldIds={exitFieldIds}
          setRules={setGroupRules}
          deleteItem={deleteItem}
        />
      </main>
      {fieldSelectVisible && (
        <div className={styles.selectField}>
          <ViewFieldOptions
            isAddNewOption
            onChange={setGroupField.bind(null, exitFieldIds.length)}
            defaultFieldId={t(Strings.add_grouping)}
            existFieldIds={exitFieldIds}
          />
        </div>
      )}
    </div>
  );
};
