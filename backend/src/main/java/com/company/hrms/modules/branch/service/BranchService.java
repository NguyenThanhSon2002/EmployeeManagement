package com.company.hrms.modules.branch.service;

import com.company.hrms.common.exception.ResourceConflictException;
import com.company.hrms.common.exception.ResourceNotFoundException;
import com.company.hrms.modules.branch.domain.Branch;
import com.company.hrms.modules.branch.dto.BranchDto;
import com.company.hrms.modules.branch.repository.BranchRepository;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class BranchService {

    private final BranchRepository branchRepository;
    private final EmployeeRepository employeeRepository;

    public BranchService(BranchRepository branchRepository, EmployeeRepository employeeRepository) {
        this.branchRepository = branchRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public List<BranchDto> getAllBranches() {
        return branchRepository.findAllByDeletedAtIsNullOrderByBranchNameAsc().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BranchDto getBranchById(Long id) {
        Branch branch = branchRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh", id));
        return toDto(branch);
    }

    @Transactional
    public BranchDto createBranch(BranchDto request) {
        if (branchRepository.existsByBranchCodeAndDeletedAtIsNull(request.getBranchCode())) {
            throw new ResourceConflictException("Mã chi nhánh đã tồn tại: " + request.getBranchCode());
        }

        Branch branch = new Branch(
                request.getBranchCode(),
                request.getBranchName(),
                request.getAddress(),
                request.getPhoneNumber(),
                request.getManagerId()
        );

        Branch saved = branchRepository.save(branch);
        return toDto(saved);
    }

    @Transactional
    public BranchDto updateBranch(Long id, BranchDto request) {
        Branch branch = branchRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh", id));

        branch.setBranchName(request.getBranchName());
        branch.setAddress(request.getAddress());
        branch.setPhoneNumber(request.getPhoneNumber());
        branch.setManagerId(request.getManagerId());
        if (request.getIsActive() != null) {
            branch.setIsActive(request.getIsActive());
        }

        Branch updated = branchRepository.save(branch);
        return toDto(updated);
    }

    @Transactional
    public void deleteBranch(Long id) {
        Branch branch = branchRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Chi nhánh", id));

        long employeeCount = employeeRepository.countByBranchIdAndDeletedAtIsNull(id);
        if (employeeCount > 0) {
            throw new ResourceConflictException("Không thể xóa chi nhánh vì vẫn còn " + employeeCount 
                    + " nhân sự đang trực thuộc. Vui lòng điều chuyển nhân sự sang cơ sở khác trước khi xóa.");
        }

        branch.softDelete();
        branchRepository.save(branch);
    }

    private BranchDto toDto(Branch branch) {
        return new BranchDto(
                branch.getId(),
                branch.getBranchCode(),
                branch.getBranchName(),
                branch.getAddress(),
                branch.getPhoneNumber(),
                branch.getManagerId(),
                branch.getIsActive(),
                branch.getVersion()
        );
    }
}
