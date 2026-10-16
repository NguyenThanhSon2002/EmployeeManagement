package com.company.hrms.modules.schedule.repository;

import com.company.hrms.modules.schedule.domain.CompanyHoliday;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyHolidayRepository extends JpaRepository<CompanyHoliday, Long> {

    Optional<CompanyHoliday> findByHolidayDate(LocalDate holidayDate);

    boolean existsByHolidayDate(LocalDate holidayDate);

    List<CompanyHoliday> findAllByHolidayDateBetween(LocalDate startDate, LocalDate endDate);
}
