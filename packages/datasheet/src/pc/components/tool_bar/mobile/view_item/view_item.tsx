import { useThemeColors } from '@vikadata/components';
import { IViewProperty, Selectors, StoreActions, Strings, t } from '@apitable/core';
import { DragOutlined } from '@vikadata/icons';
import { Message } from 'pc/components/common';
import { Modal } from 'pc/components/common/mobile/modal';
import { changeView } from 'pc/hooks';
import SwipeOut from 'rc-swipeout';
import * as React from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { ViewIcon } from '../../view_switcher/view_icon';
import style from '../style.module.less';

export enum ActionType {
  Delete,
  Rename,
  Duplicate,
  Add,
}

interface IViewItemProps {
  view: IViewProperty;
  activeViewId: string;
  onChange(actionType: ActionType, view: IViewProperty);
  onClose(): void;
  draggable: boolean;
  validator(value: string): boolean;
}

export const ViewItem: React.FC<IViewItemProps> = props => {
  const colors = useThemeColors();
  const {
    onChange,
    draggable,
    activeViewId,
    view,
    validator,
  } = props;

  const {
    viewCreatable,
    viewRenamable,
    viewRemovable,
    datasheetId,
  } = useSelector(state => {
    const {
      viewCreatable,
      viewRenamable,
      viewRemovable,
    } = Selectors.getPermissions(state);

    const { datasheetId } = state.pageParams;

    return {
      viewCreatable,
      viewRenamable,
      viewRemovable,
      datasheetId,
    };
  }, shallowEqual);

  const rightContent = [
    {
      text: t(Strings.duplicate),
      onPress: () => {
        onChange(
          ActionType.Duplicate,
          view,
        );
      },
      style: { backgroundColor: colors.successColor },
      className: style.swipeItem,
    },
    {
      text: t(Strings.rename),
      onPress: () => {
        Modal.prompt({
          title: t(Strings.rename),
          defaultValue: view.name,
          onOk: value => {
            if (value === view.name) {
              return;
            }
            if (!validator(value)) {
              Message.error({
                content: t(Strings.view_name_length_err),
              });
              return;
            }
            onChange(
              ActionType.Rename,
              {
                ...view,
                name: value,
              }
            );
          },
        });
      },
      style: { backgroundColor: colors.warningColor },
      className: style.swipeItem,
    },
    {
      text: t(Strings.delete),
      onPress: async() => {
        const formList = await StoreActions.fetchForeignFormList(datasheetId!, view.id!);
        console.log(formList);
        Modal.warning({
          title: t(Strings.delete),
          content: formList.length > 0 ? t(Strings.notes_delete_the_view_linked_to_form, {
            view_name: view.name,
          }) : t(Strings.del_view_content, {
            view_name: view.name,
          }),
          onOk: () => {
            onChange(
              ActionType.Delete,
              view,
            );
          },
        });
      },
      style: { backgroundColor: colors.errorColor },
      className: style.swipeItem,
    },
  ];

  const viewPermissions = [
    viewCreatable,
    viewRenamable,
    viewRemovable,
  ];

  const _rightContent = rightContent.filter((_, index) => viewPermissions[index]);

  const active = activeViewId === view.id;
  const fillColor = active ? colors.primaryColor : colors.thirdLevelText;
  const fontColor = active ? colors.primaryColor : colors.firstLevelText;

  return (
    <SwipeOut
      right={_rightContent}
      autoClose
      disabled={!viewCreatable && !viewRenamable && !viewRemovable}
    >
      <div
        className={style.viewItem}
        onClick={() => {
          changeView(view.id);
          props.onClose();
        }}
      >
        {draggable && (
          <div className={style.iconMove}>
            <DragOutlined size={10} color={fillColor} />
          </div>
        )}
        <ViewIcon
          viewType={view.type}
          fill={fillColor}
        />
        <span
          className={style.text}
          style={{ color: fontColor }}
        >
          {view.name}
        </span>
      </div>
    </SwipeOut>
  );
};
