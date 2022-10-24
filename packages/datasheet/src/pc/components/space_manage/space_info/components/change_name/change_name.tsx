import { useEffect, useState } from 'react';
import * as React from 'react';
import styles from './style.module.less';
import { Strings, t, IReduxState, ConfigConstant } from '@apitable/core';
import { Tooltip, NormalModal, WithTipTextInput } from 'pc/components/common';
import { shallowEqual, useSelector } from 'react-redux';
import { IconButton, Skeleton } from '@vikadata/components';
import { useNotificationCreate } from 'pc/hooks';
import { EditOutlined } from '@vikadata/icons';
export const ChangeName = () => {
  
  const { spaceInfo, spaceResource, spaceId, userInfo } = useSelector((state: IReduxState) => ({
    spaceInfo: state.space.curSpaceInfo,
    spaceId: state.space.activeId,
    spaceResource: state.spacePermissionManage.spaceResource,
    userInfo: state.user.info,
  }), shallowEqual);
  const [changeNameModal, setChangeNameModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputNameErr, setInputNameErr] = useState('');
  const [changeNameBtnLoading, setChangeNameBtnLoading] = useState(false);
  const { changeSpaceNameAndNotice } =
    useNotificationCreate({ fromUserId: userInfo!.uuid, spaceId: userInfo!.spaceId });
    
  const changeNameConfirm = () => {
    const text = inputText.trim();
    if (text.length < 2 || text.length > ConfigConstant.SPACE_NAME_LENGTH) {
      setInputNameErr(t(Strings.space_name_length_err));
    } else {
      setChangeNameBtnLoading(true);
      changeSpaceNameAndNotice(spaceId || '', text, cancelUpdateSpace);
    }
  };
  const inputTextChange = (value: string) => {
    setInputNameErr('');
    setInputText(value);
  };
  const cancelUpdateSpace = () => {
    setChangeNameModal(false);
    setChangeNameBtnLoading(false);
    spaceInfo && setInputText(spaceInfo.spaceName);
    setInputNameErr('');
  };

  useEffect(() => {
    setInputText(spaceInfo?.spaceName || '');
  }, [spaceInfo?.spaceName]);

  return (
    <>
      <div className={styles.changeName}>
        {
          spaceInfo ? 
            <>
              <Tooltip
                title={spaceInfo.spaceName}
                placement="bottomLeft"
                textEllipsis
              >
                <span className={styles.spaceName}>{spaceInfo.spaceName}</span>
              </Tooltip>
              {
                spaceResource && spaceResource.mainAdmin &&
                <IconButton icon={EditOutlined} onClick={() => setChangeNameModal(true)}/>
              }
            </> : (
              <>
                <Skeleton width="38%" />
                <Skeleton count={2} />
                <Skeleton width="61%"/>
              </>
            )
        }
      </div>
      {changeNameModal && spaceInfo &&
      (
        <NormalModal
          title={t(Strings.change) + t(Strings.space_name)}
          okButtonProps={{
            disabled: (!inputText) || (inputText.trim() === spaceInfo.spaceName) || changeNameBtnLoading,
            loading: changeNameBtnLoading,
          }}
          onCancel={cancelUpdateSpace}
          onOk={changeNameConfirm}
          maskClosable
        >
          <WithTipTextInput
            placeholder={t(Strings.placeholder_input_workspace_new_name, {
              minCount: 2,
              maxCount: 100,
            })}
            value={inputText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => inputTextChange(e.target.value)}
            error={Boolean(inputNameErr)}
            helperText={inputNameErr}
            block
          />
        </NormalModal>
      )
      }
    </>
  );
};