package com.company.hrms.modules.shift.repository;

import com.company.hrms.modules.shift.domain.WorkShift;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkShiftRepository extends JpaRepository<WorkShift, Long> {

    Optional<WorkShift> findByIdAndDeletedAtIsNull(Long id);

    Optional<WorkShift> findByShiftCodeAndDeletedAtIsNull(String shiftCode);

    List<WorkShift> findAllByDeletedAtIsNullOrderByStartTimeAsc();

    boolean existsByShiftCodeAndDeletedAtIsNull(String shiftCode);
}
