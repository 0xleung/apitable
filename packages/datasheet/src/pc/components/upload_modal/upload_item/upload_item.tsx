import { useThemeColors } from '@apitable/components';
import { isImage, RowHeightLevel, Strings, t } from '@apitable/core';
import { Progress } from 'antd';
import Image from 'next/image';
import { usePlatform } from 'pc/hooks/use_platform';
import { resourceService } from 'pc/resource_service';
import { byte2Mb, NO_SUPPORT_IMG_MIME_TYPE, renderFileIconUrl, UploadManager, UploadStatus } from 'pc/utils';
import * as React from 'react';
import { useEffect, useState } from 'react';
import IconDelete from 'static/icon/common/common_icon_delete.svg';
import IconReUpdate from 'static/icon/common/common_icon_refresh.svg';
import { IUploadFileItemProps } from '../upload_core/upload_core.interface';
import styles from './styles.module.less';

enum RetryIconSize {
  Short = 16,
  Medium = 24,
  Tall = 32,
  ExtraTall = 40,
  Default = 32,
}

export const UploadItem: React.FC<IUploadFileItemProps> = props => {
  const {
    recordId, field, file, fileUrl, fileId, datasheetId, status,
    isCell, cellHeight, deleteUploadItem, rowHeightLevel, onSave, getCellValueFn
  } = props;
  const colors = useThemeColors();
  const [loaded, setLoaded] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | undefined>(status);
  const { mobile } = usePlatform();
  const uploadManager = resourceService.instance!.uploadManager;

  const updateFileItem = () => {
    const list = uploadManager.get(UploadManager.getCellId(recordId, field.id));
    const item = list.find(item => item.fileId === fileId);
    if (!item) return;
    setUploadStatus(item.status);
    if (item.loaded) {
      setLoaded(item.loaded);
    }
  };

  useEffect(() => {
    if (status) {
      return;
    }
    const list = uploadManager.get(UploadManager.getCellId(recordId, field.id));
    const item = list.find(item => item.fileId === fileId);
    if (item) return;
    const cellId = UploadManager.getCellId(recordId, field.id);
    // send request.
    uploadManager.register(
      cellId,
      uploadManager.generateSuccessFn(
        recordId, field.id, { name: file.name, id: fileId }, datasheetId, getCellValueFn, onSave
      ),
      UploadManager.generateFormData(file, datasheetId),
      fileId
    );
    uploadManager.bindFileStatus(cellId, fileId, updateFileItem);
    return () => {
      uploadManager.unBindFileStatus(cellId, fileId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cellId = UploadManager.getCellId(recordId, field.id);
    if (status) {
      // De-Data Binding.
      uploadManager.bindFileStatus(cellId, fileId, updateFileItem);
      return;
    }
    return () => {
      uploadManager.unBindFileStatus(cellId, fileId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function renderIcon() {
    const imgStyle = {
      maxWidth: '100%',
      maxHeight: 'calc(100% - 8px)'
    };

    if (isCell) {
      return (
        <span style={imgStyle}>
          <Image
            src={
              isImage(file) && !NO_SUPPORT_IMG_MIME_TYPE.includes(file.type)
                ? fileUrl
                : renderFileIconUrl(file)
            }
            height={mobile ? undefined : Number(cellHeight)}
            alt=''
          />
        </span>
      );
    }
    return isImage(file) ?
      (
        <div
          className={styles.img}
          style={{
            backgroundImage: `url(${fileUrl})`
          }}
        />
      )
      : <Image src={renderFileIconUrl(file)} width={90} height={100} style={imgStyle} alt='' />;

  }

  function retryUpload() {
    uploadManager.retryUpload(UploadManager.getCellId(recordId, field.id), fileId);
  }

  function deleteFileItem() {
    uploadManager.deleteFailItem(UploadManager.getCellId(recordId, field.id), fileId, true);
    deleteUploadItem && deleteUploadItem(fileId);
  }

  const retryIconSize = (() => {
    if (!isCell) {
      return RetryIconSize.Default;
    }
    if (rowHeightLevel === RowHeightLevel.Short) {
      return RetryIconSize.Short;
    }
    if (rowHeightLevel === RowHeightLevel.Medium) {
      return RetryIconSize.Medium;
    }
    if (rowHeightLevel === RowHeightLevel.Tall) {
      return RetryIconSize.Tall;
    }
    return RetryIconSize.ExtraTall;
  })();

  return (
    <div className={styles.uploadItem}>
      <div className={styles.placeholderFile}>
        {renderIcon()}
      </div>
      {
        !isCell && uploadStatus === UploadStatus.Fail &&
        <div className={styles.iconDelete} onClick={deleteFileItem}>
          <IconDelete fill={colors.defaultBg} />
        </div>
      }
      {
        !isCell && <div className={styles.fileName}>
          {file.name}
        </div>
      }
      <div
        className={styles.status}
        style={{
          height: isCell ? cellHeight : ''
        }}
      >
        {
          (uploadStatus === UploadStatus.Pending || !uploadStatus) &&

          <div className={styles.progress}>
            <Progress
              percent={Math.ceil((loaded / file.size) * 100)}
              showInfo={false}
              strokeColor={colors.successColor}
            />
            {
              !isCell &&
              <p>
                {t(Strings.waiting_for_upload)}
              </p>
            }
          </div>
        }
        {
          uploadStatus === UploadStatus.Loading &&
          <div
            className={styles.progress}

          >
            <Progress
              percent={Math.ceil((loaded / file.size) * 100)}
              showInfo={false}
              strokeColor={colors.successColor}
            />
            {
              !isCell &&
              <p>
                {
                  `${byte2Mb(loaded)}M / ${byte2Mb(file.size)}M`
                }
              </p>
            }
          </div>
        }
        {
          uploadStatus === UploadStatus.Fail &&
          <div onClick={retryUpload} className={styles.retryUpload}>
            <IconReUpdate
              fill={colors.defaultBg}
              width={retryIconSize}
              height={retryIconSize}
            />
          </div>
        }
      </div>

    </div>
  );
};
