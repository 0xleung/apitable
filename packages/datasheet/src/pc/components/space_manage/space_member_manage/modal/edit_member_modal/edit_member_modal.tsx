import { ConfigConstant, IReduxState, ITeamsInSpace, IUpdateMemberInfo, Strings, t, StoreActions, isIdassPrivateDeployment } from '@apitable/core';
import { TextInput, Button, TextButton, colorVars } from '@vikadata/components';
import { Avatar } from 'pc/components/common/avatar';
import { Message } from 'pc/components/common/message';
import { Modal } from 'pc/components/common/modal/modal/modal';
import { useEditMember } from 'pc/hooks';
import { getEnvVariables } from 'pc/utils/env';
import { useEffect, useState, FC } from 'react';
import { shallowEqual, useSelector, useDispatch } from 'react-redux';
import AddIcon from 'static/icon/common/common_icon_add_content.svg';
import CloseIcon from 'static/icon/datasheet/datasheet_icon_tagdelete.svg';
import { ChangeMemberTeam } from '../change_member_team';
import styles from './style.module.less';
import { useMemberManage } from 'pc/hooks';
import { isPrimaryOrOwnFunc } from '../../utils';
import { isSocialDingTalk, isSocialFeiShu, isSocialWecom } from 'pc/components/home/social_platform';
import { WecomOpenData } from 'pc/components/address_list';
import { Tooltip } from 'pc/components/common';

interface IModalProps {
  cancelModalVisible: () => void;
  onSubmit?: () => void;
  removeCallback?: () => void;
  pageNo: number;
}

