package com.company.hrms.modules.attendance.repository;

import com.company.hrms.modules.attendance.domain.AttendanceCorrection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttendanceCorrectionRepository extends JpaRepository<AttendanceCorrection, Long> {

    List<AttendanceCorrection> findAllByEmployeeIdOrderByCreatedAtDesc(Long employeeId);

    Page<AttendanceCorrection> findAllByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<AttendanceCorrection> findAllByStatusOrderByCreatedAtDesc(String status);

    @Query("SELECT ac FROM AttendanceCorrection ac " +
            "WHERE (:employeeId IS NULL OR ac.employeeId = :employeeId) " +
            "AND (:status IS NULL OR ac.status = :status) " +
            "ORDER BY ac.createdAt DESC")
    Page<AttendanceCorrection> findCorrectionsWithFilter(
            @Param("employeeId") Long employeeId,
            @Param("status") String status,
            Pageable pageable
    );

    @Query("SELECT ac FROM AttendanceCorrection ac " +
            "WHERE ac.employeeId IN :employeeIds " +
            "AND (:status IS NULL OR ac.status = :status) " +
            "ORDER BY ac.createdAt DESC")
    Page<AttendanceCorrection> findCorrectionsByEmployeeIds(
            @Param("employeeIds") List<Long> employeeIds,
            @Param("status") String status,
            Pageable pageable
    );
}
