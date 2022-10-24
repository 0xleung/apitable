import * as React from 'react';
import { SubAdmin } from 'pc/components/space_manage/sub_admin';
import { MainAdmin } from 'pc/components/space_manage/main_admin';
import { Typography } from '@vikadata/components';
import styles from './style.module.less';
import { Strings, t } from '@apitable/core';

export const Manager: React.FC = () => {
  return <div className={styles.managerContainer}>
    <Typography variant={'h1'}>{t(Strings.share_permisson_model_space_admin)}</Typography>
    <Typography className={styles.pageSubscribe} variant={'body2'}>{t(Strings.share_permisson_model_space_admin_tip)}</Typography>
    <MainAdmin />
    <SubAdmin />
  </div>;
};