export const EditMemberModal: FC<IModalProps> = ({ cancelModalVisible, pageNo, removeCallback }) => {
  const { spaceId, teamId, memberInfoInSpace, selectedTeamInfoInSpace, userInfo, selectMemberListInSpace, spaceInfo } = useSelector(
    (state: IReduxState) => ({
      spaceId: state.space.activeId || '',
      teamId: state.spaceMemberManage.selectedTeamInfoInSpace ? state.spaceMemberManage.selectedTeamInfoInSpace.teamId : ConfigConstant.ROOT_TEAM_ID,
      memberInfoInSpace: state.spaceMemberManage.memberInfoInSpace,
      selectMemberListInSpace: state.spaceMemberManage.selectMemberListInSpace,
      selectedTeamInfoInSpace: state.spaceMemberManage.selectedTeamInfoInSpace,
      userInfo: state.user.info,
      spaceInfo: state.space.curSpaceInfo,
    }),
    shallowEqual,
  );
  const { removeMember } = useMemberManage();
  const dispatch = useDispatch();
  const env = getEnvVariables();
  const [form, setForm] = useState({
    memberName: '',
    nickName: '',
    mobile: '',
    email: '',
  });
  const [formErr, setFormErr] = useState({
    memberName: '',
    nickName: '',
    mobile: '',
    email: '',
  });
  const { memberName, email, memberId, avatar, teamData, nickName, mobile, isMemberNameModified, isNickNameModified } = memberInfoInSpace!;
  const [formData, setFormData] = useState<IUpdateMemberInfo>();
  const [teamList, setTeamList] = useState<ITeamsInSpace[]>([]);
  const [changeMemberTeamModalVisible, setChangeMemberTeamModalVisible] = useState(false);
  const [setStart] = useEditMember(formData!, spaceId, teamId, pageNo, cancelModalVisible);
  useEffect(() => {
    setForm({
      memberName: memberName || '',
      nickName: nickName || '',
      mobile: mobile || '',
      email: email || '',
    });
  }, [memberName, nickName, mobile, email]);
  useEffect(() => {
    if (teamData && teamData.length) {
      const teams: ITeamsInSpace[] = teamData.map(item => {
        return { teamId: item.teamId, teamName: item.fullHierarchyTeamName || '' };
      });
      setTeamList(teams);
    } else {
      setTeamList([]);
    }
  }, [teamData]);
  const toChangeTeamModal = () => {
    setChangeMemberTeamModalVisible(true);
  };
  const handleOk = () => {
    if (formErr.memberName || formErr.nickName || formErr.email) {
      return;
    }
    const formData = { spaceId, memberId, teamIds: teamList.map(item => item.teamId), memberName: form.memberName };
    setFormData(formData as IUpdateMemberInfo);
    setStart(true);
  };
  const handleChange = (e, property: 'memberName' | 'nickName' | 'email') => {
    if (formErr[property]) {
      setFormErr({ ...formErr, [property]: '' });
    }
    setForm({
      ...form,
      [property]: e.target.value.trim(),
    });
  };
  const verifyMemberName = () => {
    setMemberInputFocus(false);
    if (form.memberName.length > ConfigConstant.MEMBER_NAME_LENGTH) {
      setFormErr({
        ...formErr,
        memberName: t(Strings.member_err),
      });
    }
  };
  const handleCancel = () => {
    cancelModalVisible();
  };
  const removeTeam = (id: string) => {
    const newArr = teamList.filter(item => item.teamId !== id);
    setTeamList(newArr);
  };
  const removeFromSpace = () => {
    if (userInfo && isPrimaryOrOwnFunc(memberInfoInSpace, userInfo.memberId)) {
      Message.error({ content: t(Strings.warning_can_not_remove_yourself_or_primary_admin) });
      return;
    }
    Modal.confirm({
      title: t(Strings.kindly_reminder),
      content: t(Strings.remove_from_space_confirm_tip),
      onOk: () => {
        removeMember({
          teamId: selectedTeamInfoInSpace!.teamId,
          memberIdArr: [memberId],
          isDeepDel: true,
          resFunc: () => {
            const newSelect = selectMemberListInSpace.filter(item => item !== memberId);
            removeCallback && removeCallback();
            dispatch(StoreActions.updateSelectMemberListInSpace(newSelect));
            cancelModalVisible();
          },
        });
      },
      type: 'danger',
    });
  };
  const getTeamRemoveList = () => {
    if (!selectedTeamInfoInSpace) {
      return;
    }
    const tempList = teamList.length === 0 ? [{ teamId: ConfigConstant.ROOT_TEAM_ID, teamName: userInfo!.spaceName }] : teamList;
    return tempList.map(item => {
      return (
        <span className={styles.teamWrapper} key={item.teamId}>
          <Tooltip title={item.teamName} textEllipsis showTipAnyway>
            <span className={styles.teamText}>{item.teamName}</span>
          </Tooltip>
          {teamList.length > 0 && !isSocialFeiShu(spaceInfo) && (
            <span className={styles.teamRemoveIcon} onClick={() => removeTeam(item.teamId)}>
              <CloseIcon />
            </span>
          )}
        </span>
      );
    });
  };

  const [isMemberInputFocus, setMemberInputFocus] = useState(false);
  const _isSocialWecom = isSocialWecom(spaceInfo);
  const wecomMemberNameVisible = _isSocialWecom && !isMemberInputFocus && !isMemberNameModified && form.memberName === memberName;
  const wecomNickNameVisible = _isSocialWecom && !isNickNameModified;

  return (
    <>
      <Modal
        title={<div>{t(Strings.edit_member)}</div>}
        visible
        className={styles.adjustMemberModal}
        onOk={handleOk}
        onCancel={handleCancel}
        cancelText={t(Strings.cancel)}
        okText={t(Strings.save)}
        maskClosable
        cancelButtonProps={{ size: 'small', className: 'subText' }}
        okButtonProps={{ size: 'small' }}
        centered
        width={400}
      >
        <div className={styles.portrait}>
          <Avatar src={avatar} title={memberName || ''} size={80} id={memberId} />
        </div>
        <div className={styles.item}>
          <label className={styles.label}>{t(Strings.nickname_in_space)}</label>
          <div className={styles.content}>
            {wecomMemberNameVisible && (
              <div className={styles.wecomLayer}>
                <WecomOpenData openId={form.memberName} />
              </div>
            )}
            <TextInput
              style={{
                color: wecomMemberNameVisible ? 'transparent' : colorVars.fc1,
              }}
              value={form.memberName}
              onChange={e => {
                handleChange(e, 'memberName');
              }}
              onBlur={verifyMemberName}
              onClick={() => setMemberInputFocus(true)}
              disabled={isIdassPrivateDeployment()}
              block
            />
          </div>
          <div className={styles.err}>{formErr.memberName}</div>
        </div>
        <div className={styles.item}>
          <label className={styles.label}>{t(Strings.personal_nickname)}</label>
          <div className={styles.content}>
            {wecomNickNameVisible && (
              <div className={styles.wecomLayer} style={{ color: colorVars.black[500] }}>
                <WecomOpenData openId={form.nickName} />
              </div>
            )}
            <TextInput
              style={{
                color: wecomNickNameVisible ? 'transparent' : colorVars.black[500],
                WebkitTextFillColor: wecomNickNameVisible ? 'transparent' : colorVars.black[500],
              }}
              type="text"
              value={form.nickName}
              disabled
              block
            />
          </div>
          <div className={styles.err}>{formErr.nickName}</div>
        </div>
        <div className={styles.item}>
          <label className={styles.label}>{t(Strings.team)}</label>
          <div className={styles.deptItem}>
            {getTeamRemoveList()}
            {!isSocialFeiShu(spaceInfo) && (
              <Button onClick={toChangeTeamModal} size="small" className={styles.addBtn} prefixIcon={<AddIcon fill="currentColor" />}>
                {t(Strings.add)}
              </Button>
            )}
          </div>
        </div>
        {!env.HIDDEN_BIND_PHONE && (
          <div className={styles.item}>
            <label className={styles.label}>{t(Strings.phone_number)}</label>
            <TextInput value={form.mobile} disabled block />
            <div className={styles.err}>{formErr.mobile}</div>
          </div>
        )}

        <div className={styles.item}>
          <label className={styles.label}>{t(Strings.mail)}</label>
          <TextInput value={form.email} disabled block />
          <div className={styles.err}>{formErr.email}</div>
        </div>
        {!isSocialDingTalk(spaceInfo) && !isSocialWecom(spaceInfo) && !isSocialFeiShu(spaceInfo) && (
          <TextButton color="danger" onClick={removeFromSpace} size="small" style={{ position: 'absolute', bottom: '24px', left: '24px' }}>
            {t(Strings.remove_from_space)}
          </TextButton>
        )}
      </Modal>
      {/* {changeMemberTeamModalVisible && (
       <ChangeMemberTeamModal
       inEditMember
       setTeamList={setTeamList}
       teamList={teamList}
       setModalVisible={v => {
       setChangeMemberTeamModalVisible(v);
       }}
       />
       )} */}
      {changeMemberTeamModalVisible && (
        <ChangeMemberTeam onCancel={() => setChangeMemberTeamModalVisible(false)} inEditMember setTeamList={setTeamList} teamList={teamList} />
      )}
    </>
  );
};
