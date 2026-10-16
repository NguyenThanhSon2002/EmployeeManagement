package com.company.hrms.modules.schedule.domain;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "company_holidays")
public class CompanyHoliday {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "holiday_date", nullable = false, unique = true)
    private LocalDate holidayDate;

    @Column(name = "holiday_name", nullable = false, length = 150)
    private String holidayName;

    @Column(name = "is_recurring", nullable = false)
    private Boolean isRecurring = false;

    @Column(name = "is_paid", nullable = false)
    private Boolean isPaid = true;

    public CompanyHoliday() {
    }

    public CompanyHoliday(LocalDate holidayDate, String holidayName, Boolean isRecurring, Boolean isPaid) {
        this.holidayDate = holidayDate;
        this.holidayName = holidayName;
        this.isRecurring = isRecurring != null ? isRecurring : false;
        this.isPaid = isPaid != null ? isPaid : true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public LocalDate getHolidayDate() { return holidayDate; }
    public void setHolidayDate(LocalDate holidayDate) { this.holidayDate = holidayDate; }
    public String getHolidayName() { return holidayName; }
    public void setHolidayName(String holidayName) { this.holidayName = holidayName; }
    public Boolean getIsRecurring() { return isRecurring; }
    public void setIsRecurring(Boolean recurring) { isRecurring = recurring; }
    public Boolean getIsPaid() { return isPaid; }
    public void setIsPaid(Boolean paid) { isPaid = paid; }
}
