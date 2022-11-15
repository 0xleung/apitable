import { memo, useContext, useRef, useState } from 'react';
import { Selectors, t, Strings } from '@apitable/core';
import { ExpandRecordOutlined } from '@apitable/icons';
import { Typography, IconButton } from '@apitable/components';
import { useSelector } from 'react-redux';
import { FieldEditor } from 'pc/components/expand_record/field_editor';
import { expandRecordIdNavigate } from 'pc/components/expand_record';
import { useClickAway } from 'ahooks';
import styles from './styles.module.less';
import { CalendarContext } from '../calendar_context';
import cls from 'classnames';

const DragDropModalBase = ({ recordId, style }: { recordId?: string; style: object }) => {
  const {
    calendarStyle,
    snapshot,
    datasheetId
  } = useSelector(state => {
    const dstId = Selectors.getActiveDatasheetId(state)!;
    return {
      datasheetId: dstId,
      snapshot: Selectors.getSnapshot(state, dstId)!,
      calendarStyle: Selectors.getCalendarStyle(state)!,
    };
  });
  const firstFieldId = snapshot.meta.views[0].columns[0].fieldId;
  const { startFieldId, endFieldId } = calendarStyle;
  const [focusFieldId, setFocusFieldId] = useState<string | null>(firstFieldId);

  const clickWithinField = useRef<boolean>(Boolean(focusFieldId));
  
  const modalRef = useRef(null);
  const { setRecordModal, isStartDateTimeField, isEndDateTimeField } = useContext(CalendarContext);

  const titleFieldRef = useRef(null);
  const dateFieldRef = useRef(null);

  useClickAway(() => {
    setRecordModal(undefined);
  }, modalRef, 'click');

  useClickAway(() => {
    clickWithinField.current = false;
    setFocusFieldId(null);
  }, [titleFieldRef, dateFieldRef]);

  if (!recordId) return null;
  return (
    <div className={cls('dragDropModal', styles.dragDropModal)} ref={modalRef} style={style}>
      <header>
        <Typography variant="h7">
          {t(Strings.set_record)}
        </Typography>
        <IconButton icon={ExpandRecordOutlined} onClick={() => expandRecordIdNavigate(recordId)} />
      </header>
      <div className={styles.content}>
        <div ref={titleFieldRef} onMouseDown={() => clickWithinField.current = true}>
          <FieldEditor
            datasheetId={datasheetId}
            fieldId={firstFieldId}
            expandRecordId={recordId}
            isFocus={focusFieldId === firstFieldId}
            setFocus={setFocusFieldId}
          />
        </div>
        <div className={styles.date} ref={dateFieldRef}>
          {[isStartDateTimeField ? startFieldId: null, isEndDateTimeField ? endFieldId : null].map((fieldId, idx) => {
            if (!fieldId) return <div key={idx} className={styles.dateItem} />;
            const isFocus = focusFieldId === fieldId;
            return (
              <div key={idx} className={styles.dateItem} onMouseDown={() => clickWithinField.current = true}>
                <FieldEditor
                  datasheetId={datasheetId}
                  fieldId={fieldId}
                  expandRecordId={recordId}
                  isFocus={isFocus}
                  setFocus={setFocusFieldId}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const DragDropModal = memo(DragDropModalBase);