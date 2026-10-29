package com.company.hrms.modules.employee.repository;

import com.company.hrms.modules.employee.domain.Employee;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByIdAndDeletedAtIsNull(Long id);

    Optional<Employee> findByEmployeeCodeAndDeletedAtIsNull(String employeeCode);

    Optional<Employee> findByUserIdAndDeletedAtIsNull(Long userId);

    boolean existsByEmployeeCodeAndDeletedAtIsNull(String employeeCode);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    boolean existsByPhoneNumberAndDeletedAtIsNull(String phoneNumber);

    @Query("SELECT e.employeeCode FROM Employee e WHERE e.employeeCode LIKE 'EMP-%'")
    List<String> findAllEmpCodes();

    List<Employee> findAllByBranchIdAndDeletedAtIsNull(Long branchId);

    List<Employee> findAllByDeletedAtIsNull();

    long countByBranchIdAndDeletedAtIsNull(Long branchId);

    @Query("SELECT e FROM Employee e WHERE e.deletedAt IS NULL " +
            "AND (:branchId IS NULL OR e.branchId = :branchId) " +
            "AND (:status IS NULL OR e.employmentStatus = :status) " +
            "AND (:keyword IS NULL OR LOWER(e.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(e.employeeCode) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "     OR LOWER(e.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Employee> findEmployeesWithFilter(
            @Param("branchId") Long branchId,
            @Param("status") String status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
