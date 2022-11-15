// import React from 'react';
// import style from './style.module.less';
// import { List } from './list';
// import { IReduxState, Strings, t } from '@apitable/core';
// import { useSelector } from 'react-redux';
// import { Typography } from '@apitable/components';
// import { colorVars } from '@apitable/components';
// import { getFeishuConfig } from 'pc/utils/get_config';
// import { isSocialPlatformEnabled } from 'pc/components/home/social_platform';
// import { Loading } from 'pc/components/common';

// export const OFFICE_APP_ID = 'ina5645957505507647';
// export const DINGTALK_APP_ID = 'ina9134969049653777';
// export const WEWORK_APP_ID = 'ina5200279359980055';
// export const FEISHU_APP_ID = getFeishuConfig().appId;
// const socialAppIds = [FEISHU_APP_ID, DINGTALK_APP_ID, WEWORK_APP_ID];

// export const Marketing: React.FC = () => {
//   const spaceInfo = useSelector((state: IReduxState) => state.space.curSpaceInfo);
//   const apps = useSelector((state: IReduxState) => state.space.marketplaceApps);
//   const isBindSocial = spaceInfo && isSocialPlatformEnabled(spaceInfo);

//   const openingApps = apps.filter(app => app.status);
//   // Some third-party integration is enabled (Dingtalk, Wecom, Feishu, the other two are hidden)
//   const closedApps = isBindSocial ?
//     apps.filter(app => !app.status && !socialAppIds.includes(app.appId)) :
//     apps.filter(app => !app.status);

//   const data = [
//     {
//       type: 'open',
//       data: openingApps,
//     },
//     {
//       type: 'close',
//       data: closedApps,
//     }
//   ];

//   if (!spaceInfo || !apps) {
//     return <Loading/>;
//   }
//   return (
//     <div className={style.container}>
//       <div style={{ marginBottom: 32 }}>
//         <Typography variant='h1'>{t(Strings.space_info_feishu_label)}</Typography>
//         <div style={{ height: 8 }} />
//         <Typography variant='body2' color={colors.thirdLevelText}>{t(Strings.marketing_sub_title)}</Typography>
//       </div>

//       {data.map((list) => {
//         if (list.data.length === 0) {
//           return null;
//         }
//         return (
//           <List
//             type={list.type as any}
//             data={list.data}
//             key={list.type}
//           />
//         );
//       })}
//     </div>
//   );
// };

import { Trial } from 'pc/components/space_manage/log/trial';
import { getEnvVariables } from 'pc/utils/env';
import { useState } from 'react';
import * as React from 'react';
import style from './style.module.less';
import { List } from './list';
import { IReduxState, Strings, t } from '@apitable/core';
import { useSelector } from 'react-redux';
import { Typography, useThemeColors } from '@apitable/components';
import { Loading } from 'pc/components/common';
import { AppStatus, IStoreApp } from './interface';
import { useMarketing } from './hooks';
import { MarketingContext } from './context';

export const OFFICE_APP_ID = 'ina5645957505507647';
export const DINGTALK_APP_ID = 'ina9134969049653777';
export const WEWORK_APP_ID = 'ina5200279359980055';

interface IStoreAppConfig {
  type: AppStatus;
  data: IStoreApp[];
}

const MarketingBase: React.FC = () => {
  const colors = useThemeColors();
  const spaceInfo = useSelector((state: IReduxState) => state.space.curSpaceInfo);
  const spaceId = useSelector(state => state.space.activeId)!;
  const [refresh, setRefresh] = React.useState(false);

  const { loading, apps, appInstances } = useMarketing(spaceId, refresh);

  if (loading) {
    return <Loading />;
  }

  const data: IStoreAppConfig[] = [
    { type: AppStatus.Open, data: appInstances },
    { type: AppStatus.Close, data: apps },
  ];

  if (!spaceInfo || !apps) {
    return <Loading />;
  }

  return (
    <div className={style.container}>
      <div style={{ marginBottom: 32 }}>
        <Typography variant='h1'>{t(Strings.space_info_feishu_label)}</Typography>
        <div style={{ height: 8 }} />
        <Typography variant='body2' color={colors.thirdLevelText}>{t(Strings.marketing_sub_title)}</Typography>
      </div>
      <MarketingContext.Provider value={{ onSetRefresh: setRefresh }}>
        {data.map((list) => {
          if (list.data.length === 0) {
            return null;
          }
          return <List type={list.type} data={list.data} key={list.type} />;
        })}
      </MarketingContext.Provider>
    </div>
  );
};

export const Marketing = () => {
  const vars = getEnvVariables();
  const [showTrialModal, setShowTrialModal] = useState<boolean>(vars.CLOUD_DISABLE_USE_APP_STORE);

  if (showTrialModal) {
    return <Trial setShowTrialModal={setShowTrialModal} title={t(Strings.space_info_feishu_label)}/>;
  }

  return <MarketingBase />;
};
