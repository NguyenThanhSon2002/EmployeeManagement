package com.company.hrms.modules.schedule.repository;

import com.company.hrms.modules.schedule.domain.ScheduleChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleChangeHistoryRepository extends JpaRepository<ScheduleChangeHistory, Long> {

    List<ScheduleChangeHistory> findAllByScheduleIdOrderByCreatedAtDesc(Long scheduleId);
}
