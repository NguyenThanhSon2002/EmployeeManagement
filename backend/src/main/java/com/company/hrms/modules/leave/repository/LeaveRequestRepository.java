package com.company.hrms.modules.leave.repository;

import com.company.hrms.modules.leave.domain.LeaveRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employeeId = :employeeId " +
            "AND lr.status = 'APPROVED' " +
            "AND :date BETWEEN lr.startDate AND lr.endDate")
    List<LeaveRequest> findApprovedLeavesByEmployeeAndDate(
            @Param("employeeId") Long employeeId,
            @Param("date") LocalDate date
    );

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.status = 'APPROVED' " +
            "AND lr.employeeId IN :employeeIds " +
            "AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findApprovedLeavesForEmployeesInDateRange(
            @Param("employeeIds") List<Long> employeeIds,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    Page<LeaveRequest> findAllByEmployeeIdOrderByCreatedAtDesc(Long employeeId, Pageable pageable);

    Page<LeaveRequest> findAllByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.employeeId = :employeeId " +
            "AND (:excludeId IS NULL OR lr.id != :excludeId) " +
            "AND lr.status IN ('SUBMITTED', 'APPROVED') " +
            "AND lr.startDate <= :endDate AND lr.endDate >= :startDate")
    List<LeaveRequest> findOverlappingActiveLeaves(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("excludeId") Long excludeId
    );
}
