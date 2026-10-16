package com.company.hrms.modules.setting.service;

import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.setting.domain.SystemSetting;
import com.company.hrms.modules.setting.dto.SystemSettingDto;
import com.company.hrms.modules.setting.dto.UpdateSettingRequest;
import com.company.hrms.modules.setting.repository.SystemSettingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SystemSettingService {

    private final SystemSettingRepository settingRepository;

    public SystemSettingService(SystemSettingRepository settingRepository) {
        this.settingRepository = settingRepository;
    }

    @Transactional(readOnly = true)
    public List<SystemSettingDto> getAllSettings() {
        return settingRepository.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SystemSettingDto getSettingByKey(String key) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Tham số hệ thống", key));
        return toDto(setting);
    }

    @Transactional
    public SystemSettingDto updateSetting(String key, UpdateSettingRequest request, Long updatedByUserId) {
        SystemSetting setting = settingRepository.findBySettingKey(key)
                .orElseThrow(() -> new ResourceNotFoundException("Tham số hệ thống", key));

        setting.setSettingValue(request.getSettingValue());
        setting.setUpdatedBy(updatedByUserId);
        setting.setUpdatedAt(LocalDateTime.now());

        SystemSetting saved = settingRepository.save(setting);
        return toDto(saved);
    }

    public SystemSettingDto toDto(SystemSetting s) {
        return new SystemSettingDto(
                s.getId(),
                s.getSettingKey(),
                s.getSettingValue(),
                s.getDataType(),
                s.getDescription()
        );
    }
}
