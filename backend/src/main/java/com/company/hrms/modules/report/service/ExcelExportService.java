package com.company.hrms.modules.report.service;

import com.company.hrms.modules.report.dto.AttendanceSummaryDto;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class ExcelExportService {

    public byte[] exportAttendanceToExcel(List<AttendanceSummaryDto> summaries, int year, int month) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Báo cáo tháng " + month + "-" + year);

            // Title row
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO TỔNG HỢP CÔNG & GIỜ LÀM VIỆC - THÁNG " + month + "/" + year);

            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Header row
            String[] headers = {
                    "STT", "Mã nhân viên", "Họ và tên", "Phòng ban",
                    "Số ngày làm", "Tổng giờ thực tế", "Giờ công chuẩn",
                    "Giờ tăng ca (OT)", "Giờ làm đêm", "Lần đi muộn", "Lần về sớm"
            };

            Row headerRow = sheet.createRow(2);
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Data rows
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            int rowIdx = 3;
            int stt = 1;
            for (AttendanceSummaryDto s : summaries) {
                Row row = sheet.createRow(rowIdx++);

                Cell c0 = row.createCell(0); c0.setCellValue(stt++); c0.setCellStyle(dataStyle);
                Cell c1 = row.createCell(1); c1.setCellValue(s.getEmployeeCode()); c1.setCellStyle(dataStyle);
                Cell c2 = row.createCell(2); c2.setCellValue(s.getFullName()); c2.setCellStyle(dataStyle);
                Cell c3 = row.createCell(3); c3.setCellValue(s.getDepartmentName()); c3.setCellStyle(dataStyle);
                Cell c4 = row.createCell(4); c4.setCellValue(s.getTotalWorkingDays()); c4.setCellStyle(dataStyle);
                Cell c5 = row.createCell(5); c5.setCellValue(s.getTotalActualHours().doubleValue()); c5.setCellStyle(dataStyle);
                Cell c6 = row.createCell(6); c6.setCellValue(s.getTotalRegularHours().doubleValue()); c6.setCellStyle(dataStyle);
                Cell c7 = row.createCell(7); c7.setCellValue(s.getTotalOvertimeHours().doubleValue()); c7.setCellStyle(dataStyle);
                Cell c8 = row.createCell(8); c8.setCellValue(s.getTotalNightHours().doubleValue()); c8.setCellStyle(dataStyle);
                Cell c9 = row.createCell(9); c9.setCellValue(s.getLateCount()); c9.setCellStyle(dataStyle);
                Cell c10 = row.createCell(10); c10.setCellValue(s.getEarlyLeaveCount()); c10.setCellStyle(dataStyle);
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] exportAttendanceToCsv(List<AttendanceSummaryDto> summaries, int year, int month) {
        StringBuilder sb = new StringBuilder();
        // UTF-8 BOM for Excel Vietnamese compatibility
        sb.append("\uFEFF");

        // Header
        sb.append("STT,Mã nhân viên,Họ và tên,Phòng ban,Số ngày làm,Tổng giờ thực tế,Giờ công chuẩn,Giờ tăng ca (OT),Giờ làm đêm,Lần đi muộn,Lần về sớm\n");

        int stt = 1;
        for (AttendanceSummaryDto s : summaries) {
            sb.append(stt++).append(",")
                    .append(escapeCsv(s.getEmployeeCode())).append(",")
                    .append(escapeCsv(s.getFullName())).append(",")
                    .append(escapeCsv(s.getDepartmentName())).append(",")
                    .append(s.getTotalWorkingDays()).append(",")
                    .append(s.getTotalActualHours()).append(",")
                    .append(s.getTotalRegularHours()).append(",")
                    .append(s.getTotalOvertimeHours()).append(",")
                    .append(s.getTotalNightHours()).append(",")
                    .append(s.getLateCount()).append(",")
                    .append(s.getEarlyLeaveCount()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}
