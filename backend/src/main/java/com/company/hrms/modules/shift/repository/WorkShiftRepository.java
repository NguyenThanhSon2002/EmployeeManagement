package com.company.hrms.modules.shift.repository;

import com.company.hrms.modules.shift.domain.WorkShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkShiftRepository extends JpaRepository<WorkShift, Long> {

    Optional<WorkShift> findByIdAndDeletedAtIsNull(Long id);

    Optional<WorkShift> findByShiftCodeAndDeletedAtIsNull(String shiftCode);

    List<WorkShift> findAllByDeletedAtIsNullOrderByStartTimeAsc();

    @Query("SELECT w FROM WorkShift w WHERE w.deletedAt IS NULL AND (w.branchId IS NULL OR w.branchId = :branchId) ORDER BY w.startTime ASC")
    List<WorkShift> findAllActiveByBranchIdOrGlobal(@Param("branchId") Long branchId);

    @Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END FROM WorkShift w " +
           "WHERE w.shiftCode = :shiftCode AND w.deletedAt IS NULL " +
           "AND ((:branchId IS NULL AND w.branchId IS NULL) OR w.branchId = :branchId)")
    boolean existsByShiftCodeAndBranchIdAndDeletedAtIsNull(
            @Param("shiftCode") String shiftCode,
            @Param("branchId") Long branchId);

    boolean existsByShiftCodeAndDeletedAtIsNull(String shiftCode);
}

