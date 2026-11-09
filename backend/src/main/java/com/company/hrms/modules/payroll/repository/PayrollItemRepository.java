package com.company.hrms.modules.payroll.repository;

import com.company.hrms.modules.payroll.domain.PayrollItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PayrollItemRepository extends JpaRepository<PayrollItem, Long> {

    List<PayrollItem> findAllByPayrollId(Long payrollId);

    Optional<PayrollItem> findByPayrollIdAndEmployeeId(Long payrollId, Long employeeId);

    @Query("SELECT pi FROM PayrollItem pi JOIN Payroll p ON pi.payrollId = p.id " +
            "WHERE pi.employeeId = :employeeId AND p.periodMonth = :month AND p.periodYear = :year " +
            "ORDER BY CASE WHEN p.status = 'APPROVED' THEN 0 ELSE 1 END, p.id DESC")
    List<PayrollItem> findEmployeePayslips(
            @Param("employeeId") Long employeeId,
            @Param("month") Integer month,
            @Param("year") Integer year
    );

    @Query("SELECT pi FROM PayrollItem pi JOIN Payroll p ON pi.payrollId = p.id " +
            "WHERE pi.employeeId = :employeeId " +
            "ORDER BY p.periodYear DESC, p.periodMonth DESC")
    List<PayrollItem> findAllPayslipsByEmployeeId(@Param("employeeId") Long employeeId);

    void deleteAllByPayrollId(Long payrollId);
}
