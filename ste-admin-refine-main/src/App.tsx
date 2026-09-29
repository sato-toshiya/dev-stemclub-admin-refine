import {
  Authenticated,
  I18nProvider,
  Refine,
  type OpenNotificationParams,
} from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  AuthPage,
  ErrorComponent,
  ThemedLayout,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerProvider, {
  // CatchAllNavigate,
  DocumentTitleHandler,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { App as AntdApp } from "antd";
import { useMemo } from "react";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import { accessControlProvider } from "./provider/accessControlProvider";
import { authProvider, axiosInstance } from "./provider/authProvider";
import { Header } from "./components/header";
import { CustomSider } from "./components/sider";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { StrapiV5DataProvider } from "./strapiV5DataProvider";

import { AcademicYearList, AcademicYearUpsert } from "./pages/academic-years";
import { ClassList, ClassUpsert } from "./pages/classes";
import { SchoolAdminList } from "./pages/school-admins";
import { TeacherList, TeacherUpsert } from "./pages/teachers";
import { RouteGuard } from "./components/RouteGuard";
import { StudentList, StudentUpsert } from "./pages/students";
import { AuthStateProvider } from "./provider/AuthStateProvider";
import { WorkManagement } from "./pages/works";
import { API_URL_WITH_API } from "./config/api";
import { Viewer } from "./pages/viewer/[token]";
import { SchoolAdminUpsert } from "./pages/school-admins/upsert";
import { LoginPage } from "./pages/login";
import i18n from "./i18n";
import PrivacyPolicyPage from "./pages/privacy-policy/PrivacyPolicyPage";
import HelpPage from "./pages/help/HelpPage";

const extractNotificationText = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    const obj = value as { message?: unknown; error?: unknown };
    if (typeof obj.message === "string") return obj.message.trim();
    if (typeof obj.error === "string") return obj.error.trim();
  }
  return "";
};

const useAppNotificationProvider = () => {
  const defaultNotificationProvider = useNotificationProvider();

  return useMemo(() => {
    return {
      ...defaultNotificationProvider,
      open: (params: OpenNotificationParams) => {
        if (params?.type === "error") {
          const backendMessage =
            extractNotificationText(params.description) ||
            extractNotificationText(params.message);

          return defaultNotificationProvider.open({
            ...params,
            message: backendMessage || "エラーが発生しました。",
            description: undefined,
          });
        }

        return defaultNotificationProvider.open(params);
      },
    };
  }, [defaultNotificationProvider]);
};

