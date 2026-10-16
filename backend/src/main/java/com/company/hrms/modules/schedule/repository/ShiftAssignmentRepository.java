package com.company.hrms.modules.schedule.repository;

import com.company.hrms.modules.schedule.domain.ShiftAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ShiftAssignmentRepository extends JpaRepository<ShiftAssignment, Long> {

    List<ShiftAssignment> findAllByScheduleId(Long scheduleId);

    List<ShiftAssignment> findAllByScheduleIdAndWorkDate(Long scheduleId, LocalDate workDate);

    List<ShiftAssignment> findAllByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);

    List<ShiftAssignment> findAllByEmployeeIdAndWorkDateBetween(Long employeeId, LocalDate startDate, LocalDate endDate);

    List<ShiftAssignment> findAllByEmployeeIdInAndWorkDateBetween(List<Long> employeeIds, LocalDate startDate, LocalDate endDate);

    @Query("SELECT a FROM ShiftAssignment a WHERE a.employeeId = :employeeId " +
            "AND (:excludeId IS NULL OR a.id != :excludeId) " +
            "AND a.status != 'CANCELLED' " +
            "AND a.plannedStartTime < :plannedEnd AND a.plannedEndTime > :plannedStart")
    List<ShiftAssignment> findOverlappingAssignments(
            @Param("employeeId") Long employeeId,
            @Param("plannedStart") LocalDateTime plannedStart,
            @Param("plannedEnd") LocalDateTime plannedEnd,
            @Param("excludeId") Long excludeId
    );

    @Query("SELECT a FROM ShiftAssignment a WHERE a.scheduleId = :scheduleId " +
            "AND a.workShiftId = :workShiftId " +
            "AND a.workDate = :workDate " +
            "AND a.status != 'CANCELLED'")
    List<ShiftAssignment> findAssignmentsByShiftAndDate(
            @Param("scheduleId") Long scheduleId,
            @Param("workShiftId") Long workShiftId,
            @Param("workDate") LocalDate workDate
    );

    void deleteAllByScheduleId(Long scheduleId);
}
