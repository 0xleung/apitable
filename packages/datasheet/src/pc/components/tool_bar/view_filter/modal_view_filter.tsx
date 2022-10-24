import {
  BasicValueType, Field, FilterConjunction as CoreFilterConjunction,
  FilterDuration, getNewId, IDPrefix, IFilterInfo, IGridViewProperty, ILookUpField, Selectors, Strings, t,
} from '@apitable/core';
import { useRef } from 'react';
import * as React from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import IconAdd from 'static/icon/common/common_icon_add_content.svg';
import { useThemeColors } from '@vikadata/components';
import ConditionList from './condition_list';
import { ExecuteFilterFn } from './interface';
import styles from './style.module.less';

interface IViewFilter {
  datasheetId: string;
  filterInfo: IFilterInfo;
  setFilters: Function;
  field?: ILookUpField;
}

const ViewFilterBase: React.FC<IViewFilter> = props => {
  const colors = useThemeColors();
  const { datasheetId, filterInfo, setFilters, field } = props;
  const view = useSelector(state => Selectors.getCurrentView(state, datasheetId))! as IGridViewProperty;
  const columns = view.columns;
  const fieldMap = useSelector(state => Selectors.getFieldMap(state, datasheetId))!;

  const changeFilter = (cb: ExecuteFilterFn) => {
    const result = cb(filterInfo!);
    setFilters(result);
  };

  // 标记是否已添加新的筛选项，直接在 addViewFilter 函数中滚动到底部无效
  const added = useRef<boolean>(false);

  function addViewFilter(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    const firstColumns = fieldMap[columns[0].fieldId];
    const exitIds = filterInfo ? filterInfo.conditions.map(item => item.conditionId) : [];
    const acceptFilterOperators = Field.bindModel(firstColumns).acceptFilterOperators;
    const newOperate = acceptFilterOperators[0];
    setFilters({
      conjunction: filterInfo?.conjunction || CoreFilterConjunction.And,
      conditions: [...(filterInfo?.conditions || []), {
        conditionId: getNewId(IDPrefix.Condition, exitIds),
        fieldId: columns[0].fieldId,
        operator: newOperate,
        fieldType: firstColumns.type as any,
        value: Field.bindModel(firstColumns).valueType === BasicValueType.DateTime ?
          [FilterDuration.ExactDate, null] : null,
      }],
    });
    added.current = true;
  }

  useEffect(() => {
    if (added.current) {
      const conditionWrapper = document.querySelector(`.${styles.condition}`) as HTMLDivElement;
      conditionWrapper.scrollTop = conditionWrapper.scrollHeight;
      added.current = false;
    }
  }, [filterInfo?.conditions.length]);

  function deleteFilter(idx: number) {
    setFilters({
      conjunction: filterInfo!.conjunction,
      conditions: filterInfo!.conditions.filter((item, index) => {
        return index !== idx;
      }),
    });
  }

  return (
    <div className={styles.viewFilter} style={{ width: 670 }}>
      <ConditionList
        filterInfo={filterInfo}
        fieldMap={fieldMap}
        changeFilter={changeFilter}
        deleteFilter={deleteFilter}
        datasheetId={datasheetId}
        field={field}
      />
      <div className={styles.addNewButton} onClick={addViewFilter}>
        <div className={styles.iconAdd}>
          <IconAdd width={16} height={16} fill={colors.thirdLevelText} />
        </div>
        {t(Strings.add_filter)}
      </div>
    </div>
  );
};

export const ModalViewFilter = React.memo(ViewFilterBase);
