package com.company.hrms.modules.branch.repository;

import com.company.hrms.modules.branch.domain.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BranchRepository extends JpaRepository<Branch, Long> {
    List<Branch> findAllByDeletedAtIsNullOrderByBranchNameAsc();
    Optional<Branch> findByIdAndDeletedAtIsNull(Long id);
    boolean existsByBranchCodeAndDeletedAtIsNull(String branchCode);
    List<Branch> findAllByManagerIdAndDeletedAtIsNull(Long managerId);
}
