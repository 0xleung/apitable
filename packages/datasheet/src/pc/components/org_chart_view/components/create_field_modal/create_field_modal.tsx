import { Button, Typography, useThemeColors } from '@vikadata/components';
import { Strings, t } from '@apitable/core';
import { Modal } from 'antd';
import Image from 'next/image';
import { DATASHEET_VIEW_CONTAINER_ID } from 'pc/components/view';
import * as React from 'react';
import { useContext } from 'react';
import OrgChartCreationNoPermission from 'static/icon/account/org_chart_creation_no_permission.png';
import OrgChartCreationLink from 'static/icon/account/pic_org_guide.png';
import IconAdd from 'static/icon/common/common_icon_add_content.svg';
import { FlowContext } from '../../context/flow_context';
import styles from './style.module.less';

interface ICreateFieldModalProps {
  onAdd: () => void;
}

export const CreateFieldModal: React.FC<ICreateFieldModalProps> = props => {
  const colors = useThemeColors();
  const { onAdd } = props;
  const { permissions: { manageable }} = useContext(FlowContext);

  return (
    <Modal
      visible
      title={null}
      closable={false}
      destroyOnClose
      footer={null}
      maskClosable
      width={368}
      centered
      getContainer={() => document.getElementById(DATASHEET_VIEW_CONTAINER_ID)!}
      zIndex={10}
      maskStyle={{ position: 'absolute', zIndex: 10 }}
      wrapClassName={styles.modalWrap}
    >
      <div className={styles.createFieldModal}>
        <div className={styles.banner}>
          <span className={styles.bannerImg}>
            <Image src={manageable ? OrgChartCreationLink : OrgChartCreationNoPermission} alt={'banner'} />
          </span>
        </div>
        <Typography variant="h7" align={'center'}>
          {manageable
            ? t(Strings.org_chart_init_fields_title)
            : t(Strings.org_chart_init_fields_no_permission_title)}
        </Typography>
        <Typography variant="body4" className={styles.desc}>
          {manageable
            ? t(Strings.org_chart_init_fields_desc)
            : t(Strings.org_chart_init_fields_no_permission_desc)}
        </Typography>
        <Button
          color="primary"
          className={styles.createBtn}
          onClick={onAdd}
          size="middle"
          disabled={!manageable}
          prefixIcon={<IconAdd width={16} height={16} fill={colors.staticWhite0} />}
        >
          {t(Strings.org_chart_init_fields_button)}
        </Button>
      </div>
    </Modal>
  );
};
