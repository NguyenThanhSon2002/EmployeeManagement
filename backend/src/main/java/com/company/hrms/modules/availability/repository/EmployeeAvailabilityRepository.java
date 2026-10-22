package com.company.hrms.modules.availability.repository;

import com.company.hrms.modules.availability.domain.EmployeeAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmployeeAvailabilityRepository extends JpaRepository<EmployeeAvailability, Long> {

    List<EmployeeAvailability> findAllByEmployeeId(Long employeeId);

    @Modifying
    @Query("DELETE FROM EmployeeAvailability ea WHERE ea.employeeId = :employeeId")
    void deleteAllByEmployeeId(@Param("employeeId") Long employeeId);

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
