import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import routerProvider, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import "./App.css";

import { Layout } from "./components/refine-ui/layout/layout";
import { ErrorComponent } from "./components/refine-ui/layout/error-component";
import { Toaster } from "./components/refine-ui/notification/toaster";
import { useNotificationProvider } from "./components/refine-ui/notification/use-notification-provider";
import { ThemeProvider } from "./components/refine-ui/theme/theme-provider";

import { resources } from "./config/resources";
import { authProvider } from "./providers/auth";
import { dataProvider } from "./providers/data";
import {
  colorsDataProvider,
  colorSynonymsDataProvider,
} from "./providers/colors-data";

import { ForgotPassword } from "./pages/forgotPassword";
import { Login } from "./pages/login";
import { Register } from "./pages/register";
import { ProductCreate, ProductEdit, ProductList } from "./pages/products";
import { ColorCreate, ColorEdit, ColorList } from "./pages/colors";

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ThemeProvider>
          <DevtoolsProvider>
            <Refine
              dataProvider={{
                default: dataProvider,
                colors: colorsDataProvider,
                colorSynonyms: colorSynonymsDataProvider,
              }}
              notificationProvider={useNotificationProvider()}
              routerProvider={routerProvider}
              authProvider={authProvider}
              resources={resources}
              options={{
                syncWithLocation: true,
                warnWhenUnsavedChanges: true,
                projectId: "k9qkbs-3ZsaAF-R1Vjwx",
              }}
            >
              <Routes>
                {/* Authenticated app shell */}
                <Route
                  element={
                    <Authenticated
                      key="authenticated-routes"
                      fallback={<CatchAllNavigate to="/login" />}
                    >
                      <Layout>
                        <Outlet />
                      </Layout>
                    </Authenticated>
                  }
                >
                  <Route
                    index
                    element={<NavigateToResource resource="products" />}
                  />
                  <Route path="/products">
                    <Route index element={<ProductList />} />
                    <Route path="create" element={<ProductCreate />} />
                    <Route path="edit/:id" element={<ProductEdit />} />
                  </Route>
                  <Route path="/colors">
                    <Route index element={<ColorList />} />
                    <Route path="create" element={<ColorCreate />} />
                    <Route path="edit/:id" element={<ColorEdit />} />
                  </Route>
                  <Route path="*" element={<ErrorComponent />} />
                </Route>

                {/* Public auth routes */}
                <Route
                  element={
                    <Authenticated key="auth-pages" fallback={<Outlet />}>
                      <NavigateToResource resource="products" />
                    </Authenticated>
                  }
                >
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route
                    path="/forgot-password"
                    element={<ForgotPassword />}
                  />
                </Route>
              </Routes>

              <Toaster position="bottom-center" />
              <RefineKbar />
              <UnsavedChangesNotifier />
              <DocumentTitleHandler />
            </Refine>
            <DevtoolsPanel />
          </DevtoolsProvider>
        </ThemeProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
