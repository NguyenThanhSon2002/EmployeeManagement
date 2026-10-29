package com.company.hrms.modules.availability.repository;

import com.company.hrms.modules.availability.domain.EmployeeAvailability;
import com.company.hrms.modules.shift.domain.WorkShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeAvailabilityRepository extends JpaRepository<EmployeeAvailability, Long> {

    List<EmployeeAvailability> findAllByEmployeeId(Long employeeId);

    @Query("""
        SELECT ea FROM EmployeeAvailability ea
        JOIN WorkShift ws ON ea.workShiftId = ws.id
        WHERE ea.employeeId = :employeeId
          AND ws.branchId = :branchId
    """)
    List<EmployeeAvailability> findAllByEmployeeIdAndBranchId(@Param("employeeId") Long employeeId, @Param("branchId") Long branchId);

    @Modifying
    @Query("DELETE FROM EmployeeAvailability ea WHERE ea.employeeId = :employeeId")
    void deleteAllByEmployeeId(@Param("employeeId") Long employeeId);

    @Modifying
    @Query("""
        DELETE FROM EmployeeAvailability ea
        WHERE ea.employeeId = :employeeId
          AND ea.workShiftId IN (
              SELECT ws.id FROM WorkShift ws WHERE ws.branchId = :branchId
          )
    """)
    void deleteAllByEmployeeIdAndBranchId(@Param("employeeId") Long employeeId, @Param("branchId") Long branchId);

    @Query("""
        SELECT ea FROM EmployeeAvailability ea
        JOIN Employee e ON ea.employeeId = e.id
        WHERE e.branchId = :branchId
          AND e.isActive = true
          AND e.deletedAt IS NULL
          AND e.employmentStatus != 'RESIGNED'
          AND ea.isAvailable = true
    """)
    List<EmployeeAvailability> findAllActiveByBranchId(@Param("branchId") Long branchId);
}
