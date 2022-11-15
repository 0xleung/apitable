import { Api, IReduxState, ITeamList, StoreActions, Strings, t } from '@apitable/core';
import { Button, ButtonGroup, Skeleton, useThemeColors } from '@apitable/components';
import { Input, TreeSelect } from 'antd';
import { Message, Popconfirm, Tooltip } from 'pc/components/common';
import { ComponentDisplay, ScreenSize } from 'pc/components/common/component_display';
import { Modal } from 'pc/components/common/mobile/modal';
import { useAppDispatch } from 'pc/hooks/use_app_dispatch';
import { copy2clipBoard } from 'pc/utils';
import { FC, useEffect, useState } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import DeleteIcon from 'static/icon/common/common_icon_delete.svg';
import HistoryIcon from 'static/icon/common/common_icon_history.svg';
import PulldownIcon from 'static/icon/common/common_icon_pulldown_line.svg';
import CopyIcon from 'static/icon/datasheet/rightclick/datasheet_icon_copy.svg';
import RetractIcon from 'static/icon/datasheet/rightclick/rightclick_icon_retract.svg';
import { InviteAlert } from '../components/invite-alert';
import styles from './style.module.less';

const { TreeNode } = TreeSelect;

export interface ILinkInviteProps {
  shareId?: string;
}

