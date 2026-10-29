package com.company.hrms.modules.swap.repository;

import com.company.hrms.modules.swap.domain.ShiftSwapRequest;
import com.company.hrms.modules.swap.domain.SwapStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShiftSwapRequestRepository extends JpaRepository<ShiftSwapRequest, Long> {

    Optional<ShiftSwapRequest> findByRequestCode(String requestCode);

    @Query("SELECT r FROM ShiftSwapRequest r WHERE r.requesterId = :empId OR r.targetId = :empId ORDER BY r.createdAt DESC")
    List<ShiftSwapRequest> findAllByEmployeeId(@Param("empId") Long empId);

    @Query("SELECT r FROM ShiftSwapRequest r WHERE r.branchId = :branchId AND r.status = :status ORDER BY r.createdAt ASC")
    List<ShiftSwapRequest> findByBranchIdAndStatus(@Param("branchId") Long branchId, @Param("status") SwapStatus status);

    @Query("SELECT r FROM ShiftSwapRequest r WHERE r.branchId = :branchId ORDER BY r.createdAt DESC")
    List<ShiftSwapRequest> findByBranchId(@Param("branchId") Long branchId);

    long countByBranchIdAndStatus(Long branchId, SwapStatus status);

    boolean existsByRequesterAssignmentIdAndStatusIn(Long requesterAssignmentId, List<SwapStatus> statuses);

    boolean existsByTargetAssignmentIdAndStatusIn(Long targetAssignmentId, List<SwapStatus> statuses);
}
