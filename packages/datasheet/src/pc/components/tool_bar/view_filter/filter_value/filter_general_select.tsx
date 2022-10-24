import { FieldType, ICellValue, IField, IMultiSelectedIds, ISelectFieldOption, IUnitValue, IUserValue, Selectors, Strings, t } from '@apitable/core';
import { ChevronDownOutlined } from '@vikadata/icons';
import { useClickAway } from 'ahooks';
import classNames from 'classnames';
import { ComponentDisplay, ScreenSize } from 'pc/components/common/component_display';
import { Popup } from 'pc/components/common/mobile/popup';
import { OptionList } from 'pc/components/list';
import { MemberOptionList } from 'pc/components/list/member_option_list';
import { CellCreatedBy } from 'pc/components/multi_grid/cell/cell_created_by';
import { CellMember } from 'pc/components/multi_grid/cell/cell_member';
import { useThemeColors } from '@vikadata/components';
import Trigger from 'rc-trigger';
import { useRef, useState } from 'react';
import * as React from 'react';
import { useSelector } from 'react-redux';
import IconArrow from 'static/icon/common/common_icon_pulldown_line.svg';
import { CellOptions } from '../../../multi_grid/cell/cell_options/cell_options';
import styles from './style.module.less';

interface IFilterGeneralSelectProps {
  placeholder?: string;
  searchPlaceholder?: string;
  popupClass?: string;
  field: IField;
  isMulti: boolean;
  onChange: (value: string | IMultiSelectedIds | null) => void;
  cellValue?: ICellValue;
  listData: (IUnitValue | IUserValue)[] | ISelectFieldOption[];
}

export const FilterGeneralSelect: React.FC<IFilterGeneralSelectProps> = props => {
  const colors = useThemeColors();
  const { placeholder, searchPlaceholder, popupClass, field, isMulti, onChange, cellValue, listData } = props;
  const isMemberField: boolean = field.type === FieldType.Member;
  let DisplayComponent;
  let TriggerComponent;

  switch (field.type) {
    case FieldType.Member:
      TriggerComponent = MemberOptionList;
      DisplayComponent = CellMember;
      break;
    case FieldType.CreatedBy:
    case FieldType.LastModifiedBy:
      TriggerComponent = MemberOptionList;
      DisplayComponent = CellCreatedBy;
      break;
    default:
      TriggerComponent = OptionList;
      DisplayComponent = CellOptions;
      break;
  }

  const unitMap = useSelector(Selectors.getUnitMap);

  const [visible, setVisible] = useState(false);

  function commandFn(value: string[] | null) {
    onChange(value && value.length ? value : null);
    if (!isMulti) {
      setVisible(false);
    }
  }

  // TODO 解决神奇引用筛选面板不关闭问题，临时解决方案，强行关闭
  const refSelect = useRef<HTMLDivElement>(null);
  const refSelectItem = useRef<HTMLDivElement>(null);
  useClickAway(() => setVisible(false), [refSelect, refSelectItem], 'click');

  function renderPopup() {
    return (
      <div ref={refSelectItem} className={popupClass}>
        <TriggerComponent
          onClickItem={commandFn}
          showInviteTip
          showMoreTipButton={isMemberField}
          showSearchInput
          multiMode={isMulti}
          existValues={cellValue as string[]}
          listData={listData || []}
          uniqId={isMemberField ? 'unitId' : 'userId'}
          unitMap={unitMap}
          placeholder={searchPlaceholder}
        />
      </div>
    );
  }

  return (
    <div className={styles.select} ref={refSelect}>
      <ComponentDisplay minWidthCompatible={ScreenSize.md}>
        <Trigger
          action={['click']}
          popup={renderPopup()}
          destroyPopupOnHide
          popupAlign={{ points: ['tl', 'bl'], offset: [0, 8], overflow: { adjustX: true, adjustY: true }}}
          popupVisible={visible}
          onPopupVisibleChange={visible => setVisible(visible)}
          stretch="width,height"
          popupStyle={{ height: 'max-content' }}
        >
          <div className={classNames(styles.displayBox, styles.option)}>
            {!cellValue && placeholder ? (
              <div className={styles.placeholder}>{placeholder}</div>
            ) : (
              <DisplayComponent cellValue={cellValue} field={field} />
            )}
            <div className={styles.iconArrow}>
              <ChevronDownOutlined color={colors.black[500]} />
            </div>
          </div>
        </Trigger>
      </ComponentDisplay>

      <ComponentDisplay maxWidthCompatible={ScreenSize.md}>
        <div className={classNames(styles.displayBox, styles.option)} onClick={() => setVisible(!visible)}>
          <DisplayComponent cellValue={cellValue} field={field} />
          <div className={styles.iconArrow}>
            <IconArrow width={16} height={16} fill={colors.fourthLevelText} />
          </div>
        </div>
        <Popup
          title={t(Strings.please_choose)}
          height="90%"
          visible={visible}
          onClose={() => setVisible(false)}
          className={styles.filterGeneralPopupWrapper}
        >
          {renderPopup()}
        </Popup>
      </ComponentDisplay>
    </div>
  );
};
