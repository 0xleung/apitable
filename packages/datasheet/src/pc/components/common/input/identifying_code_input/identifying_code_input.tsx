import { FC, useEffect, useState } from 'react';
import { VerificationCodeFilled } from '@apitable/icons';
import { AutoTestID, ConfigConstant, StatusCode, Strings, t } from '@apitable/core';
import { Button, ITextInputProps, TextInput } from '@apitable/components';
import { useBoolean, useMount, useInterval } from 'ahooks';
import { useRequest } from 'pc/hooks';
import styles from './style.module.less';
import { useUserRequest } from 'pc/hooks';
import { execNoTraceVerification, initNoTraceVerification } from 'pc/utils';

export interface IIdentifyingCodeInputProps extends ITextInputProps {
  mode?: ConfigConstant.LoginMode;
  data: {
    areaCode?: string;
    account: string;
  };
  smsType?: ConfigConstant.SmsTypes;
  emailType?: ConfigConstant.EmailCodeType;
  disabled?: boolean;
  setErrMsg: (
    data:
      | Partial<{
        accountErrMsg: string;
        identifyingCodeErrMsg: string;
      }>
      | ((prevState: {
        accountErrMsg: string;
        identifyingCodeErrMsg: string;
      }) => Partial<{
        accountErrMsg: string;
        identifyingCodeErrMsg: string;
      }>)
  ) => void;
  checkAccount?: () => boolean;
}

export const IdentifyingCodeInput: FC<IIdentifyingCodeInputProps> = ({
  mode = ConfigConstant.LoginMode.PHONE,
  data,
  disabled = false,
  smsType,
  emailType,
  setErrMsg,
  checkAccount,
  ...rest
}) => {
  const [second, setSecond] = useState(60);
  const [isRunning, { setTrue: startTime, setFalse: closingTime }] = useBoolean(
    false
  );
  const [btnDisabled, setBtnDisabled] = useState(disabled);
  const [nvcSuccessData, setNvcSuccessData] = useState<string | null>(null);
  const { getSmsCodeReq, getEmailCodeReq } = useUserRequest();
  const { run: getSmsCode, loading: smsLoading } = useRequest(getSmsCodeReq, {
    manual: true,
  });
  const { run: getEmailCode, loading: emailLoading } = useRequest(
    getEmailCodeReq,
    {
      manual: true,
    }
  );

  useEffect(() => {
    setBtnDisabled(disabled);
  }, [disabled]);

  useMount(() => {
    initNoTraceVerification(setNvcSuccessData);
  });

  useEffect(() => {
    if (nvcSuccessData) {
      getIdentifyingCode(nvcSuccessData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nvcSuccessData]);

  useInterval(
    () => {
      if (second === 0) {
        reset();
        return;
      }
      setBtnDisabled(true);
      setSecond(second - 1);
    },
    isRunning ? 1000 : undefined
  );

  const getIdentifyingCode = async(nvcVal?: string) => {
    if (checkAccount && !checkAccount()) return;

    let result: {
      success: boolean;
      code: number;
      message: string;
    } | null = null;
    const { account, areaCode } = data;
    if (mode === ConfigConstant.LoginMode.PHONE && areaCode && smsType) {
      result = await getSmsCode(areaCode, account, smsType, nvcVal);
    } else if (mode === ConfigConstant.LoginMode.MAIL && emailType) {
      result = await getEmailCode(account, emailType);
    }

    if (!result) {
      return;
    }

    const { success, code, message } = result;
    if (success) {
      startTime();
      return;
    }
    switch (code) {
      case StatusCode.SMS_GET_ERR:
      case StatusCode.SMS_CHECK_ERR:
        setErrMsg({ identifyingCodeErrMsg: message });
        break;
      case StatusCode.SECONDARY_VALIDATION:
      case StatusCode.NVC_FAIL:
        break;
      default:
        setErrMsg({ accountErrMsg: message });
    }
  };

  const handleGainIdentifyingCode = () => {
    execNoTraceVerification(getIdentifyingCode);
  };

  const reset = () => {
    setSecond(60);
    closingTime();
    setBtnDisabled(false);
  };

  const isLoading = smsLoading || emailLoading;

  return (
    <>
      <div className={styles.identifyingCodeInput}>
        <TextInput
          maxLength={6}
          prefix={<VerificationCodeFilled />}
          placeholder={t(Strings.placeholder_enter_your_verification_code)}
          className={styles.input}
          block
          {...rest}
        />
        <Button
          id={AutoTestID.GET_IDENTIFYING_CODE_BTN}
          className={styles.btn}
          color="primary"
          variant="jelly"
          onClick={handleGainIdentifyingCode}
          disabled={isLoading || btnDisabled}
          loading={isLoading}
        >
          {isRunning
            ? t(Strings.how_many_seconds, {
              seconds: second,
            })
            : isLoading ? '' : t(Strings.message_code)}
        </Button>
      </div>
    </>
  );
};
