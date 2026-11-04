package com.company.hrms.modules.schedule.repository;

import com.company.hrms.modules.schedule.domain.Schedule;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    Optional<Schedule> findByBranchIdAndStartDate(Long branchId, LocalDate startDate);

    boolean existsByBranchIdAndStartDate(Long branchId, LocalDate startDate);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Schedule s WHERE s.id = :id")
    Optional<Schedule> findByIdForUpdate(@Param("id") Long id);
}
