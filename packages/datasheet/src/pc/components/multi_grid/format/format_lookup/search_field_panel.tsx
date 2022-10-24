import { FieldType, Field, IField, ILinkField, ILookUpField, Selectors, Strings, t } from '@apitable/core';
import classNames from 'classnames';
import isEmpty from 'lodash/isEmpty';
import { InlineNodeName } from 'pc/components/common/inline_node_name';
import { LineSearchInput } from 'pc/components/list/common_list/line_search_input';
import { TComponent } from 'pc/components/common/t_component';
import { useSelectIndex } from 'pc/hooks';
import { useThemeColors } from '@vikadata/components';
import { useMemo, useRef, useState } from 'react';
import * as React from 'react';
import { getFieldTypeIcon, checkComputeRef } from '../../field_setting';
import styles from './styles.module.less';
import { store } from 'pc/store';
import { WrapperTooltip } from 'pc/components/widget/widget_panel/widget_panel_header';
import { Tooltip } from 'pc/components/common';
import WarnIcon from 'static/icon/common/common_icon_warning_triangle.svg';
import { FieldPermissionLock } from 'pc/components/field_permission';
import { HighlightWords } from 'pc/components/highlight_words';

export enum ShowType {
  LinkField,
  LookField,
}

export interface IFieldSearchPanelProps {
  showType: ShowType;
  fields: IField[];
  field?: ILookUpField;
  onChange(id: string);
  errTip?: string;
  activeFieldId?: string;
  setSearchPanelVisible?(v: boolean);
  prefix?: React.ReactNode;
}

const NoLookupField = ({ showType, value }) => {
  const colors = useThemeColors();
  return (
    <div
      style={{
        height: showType === ShowType.LinkField ? 56 : 42,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: colors.thirdLevelText,
        overflow: 'hidden',
      }}
    >
      <TComponent
        tkey={t(Strings.lookup_not_found_search_keyword)}
        params={{
          notFoundSearchKeywordSpan: <span className={styles.notFoundSearchKeyword}>{value}</span>,
        }}
      />
    </div>
  );
};

const WarnTip = ({ text }) => {
  const colors = useThemeColors();
  return (
    <Tooltip
      title={text}
      placement="top"
    >
      <WarnIcon fill={colors.warningColor} width={15} height={13} className={styles.warningIcon} />
    </Tooltip>
  );
};

const FieldItem = ({ showType, handleFieldClick, field, activeFieldId, index, currentIndex, renderInlineNodeName, warnText, keyword }) => {
  const colors = useThemeColors();
  const foreignDatasheetReadable = useMemo(() => {
    if (showType !== ShowType.LinkField) {
      return true;
    }
    return Selectors.getPermissions(store.getState(), field.property.foreignDatasheetId).readable;
  }, [showType, field]);

  return (
    <WrapperTooltip wrapper={!foreignDatasheetReadable} tip={t(Strings.no_foreign_dst_readable)} style={{ display: 'block' }}>
      <div
        key={field.id}
        onClick={() => {
          foreignDatasheetReadable && !warnText && handleFieldClick(field.id);
        }}
        style={{
          height: showType === ShowType.LinkField ? 56 : 42,
        }}
        className={classNames({
          [styles.activeField]: activeFieldId === field.id,
          [styles.hover]: index === currentIndex,
          active: index === currentIndex,
          [styles.disabled]: !foreignDatasheetReadable || warnText,
        }, styles.fieldItem)}
      >
        <div className={styles.fieldIconAndTitle} style={{ opacity: (!foreignDatasheetReadable || warnText) ? 0.5 : 1 }}>
          <div
            className={classNames({
              [styles.iconWithFieldNote]: showType === ShowType.LinkField,
              [styles.iconType]: showType !== ShowType.LinkField,
            })}
          >
            {
              getFieldTypeIcon(
                field.type,
                activeFieldId === field.id ? colors.primaryColor : colors.thirdLevelText
              )
            }
          </div>
          <div className={styles.fieldName}>
            <HighlightWords keyword={keyword} words={field.name} />
            {
              showType === ShowType.LinkField && <div className={styles.fieldNote}>
                {renderInlineNodeName((field as ILinkField).property.foreignDatasheetId)}
              </div>
            }
          </div>
        </div>
        {warnText && <WarnTip text={warnText} />}
        <FieldPermissionLock fieldId={field.id} />
      </div>
    </WrapperTooltip>
  );
};

export function FieldSearchPanel(props: IFieldSearchPanelProps) {
  const { fields, activeFieldId, onChange, setSearchPanelVisible, showType, errTip, field } = props;
  const [value, setValue] = useState('');
  const showFields = fields.filter(item => item.name.toLowerCase().includes(value.toLowerCase()));

  const listContainerRef = useRef<any>(null);
  const handleFieldClick = (fieldId: string) => {
    onChange(fieldId);
    setSearchPanelVisible && setSearchPanelVisible(false);
  };

  const { index: currentIndex } = useSelectIndex({
    listLength: showFields.length,
    listContainerRef,
    activeItemClass: '.active',
    onEnter: index => {
      const field = showFields[index];
      field && handleFieldClick(field.id);
    },
  });

  const renderInlineNodeName = (datasheetId) => {
    const datasheet = Selectors.getDatasheet(store.getState(), datasheetId);
    return (
      <InlineNodeName
        nodeId={datasheetId}
        nodeName={datasheet?.name}
        nodeIcon={datasheet?.icon}
        prefix={t(Strings.association_table)}
        size={14}
        iconSize={16}
        withIcon
        withBrackets
      />
    );
  };

  return (
    <div className={styles.panel}>
      <div className={styles.title}>
        {
          t(showType === ShowType.LinkField ?
            Strings.lookup_link
            : Strings.check_field)
        }
      </div>
      {showType === ShowType.LinkField && (
        <div className={styles.subtitle}>
          {t(Strings.lookup_modal_subtitle)}
        </div>
      )}
      <div className={styles.searchInPut}>
        <LineSearchInput
          placeholder={t(Strings.search_field)}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        />
      </div>
      {
        errTip ? <div className={styles.noLinkTableTips}>
          {errTip}
        </div> : <div className={styles.optList} ref={listContainerRef}>
          {
            isEmpty(showFields) ?
              <NoLookupField showType={showType} value={value} /> :
              showFields.map((sf, index) => {
                // 判断是否会导致循环引用
                // 模拟实际选择的数据结构做检查
                let warnText;
                if (field && [FieldType.LookUp, FieldType.Formula].includes(sf.type)) {
                  const newField = {
                    ...field,
                    property: {
                      ...field.property,
                      lookUpTargetFieldId: sf.id,
                    },
                  };
                  warnText = checkComputeRef(newField);
                  if (typeof warnText != 'string') {
                    // 模拟选择实际数据检查新的 field 是否有问题
                    if (Field.bindModel(newField).hasError) {
                      warnText = t(Strings.field_configuration_err);
                    } else {
                      warnText = '';
                    }

                  }
                }
                return <FieldItem
                  key={index}
                  keyword={value}
                  index={index}
                  showType={showType}
                  handleFieldClick={handleFieldClick}
                  warnText={warnText}
                  field={sf}
                  activeFieldId={activeFieldId}
                  currentIndex={currentIndex}
                  renderInlineNodeName={renderInlineNodeName}
                />;
              })
          }
        </div>
      }

    </div>
  );
}
