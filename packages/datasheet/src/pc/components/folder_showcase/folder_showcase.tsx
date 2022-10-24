import { Button, ContextMenu, Skeleton, useContextMenu } from '@vikadata/components';
import {
  AutoTestID, ConfigConstant, CutMethod, Events, FOLDER_SHOWCASE_ID, getImageThumbSrc, INodePermissions, integrateCdnHost, IReduxState, Navigation,
  Player, Settings, StoreActions, Strings, t,
} from '@apitable/core';
import { uploadAttachToS3 } from '@vikadata/widget-sdk';
import { useToggle, useUnmount } from 'ahooks';
import { Spin } from 'antd';
import classNames from 'classnames';
import Image from 'next/image';
import { TriggerCommands } from 'pc/common/apphook/trigger_commands';
import { Share } from 'pc/components/catalog/share';
import { ButtonPlus } from 'pc/components/common';
import { ComponentDisplay, ScreenSize } from 'pc/components/common/component_display';
import { IPreviewShape, ISelectInfo } from 'pc/components/common/image_crop_upload';
import { Router } from 'pc/components/route_manager/router';
import { Deserializer, SlateEditor } from 'pc/components/slate_editor';
import { sanitized } from 'pc/components/tab_bar/description_modal';
import { useCatalogTreeRequest, usePrevious, useRequest, useWeixinShare } from 'pc/hooks';
import { flatContextData } from 'pc/utils';
import { getStorage, setStorage, StorageName } from 'pc/utils/storage';
import * as React from 'react';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { ContextMenuTrigger } from 'react-contextmenu';
import { useDispatch, useSelector } from 'react-redux';
import MoreIcon from 'static/icon/common/common_icon_more.svg';
import ShareIcon from 'static/icon/common/common_icon_share.svg';
import BannerEditIcon from 'static/icon/datasheet/rightclick/datasheet_icon_rename.svg';
import { GenerateTemplate } from '../catalog/generate_template';
import { makeNodeIconComponent, NodeIcon } from '../catalog/node_context_menu';
import { getNodeIcon } from '../catalog/tree/node_icon';
import { ImageCropUpload, Message } from '../common';
import { NodeInfoBar } from '../common/node_info_bar';
import { inSocialApp } from '../home/social_platform';
import { MobileBar } from '../mobile_bar';
import { NoPermission } from '../no_permission';
import { DescriptionModal } from './description_modal';
import { DingTalkDa } from './dingtalk_da';
import styles from './style.module.less';

export interface IFolderShowcaseProps {
  nodeInfo: {
    id: string;
    name: string;
    icon: string;
    role?: string;
    permissions?: INodePermissions;
    nodeFavorite?: boolean;
  };
  childNodes?: any[];
  readOnly?: boolean;
}

export interface IChildrenNode {
  nodeId: string;
  icon: string;
  type: ConfigConstant.NodeType;
  nodeName: string;
}

const customTips = {
  cropDesc: t(Strings.custom_upload_tip),
};

const template = /(\/)?template(\/)?/; // 模板中心

