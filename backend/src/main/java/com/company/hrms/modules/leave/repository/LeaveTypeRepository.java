package com.company.hrms.modules.leave.repository;

import com.company.hrms.modules.leave.domain.LeaveType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LeaveTypeRepository extends JpaRepository<LeaveType, Long> {

    List<LeaveType> findAllByIsActiveTrue();

    Optional<LeaveType> findByTypeCode(String typeCode);
}
