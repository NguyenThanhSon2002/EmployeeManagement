/**
 * Tiện ích tự động sinh mã ký tự kỹ thuật (Slug Code Generator)
 * Chuyển đổi tên tiếng Việt có dấu thành mã định danh uppercase (VD: "Chi nhánh Cầu Giấy" -> "CN_CAUGIAY")
 */
export const generateSlugCode = (text: string, prefix = ''): string => {
  if (!text || !text.trim()) {
    return `${prefix}${Date.now().toString(36).toUpperCase()}`;
  }

  // 1. Chuẩn hóa NFD và loại bỏ dấu tiếng Việt
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');

  // 2. Chuyển thành chữ hoa, thay ký tự đặc biệt và khoảng trắng bằng dấu gạch dưới
  let slug = normalized
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  // Fallback an toàn nếu sau khi lọc ký tự đặc biệt mà slug bị rỗng
  if (!slug) {
    return `${prefix}${Date.now().toString(36).toUpperCase()}`;
  }

  // 3. Đảm bảo có tiền tố nếu yêu cầu
  if (prefix) {
    const cleanPrefix = prefix.toUpperCase();
    if (!slug.startsWith(cleanPrefix)) {
      slug = `${cleanPrefix}${slug}`;
    }
  }

  return slug;
};
