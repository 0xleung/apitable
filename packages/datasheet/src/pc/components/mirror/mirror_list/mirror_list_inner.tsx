import { Button, Skeleton, Typography, useThemeColors } from '@apitable/components';
import { ConfigConstant, integrateCdnHost, Navigation, Selectors, Settings, Strings, t } from '@apitable/core';
import { AddOutlined } from '@apitable/icons';
import Image from 'next/image';
import { PopUpTitle } from 'pc/components/common';
import { Router } from 'pc/components/route_manager/router';
import { useCatalog } from 'pc/hooks/use_catalog';
import * as React from 'react';
import { useSelector } from 'react-redux';
import { IMirrorItem } from './interface';
import styles from './style.module.less';
import { gstMirrorIconByViewType } from './utils';

interface IMirrorListInner {
  mirrorList: IMirrorItem[];
  creatable: boolean;
  loading: boolean;
}

const BlankInner = ({ createMirrorNode, mirrorCreatable }) => {
  return (
    <div className={styles.blackInner}>
      <div className={styles.imgBox}>
        <Image src={integrateCdnHost(Settings.blank_mirror_list_image.value)} alt="" width={160} height={120} />
      </div>
      <span className={styles.emptyText}>{t(Strings.black_mirror_list_tip)}</span>
      <Button color={'primary'} onClick={createMirrorNode} disabled={!mirrorCreatable}>
        {t(Strings.create_mirror_by_view)}
      </Button>
    </div>
  );
};

export const MirrorListInner: React.FC<IMirrorListInner> = props => {
  const colors = useThemeColors();
  const { mirrorList, loading } = props;
  const { datasheetId, viewId } = useSelector(state => state.pageParams)!;
  const folderId = useSelector(state => {
    return Selectors.getDatasheetParentId(state, datasheetId);
  });
  const view = useSelector(state => {
    const snapshot = Selectors.getSnapshot(state, datasheetId)!;
    return Selectors.getViewById(snapshot, viewId!);
  });

  const mirrorCreatable = useSelector(state => {
    const { manageable } = Selectors.getPermissions(state);
    const { manageable: folderManageable } = state.catalogTree.treeNodesMap[folderId!]?.permissions || {};
    return manageable && folderManageable;
  });

  const { addTreeNode } = useCatalog();

  const createMirrorNode = () => {
    addTreeNode(
      folderId,
      ConfigConstant.NodeType.MIRROR,
      {
        datasheetId,
        viewId,
      },
      `${view!.name}${t(Strings.key_of_adjective)}${t(Strings.mirror)}`,
    );
  };

  const linkTo = (id: string) => {
    Router.push(Navigation.WORKBENCH,{
      params: {
        nodeId: id,
      },
    });
  };

  return (
    <div className={styles.mirrorListInner}>
      <PopUpTitle variant={'h7'} title={t(Strings.mirror)} infoUrl={t(Strings.mirror_help_url)} className={styles.boxTop} />
      {loading ? (
        <div className={styles.skeletonWrapper} style={{ width: 368, height: 200 }}>
          <Skeleton count={2} height="24px" />
        </div>
      ) : mirrorList.length ? (
        <div>
          <div className={styles.scroll}>
            {mirrorList.map(item => {
              return (
                <div
                  key={item.nodeId}
                  className={styles.listItem}
                  onClick={() => {
                    linkTo(item.nodeId);
                  }}
                >
                  {gstMirrorIconByViewType(view!.type)}
                  <Typography variant={'body3'} ellipsis>
                    {item.nodeName}
                  </Typography>
                </div>
              );
            })}
          </div>
          <Button
            color={colors.defaultBg}
            disabled={!mirrorCreatable}
            className={styles.operateButton}
            onClick={createMirrorNode}
            block
            prefixIcon={<AddOutlined color={colors.thirdLevelText} />}
          >
            <Typography variant={'body3'}>{t(Strings.create_mirror_by_view)}</Typography>
          </Button>
        </div>
      ) : (
        <BlankInner createMirrorNode={createMirrorNode} mirrorCreatable={mirrorCreatable} />
      )}
    </div>
  );
};
