package com.company.hrms.modules.position.repository;

import com.company.hrms.modules.position.domain.Position;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PositionRepository extends JpaRepository<Position, Long> {

    List<Position> findAllByDeletedAtIsNullOrderByPositionNameAsc();

    Optional<Position> findByIdAndDeletedAtIsNull(Long id);

    boolean existsByPositionCodeAndDeletedAtIsNull(String positionCode);
}
