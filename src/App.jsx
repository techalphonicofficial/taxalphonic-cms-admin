import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmHost from './components/common/ConfirmHost';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { RoutePermission } from './components/common/HasPermission';
import Dashboard from './pages/Dashboard';
import PagesList from './pages/PagesList';
import PageForm from './pages/PageForm';
import HomePageEditor from './pages/HomePageEditor';
import ServiceCategoriesList from './pages/ServiceCategoriesList';
import ServiceCategoryForm from './pages/ServiceCategoryForm';
import ServiceForm from './pages/ServiceForm';
import ServicesList from './pages/ServicesList';
import PackagesList from './pages/PackagesList';
import PackageForm from './pages/PackageForm';
import BlogDashboard from './pages/blogs/BlogDashboard';
import BlogsList from './pages/blogs/BlogsList';
import BlogForm from './pages/blogs/BlogForm';
import BlogComments from './pages/blogs/BlogComments';
import BlogCategoriesList from './pages/blogs/BlogCategoriesList';
import BlogCategoryForm from './pages/blogs/BlogCategoryForm';
import BlogTagsList from './pages/blogs/BlogTagsList';
import BlogTagForm from './pages/blogs/BlogTagForm';
import BlogAuthorsList from './pages/blogs/BlogAuthorsList';
import BlogAuthorForm from './pages/blogs/BlogAuthorForm';
import TestimonialsList from './pages/TestimonialsList';
import TestimonialForm from './pages/TestimonialForm';
import TeamMembersList from './pages/TeamMembersList';
import TeamMemberForm from './pages/TeamMemberForm';
import FaqsList from './pages/FaqsList';
import FaqForm from './pages/FaqForm';
import PortfolioCategoriesList from './pages/PortfolioCategoriesList';
import PortfolioCategoryForm from './pages/PortfolioCategoryForm';
import PortfolioItemsList from './pages/PortfolioItemsList';
import PortfolioItemForm from './pages/PortfolioItemForm';
import BannersList from './pages/BannersList';
import BannerForm from './pages/BannerForm';
import MediaList from './pages/MediaList';
import SeoList from './pages/SeoList';
import SeoForm from './pages/SeoForm';
import SettingsView from './pages/Settings/SettingsView';
import AboutView from './pages/About/AboutView';
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import UsersList from './pages/UsersList';
import UserForm from './pages/UserForm';
import RolesList from './pages/RolesList';
import RoleForm from './pages/RoleForm';
import PermissionsList from './pages/PermissionsList';
import PermissionForm from './pages/PermissionForm';
import AuditLogsList from './pages/AuditLogsList';
import Trash from './pages/Trash';
import MediaSettings from './pages/media/MediaSettings';
import BranchesList from './pages/BranchesList';
import BranchForm from './pages/BranchForm';
import PartnersList from './pages/PartnersList';
import PartnerForm from './pages/PartnerForm';
import CountriesList from './pages/CountriesList';
import CountryForm from './pages/CountryForm';
import Profile from './pages/Profile';
import PageCategoriesList from './pages/PageCategoriesList';
import PageCategoryForm from './pages/PageCategoryForm';
import MenusList from './pages/MenusList';
import MenuBuilder from './pages/MenuBuilder';
import LocationsList from './pages/LocationsList';
import LocationForm from './pages/LocationForm';
import IndustriesList from './pages/IndustriesList';
import IndustryForm from './pages/IndustryForm';
import TechnologiesList from './pages/TechnologiesList';
import TechnologyForm from './pages/TechnologyForm';
import ProblemsList from './pages/ProblemsList';
import ProblemList from './pages/ProblemsList';
import ProblemForm from './pages/ProblemForm';
import SeoPagesList from './pages/SeoPagesList';
import SeoPageForm from './pages/SeoPageForm';
import SeoPageEditForm from './pages/SeoPageEditForm';
import StatesList from './pages/StatesList';
import StateForm from './pages/StateForm';
import LeadsList from './pages/crm/LeadsList';
import FormsList from './pages/forms/FormsList';
import FormBuilder from './pages/forms/FormBuilder';
import AiSettings from './pages/seo/AiSettings';
import SystemLogsList from './pages/logs/SystemLogsList';