export const FolderShowcase: FC<IFolderShowcaseProps> = ({ readOnly, childNodes, nodeInfo }) => {
  // 子节点集合
  const [childrenNodeIdList, setChildrenNodeIdList] = useState<IChildrenNode[]>([]);
  // banner图集合
  const [banners, setBanners] = useState<string[]>([]);
  // 是否显示描述编辑模态框
  const [isDescriptionModal, { toggle: toggleIsDescriptionModal }] = useToggle(false);
  // 是否显示自定义banner模态框
  const [isBannerModal, { toggle: toggleIsBannerModal }] = useToggle(false);
  // 是否显示生成模板模态框
  const [isGenerateTempalte, { toggle: toggleIsGenerateTemplate }] = useToggle(false);
  // banner loading状态
  const [bannerLoading, setBannerLoading] = useState(false);
  // 当前打开“分享模态框”的节点ID
  const [shareNodeId, setShareNodeId] = useState('');
  const moreRef = useRef<any>();
  const dispatch = useDispatch();
  const { folderId: _folderId, templateId, shareId, categoryId } = useSelector((state: IReduxState) => state.pageParams);
  const spaceId = useSelector(state => state.space.activeId);
  const { treeNodesMap, socketData } = useSelector((state: IReduxState) => state.catalogTree);
  const { getNodeShowcaseReq, updateNodeReq, getChildNodeListReq } = useCatalogTreeRequest();
  const { run: updateNode } = useRequest(updateNodeReq, { manual: true });
  const { run: getChildNodeList, loading: getChildNodeListLoading } = useRequest(getChildNodeListReq, { manual: true });
  const { run: getNodeShowcase, data: showcaseData, loading, mutate: setShowcaseData } = useRequest(getNodeShowcaseReq, { manual: true });
  const { show } = useContextMenu({
    id: ConfigConstant.ContextMenuType.FOLDER_SHOWCASE,
  });
  const isInDingTalk = inSocialApp(ConfigConstant.SocialType.DINGTALK);
  const folderId = _folderId!;
  const hasChildren = treeNodesMap[folderId]?.hasChildren;

  const pathname = location.pathname;
  const isMatchTemplate = template.test(pathname);

  useUnmount(() => {
    if (!isMatchTemplate) {
      TriggerCommands.clear_guide_uis(['taskList']);
      TriggerCommands.skip_all_wizards();
    }
  });

  useEffect(() => {
    if (!isMatchTemplate) {
      TriggerCommands.clear_guide_uis(['taskList']);
      TriggerCommands.skip_all_wizards();
    }
  }, [folderId, isMatchTemplate]);

  const prevShowcaseData = usePrevious(showcaseData);
  useEffect(() => {
    if (folderId && !prevShowcaseData && showcaseData) {
      Player.doTrigger(Events.workbench_folder_showcase_shown);

      if (isInDingTalk && showcaseData?.extra?.showTips) {
        const folderIds = getStorage(StorageName.DingTalkVisitedFolders) || [];
        if (!folderIds.includes(folderId)) {
          Message.success({
            content: t(Strings.using_templates_successful),
          });
          setStorage(StorageName.DingTalkVisitedFolders, [folderId]);
        }
      }
      if (showcaseData?.extra?.sourceTemplateId) {
        Player.doTrigger(Events.workbench_folder_from_template_showcase_shown);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, showcaseData]);

  const formatData = (description: string) => {
    const data = JSON.parse(description);
    let newData = '';
    if (data.hasOwnProperty('blocks')) {
      for (const block of data.blocks) {
        if (block.type === 'paragraph') {
          newData += `<p>${block.data.text}<p>`;
        }
        if (block.type === 'image') {
          newData += `<Image src="${block.data.file.url}" />`;
        }
      }
      return newData.length ? newData : t(Strings.edit_node_desc);
    }
    return data.render;
  };

  const polyfillHtmlString = (description: string) => {
    const data = JSON.parse(description);
    if (data.hasOwnProperty('blocks')) {
      return formatData(description);
    }
    return data.data;
  };

  // const polyfillDescription = description => {
  //   const data = JSON.parse(description);
  //   if (data.data === '<p><br></p>') {
  //     return t(Strings.edit_node_desc);
  //   }
  //   return htmlParser(polyfillHtmlString(description));
  // };

  const folderShareInfo = useMemo(() => {
    if (!showcaseData) {
      return;
    }
    const { nodeName, description } = showcaseData;
    return {
      nodeName: nodeName,
      nodeDesc: description && sanitized(polyfillHtmlString(description)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showcaseData]);

  useWeixinShare(folderShareInfo);

  useEffect(() => {
    setShowcaseData(undefined);
    getNodeShowcase(folderId!, shareId);
    setBanners(Settings.folder_showcase_banners.value.split(','));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  useEffect(() => {
    if (getChildNodeListLoading) return;
    if (!hasChildren) return setChildrenNodeIdList([]);
    const fetchNodeList = async() => {
      const result = await getChildNodeList(folderId);
      if (result) {
        setChildrenNodeIdList(result);
        dispatch(StoreActions.addNodeToMap(result, false));
      }
    };
    fetchNodeList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId, hasChildren]);

  useEffect(() => {
    if (!socketData || !showcaseData) {
      return;
    }
    if ('cover' in socketData.data) {
      setShowcaseData({ ...showcaseData!, cover: socketData.data.cover });
    }
    if ('nodeName' in socketData.data) {
      setShowcaseData({ ...showcaseData!, nodeName: socketData.data.nodeName });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socketData]);

  useEffect(() => {
    if (Array.isArray(childNodes) && childNodes.length) {
      setChildrenNodeIdList(childNodes);
    }
  }, [childNodes]);

  const changeBanner = (bannerId: string) => {
    if (!showcaseData || !folderId) {
      return;
    }
    setShowcaseData({ ...showcaseData, cover: bannerId });
    updateNode(folderId, { cover: bannerId });
  };

  const jumpNode = (nodeId: string) => {
    if (spaceId && templateId) {
      Router.push(Navigation.TEMPLATE, {
        params: { spaceId, categoryId, templateId, nodeId },
      });
      return;
    }
    if (!spaceId && templateId) {
      Router.push(Navigation.TEMPLATE, {
        params: { categoryId, templateId, nodeId },
      });
      return;
    }
    if (shareId) {
      Router.push(Navigation.SHARE_SPACE, {
        params: { shareId, nodeId },
      });
      return;
    }
    Router.push(Navigation.WORKBENCH, {
      params: { spaceId, nodeId },
    });
  };

  const uploadBanner = (file: File) => {
    if (!folderId || !showcaseData) {
      return false;
    }
    setBannerLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', '3');
    formData.append('nodeId', folderId);
    uploadFile(formData, folderId);
    return false;
  };

  const uploadFile = (formData: FormData, folderId: string) => {
    if (!showcaseData) {
      return;
    }
    uploadAttachToS3({
      file: formData.get('file') as File,
      fileType: 3,
      nodeId: folderId,
    }).then(res => {
      const { success, data } = res.data;
      if (success) {
        setShowcaseData({ ...showcaseData, cover: data.token });
        updateNode(folderId, { cover: data.token });
      } else {
        Message.error({ content: t(Strings.message_upload_img_failed) });
      }
      setBannerLoading(false);
    });
  };

  const uploadConfirm = (data: ISelectInfo) => {
    const { customFile, officialToken } = data;
    if (officialToken) {
      changeBanner(officialToken);
      return;
    }
    if (customFile) {
      uploadBanner(customFile as File);
    }
  };

  const openMoreContextMenu = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    show(e);
  };

  const updateDesc = (data: string) => {
    if (!showcaseData) {
      return;
    }
    setShowcaseData({ ...showcaseData, description: data });
  };

  const openDescModal = () => {
    toggleIsDescriptionModal();
  };

  const memoDesc = useMemo(() => {
    if (!showcaseData || !showcaseData.description) {
      return null;
    }
    const descJson = JSON.parse(showcaseData.description);
    if (descJson.slateData) {
      // 只有新版的编辑器才有text字段
      if (!descJson.text) {
        return null;
      }
      return descJson.slateData;
    }
    if (descJson.data === '<p><br></p>') {
      return null;
    }
    return Deserializer.html(descJson.data);
  }, [showcaseData]);

  if (!folderId || loading) {
    return (
      <div className={styles.folderShowcaseSkeleton}>
        <div style={{ display: 'flex' }}>
          <div>
            <Skeleton image style={{ width: 240, height: 240 }} />
          </div>
          <div style={{ flexGrow: 1, marginLeft: 8 }}>
            <Skeleton width='38%' />
            <Skeleton count={2} />
            <Skeleton width='61%' />
          </div>
        </div>
        <div style={{ marginTop: 80 }}>
          <Skeleton width='38%' />
          <Skeleton count={2} />
          <Skeleton width='61%' />
        </div>
      </div>
    );
  }

  if (!showcaseData) {
    return <NoPermission />;
  }

  const { permissions, cover, role, nodeId, socialInfo } = showcaseData;
  const bannerImgUrl = getImageThumbSrc(integrateCdnHost(cover || banners[0]), {
    method: CutMethod.CUT,
    quality: 100,
    size: 470 * window.devicePixelRatio || 1,
  });
  return (
    <div id={AutoTestID.SHARE_CONTAINER} className={classNames(styles.folderShowcaseWrapper, readOnly && styles.readOnly)}>
      <ComponentDisplay maxWidthCompatible={ScreenSize.md}>
        <MobileBar />
      </ComponentDisplay>
      <div className={styles.scrollWrapper}>
        <div className={styles.container}>
          <div className={styles.top}>
            <Spin spinning={bannerLoading}>
              <div className={styles.folderShowcaseBanner}>
                <div className={styles.banner}>
                  <Image src={bannerImgUrl} alt='banner' layout={'fill'} />
                  {permissions.descriptionEditable && (
                    <div className={styles.editBtn}>
                      <ButtonPlus.Icon size='small' onClick={() => toggleIsBannerModal()} icon={<BannerEditIcon />} />
                    </div>
                  )}
                </div>
              </div>
            </Spin>

            <div className={styles.nodeInfo}>
              <div className={styles.nodeTitle}>
                <NodeInfoBar
                  data={{
                    nodeId: nodeInfo.id,
                    icon: nodeInfo.icon,
                    type: ConfigConstant.NodeType.FOLDER,
                    name: nodeInfo.name,
                    role: nodeInfo.role || role,
                    favoriteEnabled: nodeInfo.nodeFavorite,
                    nameEditable: nodeInfo.permissions?.renamable,
                    iconEditable: nodeInfo.permissions?.iconEditable,
                    iconSize: 24,
                  }}
                  hiddenModule={{ favorite: Boolean(shareId || templateId) }}
                  style={{ fontSize: '20px', fontWeight: 'bold' }}
                />
              </div>
              <div
                id={FOLDER_SHOWCASE_ID.DESCRIPTION}
                onClick={() => toggleIsDescriptionModal()}
                className={classNames(styles.descWrapper, permissions.sharable && styles.needPadding)}
              >
                <div className={styles.desc}>
                  {memoDesc ? (
                    <SlateEditor className={styles.onlyReadEditor} sectionSpacing='small' value={memoDesc} readOnly />
                  ) : (
                    <span className={styles.defaultText}>{t(Strings.edit_node_desc)}</span>
                  )}
                  {/* {showcaseData.description ? htmlParser(JSON.parse(showcaseData.description).data) : '暂无描述'} */}
                </div>
              </div>
              <div className={styles.btnGroup}>
                {permissions.sharable && (
                  <Button
                    className={styles.shareBtn}
                    shape='round'
                    size='small'
                    onClick={() => setShareNodeId(nodeInfo.id)}
                    prefixIcon={<ShareIcon fill='currentColor' />}
                  >
                    {t(Strings.share)}
                  </Button>
                )}
                {isInDingTalk && socialInfo?.dingTalkSuiteKey && socialInfo?.dingTalkCorpId && Boolean(socialInfo?.dingTalkDaStatus) && (
                  <DingTalkDa suiteKey={socialInfo.dingTalkSuiteKey} corpId={socialInfo.dingTalkCorpId} bizAppId={folderId} />
                )}
                {(permissions.nodeAssignable || permissions.templateCreatable) && (
                  <ContextMenuTrigger id='folder_showcase_moreBtn' ref={moreRef}>
                    <ComponentDisplay minWidthCompatible={ScreenSize.md}>
                      <Button
                        id={FOLDER_SHOWCASE_ID.BTN_MORE}
                        className={styles.settingBtn}
                        size='small'
                        onClick={openMoreContextMenu}
                        shape='round'
                        prefixIcon={<MoreIcon fill='currentColor' />}
                      />
                    </ComponentDisplay>
                    {/* <ComponentDisplay maxWidthCompatible={ScreenSize.md}>
                     <div className={styles.disabledBtn}>
                     <MoreIcon />
                     </div>
                     </ComponentDisplay> */}
                  </ContextMenuTrigger>
                )}
              </div>
            </div>
          </div>
          <div className={styles.mobileDescWrapper}>
            <div className={styles.desc} onClick={openDescModal}>
              {memoDesc ? (
                <SlateEditor sectionSpacing='small' value={memoDesc} readOnly />
              ) : (
                <span className={styles.defaultText}>{t(Strings.edit_node_desc)}</span>
              )}
              {/* {showcaseData.description ? htmlParser(JSON.parse(showcaseData.description).data) : '暂无描述'} */}
            </div>
          </div>
          <div className={styles.nodes} id={FOLDER_SHOWCASE_ID.NODES_CONTAINER}>
            {childrenNodeIdList.map((node, index) => {
              const idBase = index === 0 ? { id: FOLDER_SHOWCASE_ID.FIRST_NODE } : {};
              return (
                <div className={styles.nodeItem} key={node.nodeId} onClick={() => jumpNode(node.nodeId)} {...idBase}>
                  {getNodeIcon(node.icon, node.type)}
                  <span className={styles.nodeName}>{node.nodeName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {isDescriptionModal && <DescriptionModal onCancel={toggleIsDescriptionModal} nodeInfo={showcaseData} updateDesc={updateDesc} />}
      <ImageCropUpload
        visible={isBannerModal}
        confirm={data => uploadConfirm(data)}
        initPreview={
          <span style={{ width: '100%', height: '100%', objectFit: 'cover' }} className={styles.imgWrapper}>
            <Image src={bannerImgUrl} alt='banner' layout={'fill'} />
          </span>
        }
        customTips={customTips}
        previewShape={IPreviewShape.Square}
        officialImgs={Settings.folder_showcase_banners.value.split(',')}
        cancel={() => toggleIsBannerModal()}
      />
      <Share nodeId={shareNodeId} onClose={() => setShareNodeId('')} />
      {isGenerateTempalte && <GenerateTemplate nodeId={nodeId} onCancel={() => toggleIsGenerateTemplate()} />}
      <ContextMenu
        menuId={ConfigConstant.ContextMenuType.FOLDER_SHOWCASE}
        overlay={flatContextData(
          [
            [
              {
                icon: makeNodeIconComponent(NodeIcon.Permission),
                text: t(Strings.permission_setting), // '权限设置',
                onClick: () => dispatch(StoreActions.updatePermissionModalNodeId(nodeInfo.id)),
                hidden: !permissions.nodeAssignable,
              },
              {
                icon: makeNodeIconComponent(NodeIcon.Template),
                text: t(Strings.save_as_template), // '保存为模板',
                onClick: () => toggleIsGenerateTemplate(),
                hidden: !permissions.templateCreatable,
              },
            ],
          ],
          true,
        )}
      />
    </div>
  );
};
