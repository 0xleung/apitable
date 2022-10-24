import { Loading, useThemeMode } from '@vikadata/components';
import { StoreActions } from '@apitable/core';
import {
  widgetMessage, initWidgetMessage, iframeWidgetDatasheetSelector, iframeWidgetDashboardSelector,
  WidgetProvider, UPDATE_DASHBOARD, refreshUsedDatasheetAction, refreshWidgetAction, updateWidgetConfigAction,
  UPDATE_UNIT_INFO, setErrorCodeAction, widgetStore, refreshUsedDatasheetClientAction, getWidgetDatasheet, SET_SHARE_INFO,
  refreshUsedDatasheetSimpleAction,
  refreshCalcCache, setMirrorAction, expireCalcCache, SET_USER_INFO, RuntimeEnv
} from '@vikadata/widget-sdk';
import { MouseListenerType } from '@vikadata/widget-sdk/dist/iframe_message/interface';
import React, { useCallback, useEffect, useState } from 'react';
import { WidgetLoader } from './widget_loader';

const query = new URLSearchParams(window.location.search);
const widgetId = query.get('widgetId');

declare const window: any;
// 初始化全局静态参数
window.__initialization_data__ = window.__initialization_data__ || {};
window.__initialization_data__.isIframe = true;
window.__initialization_data__.lang = query.get('lang');
widgetId && initWidgetMessage(widgetId);

const isSocialWecom = query.get('isSocialWecom');
window['_isSocialWecom'] = isSocialWecom;

const widgetRuntimeEnv = query.get('runtimeEnv') as RuntimeEnv;

