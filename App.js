const fs = require("fs");

// Read students.json safely
let students = [];
try {
    students = JSON.parse(fs.readFileSync("students.json", "utf8"));
} catch (err) {
    console.error("Error reading or parsing students.json:", err.message);
    process.exit(1);
}

// 1. Get average grade
function getAverageGrade(student) {
    if (!student?.grades || student.grades.length === 0) {
        return 0;
    }

    return student.grades.reduce((sum, grade) => sum + grade, 0) / student.grades.length;
}

// 2. Get top students
function getTopStudents(studentsList, n) {
    if (n < 0) {
        throw new Error("Number of students cannot be negative.");
    }

    return studentsList
        .map(student => ({
            ...student,
            averageGrade: getAverageGrade(student)
        }))
        .sort((a, b) => b.averageGrade - a.averageGrade)
        .slice(0, n);
}

// 3. Group students by course
function groupByCourse(studentsList) {
    // Native Object.groupBy fallback for Node < 21
    if (Object.groupBy) {
        return Object.groupBy(studentsList, student => student.course || "Unassigned");
    }

    return studentsList.reduce((groups, student) => {
        const course = student.course || "Unassigned";
        groups[course] = groups[course] || [];
        groups[course].push({ ...student });
        return groups;
    }, {});
}

// 4. Get enrolled count
function getEnrolledCount(studentsList) {
    return studentsList.reduce(
        (count, student) => {
            student.enrolled ? count.enrolled++ : count.notEnrolled++;
            return count;
        },
        { enrolled: 0, notEnrolled: 0 }
    );
}

// 5. Find student by name
function findStudent(studentsList, name) {
    if (!name) return null;
    const student = studentsList.find(
        s => s.name?.toLowerCase() === name.toLowerCase()
    );

    return student ? { ...student } : null;
}

// 6. Get course averages
function getCourseAverages(studentsList) {
    const grouped = groupByCourse(studentsList);

    return Object.entries(grouped)
        .map(([course, courseStudents]) => {
            const studentAverages = courseStudents.map(student => getAverageGrade(student));

            const averageGrade = studentAverages.length > 0
                ? studentAverages.reduce((sum, avg) => sum + avg, 0) / studentAverages.length
                : 0;

            return {
                course,
                averageGrade
            };
        })
        .sort((a, b) => b.averageGrade - a.averageGrade);
}

// 7. Export summary
function exportSummary(studentsList) {
    const allGrades = studentsList.flatMap(student => student.grades || []);

    const overallAverage = allGrades.length > 0
        ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length
        : 0;

    const topStudents = getTopStudents(studentsList, 1);

    return {
        totalStudents: studentsList.length,
        overallAverage: Number(overallAverage.toFixed(2)),
        topPerformingStudent: topStudents.length > 0 ? topStudents[0] : null,
        breakdownByCourse: getCourseAverages(studentsList)
    };
}

// MAIN FUNCTION
function main() {
    console.log("====================================");
    console.log("        STUDENT RECORDS REPORT");
    console.log("====================================");

    console.log("\nTotal Students:", students.length);

    const summary = exportSummary(students);
    console.log("\nOverall Average Grade:", summary.overallAverage);

    const enrolled = getEnrolledCount(students);
    console.log("\nEnrollment:");
    console.log("Enrolled:", enrolled.enrolled);
    console.log("Not Enrolled:", enrolled.notEnrolled);

    console.log("\nTop Performing Students:");
    const topStudents = getTopStudents(students, 3);
    topStudents.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} - ${student.averageGrade.toFixed(2)}`);
    });

    console.log("\nAverage Grade by Course:");
    const courseAverages = getCourseAverages(students);
    courseAverages.forEach(course => {
        console.log(`${course.course}: ${course.averageGrade.toFixed(2)}`);
    });

    console.log("\nComplete Summary:");
    console.log(JSON.stringify(summary, null, 2));

    fs.writeFileSync("report.json", JSON.stringify(summary, null, 2));
    console.log("\nReport saved as report.json");
}

main();