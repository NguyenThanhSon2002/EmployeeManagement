package com.company.hrms.security.service;

import com.company.hrms.modules.auth.domain.User;
import com.company.hrms.modules.auth.repository.UserRepository;
import com.company.hrms.modules.employee.domain.Employee;
import com.company.hrms.modules.employee.repository.EmployeeRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;

    public CustomUserDetailsService(UserRepository userRepository, EmployeeRepository employeeRepository) {
        this.userRepository = userRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String rawUsername) throws UsernameNotFoundException {
        if (rawUsername == null || rawUsername.isBlank()) {
            throw new UsernameNotFoundException("Tên tài khoản không được để trống");
        }
        String cleanUsername = rawUsername.trim();

        // 1. Exact username or email lookup
        java.util.Optional<User> userOpt = userRepository.findByUsername(cleanUsername)
                .or(() -> userRepository.findByEmail(cleanUsername));

        // 2. Flexible normalization for employee codes (e.g. emp003, emp-003, emp3 -> EMP-003)
        if (userOpt.isEmpty()) {
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?i)^EMP[-_]?(\\d+)$").matcher(cleanUsername);
            if (matcher.matches()) {
                try {
                    int num = Integer.parseInt(matcher.group(1));
                    String normalizedCode = String.format("EMP-%03d", num);
                    userOpt = userRepository.findByUsername(normalizedCode)
                            .or(() -> userRepository.findByEmail(normalizedCode.toLowerCase() + "@company.com"));
                } catch (NumberFormatException ignored) {
                }
            }
        }

        User user = userOpt.orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với tài khoản/email: " + cleanUsername));

        Long employeeId = employeeRepository.findByUserIdAndDeletedAtIsNull(user.getId())
                .map(Employee::getId)
                .orElse(null);

        return UserPrincipal.create(user, employeeId);
    }
}
