package com.company.hrms.modules.swap.domain;

public enum SwapStatus {
    PENDING_PEER,      // Chờ đồng nghiệp chấp thuận
    PEER_ACCEPTED,     // Đồng nghiệp đã đồng ý, chuyển sang chờ Quản lý duyệt
    PEER_REJECTED,     // Đồng nghiệp từ chối
    APPROVED,          // Quản lý đã duyệt thành công
    REJECTED,          // Quản lý từ chối
    CANCELLED          // Người gửi tự hủy yêu cầu
}
