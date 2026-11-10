import React, { useState, useEffect, useRef } from 'react';

export const formatNumberWithDots = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '0';
  const num = typeof val === 'number' ? Math.round(val) : parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled,
  style,
  className,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const [displayVal, setDisplayVal] = useState<string>(() => (value ? formatNumberWithDots(value) : '0'));
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const userTypingRef = useRef<boolean>(false);

  useEffect(() => {
    if (userTypingRef.current) {
      userTypingRef.current = false;
      return;
    }
    if (!isFocused) {
      setDisplayVal(value ? formatNumberWithDots(value) : '0');
    } else if (value === 0 && displayVal === '') {
      // Giữ chuỗi rỗng khi người dùng đang nhập liệu mới
    } else {
      setDisplayVal(value ? formatNumberWithDots(value) : '0');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const cursor = input.selectionStart || 0;
    const oldValue = input.value;
    const digitsBeforeCursor = oldValue.slice(0, cursor).replace(/\D/g, '').length;

    const raw = oldValue.replace(/\D/g, '');
    if (!raw) {
      userTypingRef.current = true;
      setDisplayVal('');
      onChange(0);
      return;
    }

    // Giới hạn an toàn 14 chữ số (~ trăm nghìn tỷ VNĐ)
    const truncatedRaw = raw.slice(0, 14);
    const num = parseInt(truncatedRaw, 10);
    if (isNaN(num)) {
      userTypingRef.current = true;
      setDisplayVal('');
      onChange(0);
      return;
    }

    const newFormatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    userTypingRef.current = true;
    setDisplayVal(newFormatted);
    onChange(num);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        let targetPos = 0;
        let digitsFound = 0;
        for (let i = 0; i < newFormatted.length; i++) {
          if (/\d/.test(newFormatted[i])) {
            digitsFound++;
          }
          if (digitsFound >= digitsBeforeCursor) {
            targetPos = i + 1;
            break;
          }
        }
        if (digitsBeforeCursor === 0) targetPos = 0;
        inputRef.current.setSelectionRange(targetPos, targetPos);
      }
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (value === 0) {
      setDisplayVal('');
    } else {
      setDisplayVal(formatNumberWithDots(value));
    }
    if (onFocus) {
      onFocus(e);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setDisplayVal(value ? formatNumberWithDots(value) : '0');
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={displayVal}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      className={className}
      {...restProps}
    />
  );
};
