import * as React from 'react';
import SearchIcon from 'static/icon/common/common_icon_search_normal.svg';
import styles from './style.module.less';
import classNames from 'classnames';
import { Strings, t } from '@apitable/core';
import ClearIcon from 'static/icon/datasheet/datasheet_icon_attachment_cancel.svg';
import { stopPropagation, useThemeColors } from '@vikadata/components';

interface ILineSearchInputProps {
  value?: string;
  size?: 'large' | 'small' | 'default'
  placeholder?: string;
  className?: string;
  showCloseIcon?: boolean;
  onChange?(e): void
  onKeyDown?(e): void
  onFocus?(e): void
  style?: React.CSSProperties;
  allowClear?: boolean
  onClear?(): void;
}

export const LineSearchInputBase: React.ForwardRefRenderFunction<{}, ILineSearchInputProps> = (props, ref) => {
  const colors = useThemeColors();
  const {
    onChange,
    value,
    onKeyDown,
    className,
    onFocus,
    size = 'default',
    placeholder,
    style,
    onClear,
    allowClear,
  } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useImperativeHandle(ref, () => {
    return {
      focus() {
        inputRef.current!.focus();
      },
    };
  });

  const handleClear = () => {
    if (!allowClear) { return; }
    if (onClear && typeof onClear === 'function') {
      onClear();
      inputRef.current?.focus();
    }
  };
  return <div
    className={
      classNames('lineSearchInput', styles.lineSearchInput, {
        [styles[size]]: true,
      }, className)
    }
    style={style}
  >
    <span className={styles.prefixIcon}>
      <SearchIcon fill={colors.fourthLevelText} width={16} height={16} />
    </span>
    <input
      type="text"
      ref={inputRef}
      onFocus={onFocus}
      onChange={onChange}
      value={value}
      onKeyDown={onKeyDown}
      placeholder={placeholder || t(Strings.search)}
      size={1}
    />
    <span
      className={styles.suffixIcon}
      onClick={e => {
        stopPropagation(e);
        handleClear();
      }} 
    >
      {Boolean(value) && allowClear && <ClearIcon fill={colors.fourthLevelText} />}
    </span>
  </div>;
};

export const LineSearchInput = React.forwardRef(LineSearchInputBase);