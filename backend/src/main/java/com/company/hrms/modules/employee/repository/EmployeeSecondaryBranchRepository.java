package com.company.hrms.modules.employee.repository;

import com.company.hrms.modules.employee.domain.EmployeeSecondaryBranch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface EmployeeSecondaryBranchRepository extends JpaRepository<EmployeeSecondaryBranch, Long> {

    List<EmployeeSecondaryBranch> findAllByBranchId(Long branchId);

    List<EmployeeSecondaryBranch> findAllByEmployeeId(Long employeeId);

    List<EmployeeSecondaryBranch> findAllByEmployeeIdIn(List<Long> employeeIds);

    boolean existsByEmployeeIdAndBranchId(Long employeeId, Long branchId);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmployeeSecondaryBranch e WHERE e.employeeId = :employeeId")
    void deleteAllByEmployeeId(@Param("employeeId") Long employeeId);
}
