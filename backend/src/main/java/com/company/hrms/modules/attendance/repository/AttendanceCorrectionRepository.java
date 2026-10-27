package com.company.hrms.modules.attendance.repository;

import com.company.hrms.modules.attendance.domain.AttendanceCorrection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceCorrectionRepository extends JpaRepository<AttendanceCorrection, Long> {

    List<AttendanceCorrection> findAllByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    Page<AttendanceCorrection> findAllByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<AttendanceCorrection> findAllByStatusOrderByCreatedAtDesc(String status);
}
