import { Switch, Route, Redirect } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import HomePage from "@/pages/home-page";
import { ProtectedRoute } from "./lib/protected-route";

// Student Pages
import StudentDashboard from "@/pages/student/dashboard";
import StudentCourses from "@/pages/student/courses";
import StudentCourseDetail from "@/pages/student/course-detail";
import StudentTests from "@/pages/student/tests";
import StudentTestAttempt from "@/pages/student/test-attempt";
import StudentTestResult from "@/pages/student/test-result";
import StudentDoubts from "@/pages/student/doubts";
import StudentProfile from "@/pages/student/profile";
import AvailableCourses from "@/pages/student/available-courses";

// Admin Pages
import AdminDashboard from "@/pages/admin/dashboard";
import ManageCourses from "@/pages/admin/manage-courses";
import ManageTests from "@/pages/admin/manage-tests";
import TestCreator from "@/pages/admin/test-creator";
import QuestionManager from "@/pages/admin/question-manager";
import ManageStudents from "@/pages/admin/manage-students";
import ManageEnrollments from "@/pages/admin/manage-enrollments";
import EnrollmentRequests from "@/pages/admin/enrollment-requests";
import SessionSchedule from "@/pages/admin/session-schedule";
import Analytics from "@/pages/admin/analytics";
import AnalyticsDashboard from "@/pages/admin/analytics-dashboard";
import SiteConfigPage from "@/pages/admin/site-config";
import PromotionsPage from "@/pages/admin/promotions";

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/login">
          <Redirect to="/auth" />
        </Route>
        <Route path="/register">
          <Redirect to="/auth" />
        </Route>

        {/* Student Routes */}
        <Route path="/student/dashboard">
          <ProtectedRoute
            path="/student/dashboard"
            component={StudentDashboard}
            roles={["student"]}
          />
        </Route>
        <Route path="/student/courses">
          <ProtectedRoute
            path="/student/courses"
            component={StudentCourses}
            roles={["student"]}
          />
        </Route>
        <Route path="/student/courses/:id">
          <ProtectedRoute
            path="/student/courses/:id"
            component={StudentCourseDetail}
            roles={["student"]}
          />
        </Route>
        <Route path="/student/tests">
          <ProtectedRoute
            path="/student/tests"
            component={StudentTests}
            roles={["student"]}
          />
        </Route>
        <Route path="/student/test-attempt">
          <ProtectedRoute
            path="/student/test-attempt"
            component={StudentTestAttempt}
            roles={["student"]}
          />
        </Route>
        <Route path="/student/tests/result/:attemptId">
          <ProtectedRoute
            path="/student/tests/result/:attemptId"
            component={StudentTestResult}
            roles={["student"]}
          />
        </Route>
        <Route path="/student/doubts">
          <ProtectedRoute
            path="/student/doubts"
            component={StudentDoubts}
            roles={["student"]}
          />
        </Route>
        <Route path="/student/profile">
          <ProtectedRoute
            path="/student/profile"
            component={StudentProfile}
            roles={["student"]}
          />
        </Route>
        <Route path="/student/available-courses">
          <ProtectedRoute
            path="/student/available-courses"
            component={AvailableCourses}
            roles={["student"]}
          />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/dashboard">
          <ProtectedRoute
            path="/admin/dashboard"
            component={AdminDashboard}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/manage-courses">
          <ProtectedRoute
            path="/admin/manage-courses"
            component={ManageCourses}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/manage-tests">
          <ProtectedRoute
            path="/admin/manage-tests"
            component={ManageTests}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/test-creator">
          <ProtectedRoute
            path="/admin/test-creator"
            component={TestCreator}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/test-creator/:id">
          <ProtectedRoute
            path="/admin/test-creator/:id"
            component={TestCreator}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/tests/:id/questions">
          <ProtectedRoute
            path="/admin/tests/:id/questions"
            component={QuestionManager}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/manage-students">
          <ProtectedRoute
            path="/admin/manage-students"
            component={ManageStudents}
            roles={["admin"]}
          />
        </Route>
        <Route path="/admin/manage-enrollments">
          <ProtectedRoute
            path="/admin/manage-enrollments"
            component={ManageEnrollments}
            roles={["admin"]}
          />
        </Route>
        <Route path="/admin/enrollment-requests">
          <ProtectedRoute
            path="/admin/enrollment-requests"
            component={EnrollmentRequests}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/session-schedule">
          <ProtectedRoute
            path="/admin/session-schedule"
            component={SessionSchedule}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/analytics">
          <ProtectedRoute
            path="/admin/analytics"
            component={Analytics}
            roles={["admin", "teacher"]}
          />
        </Route>
        <Route path="/admin/analytics-dashboard">
          <ProtectedRoute
            path="/admin/analytics-dashboard"
            component={AnalyticsDashboard}
            roles={["admin"]}
          />
        </Route>
        <Route path="/admin/site-config">
          <ProtectedRoute
            path="/admin/site-config"
            component={SiteConfigPage}
            roles={["admin"]}
          />
        </Route>
        <Route path="/admin/promotions">
          <ProtectedRoute
            path="/admin/promotions"
            component={PromotionsPage}
            roles={["admin"]}
          />
        </Route>

        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
