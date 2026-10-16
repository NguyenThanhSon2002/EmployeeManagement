package com.company.hrms.common.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.domain.Page;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class PageResponse<T> {

    private boolean success = true;
    private List<T> data;
    private Map<String, Object> meta;

    public PageResponse() {
        this.success = true;
    }

    public PageResponse(boolean success, List<T> data, Map<String, Object> meta) {
        this.success = success;
        this.data = data;
        this.meta = meta;
    }

    public static class PaginationMeta {
        private int page;
        private int size;
        @JsonProperty("total_elements")
        private long totalElements;
        @JsonProperty("total_pages")
        private int totalPages;
        @JsonProperty("has_next")
        private boolean hasNext;
        @JsonProperty("has_previous")
        private boolean hasPrevious;

        public PaginationMeta() {
        }

        public PaginationMeta(int page, int size, long totalElements, int totalPages, boolean hasNext, boolean hasPrevious) {
            this.page = page;
            this.size = size;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
            this.hasNext = hasNext;
            this.hasPrevious = hasPrevious;
        }

        public int getPage() { return page; }
        public void setPage(int page) { this.page = page; }
        public int getSize() { return size; }
        public void setSize(int size) { this.size = size; }
        public long getTotalElements() { return totalElements; }
        public void setTotalElements(long totalElements) { this.totalElements = totalElements; }
        public int getTotalPages() { return totalPages; }
        public void setTotalPages(int totalPages) { this.totalPages = totalPages; }
        public boolean isHasNext() { return hasNext; }
        public void setHasNext(boolean hasNext) { this.hasNext = hasNext; }
        public boolean isHasPrevious() { return hasPrevious; }
        public void setHasPrevious(boolean hasPrevious) { this.hasPrevious = hasPrevious; }
    }

    public static <T> PageResponse<T> from(Page<T> page) {
        PaginationMeta pagination = new PaginationMeta(
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.hasNext(),
                page.hasPrevious()
        );

        Map<String, Object> meta = new HashMap<>();
        meta.put("pagination", pagination);
        meta.put("timestamp", Instant.now().toString());

        return new PageResponse<>(true, page.getContent(), meta);
    }

    public static <T> PageResponse<T> of(Page<T> page) {
        return from(page);
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public List<T> getData() { return data; }
    public void setData(List<T> data) { this.data = data; }
    public Map<String, Object> getMeta() { return meta; }
    public void setMeta(Map<String, Object> meta) { this.meta = meta; }
}
