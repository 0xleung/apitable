import { shallowEqual, useSelector } from 'react-redux';
import { PropsWithChildren } from 'react';
import * as React from 'react';
import { GridChildComponentProps, ListChildComponentProps } from '@vikadata/react-window';
import { BasicValueType, Field, Selectors } from '@apitable/core';
import { CellValue } from '../multi_grid/cell/cell_value';
import { store } from 'pc/store';
import styles from './styles.module.less';
import { FieldTitle } from '../expand_record/field_editor/field_title';
import { useThemeColors } from '@vikadata/components';
import IconMore from 'static/icon/common/common_icon_more_stand.svg';
import { FIELD_HEAD_CLASS } from 'pc/utils';
import classNames from 'classnames';

enum CellType {
  HEAD,
  TITLE,
  GRID,
}

interface ICellFuncOwnProps {
  type: CellType;
}

type ChildProps = GridChildComponentProps & ListChildComponentProps;

const CellFunc: React.FC<ChildProps & ICellFuncOwnProps> = props => {
  const colors = useThemeColors();
  const {
    columnIndex,
    rowIndex,
    index,
    style,
    type,
    data,
  } = props;

  const state = store.getState();

  const {
    datasheetId,
    firstColumn,
    remainingColumns,
    fieldMap,
    rows,
    containerWidth,
    manageable,
    searchKeyword,
    snapshot,
  } = data;
  
  const activeCell = useSelector(state => Selectors.getActiveCell(state));
  const activeSelectFieldId = activeCell?.fieldId;
  const matched = (recordId: string, fieldId: string) => {
    if (!searchKeyword) {
      return false;
    }
    const stringifyCellValue = Selectors.getStringifyCellValue(state, snapshot, recordId, fieldId, true);
    if (!stringifyCellValue) {
      return false;
    }
    return stringifyCellValue?.toLowerCase().includes(searchKeyword.toLowerCase());
  };

  if (type === CellType.HEAD) {
    const hasFoundMark = activeSelectFieldId === remainingColumns[index].fieldId;
    return (
      <div
        className={classNames(FIELD_HEAD_CLASS, styles.fieldHead)}
        style={{
          ...style,
          paddingLeft: index === 0 ? 26 : 10,
          paddingRight: index === remainingColumns.length - 1 ? 16 : 0,
        }}
        data-field-id={remainingColumns[index].fieldId}
        data-column-index={index + 1}
      >
        <div className={classNames(styles.fieldTitleWrapper, hasFoundMark && styles.foundMarkMobileHeadCell)}>
          <FieldTitle
            fieldId={remainingColumns[index].fieldId}
            datasheetId={datasheetId}
            hideDesc
          />
        </div>
        {manageable &&
          <div className={styles.fieldMenuTrigger}>
            <IconMore fill={colors.thirdLevelText} />
          </div>
        }
      </div>
    );
  }

  const record = Selectors.getRecord(state, rows[type === CellType.TITLE ? index : rowIndex].recordId, datasheetId);
  const field = fieldMap[type === CellType.TITLE ? firstColumn.fieldId : remainingColumns[columnIndex].fieldId];
  const cellValue = Selectors.getCellValue(state, {
    meta: { fieldMap: { [field.id]: field }},
    recordMap: { [record.id]: record },
  }, record.id, field.id);

  const isEmptyCell = Boolean(cellValue);

  if (type === CellType.TITLE) {
    const hasFoundMark = matched(record.id, field.id);

    return (
      <div
        className={styles.firstColumnCell}
        style={style}
        data-record-id={record.id}
      >
        <div
          className={classNames(styles.cellTitleContainer, {
            [styles.hiddenAll]: remainingColumns.length === 0
          })}
          style={{ width: containerWidth - 32 }}
        >
          <div className={classNames(styles.fieldTitleWrapper, styles.fieldTitleWithContent)}>
            <FieldTitle
              fieldId={field.id}
              datasheetId={datasheetId}
              hideDesc
            />
          </div>
          {!isEmptyCell ?
            <div className={styles.cellHolderWrapper}>
              <span className={styles.cellHolder} />
            </div>
            :
            <CellValue
              className={classNames(styles.cellValue, styles.titleCell, {
                [styles.foundMarkCell]: hasFoundMark,
              })}
              recordId={record.id}
              field={field}
              cellValue={cellValue}
            />}
        </div>
      </div>
    );
  }

  const isFirstColumn = columnIndex === 0;
  const isLastColumn = columnIndex === remainingColumns.length - 1;

  const isNumberField =
    Field.bindModel(field).basicValueType === BasicValueType.Number ||
    Field.bindModel(field).innerBasicValueType === BasicValueType.Number;
  const hasFoundMark = matched(record.id, field.id) || activeSelectFieldId === field.id;

  const cellValueClass = classNames(
    styles.cellValue,
    isNumberField && styles.numberCell,
    hasFoundMark && styles.foundMarkCell,
  );

  return (
    <div
      className={styles.cellWrapper}
      style={{
        ...style,
        paddingLeft: isFirstColumn ? 16 : 0,
        paddingRight: isLastColumn ? 16 : 0,
      }}
      data-record-id={record.id}
    >
      <div
        className={styles.cellContainer}
        style={{
          borderBottomLeftRadius: isFirstColumn ? 8 : 0,
          borderTopLeftRadius: isFirstColumn ? 8 : 0,
          borderTopRightRadius: isLastColumn ? 8 : 0,
          borderBottomRightRadius: isLastColumn ? 8 : 0,
        }}
      >
        {!isEmptyCell ?
          <div className={classNames(styles.cellHolderWrapper, isNumberField && styles.numberCellHolder)}>
            <span className={styles.cellHolder} />
          </div>
          :
          <CellValue
            className={cellValueClass}
            recordId={record.id}
            field={field}
            cellValue={cellValue}
          />
        }
      </div>
    </div>
  );
};

const CellFuncHead = (props: PropsWithChildren<ChildProps>) => {
  return CellFunc({ ...props, type: CellType.HEAD });
};

const CellFuncTitle = (props: PropsWithChildren<ChildProps>) => {
  return CellFunc({ ...props, type: CellType.TITLE });
};

const CellFuncGrid = (props: PropsWithChildren<ChildProps>) => {
  return CellFunc({ ...props, type: CellType.GRID });
};

const areEqual = (
  prevProps: Readonly<PropsWithChildren<ChildProps>>,
  nextProps: Readonly<PropsWithChildren<ChildProps>>,
) => {
  const { style: prevStyle, data: prevData, ...prevRest } = prevProps;
  const { style: nextStyle, data: nextData, ...nextRest } = nextProps;
  return shallowEqual(prevStyle, nextStyle) && shallowEqual(prevData, nextData) && shallowEqual(prevRest, nextRest);
};

export const Cell = React.memo(CellFuncGrid, areEqual);
export const CellTitle = React.memo(CellFuncTitle, areEqual);
export const CellHead = React.memo(CellFuncHead, areEqual);