function App() {
  const i18nProvider: I18nProvider = {
    translate: (key, params, defaultMessage) => {
      const patchedParams =
        params && typeof params === "object"
          ? {
              ...params,
              resource:
                typeof params.resource === "string" &&
                i18n.exists(params.resource)
                  ? i18n.t(params.resource)
                  : params.resource,
            }
          : params;

      const res = i18n.t(key, {
        ...patchedParams,
        defaultValue: defaultMessage ?? key,
      });

      return typeof res === "string" ? res : String(res);
    },
    changeLocale: (lang) => i18n.changeLanguage(lang),
    getLocale: () => i18n.language,
  };

  return (
    <BrowserRouter>
      <AuthStateProvider>
        <RefineKbarProvider>
          <ColorModeContextProvider>
            <AntdApp>
              <DevtoolsProvider>
                <Refine
                  authProvider={authProvider}
                  dataProvider={StrapiV5DataProvider(
                    API_URL_WITH_API,
                    axiosInstance,
                  )}
                  i18nProvider={i18nProvider}
                  accessControlProvider={accessControlProvider}
                  notificationProvider={useAppNotificationProvider}
                  routerProvider={routerProvider}
                  resources={[
                    {
                      name: "school-admins",
                      meta: {
                        canDelete: true,
                        label: "法人管理",
                      },
                      list: "/school-admins",
                      create: "/school-admins/create",
                      edit: "/school-admins/edit/:id",
                      show: "/school-admins/show/:id",
                    },
                    {
                      name: "academic-years",
                      list: "/academic-years",
                      create: "/academic-years/create",
                      edit: "/academic-years/edit/:id",
                      meta: {
                        canDelete: false,
                        label: "年度一覧",
                      },
                    },
                    {
                      name: "teachers",
                      meta: {
                        canDelete: true,
                        label: "教師管理",
                      },
                      list: "/teachers",
                      create: "/teachers/create",
                      edit: "/teachers/edit/:id",
                      show: "/teachers/show/:id",
                    },
                    {
                      name: "students",
                      meta: {
                        canDelete: true,
                        label: "生徒管理",
                      },
                      list: "/students",
                      create: "/students/create",
                      edit: "/students/edit/:id",
                      show: "/students/show/:id",
                    },
                    {
                      name: "works",
                      meta: { canDelete: true, label: "作品管理" },
                      list: "/works",
                    },
                    {
                      name: "classes",
                      meta: { canDelete: true, label: "クラス" },
                      list: "/academic-years/:academicYearId/classes",
                      create: "/academic-years/:academicYearId/classes/create",
                      edit: "/academic-years/:academicYearId/classes/:classId/edit",
                    },
                  ]}
                  options={{
                    syncWithLocation: true,
                    warnWhenUnsavedChanges: true,
                    projectId: "o0YFv2-gODSYZ-WiPmQg",
                  }}>
                  <Routes>
                    <Route
                      element={
                        <Authenticated
                          key='authenticated-inner'
                          redirectOnFail='/login'
                          appendCurrentPathToQuery={false}>
                          <ThemedLayout
                            Header={Header}
                            Sider={(props) => <CustomSider {...props} fixed />}>
                            <Outlet />
                          </ThemedLayout>
                        </Authenticated>
                      }>
                      <Route
                        element={
                          <RouteGuard>
                            <Outlet />
                          </RouteGuard>
                        }>
                        <Route index element={null} />
                        <Route path='/school-admins'>
                          <Route index element={<SchoolAdminList />} />
                          <Route
                            path='create'
                            element={<SchoolAdminUpsert />}
                          />
                          <Route
                            path='edit/:id'
                            element={<SchoolAdminUpsert />}
                          />
                        </Route>
                        <Route path='/academic-years'>
                          <Route index element={<AcademicYearList />} />
                          <Route
                            path='create'
                            element={<AcademicYearUpsert />}
                          />
                          <Route
                            path='edit/:academicYearId'
                            element={<AcademicYearUpsert />}
                          />
                          <Route path=':academicYearId/classes'>
                            <Route index element={<ClassList />} />
                            <Route path='create' element={<ClassUpsert />} />
                            <Route
                              path=':classId/edit'
                              element={<ClassUpsert />}
                            />
                          </Route>
                        </Route>
                        <Route path='/teachers'>
                          <Route index element={<TeacherList />} />
                          <Route path='create' element={<TeacherUpsert />} />
                          <Route
                            path='edit/:teacherId'
                            element={<TeacherUpsert />}
                          />
                        </Route>
                        <Route path='/students'>
                          <Route index element={<StudentList />} />
                          <Route path='create' element={<StudentUpsert />} />
                          <Route path='edit/:id' element={<StudentUpsert />} />
                        </Route>
                        <Route path='/works'>
                          <Route index element={<WorkManagement />} />
                        </Route>
                      </Route>
                      <Route path='*' element={<ErrorComponent />} />
                    </Route>
                    <Route path='/viewer/:token' element={<Viewer />} />
                    <Route
                      path='/privacy-policy'
                      element={<PrivacyPolicyPage />}
                    />
                    <Route path='/help' element={<HelpPage />} />

                    <Route
                      element={
                        <Authenticated
                          key='authenticated-outer'
                          fallback={<Outlet />}></Authenticated>
                      }>
                      <Route path='/login' element={<LoginPage />} />
                      <Route
                        path='/register'
                        element={<AuthPage type='register' />}
                      />
                      <Route
                        path='/forgot-password'
                        element={<AuthPage type='forgotPassword' />}
                      />
                    </Route>
                  </Routes>

                  <RefineKbar />
                  <UnsavedChangesNotifier />
                  <DocumentTitleHandler />
                </Refine>
                <DevtoolsPanel />
              </DevtoolsProvider>
            </AntdApp>
          </ColorModeContextProvider>
        </RefineKbarProvider>
      </AuthStateProvider>
    </BrowserRouter>
  );
}

export default App;
