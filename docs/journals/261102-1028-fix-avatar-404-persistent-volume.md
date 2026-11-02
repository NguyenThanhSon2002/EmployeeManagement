# Journal: Fix Avatar 404 Error by Mounting Persistent Uploads Volume in Docker

**Date & Time:** 2026-11-02 10:28:00 +07:00  
**Author:** AI Assistant  
**Topic:** Docker Deployment, Static File Serving, File Upload Persistence  

## 1. Problem Statement
When accessing `http://172.16.103.64:8082/employees`, the browser console logged a `404 Not Found` error:
`GET http://172.16.103.64:8082/uploads/avatars/avatar_emp_1_1793262472831_cea3f6e4.jpg 404 (Not Found)`
Avatar for employee `EMP-001` (Nguyễn Thu Phương) could not be rendered.

## 2. Root Cause Analysis
1. In the database, employee `EMP-001` has `avatar_url: "/uploads/avatars/avatar_emp_1_1793262472831_cea3f6e4.jpg"`.
2. This image was previously uploaded to host filesystem at `D:\Project\Employee Management\backend\uploads\avatars\`.
3. In `docker-compose.yml`, the `hrms-backend` container had no volume mounted for `/app/uploads`.
4. Spring Boot defaults to `app.upload.dir: uploads` (resolving to `/app/uploads`), which was empty inside the ephemeral container file system.
5. `frontend/nginx.conf` properly proxied `/uploads/` to `http://backend:8080/uploads/`, but the backend responded with HTTP `404` because the file was missing in `/app/uploads`.

## 3. Solution Applied
Updated [docker-compose.yml](file:///D:/Project/Employee%20Management/docker-compose.yml) to mount the host upload directory into the backend container:
```yaml
    volumes:
      - ./backend/uploads:/app/uploads
```
Recreated container with `docker compose up -d backend`.

## 4. Verification & Results
- Verified `/app/uploads/avatars/avatar_emp_1_1793262472831_cea3f6e4.jpg` is mounted inside container (`18,989` bytes).
- Tested HTTP GET on `http://localhost:8081/uploads/avatars/...`: HTTP `200 OK`, `image/jpeg`.
- Tested HTTP GET on `http://localhost:8082/uploads/avatars/...`: HTTP `200 OK`, `image/jpeg`.
- Tested HTTP GET on `http://172.16.103.64:8082/uploads/avatars/...`: HTTP `200 OK`, `image/jpeg`.
- All avatars (past and newly uploaded) are now permanently persisted on the host disk and survived across container restarts and rebuilds.
