# Completed Endpoints Implementation

## ✅ 1. Courses
- GET /courses - list all courses
- GET /courses/:id - get course by id ✅ NEW
- POST /courses - create course
- PUT /courses/:id - update course ✅ NEW
- DELETE /courses/:id - soft delete course ✅ NEW

## ✅ 2. Groups
- GET /groups/all - list all groups
- GET /groups/one/students/:groupId - get group students
- GET /groups/:groupId - get group by id
- GET /groups/:groupId/schedules - get schedules
- POST /groups - create group
- POST /groups/:groupId/lesson - create lesson
- GET /groups/:groupId/lesson - get lesson by date
- PUT /groups/:groupId - update group ✅ NEW
- DELETE /groups/:groupId - soft delete group (status -> completed) ✅ NEW

## ✅ 3. Students
- GET /students - list all students (paginated)
- GET /students/:id - get student by id ✅ NEW
- GET /students/my/groups - get my groups
- POST /students - create student
- POST /students/homeworkAnswer/:homeworkId - submit homework
- PUT /students/:id - update student ✅ NEW
- DELETE /students/:id - soft delete student ✅ NEW

## ✅ 4. Teachers
- GET /teachers - list all teachers
- GET /teachers/:id - get teacher by id ✅ NEW
- POST /teachers - create teacher
- PUT /teachers/:id - update teacher ✅ NEW
- DELETE /teachers/:id - soft delete teacher ✅ NEW

## ✅ 5. Rooms
- GET /rooms - list all rooms
- GET /rooms/:id - get room by id ✅ NEW
- POST /rooms - create room
- PUT /rooms/:id - update room ✅ NEW
- DELETE /rooms/:id - soft delete room ✅ NEW

## ✅ 6. Lessons
- GET /lessons - list all lessons
- GET /lessons/:id - get lesson by id ✅ NEW
- GET /lessons/my/group/:groupId - get my group lessons
- POST /lessons - create lesson
- PUT /lessons/:id - update lesson ✅ NEW
- DELETE /lessons/:id - soft delete lesson ✅ NEW

## ✅ 7. Homework
- GET /homework/own/:lessonId - get own homework
- GET /homework/all - list all homework
- GET /homework/:groupId - get group homework
- GET /group/:groupId/homework/:homeworkId/results - get results
- GET /group/:groupId/homework/:homeworkId/result/:studentId - get student result
- POST /homework - create homework
- POST /group/:groupId/homework/:homeworkId/check - check homework
- PUT /homework/:id - update homework ✅ NEW
- DELETE /homework/:id - hard delete homework ✅ NEW

## ✅ 8. Attendance
- GET /attendance/all - list all attendance
- GET /attendance/:id - get by id ✅ NEW
- POST /attendance - create attendance
- PUT /attendance/:id - update attendance ✅ NEW
- DELETE /attendance/:id - hard delete attendance ✅ NEW

## ✅ 9. Users (Admin)
- GET /users/admin/all - list all admins
- GET /users/admin/:id - get admin by id ✅ NEW
- POST /users/admin - create admin
- PUT /users/admin/:id - update admin ✅ NEW
- DELETE /users/admin/:id - soft delete admin ✅ NEW

## ✅ 10. Student-Group
- GET /student-group/all - list all student-group relations
- POST /student-group - add student to group
- DELETE /student-group/:studentId/:groupId - remove student from group ✅ NEW

## ✅ 11. Auth
- POST /auth/login - login
- GET /auth/profile - get current user profile (works for STUDENT, TEACHER, ADMIN, SUPERADMIN) ✅ NEW