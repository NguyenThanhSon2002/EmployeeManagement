package com.company.hrms.modules.schedule.repository;

import com.company.hrms.modules.schedule.domain.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    Optional<Schedule> findByDepartmentIdAndStartDate(Long departmentId, LocalDate startDate);

    boolean existsByDepartmentIdAndStartDate(Long departmentId, LocalDate startDate);
}
