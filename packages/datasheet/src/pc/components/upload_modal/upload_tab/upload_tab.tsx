import { ConfigConstant, IAttachmentValue, Strings, t } from '@apitable/core';
import { Tooltip } from 'antd';
import classNames from 'classnames';
import { ComponentDisplay, ScreenSize } from 'pc/components/common/component_display';
import { ExpandAttachContext } from 'pc/components/expand_record/expand_attachment';
import { resourceService } from 'pc/resource_service';
import { useThemeColors } from '@vikadata/components';
import { initNoTraceVerification, UploadManager } from 'pc/utils';
import { useContext, useEffect, useRef, useState } from 'react';
import * as React from 'react';
import IconURL from 'static/icon/datasheet/column/datasheet_icon_url.svg';
import IconDrag from 'static/icon/datasheet/datasheet_icon_attachment_local.svg';
import IconPaste from 'static/icon/datasheet/datasheet_icon_attachment_paste.svg';
import { IUploadFileList } from '../upload_core';
import { UploadPaste } from '../upload_paste/upload_paste';
import { IUploadZoneItem, UploadZone } from '../upload_zone';
import styles from './styles.module.less';
import { useMount } from 'ahooks';
import { useSelector } from 'react-redux';
import { uniqBy } from 'lodash';

export enum UploadTabType {
  Drag = 'Drag',
  Paste = 'Paste',
  Link = 'Link',
}

const tabConfig = {
  [UploadTabType.Drag]: {
    open: true,
    icon: IconDrag,
    tip: t(Strings.local_drag_upload),
    index: 1,
  },
  [UploadTabType.Paste]: {
    open: true,
    icon: IconPaste,
    tip: t(Strings.paste_upload),
    index: 2,
  },
  [UploadTabType.Link]: {
    open: false,
    icon: IconURL,
    tip: '',
    index: 3,
  },
};

interface IUploadTabProps {
  recordId: string;
  fieldId: string;
  cellValue: IAttachmentValue[];
  setUploadList: React.Dispatch<React.SetStateAction<IUploadFileList>>;
  uploadList: IUploadFileList;
  className?: string;
}

export interface ICommonTabRef {
  focus(): void;
  trigger?(): void;
}

export const UploadTab: React.FC<IUploadTabProps> = props => {
  const colors = useThemeColors();
  const { recordId, fieldId, setUploadList, className, cellValue } = props;
  const uploadManager = resourceService.instance!.uploadManager;
  const tabInfoRef = useRef<ICommonTabRef>(null);

  const { isFocus } = useContext(ExpandAttachContext);

  const [currentTab, setCurrentTab] = useState(UploadTabType.Drag);
  const userInfo = useSelector(state => state.user.info);
  const { shareId, formId } = useSelector(state => state.pageParams);
  useMount(() => {
    if (!shareId || !formId) {
      return;
    }
    if (userInfo) {
      return;
    }

    initNoTraceVerification(() => {}, ConfigConstant.CaptchaIds.LOGIN);
  });

  useEffect(() => {
    if (!isFocus) {
      return;
    }
    tabInfoRef.current?.focus();
  }, [currentTab, isFocus]);

  function onUpload(list: IUploadZoneItem[]) {
    const queueIe = UploadManager.getCellId(recordId, fieldId);
    const existList = uploadManager.get(queueIe);
    setUploadList(uniqBy([...existList, ...list], 'fileId'));
  }

  function showActiveIcon(isActive: boolean) {
    if (typeof isFocus !== 'boolean') {
      return isActive;
    }
    return isFocus && isActive;
  }

  function calcActiveLineOffset() {
    const activeIndex = tabConfig[currentTab].index;
    return parseInt(styles.tabWidth, 10) * activeIndex - 2 * parseInt(styles.activeLineWidth, 10);
  }

  return (
    <div className={classNames(styles.uploadTab, className)}>
      <ComponentDisplay minWidthCompatible={ScreenSize.md}>
        <nav className={styles.nav}>
          {Object.entries(tabConfig).map(([id, config]) => {
            if (!config.open) {
              return;
            }
            const Icon = config.icon;
            const isActive = id === currentTab;
            return (
              <Tooltip title={config.tip} key={id}>
                <span
                  className={styles.tab}
                  onMouseDown={() => {
                    setCurrentTab(id as UploadTabType);
                  }}
                  onClick={() => {
                    if (id === UploadTabType.Drag) {
                      tabInfoRef.current?.trigger?.();
                      return;
                    }
                    tabInfoRef.current?.focus();
                  }}
                >
                  <Icon width={16} height={16} fill={showActiveIcon(isActive) ? colors.primaryColor : colors.fourthLevelText} />
                </span>
              </Tooltip>
            );
          })}
          <span
            className={classNames({
              [styles.activeLine]: true,
              [styles.grayColor]: isFocus === false,
            })}
            style={{ transform: `translateX(${calcActiveLineOffset()}px)` }}
          />
        </nav>
      </ComponentDisplay>

      <div className={styles.uploadTabInfo}>
        <ComponentDisplay minWidthCompatible={ScreenSize.md}>
          {currentTab === UploadTabType.Drag && (
            <UploadZone onUpload={onUpload} recordId={recordId} fieldId={fieldId} cellValue={cellValue} ref={tabInfoRef} />
          )}
          {currentTab === UploadTabType.Paste && (
            <UploadPaste onUpload={onUpload} ref={tabInfoRef} fieldId={fieldId} recordId={recordId} cellValue={cellValue} />
          )}
        </ComponentDisplay>
        <ComponentDisplay maxWidthCompatible={ScreenSize.md}>
          <UploadZone onUpload={onUpload} recordId={recordId} fieldId={fieldId} cellValue={cellValue} ref={tabInfoRef} />
        </ComponentDisplay>
      </div>
    </div>
  );
};
