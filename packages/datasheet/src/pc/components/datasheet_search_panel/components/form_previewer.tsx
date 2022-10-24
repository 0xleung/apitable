import { Button } from '@vikadata/components';
import { Events, Field, FieldType, IMeta, Player, Selectors, Strings, t, ViewType } from '@apitable/core';
import { useMount } from 'ahooks';
import classnames from 'classnames';
import Image from 'next/image';
import { ScreenSize } from 'pc/components/common/component_display';
import { FormFieldContainer } from 'pc/components/form_container/form_field_container';
import { useResponsive } from 'pc/hooks';
import * as React from 'react';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import templateEmptyPng from 'static/icon/template/template_img_empty.png';
import styles from './style.module.less';

interface IFormPreviewerProps {
  datasheetId: string;
  viewId: string;
  meta: IMeta;
  onChange(result: { datasheetId?: string; viewId?: string; widgetId?: string; viewName?: string });
}

export const FormPreviewer: React.FC<IFormPreviewerProps> = props => {
  const { datasheetId, viewId, meta, onChange } = props;
  const { screenIsAtMost } = useResponsive();
  const isMobile = screenIsAtMost(ScreenSize.md);
  const currentView = meta.views.filter(view => view.id === viewId)[0];
  const fieldPermissionMap = useSelector(Selectors.getFieldPermissionMapFromForm);
  const fieldMap = useMemo(() => meta.fieldMap || {}, [meta.fieldMap]);
  const filteredColumns = useMemo(() => {
    return currentView.columns.filter(column => {
      const { fieldId, hidden } = column;
      const field = fieldMap[fieldId];
      if (field == null) {
        return false;
      }
      const formSheetAccessible = Selectors.getFormSheetAccessibleByFieldId(fieldPermissionMap, fieldId);

      return !hidden && formSheetAccessible && !Field.bindModel(field).isComputed && field.type !== FieldType.AutoNumber;
    });
  }, [currentView.columns, fieldMap, fieldPermissionMap]);

  const canCreate = useMemo(() => {
    if (!currentView) {
      return false;
    }
    return currentView.type === ViewType.Grid;
  }, [currentView]);

  const onFormCreate = () => {
    const viewName = currentView.name ? `${currentView.name}${t(Strings.key_of_adjective)}${t(Strings.vika_form)}` : undefined;
    onChange({ datasheetId, viewId, viewName });
  };
  useMount(() => {
    Player.doTrigger(Events.workbench_create_form_previewer_shown);
  });
  return (
    <div
      className={classnames(styles.formPreviewer, {
        [styles.formPreviewerMobile]: isMobile,
      })}
    >
      <div className={styles.scrollContainer}>
        {canCreate ? (
          <>
            <h3 className={styles.panelTitleDesc}>{t(Strings.preview_form_title_desc)}：</h3>
            <h3 className={styles.panelTitle}>{t(Strings.preview_form_title)}</h3>
            <div className={styles.panelContent}>
              <FormFieldContainer
                filteredColumns={filteredColumns}
                datasheetId={datasheetId}
                viewId={viewId}
                meta={meta}
                fieldUI={({ title, index, children, required }) => (
                  <div className={styles.formField}>
                    <h4 className={styles.title} data-required={required}>
                      <span className={styles.indexClass}>{index}</span>.{title}
                    </h4>
                    {children}
                  </div>
                )}
                editable={false}
                recordId=""
              />
            </div>
          </>
        ) : (
          <div className={styles.emptyTipWrap}>
            <Image src={templateEmptyPng} alt="" className={styles.img} />
            <div className={styles.emptyTip}>{t(Strings.no_view_create_form)}</div>
          </div>
        )}
      </div>
      <div className={styles.panelFooter}>
        <Button color="primary" block disabled={!canCreate} onClick={onFormCreate}>
          {t(Strings.create_form)}
        </Button>
      </div>
    </div>
  );
};
