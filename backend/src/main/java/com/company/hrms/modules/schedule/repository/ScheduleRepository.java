package com.company.hrms.modules.schedule.repository;

import com.company.hrms.modules.schedule.domain.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    Optional<Schedule> findByBranchIdAndStartDate(Long branchId, LocalDate startDate);

    boolean existsByBranchIdAndStartDate(Long branchId, LocalDate startDate);
}