export const LinkInvite: FC<ILinkInviteProps> = ({ shareId }) => {
  const colors = useThemeColors();
  const dispatch = useAppDispatch();
  const { linkList, userInfo, teamList } = useSelector(
    (state: IReduxState) => ({
      linkList: state.invite.linkList,
      userInfo: state.user.info,
      teamList: state.addressList.teamList,
    }),
    shallowEqual,
  );
  const [value, setValue] = useState('');
  const [showPopconfirmKey, setShowPopconfirmKey] = useState('');

  const firstTeamId = teamList?.[0]?.teamId;
  useEffect(() => {
    dispatch(StoreActions.getLinkInviteList());
  }, [dispatch]);

  useEffect(() => {
    dispatch(StoreActions.getTeamListData(userInfo!));
  }, [dispatch, userInfo]);

  useEffect(() => {
    if (!firstTeamId) return;

    const linkAds = linkList.map(item => item.teamId);
    if (linkAds.includes(firstTeamId)) {
      setValue('');
    } else {
      setValue(firstTeamId);
    }
  }, [linkList, firstTeamId]);

  const onChange = (value: string) => {
    setValue(value);
  };

  const popconfirmVisibleChange = (key: string, visible: boolean) => {
    setShowPopconfirmKey(visible ? key : '');
  };

  const renderTreeNodes = (data: ITeamList[]) => {
    const tempList = linkList.map(item => item.teamId);
    return data.map(item => {
      const config = {
        title: item.teamName,
        value: item.teamId,
        disabled: tempList.includes(item.teamId),
      };
      if (item.children && item.children.length) {
        return (
          <TreeNode {...config} key={item.teamId}>
            {renderTreeNodes(item.children)}
          </TreeNode>
        );
      }
      return <TreeNode {...config} isLeaf={userInfo!.isAdmin && item.children?.length ? false : true} key={item.teamId} />;
    });
  };

  const createBtnClick = async(teamId: string) => {
    if (!teamId) {
      Message.warning({ content: t(Strings.placeholder_choose_group) });
      return;
    }
    const {
      data: { success, message },
    } = await Api.createLink(teamId);
    if (success) {
      Message.success({ content: t(Strings.create_link_succeed) });
      dispatch(StoreActions.getLinkInviteList());
      setValue('');
    } else {
      Message.error({ content: message });
    }
  };

  const deleteLink = async(teamId: string) => {
    const {
      data: { success, message },
    } = await Api.deleteLink(teamId);
    if (success) {
      Message.success({ content: t(Strings.link_delete_succeed) });
      dispatch(StoreActions.getLinkInviteList());
    } else {
      Message.error({ content: message });
    }
  };

  const inviteText = t(Strings.vika_invite_link_template, {
    nickName: userInfo!.nickName || t(Strings.friend),
    spaceName: userInfo!.spaceName,
  });

  const getLinkUrl = (token: string) => {
    const url = new URL(window.location.origin);
    url.pathname = '/invite/link';

    const searchParams = new URLSearchParams('');

    searchParams.append('token', token);
    userInfo?.inviteCode && searchParams.append('inviteCode', userInfo.inviteCode);
    url.search = searchParams.toString();
    return url.href;
  };
  const renderLinkList = () => {
    if (linkList.length === 0) {
      return null;
    }
    const joinToken = linkList.map(item => ({ ...item, token: getLinkUrl(item.token) }));
    return joinToken.map(item => {
      const teamTitle = item.parentTeamName ? `${item.parentTeamName} - ${item.teamName}` : item.teamName;
      return (
        <div className={styles.linkItem} key={item.teamId}>
          <Tooltip title={teamTitle} placement="bottomLeft" textEllipsis>
            <div className={styles.linkTitle}>{teamTitle}</div>
          </Tooltip>
          <div className={styles.urlWrapper}>
            <Input type="text" className={styles.url} value={item.token} id={item.teamId} readOnly />
            <ButtonGroup withSeparate>
              <Tooltip title={t(Strings.copy_link)} placement="top">
                <Button onClick={() => copy2clipBoard(`${item.token} ${inviteText}`)}>
                  <CopyIcon fill={colors.secondLevelText} />
                </Button>
              </Tooltip>
              <ComponentDisplay minWidthCompatible={ScreenSize.md}>
                <Popconfirm
                  onCancel={() => setShowPopconfirmKey('')}
                  onOk={() => deleteLink(item.teamId)}
                  type="danger"
                  title={t(Strings.del_invitation_link)}
                  content={t(Strings.del_invitation_link_desc)}
                  trigger="click"
                  okText={t(Strings.delete)}
                  visible={showPopconfirmKey === item.token}
                  onVisibleChange={v => popconfirmVisibleChange(item.token, v)}
                >
                  <Button>
                    <DeleteIcon fill={colors.secondLevelText} />
                  </Button>
                </Popconfirm>
              </ComponentDisplay>
              <ComponentDisplay maxWidthCompatible={ScreenSize.md}>
                <Button
                  onClick={() => {
                    Modal.warning({
                      title: t(Strings.del_invitation_link),
                      content: t(Strings.del_invitation_link_desc),
                      okText: t(Strings.delete),
                      onOk: () => deleteLink(item.teamId),
                    });
                  }}
                >
                  <DeleteIcon fill={colors.secondLevelText} />
                </Button>
              </ComponentDisplay>
            </ButtonGroup>
          </div>
        </div>
      );
    });
  };
  return (
    <div className={styles.linkInvite}>
      <InviteAlert />
      <div className={styles.subTitle}>{t(Strings.create_public_invitation_link)}</div>
      <div className={styles.addNewLink}>
        {teamList.length === 0 ? (
          <Skeleton />
        ) : (
          <>
            <TreeSelect
              value={value === '' ? undefined : value}
              placeholder={t(Strings.placeholder_choose_group)}
              onChange={value => onChange(value)}
              suffixIcon={<PulldownIcon />}
              treeIcon
              switcherIcon={<RetractIcon />}
              showSearch={false}
              dropdownClassName="dropdownInvite"
              treeDefaultExpandedKeys={[firstTeamId]}
              listHeight={200}
            >
              {renderTreeNodes(teamList || [])}
            </TreeSelect>
            <Button onClick={() => createBtnClick(value)} className={styles.createBtn}>
              {t(Strings.create)}
            </Button>
          </>
        )}
      </div>
      {linkList.length > 0 && (
        <>
          <div className={styles.historyTitle}>
            <HistoryIcon />
            {t(Strings.invitation_link_old)}
          </div>
          <div className={styles.linkWrapper}>{renderLinkList()}</div>
        </>
      )}
    </div>
  );
};
