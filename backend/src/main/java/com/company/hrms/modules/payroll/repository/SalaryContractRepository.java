package com.company.hrms.modules.payroll.repository;

import com.company.hrms.modules.payroll.domain.SalaryContract;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SalaryContractRepository extends JpaRepository<SalaryContract, Long> {

    Optional<SalaryContract> findByEmployeeIdAndIsActiveTrue(Long employeeId);

    @Query("SELECT sc FROM SalaryContract sc WHERE sc.employeeId = :employeeId " +
            "AND sc.effectiveFrom <= :targetDate " +
            "AND (sc.effectiveTo IS NULL OR sc.effectiveTo >= :targetDate) " +
            "AND sc.isActive = true AND sc.deletedAt IS NULL " +
            "ORDER BY sc.effectiveFrom DESC")
    List<SalaryContract> findActiveContractByDate(
            @Param("employeeId") Long employeeId,
            @Param("targetDate") LocalDate targetDate
    );

    List<SalaryContract> findAllByEmployeeIdInAndIsActiveTrue(List<Long> employeeIds);
}
