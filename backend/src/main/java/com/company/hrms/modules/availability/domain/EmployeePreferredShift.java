package com.company.hrms.modules.availability.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_preferred_shifts", uniqueConstraints = {
        @UniqueConstraint(name = "uq_emp_preferred_shift", columnNames = {"employee_id", "work_shift_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmployeePreferredShift {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "employee_id", nullable = false)
    private Long employeeId;

    @Column(name = "work_shift_id", nullable = false)
    private Long workShiftId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public EmployeePreferredShift(Long employeeId, Long workShiftId) {
        this.employeeId = employeeId;
        this.workShiftId = workShiftId;
    }
}
