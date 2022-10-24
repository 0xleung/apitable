import { useEffect, useRef } from 'react';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { Selectors } from '@apitable/core';
import classNames from 'classnames';
import { changeView } from 'pc/hooks';
import { ViewIcon } from 'pc/components/tool_bar/view_switcher/view_icon';
import styles from './style.module.less';
import { useThemeColors } from '@vikadata/components';
import { AutosaveOutlined } from '@vikadata/icons';
import { isInContainer } from 'pc/utils';

export const ViewSwitcherHorizontal: React.FC = () => {
  const snapshot = useSelector(state => Selectors.getSnapshot(state));
  const activeViewId = useSelector(state => Selectors.getActiveView(state));
  const colors = useThemeColors();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeItemTarget = document.querySelector(`.${styles.active}`);
    if (!activeItemTarget || !containerRef.current) {
      return;
    }
    const scrollLeft = (activeItemTarget as HTMLDivElement).offsetLeft;
    if (!isInContainer(activeItemTarget, containerRef.current)) {
      containerRef.current.scrollLeft = scrollLeft;
    }
  });

  return (
    <div className={styles.viewList} ref={containerRef}>
      {snapshot && snapshot.meta.views.map(item => {
        const active = item.id === activeViewId;
        const fillColor = active ? colors.black[50] : colors.secondLevelText;
        return (
          <div
            key={item.id}
            className={classNames(styles.viewItem, {
              [styles.active]: active,
            })}
            onClick={() => changeView(item.id)}
          >
            <ViewIcon viewType={item.type} fill={fillColor} />
            <span className={styles.viewItemName}>
              {item.name}
            </span>
            {
              active && item.autoSave &&
              <span
                style={{
                  marginLeft: 4,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <AutosaveOutlined color={'white'} />
              </span>
            }
          </div>
        );
      })}
    </div>
  );
};
