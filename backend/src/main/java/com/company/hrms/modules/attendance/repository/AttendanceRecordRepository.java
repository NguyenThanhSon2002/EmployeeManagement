package com.company.hrms.modules.attendance.repository;

import com.company.hrms.modules.attendance.domain.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    Optional<AttendanceRecord> findByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);

    List<AttendanceRecord> findAllByEmployeeIdAndWorkDateBetween(Long employeeId, LocalDate fromDate, LocalDate toDate);

    List<AttendanceRecord> findAllByWorkDateBetween(LocalDate fromDate, LocalDate toDate);

    List<AttendanceRecord> findAllByWorkDate(LocalDate workDate);

    @Query("SELECT ar FROM AttendanceRecord ar " +
            "WHERE (:employeeId IS NULL OR ar.employeeId = :employeeId) " +
            "AND (:workDate IS NULL OR ar.workDate = :workDate) " +
            "AND (:status IS NULL OR ar.status = :status)")
    Page<AttendanceRecord> findAttendanceWithFilter(
            @Param("employeeId") Long employeeId,
            @Param("workDate") LocalDate workDate,
            @Param("status") String status,
            Pageable pageable
    );
}
