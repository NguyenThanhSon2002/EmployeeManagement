package com.company.hrms.modules.payroll.repository;

import com.company.hrms.modules.payroll.domain.Payroll;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollRepository extends JpaRepository<Payroll, Long> {

    @Query("SELECT p FROM Payroll p WHERE p.periodMonth = :month AND p.periodYear = :year " +
            "AND ((:branchId IS NULL AND p.branchId IS NULL) OR p.branchId = :branchId)")
    Optional<Payroll> findByPeriodAndBranch(
            @Param("month") Integer month,
            @Param("year") Integer year,
            @Param("branchId") Long branchId
    );

    @Query("SELECT p FROM Payroll p WHERE (:year IS NULL OR p.periodYear = :year) " +
            "AND (:branchId IS NULL OR p.branchId = :branchId) " +
            "ORDER BY p.periodYear DESC, p.periodMonth DESC")
    List<Payroll> findPayrolls(
            @Param("year") Integer year,
            @Param("branchId") Long branchId
    );
}
