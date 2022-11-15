import { FC, useState, useEffect } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useRequest } from 'ahooks';
import { Popover, Tooltip } from 'antd';

import { Api, IReduxState, IShareSettings, Settings, StoreActions, Strings, t } from '@apitable/core';
import { DoubleSelect, IDoubleOptions, LinkButton, Switch, Typography } from '@apitable/components';
import { InformationSmallOutlined, ShareQrcodeOutlined, ColumnUrlOutlined } from '@apitable/icons';

import { useCatalogTreeRequest } from 'pc/hooks';
import { copy2clipBoard } from 'pc/utils';
import { Message, Modal } from 'pc/components/common';
import { TComponent } from 'pc/components/common/t_component';
import { ShareLink } from '../share/share_link';
import { DownloadQrCode } from './download_qr_code';

import styles from './style.module.less';
import { DisabledShareFile } from '../disabled_share_file/disabled_share_file';
import { useInviteRequest } from 'pc/hooks/use_invite_request';
import { generateInviteLink, ROOT_TEAM_ID } from '../utils';
import { isSocialPlatformEnabled } from 'pc/components/home/social_platform';

export interface IPublicShareLinkProps {
  nodeId: string;
  isMobile: boolean;
}

export const PublicShareInviteLink: FC<IPublicShareLinkProps> = ({ nodeId, isMobile }) => {
  const dispatch = useDispatch();
  const { getShareSettingsReq } = useCatalogTreeRequest();
  const { generateLinkReq } = useInviteRequest();
  const { run: getShareSettings, data: shareSettings } =
    useRequest<IShareSettings, any>(() => getShareSettingsReq(nodeId));
  const { userInfo, treeNodesMap, spaceFeatures, spaceInfo } = useSelector((state: IReduxState) => ({
    treeNodesMap: state.catalogTree.treeNodesMap,
    userInfo: state.user.info,
    spaceFeatures: state.space.spaceFeatures,
    spaceInfo: state.space.curSpaceInfo!,
  }), shallowEqual);

  const isShareMirror = nodeId.startsWith('mir');

  const handleUpdateShareStatus = (status: boolean) => {
    dispatch(StoreActions.updateTreeNodesMap(nodeId, { nodeShared: status }));
    if (nodeId.startsWith('mir')) {
      dispatch(StoreActions.updateMirror(nodeId, { nodeShared: status }));
      return;
    }
    dispatch(StoreActions.updateDatasheet(nodeId, { nodeShared: status }));
  };

  /**
   * Set sharing permissions
   */
  const handleUpdateShare = (permission: { onlyRead?: boolean, canBeEdited?: boolean, canBeStored?: boolean }) => {
    const onOk = () => Api.updateShare(nodeId, permission).then(res => {
      const { success } = res.data;
      if (success) {
        getShareSettings();
        handleUpdateShareStatus(true);
        Message.success({ content: t(Strings.share_settings_tip, { status: t(Strings.success) }) });
      } else {
        Message.error({ content: t(Strings.share_settings_tip, { status: t(Strings.fail) }) });
      }
    });
    if (shareSettings?.linkNodes.length) {
      Modal.confirm({
        type: 'warning',
        title: t(Strings.share_and_permission_popconfirm_title),
        content: <>
          {shareSettings.containMemberFld &&
            <div className={styles.tipItem}>
              <div className={styles.tipContent1}>
                <TComponent
                  tkey={t(Strings.share_edit_exist_member_tip)}
                  params={{
                    content: <span className={styles.bold}>{t(Strings.member_type_field)}</span>
                  }}
                />
              </div>
            </div>
          }
          <div className={styles.tipItem}>
            <div className={styles.tipContent2}>
              <TComponent
                tkey={t(Strings.share_exist_something_tip)}
                params={{
                  content: <span className={styles.bold}>{t(Strings.link_other_datasheet)}</span>
                }}
              />
            </div>
          </div>
          <div className={styles.linkNodes}>
            {shareSettings.linkNodes.map((item, index) => (
              <div key={item + index} className={styles.linkNode}>
                <div className={styles.linkNodeName}>{item}</div>
              </div>
            ))}
          </div>
        </>,
        onOk
      });
      return;
    }
    onOk();
  };

  /**
   * Close Share
   */
  const handleCloseShare = () => {
    if (!shareSettings) {
      return;
    }
    const onOk = () => Api.disableShare(shareSettings.nodeId).then(res => {
      const { success } = res.data;
      if (success) {
        getShareSettings();
        handleUpdateShareStatus(false);
        Message.success({ content: t(Strings.close_share_tip, { status: t(Strings.success) }) });
      } else {
        Message.error({ content: t(Strings.close_share_tip, { status: t(Strings.fail) }) });
      }
    });

    Modal.confirm({
      title: t(Strings.close_share_link),
      content: t(Strings.link_failed_after_close_share_link),
      onOk,
      type: 'warning'
    });
  };

  /**
   * Toggle switch for sharing links
   */
  const handleToggle = (checked: boolean) => {
    if (checked) {
      handleUpdateShare({ onlyRead: true });
      return;
    }
    handleCloseShare();
  };

  const getLink = async() => {
    const token = await generateLinkReq(ROOT_TEAM_ID, nodeId);
    if (token) {
      const _link = generateInviteLink(userInfo, token, nodeId);
      setLink(_link);
    }
  };

  const invitable = spaceFeatures?.invitable && !isSocialPlatformEnabled(spaceInfo);

  const [link, setLink] = useState<string>();

  useEffect(() => {
    if (invitable) {
      getLink();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invitable]);
  
  /**
   * Copy invitation link
   */
  const handleCopyInviteLink = () => {
    if (link) {
      copy2clipBoard(link);
    }
  };

  /**
   * open share's auth-dropdown
   */
  const handleShareAuthClick = (option: IDoubleOptions) => {
    if (option.value === value) {
      return;
    }
    handleUpdateShare({ [option.value]: true });
  };

  const Permission: IDoubleOptions[] = [{
    value: 'onlyRead',
    label: t(Strings.can_view),
    subLabel: t(Strings.share_only_desc),
  }, {
    value: 'canBeEdited',
    label: t(Strings.can_edit),
    subLabel: t(Strings.share_and_editable_desc),
    disabled: Boolean(isShareMirror)
  }, {
    value: 'canBeStored',
    label: t(Strings.can_duplicate),
    subLabel: t(Strings.share_and_save_desc),
    disabled: Boolean(isShareMirror)
  }];
  
  let value = '';
  if (shareSettings) {
    const { canBeEdited, onlyRead } = shareSettings.props;
    value = onlyRead ? 'onlyRead' :
      canBeEdited ? 'canBeEdited' :
        'canBeStored';
  }

  const renderPopover = () => {
    return (
      <div className={styles.qrCodePopoverContent} id="downloadInviteContainer">
        <DownloadQrCode isMobile={isMobile} nodeId={nodeId} width={188} />
      </div>
    );
  };

  const renderInviteByQrCode = () => {
    return (
      <LinkButton
        className={styles.inviteMoreMethod}
        underline={false}
        prefixIcon={<ShareQrcodeOutlined currentColor />}
      >
        {t(Strings.invite_by_qr_code)}
      </LinkButton>
    );
  };

  return (
    <>
      <div className={styles.shareToggle}>
        <Switch disabled={!spaceFeatures?.fileSharable} checked={shareSettings?.shareOpened} onChange={handleToggle} />
        <Typography variant='h7' className={styles.shareToggleContent}>{t(Strings.publish_share_link_with_anyone)}</Typography>
        <Tooltip title={t(Strings.support)} trigger={'hover'}>
          <a href={Settings.share_url.value} rel="noopener noreferrer" target="_blank">
            <InformationSmallOutlined currentColor />
          </a>
        </Tooltip>
      </div>
      {spaceFeatures?.fileSharable ? (
        shareSettings && shareSettings.shareOpened && (
          <>
            <div className={styles.sharePerson}>
              <Typography className={styles.sharePersonContent} variant='body2'>{t(Strings.get_link_person_on_internet)}</Typography>
              <DoubleSelect
                value={value}
                disabled={false}
                onSelected={(op, index) => handleShareAuthClick(op)}
                triggerCls={styles.doubleSelect}
                options={Permission}
              />
            </div>
            <ShareLink
              shareName={treeNodesMap[shareSettings.nodeId]?.nodeName}
              shareSettings={shareSettings}
              userInfo={userInfo}
            />
          </>
        )
      ) : <DisabledShareFile />}
      {invitable && (
        <div className={styles.inviteMore}>
          <Typography className={styles.inviteMoreTitle} variant='body3'>{t(Strings.more_invite_ways)}：</Typography>
          <Tooltip title={t(Strings.default_link_join_tip)} placement="top" overlayStyle={{ width: 190 }}>
            <LinkButton
              className={styles.inviteMoreMethod}
              underline={false}
              onClick={handleCopyInviteLink}
              prefixIcon={<ColumnUrlOutlined currentColor />}
            >
              {t(Strings.invite_via_link)}
            </LinkButton>
          </Tooltip>
          {!isMobile && (
            <Popover
              overlayClassName={styles.qrCodePopover}
              placement="rightBottom"
              title={null}
              content={renderPopover()}
              trigger="click"
            >
              {renderInviteByQrCode()}
            </Popover>
          )}
        </div>
      )}
    </>
  );
};