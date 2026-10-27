export interface AvatarColorPalette {
  bg: string;
  text: string;
  border: string;
}

export const AVATAR_PALETTES: AvatarColorPalette[] = [
  { bg: '#FEF9C3', text: '#854D0E', border: '#FEF08A' }, // Vàng chanh / rêu đậm (giống mẫu ảnh)
  { bg: '#ECFCCB', text: '#3F6212', border: '#D9F99D' }, // Cốm nhạt
  { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' }, // Xanh da trời
  { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE' }, // Chàm
  { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF' }, // Tím nhạt
  { bg: '#FFE4E6', text: '#9F1239', border: '#FECDD3' }, // Hồng đào
  { bg: '#FFEDD5', text: '#9A3412', border: '#FED7AA' }, // Cam sữa
  { bg: '#CCFBF1', text: '#115E59', border: '#99F6E4' }, // Xanh ngọc
];

/**
 * Trích xuất chữ cái in hoa đầu tiên của Tên chính (từ cuối cùng trong họ tên)
 * Ví dụ: "Nguyễn Văn Bắc" -> "B", "Nguyễn Thu Phương" -> "P", "Gia Linh" -> "L"
 */
export const getNameInitial = (fullName?: string): string => {
  if (!fullName || !fullName.trim()) return '?';
  const tokens = fullName.trim().split(/\s+/);
  const givenName = tokens[tokens.length - 1];
  return givenName.charAt(0).toUpperCase();
};

/**
 * Lấy bảng màu pastel ngẫu nhiên nhưng cố định theo tên người dùng
 */
export const getAvatarColorPalette = (fullName?: string): AvatarColorPalette => {
  if (!fullName || !fullName.trim()) return AVATAR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < fullName.length; i++) {
    hash = (hash << 5) - hash + fullName.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
};

/**
 * Chuẩn hóa URL ảnh đại diện
 */
export const getAvatarUrl = (avatarUrl?: string | null): string => {
  if (!avatarUrl || !avatarUrl.trim()) {
    return '';
  }
  return avatarUrl.trim();
};
