package com.company.hrms.modules.availability.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_availabilities", uniqueConstraints = {
        @UniqueConstraint(name = "uq_emp_shift_day", columnNames = {"employee_id", "work_shift_id", "day_of_week"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeeAvailability {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "work_shift_id", nullable = false)
    private Long workShiftId;

    @Column(name = "day_of_week", nullable = false)
    private Byte dayOfWeek; // 1: Thứ Hai -> 7: Chủ Nhật

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public EmployeeAvailability(Long employeeId, Long workShiftId, Byte dayOfWeek, Boolean isAvailable) {
        this.employeeId = employeeId;
        this.workShiftId = workShiftId;
        this.dayOfWeek = dayOfWeek;
        this.isAvailable = isAvailable;
    }
}
