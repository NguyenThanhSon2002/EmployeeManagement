package com.company.hrms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.TimeZone;

@SpringBootApplication
@EnableJpaAuditing(auditorAwareRef = "springSecurityAuditorAware")
public class HrmsApplication {

    public static void main(String[] args) {
        // Set standard default timezone to UTC for the application JVM
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(HrmsApplication.class, args);
    }
}