// Force HMR reload
function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />

            <Route path="profile" element={<Profile />} />

            <Route path="users" element={<RoutePermission action="read" module="Users"><UsersList /></RoutePermission>} />
            <Route path="users/new" element={<RoutePermission action="create" module="Users"><UserForm key="new" /></RoutePermission>} />
            <Route path="users/edit/:id" element={<RoutePermission action="update" module="Users"><UserForm key="edit" /></RoutePermission>} />

            <Route path="pages/categories" element={<RoutePermission action="read" module="PageCategories"><PageCategoriesList /></RoutePermission>} />
            <Route path="pages/categories/new" element={<RoutePermission action="create" module="PageCategories"><PageCategoryForm key="new" /></RoutePermission>} />
            <Route path="pages/categories/edit/:id" element={<RoutePermission action="update" module="PageCategories"><PageCategoryForm key="edit" /></RoutePermission>} />

            <Route path="pages/menus" element={<RoutePermission action="read" module="Menus"><MenusList /></RoutePermission>} />
            <Route path="pages/menus/new" element={<RoutePermission action="create" module="Menus"><MenuBuilder key="new" /></RoutePermission>} />
            <Route path="pages/menus/edit/:id" element={<RoutePermission action="update" module="Menus"><MenuBuilder key="edit" /></RoutePermission>} />

            <Route path="services/categories" element={<RoutePermission action="read" module="ServiceCategories"><ServiceCategoriesList /></RoutePermission>} />
            <Route path="services/categories/new" element={<RoutePermission action="create" module="ServiceCategories"><ServiceCategoryForm key="new" /></RoutePermission>} />
            <Route path="services/categories/edit/:id" element={<RoutePermission action="update" module="ServiceCategories"><ServiceCategoryForm key="edit" /></RoutePermission>} />

            <Route path="packages" element={<RoutePermission action="read" module="Packages"><PackagesList /></RoutePermission>} />
            <Route path="packages/new" element={<RoutePermission action="create" module="Packages"><PackageForm key="new" /></RoutePermission>} />
            <Route path="packages/edit/:id" element={<RoutePermission action="update" module="Packages"><PackageForm key="edit" /></RoutePermission>} />

            <Route path="roles" element={<RoutePermission action="read" module="Roles"><RolesList /></RoutePermission>} />
            <Route path="roles/new" element={<RoutePermission action="create" module="Roles"><RoleForm key="new" /></RoutePermission>} />
            <Route path="roles/edit/:id" element={<RoutePermission action="update" module="Roles"><RoleForm key="edit" /></RoutePermission>} />

            <Route path="permissions" element={<RoutePermission action="read" module="Permissions"><PermissionsList /></RoutePermission>} />
            <Route path="permissions/new" element={<RoutePermission action="create" module="Permissions"><PermissionForm key="new" /></RoutePermission>} />
            <Route path="permissions/edit/:id" element={<RoutePermission action="update" module="Permissions"><PermissionForm key="edit" /></RoutePermission>} />

            <Route path="trash" element={<Trash />} />
            <Route path="audit-logs" element={<RoutePermission action="read" module="AuditLogs"><AuditLogsList /></RoutePermission>} />
            <Route path="system-logs/:type" element={<RoutePermission action="read" module="SystemLogs"><SystemLogsList /></RoutePermission>} />

            <Route path="pages" element={<PagesList />} />
            <Route path="pages/home" element={<HomePageEditor />} />
            <Route path="pages/new" element={<PageForm key="new" />} />
            <Route path="pages/edit/:id" element={<PageForm key="edit" />} />

            <Route path="service-categories" element={<ServiceCategoriesList />} />
            <Route path="service-categories/new" element={<ServiceCategoryForm key="new" />} />
            <Route path="service-categories/edit/:id" element={<ServiceCategoryForm key="edit" />} />

            <Route path="services" element={<RoutePermission action="read" module="Services"><ServicesList /></RoutePermission>} />
            <Route path="services/new" element={<RoutePermission action="create" module="Services"><ServiceForm key="new" /></RoutePermission>} />
            <Route path="services/edit/:id" element={<RoutePermission action="update" module="Services"><ServiceForm key="edit" /></RoutePermission>} />

            {/* Advanced Blog Module */}
            <Route path="blogs/dashboard" element={<RoutePermission action="read" module="Blogs"><BlogDashboard /></RoutePermission>} />
            <Route path="blogs" element={<RoutePermission action="read" module="Blogs"><BlogsList /></RoutePermission>} />
            <Route path="blogs/new" element={<RoutePermission action="create" module="Blogs"><BlogForm key="new" /></RoutePermission>} />
            <Route path="blogs/edit/:id" element={<RoutePermission action="update" module="Blogs"><BlogForm key="edit" /></RoutePermission>} />
            <Route path="blogs/comments" element={<RoutePermission action="read" module="Blogs"><BlogComments /></RoutePermission>} />

            <Route path="blog-categories" element={<RoutePermission action="read" module="Blogs"><BlogCategoriesList /></RoutePermission>} />
            <Route path="blog-categories/new" element={<RoutePermission action="create" module="Blogs"><BlogCategoryForm key="new" /></RoutePermission>} />
            <Route path="blog-categories/edit/:id" element={<RoutePermission action="update" module="Blogs"><BlogCategoryForm key="edit" /></RoutePermission>} />
            <Route path="blog-tags" element={<BlogTagsList />} />
            <Route path="blog-tags/new" element={<BlogTagForm key="new" />} />
            <Route path="blog-tags/edit/:id" element={<BlogTagForm key="edit" />} />
            <Route path="blog-authors" element={<BlogAuthorsList />} />
            <Route path="blog-authors/new" element={<BlogAuthorForm key="new" />} />
            <Route path="blog-authors/edit/:id" element={<BlogAuthorForm key="edit" />} />

            <Route path="cms/testimonials" element={<TestimonialsList />} />
            <Route path="cms/testimonials/new" element={<TestimonialForm key="new" />} />
            <Route path="cms/testimonials/edit/:id" element={<TestimonialForm key="edit" />} />

            <Route path="cms/team" element={<TeamMembersList />} />
            <Route path="cms/team/new" element={<TeamMemberForm key="new" />} />
            <Route path="cms/team/edit/:id" element={<TeamMemberForm key="edit" />} />

            <Route path="cms/faqs" element={<FaqsList />} />
            <Route path="cms/faqs/new" element={<FaqForm key="new" />} />
            <Route path="cms/faqs/edit/:id" element={<FaqForm key="edit" />} />

            <Route path="portfolio-categories" element={<PortfolioCategoriesList />} />
            <Route path="portfolio-categories/new" element={<PortfolioCategoryForm key="new" />} />
            <Route path="portfolio-categories/edit/:id" element={<PortfolioCategoryForm key="edit" />} />

            <Route path="portfolio-items" element={<PortfolioItemsList />} />
            <Route path="portfolio-items/new" element={<PortfolioItemForm key="new" />} />
            <Route path="portfolio-items/edit/:id" element={<PortfolioItemForm key="edit" />} />

            <Route path="cms/banners" element={<BannersList />} />
            <Route path="cms/banners/new" element={<BannerForm key="new" />} />
            <Route path="cms/banners/edit/:id" element={<BannerForm key="edit" />} />

            <Route path="cms/branches" element={<BranchesList />} />
            <Route path="cms/branches/new" element={<BranchForm key="new" />} />
            <Route path="cms/branches/edit/:id" element={<BranchForm key="edit" />} />

            <Route path="cms/partners" element={<PartnersList />} />
            <Route path="cms/partners/new" element={<PartnerForm key="new" />} />
            <Route path="cms/partners/edit/:id" element={<PartnerForm key="edit" />} />

            <Route path="cms/countries" element={<CountriesList />} />
            <Route path="cms/countries/new" element={<CountryForm key="new" />} />
            <Route path="cms/countries/edit/:id" element={<CountryForm key="edit" />} />

            <Route path="cms/seo" element={<SeoList />} />
            <Route path="cms/seo/new" element={<SeoForm key="new" />} />
            <Route path="cms/seo/edit/:id" element={<SeoForm key="edit" />} />

            <Route path="media" element={<MediaList />} />
            <Route path="media/settings" element={<RoutePermission action="read" module="Media"><MediaSettings /></RoutePermission>} />

            {/* Settings Routes */}
            <Route path="about-page" element={<AboutView />} />
            <Route path="settings/:group" element={<SettingsView />} />
            <Route path="settings" element={<SettingsView />} />

            {/* PSEO Matrix Routes */}
            <Route path="seo-pages" element={<SeoPagesList />} />
            <Route path="seo-pages/ai-settings" element={<RoutePermission action="read" module="SEO"><AiSettings /></RoutePermission>} />
            <Route path="seo-pages/new" element={<SeoPageForm key="new" />} />
            <Route path="seo-pages/edit/:id" element={<SeoPageEditForm key="edit" />} />

            <Route path="locations" element={<LocationsList />} />
            <Route path="locations/new" element={<LocationForm key="new" />} />
            <Route path="locations/edit/:id" element={<LocationForm key="edit" />} />

            <Route path="states" element={<StatesList />} />
            <Route path="states/new" element={<StateForm key="new" />} />
            <Route path="states/edit/:id" element={<StateForm key="edit" />} />

            <Route path="industries" element={<IndustriesList />} />
            <Route path="industries/new" element={<IndustryForm key="new" />} />
            <Route path="industries/edit/:id" element={<IndustryForm key="edit" />} />

            <Route path="technologies" element={<TechnologiesList />} />
            <Route path="technologies/new" element={<TechnologyForm key="new" />} />
            <Route path="technologies/edit/:id" element={<TechnologyForm key="edit" />} />

            <Route path="problems" element={<ProblemsList />} />
            <Route path="problems/new" element={<ProblemForm key="new" />} />
            <Route path="problems/edit/:id" element={<ProblemForm key="edit" />} />

            {/* CRM / Lead Management Routes */}
            <Route path="crm" element={<LeadsList />} />
            <Route path="crm/leads" element={<LeadsList />} />

            {/* Form Builder Routes */}
            <Route path="forms" element={<RoutePermission action="read" module="Forms"><FormsList /></RoutePermission>} />
            <Route path="forms/new" element={<RoutePermission action="create" module="Forms"><FormBuilder key="new" /></RoutePermission>} />
            <Route path="forms/edit/:id" element={<RoutePermission action="update" module="Forms"><FormBuilder key="edit" /></RoutePermission>} />

          </Route>
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
      {/* Themed confirmations for confirmDialog() / confirmDelete() (components/common/confirm.jsx) */}
      <ConfirmHost />
    </>
  );
}

export default App;