export const WidgetBlock: React.FC<{ widgetId: string }> = ({ widgetId }) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isShowingSettings, setIsShowingSettings] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>();
  const [init, setInit] = useState<boolean>();
  const theme = useThemeMode();

  useEffect(() => {
    const timer = setInterval(() => {
      if (widgetMessage.connected) {
        setConnected(true);
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [setConnected]);

  useEffect(() => {
    if (widgetId && connected) {
      widgetMessage.initWidget().then(data => {
        setInit(true);
        const { datasheetMap, widget, dashboard, unitInfo, widgetConfig, pageParams, labs, share, mirrorMap, user } = data;
        const datasheetId = widget.snapshot.datasheetId;
        const widgetDatasheetMap = {};
        Object.keys(datasheetMap).forEach(datasheetId => {
          widgetDatasheetMap[datasheetId] = iframeWidgetDatasheetSelector(datasheetMap[datasheetId]);
        });
        widgetStore.dispatch(refreshUsedDatasheetAction(datasheetId ? widgetDatasheetMap : {}));
        widgetStore.dispatch(refreshWidgetAction(widget));
        widgetStore.dispatch(updateWidgetConfigAction(widgetConfig));
        widgetStore.dispatch({ type: UPDATE_DASHBOARD, payload: iframeWidgetDashboardSelector(dashboard) });
        widgetStore.dispatch({ type: UPDATE_UNIT_INFO, payload: unitInfo });
        widgetStore.dispatch(StoreActions.setLabs(labs));
        widgetStore.dispatch(setErrorCodeAction(datasheetId && datasheetMap?.[datasheetId]?.errorCode || null));
        widgetStore.dispatch({ type: 'UPDATE_PAGE_PARAMS', payload: pageParams });
        widgetStore.dispatch({ type: SET_SHARE_INFO, payload: share });
        mirrorMap && widgetStore.dispatch(setMirrorAction(mirrorMap));
        widgetStore.dispatch({ type: SET_USER_INFO, payload: user });
        setIsFullscreen(widgetConfig.isFullscreen);
        setIsShowingSettings(widgetConfig.isShowingSettings);
      });
    }
  }, [connected, widgetId, setInit]);

  useEffect(() => {
    if (widgetMessage && widgetStore && connected) {
      /** 更新 widget config */
      widgetMessage.onSyncWidgetConfig(res => {
        if (res.success && res.data) {
          widgetStore.dispatch(updateWidgetConfigAction(res.data));
          setIsFullscreen(res.data.isFullscreen);
          setIsShowingSettings(res.data.isShowingSettings);
        }
      });
    }
  }, [setIsFullscreen, setIsShowingSettings, connected]);

  useEffect(() => {
    if (connected && widgetMessage && widgetStore) {
      /** 更新 widget Store */
      widgetMessage.onSyncOperations(res => {
        const state = widgetStore.getState();
        if (res.success && res.data && (Object.keys(state.datasheetMap).includes(res.data.resourceId) || state.widget?.id === res.data.resourceId)) {
          const { operations, resourceType, resourceId } = res.data;
          widgetStore.dispatch(StoreActions.applyJOTOperations(operations, resourceType, resourceId));
        }
      });
      widgetMessage.onSyncDatasheetClient(res => {
        const datasheetId = getWidgetDatasheet(widgetStore.getState())?.datasheetId;
        datasheetId && widgetStore.dispatch(refreshUsedDatasheetClientAction({ datasheetId, client: res }));
      });
      widgetMessage.onSyncLabs(res => {
        widgetStore.dispatch(StoreActions.setLabs(res));
      });
      widgetMessage.onSyncPageParams(res => {
        widgetStore.dispatch({ type: 'UPDATE_PAGE_PARAMS', payload: res });
      });
      widgetMessage.onSyncUnitInfo(res => {
        widgetStore.dispatch({ type: UPDATE_UNIT_INFO, payload: res });
      });
      widgetMessage.onSyncUnitInfo(res => {
        widgetStore.dispatch({ type: UPDATE_UNIT_INFO, payload: res });
      });
      widgetMessage.onSyncShare(res => {
        widgetStore.dispatch({ type: SET_SHARE_INFO, payload: res });
      });
      // 初次 加载其他关联表数据
      widgetMessage.onLoadOtherDatasheet(data => {
        const datasheetMap = {};
        Object.keys(data).forEach(datasheetId => {
          datasheetMap[datasheetId] = iframeWidgetDatasheetSelector(data[datasheetId]);
        });
        widgetStore.dispatch(refreshUsedDatasheetAction(datasheetMap));
      });

      // 更新 加载其他关联表数据
      widgetMessage.onDatasheetSimpleUpdate(datasheet => {
        widgetStore.dispatch(refreshUsedDatasheetSimpleAction(datasheet));
      });

      widgetMessage.onRefreshSnapshot(datasheetId => {
        widgetStore.dispatch(StoreActions.refreshSnapshot(datasheetId));
      });

      widgetMessage.onSyncDashboard(dashboard => {
        widgetStore.dispatch({ type: UPDATE_DASHBOARD, payload: dashboard });
      });

      // 更新缓存
      widgetMessage.onSyncCalcCache(res => {
        widgetStore.dispatch(refreshCalcCache(res));
      });

      // 更新镜像
      widgetMessage.onSyncMirrorMap(res => {
        res && widgetStore.dispatch(setMirrorAction(res));
      });
      // 标记缓存过期
      widgetMessage.onCalcExpire(res => {
        widgetStore.dispatch(expireCalcCache(res));
      });

      // 更新 userInfo
      widgetMessage.onSyncUserInfo(res => {
        widgetStore.dispatch({ type: SET_USER_INFO, payload: res });
      });

      // 添加监听主应用加载小程序代码动作
      widgetMessage.onLoadWidget();
    }
  }, [connected]);

  const updateConfig = useCallback((config) => {
    widgetStore.dispatch(updateWidgetConfigAction(config));
    widgetMessage.syncWidgetConfig(config);
  }, []);

  const toggleSetting = useCallback(() => {
    const config = {
      isShowingSettings: !isShowingSettings
    };
    updateConfig(config);
  }, [isShowingSettings, updateConfig]);

  const toggleFullscreen = useCallback(() => {
    const config = {
      isFullscreen: !isFullscreen,
    };
    updateConfig(config);
  }, [isFullscreen, updateConfig]);

  const expandRecord = useCallback((props) => {
    widgetMessage.expandRecord(props);
  }, []);

  const expandDevConfig = () => {
    widgetMessage.expandDevConfig();
  };

  useEffect(() => {
    if (!connected) {
      return;
    }
    const fn = (e) => {
      if (!e?.type) {
        return;
      }
      widgetMessage.mouseListener(e.type);
    };
    window.document.addEventListener(MouseListenerType.ENTER, fn);
    window.document.addEventListener(MouseListenerType.LEAVE, fn);
    return () => {
      window.document.removeEventListener(MouseListenerType.ENTER, fn);
      window.document.removeEventListener(MouseListenerType.LEAVE, fn);
    };
  }, [connected]);

  if (!widgetId) {
    return <>Error: no widgetId</>;
  }
  if (!connected) {
    console.log(widgetId, ' waiting connect...');
    return <Loading/>;
  }

  if (!init) {
    console.log(widgetId, ' waiting init data...');
    return <Loading/>;
  }

  return (
    <WidgetProvider
      id={widgetId}
      theme={theme}
      runtimeEnv={widgetRuntimeEnv}
      widgetStore={widgetStore}
      resourceService={null as any}
      globalStore={null as any}
      isFullscreen={isFullscreen}
      isShowingSettings={isShowingSettings}
      toggleSettings={toggleSetting}
      toggleFullscreen={toggleFullscreen}
      expandRecord={expandRecord}
    >
      <WidgetLoader expandDevConfig={expandDevConfig}/>
    </WidgetProvider>
  );
};