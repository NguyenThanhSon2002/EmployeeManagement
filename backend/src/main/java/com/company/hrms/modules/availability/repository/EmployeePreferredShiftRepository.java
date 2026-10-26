package com.company.hrms.modules.availability.repository;

import com.company.hrms.modules.availability.domain.EmployeePreferredShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeePreferredShiftRepository extends JpaRepository<EmployeePreferredShift, Long> {

    List<EmployeePreferredShift> findAllByEmployeeId(Long employeeId);

    @Modifying
    @Query("DELETE FROM EmployeePreferredShift eps WHERE eps.employeeId = :employeeId")
    void deleteAllByEmployeeId(@Param("employeeId") Long employeeId);

    @Query("""
        SELECT eps FROM EmployeePreferredShift eps
        JOIN Employee e ON eps.employeeId = e.id
        WHERE e.branchId = :branchId
          AND e.isActive = true
          AND e.deletedAt IS NULL
          AND e.employmentStatus != 'RESIGNED'
    """)
    List<EmployeePreferredShift> findAllActiveByBranchId(@Param("branchId") Long branchId);
}
