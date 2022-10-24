import { useCallback, useEffect, useRef, useState } from 'react';
import { Range, Editor, Path, Transforms } from 'slate';
import { useSlate, ReactEditor } from 'slate-react';
import { Spin } from 'antd';
import LoadingOutlined from '@ant-design/icons/LoadingOutlined';
import { getValidPopupPosition, getValidSelection } from '../../helpers/utils';
import { GENERATOR } from '../../elements';

import { MemberOptionList } from 'pc/components/list/member_option_list';
import { store } from 'pc/store';
import { Api, Selectors } from '@apitable/core';
import { Z_INDEX } from '../../constant';
import { Portal } from 'pc/components/portal';
import { IVikaEditor } from '../../interface/editor';

import styles from './mention.module.less';
import { useDebounceFn } from 'ahooks';
import { useResponsive } from 'pc/hooks';
import { ScreenSize } from 'pc/components/common/component_display';

export const MentionPanel = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const visibleRef = useRef(false);
  const searchTextRef = useRef('');
  const state = store.getState();
  const unitMap = Selectors.getUnitMap(state) || {};
  const datasheetId = Selectors.getActiveDatasheetId(state)!;
  const editor = useSlate() as ReactEditor & IVikaEditor;
  const { selection } = editor;

  const [members, setMembers] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);
  const { screenIsAtLeast } = useResponsive();

  const setPanelVisibleAndPosition = useCallback(
    (position?: { top: number; left: number }) => {
      const el = wrapRef.current;
      if (!el) {
        return;
      }
      if (position && screenIsAtLeast(ScreenSize.sm)) {
        editor.hasMentionPanel = true;
        visibleRef.current = true;
        el.style.opacity = '1';
        el.style.top = `${position.top}px`;
        el.style.left = `${position.left}px`;
      } else {
        el.removeAttribute('style');
        visibleRef.current = false;
        editor.hasMentionPanel = false;
      }
    },
    [editor, screenIsAtLeast],
  );

  const getMembers = useCallback((keyword = '') => {
    setLoading(true);
    Api.loadOrSearch({ keyword })
      .then(res => {
        setMembers(res.data?.data ?? []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const { run: searchTextChange } = useDebounceFn(
    (keyword: string) => {
      setIndex(0);
      getMembers(keyword);
      searchTextRef.current = keyword;
    },
    { wait: 200 },
  );

  const insertMention = useCallback(
    mentionData => {
      const selection = getValidSelection(editor);
      Transforms.select(editor, selection);
      // 需要多删除一个@字符
      Transforms.delete(editor, { distance: searchTextRef.current.length + 1, reverse: true, unit: 'character' });
      // 在后面多插入一个空格
      const mention = GENERATOR.mention({ data: mentionData });
      Transforms.insertFragment(editor, [mention, { text: ' ' }]);
    },
    [editor],
  );

  const handleMemberItemClick = useCallback(
    data => {
      const memberId = data && data[0];
      const member = members.find(item => item.unitId === memberId);
      if (member) {
        insertMention(member);
      }
      setPanelVisibleAndPosition();
    },
    [members, insertMention, setPanelVisibleAndPosition],
  );

  const handleOk = useCallback(() => {
    const member = members[index];
    if (member) {
      insertMention(member);
    }
    setPanelVisibleAndPosition();
  }, [index, members, insertMention, setPanelVisibleAndPosition]);

  const handleChangeIndex = useCallback(
    (isAdd: boolean) => {
      const length = members.length;
      if (length < 2) {
        return;
      }
      let next = index + (isAdd ? 1 : -1);
      if (next < 0) {
        next = length - 1;
      } else if (next === length) {
        next = 0;
      }
      setIndex(next);
    },
    [index, members.length],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (visibleRef.current) {
        switch (e.code) {
          // up
          case 'ArrowUp': {
            e.preventDefault();
            handleChangeIndex(false);
            break;
          }

          // down
          case 'ArrowDown': {
            e.preventDefault();
            handleChangeIndex(true);
            break;
          }
          // 确定
          case 'Enter': {
            e.preventDefault();
            handleOk();
            break;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleChangeIndex, handleOk]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) {
      return;
    }

    if (!selection || !Range.isCollapsed(selection)) {
      setPanelVisibleAndPosition();
      return;
    }
    const [start] = Range.edges(selection);
    const wordBefore = Editor.before(editor, start, { unit: 'word' });
    const beforeWordRange = wordBefore && Editor.range(editor, wordBefore, start);
    const beforeWord = beforeWordRange && Editor.string(editor, beforeWordRange);
    const before = wordBefore && Editor.before(editor, wordBefore);
    const beforeRange = before && Editor.range(editor, before, start);
    const beforeText = beforeRange && Editor.string(editor, beforeRange);
    const testMatchText = beforeText || beforeWord;
    const beforeMatch = testMatchText && testMatchText.match(/^.*@([\u4e00-\u9fa5\w]{1,5})?$/);
    const after = Editor.after(editor, start);
    const afterRange = Editor.range(editor, start, after);
    const afterText = Editor.string(editor, afterRange);
    const afterMatch = afterText.match(/^(\s|$)/);
    const wordBeforePath = wordBefore && [...wordBefore.path];
    const startPath = [...start.path];
    // 最后一级为text节点，需要比较上一级节点的path
    wordBeforePath && wordBeforePath.pop();
    startPath.pop();
    const isSameBlock = wordBeforePath && Path.equals(wordBeforePath, startPath);
    if (!beforeMatch || !afterMatch || !isSameBlock) {
      el.removeAttribute('style');
      visibleRef.current = false;
      return;
    }

    const domRange = ReactEditor.toDOMRange(editor, selection);
    const rect = domRange?.getBoundingClientRect();
    if (rect && rect.x === 0 && rect.y === 0 && rect.width === 0) {
      return;
    }
    searchTextChange(beforeMatch[1] || '');
    const position = getValidPopupPosition({
      anchor: rect,
      popup: el.getBoundingClientRect(),
      offset: { x: 0, y: rect.height },
    });
    setPanelVisibleAndPosition(position);
  }, [editor, selection, searchTextChange, setPanelVisibleAndPosition]);

  return (
    <Portal zIndex={Z_INDEX.HOVERING_TOOLBAR}>
      <div className={styles.wrap} ref={wrapRef}>
        {loading ? (
          <div className={styles.loading}>
            <Spin size="small" indicator={<LoadingOutlined />} />
          </div>
        ) : (
          <MemberOptionList
            listData={members}
            showMoreTipButton={false}
            uniqId="unitId"
            unitMap={unitMap}
            showSearchInput={false}
            sourceId={datasheetId}
            onClickItem={handleMemberItemClick}
            multiMode={false}
            activeIndex={index}
            existValues={[]}
          />
        )}
      </div>
    </Portal>
  );
};
