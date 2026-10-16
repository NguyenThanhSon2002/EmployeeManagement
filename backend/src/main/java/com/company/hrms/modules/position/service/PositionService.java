package com.company.hrms.modules.position.service;

import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.position.domain.Position;
import com.company.hrms.modules.position.dto.PositionDto;
import com.company.hrms.modules.position.repository.PositionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PositionService {

    private final PositionRepository positionRepository;

    public PositionService(PositionRepository positionRepository) {
        this.positionRepository = positionRepository;
    }

    @Transactional(readOnly = true)
    public List<PositionDto> getAllPositions() {
        return positionRepository.findAllByDeletedAtIsNullOrderByPositionNameAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PositionDto getPositionById(Long id) {
        Position position = positionRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chức danh", id));
        return toDto(position);
    }

    @Transactional
    public PositionDto createPosition(PositionDto request) {
        if (positionRepository.existsByPositionCodeAndDeletedAtIsNull(request.getPositionCode())) {
            throw new ResourceConflictException("Mã chức danh đã tồn tại: " + request.getPositionCode());
        }

        Position position = new Position(
                request.getPositionCode(),
                request.getPositionName(),
                request.getDescription()
        );

        Position saved = positionRepository.save(position);
        return toDto(saved);
    }

    @Transactional
    public PositionDto updatePosition(Long id, PositionDto request) {
        Position position = positionRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chức danh", id));

        position.setPositionName(request.getPositionName());
        position.setDescription(request.getDescription());
        if (request.getIsActive() != null) {
            position.setIsActive(request.getIsActive());
        }

        Position updated = positionRepository.save(position);
        return toDto(updated);
    }

    @Transactional
    public void deletePosition(Long id) {
        Position position = positionRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chức danh", id));
        position.setIsActive(false);
        position.setDeletedAt(LocalDateTime.now());
        positionRepository.save(position);
    }

    public PositionDto toDto(Position position) {
        return new PositionDto(
                position.getId(),
                position.getPositionCode(),
                position.getPositionName(),
                position.getDescription(),
                position.getIsActive()
        );
    }
}
