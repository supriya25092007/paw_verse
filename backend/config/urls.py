from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.role_views import RoleViewSet
from accounts.views import CurrentUserView, RegisterView
from adoption.views import ApplicationViewSet, ListingViewSet as AdoptionListingViewSet
from administration.views import (
    AnalyticsViewSet,
    ApprovalViewSet,
    AuditLogViewSet,
    DashboardAPIView,
    PendingAppointmentReviewAPIView,
)
from appointments.views import BookingViewSet as AppointmentBookingViewSet
from community.views import LostFoundViewSet, PostViewSet
from health_records.views import MedicalHistoryViewSet, VaccinationViewSet
from marketplace.views import InquiryViewSet, ListingViewSet as MarketplaceListingViewSet
from messaging.views import ChatViewSet, MessageViewSet
from notifications.views import NotificationViewSet
from payments.views import TransactionViewSet
from pets.views import PetViewSet
from reminders.views import CareReminderViewSet
from rescue.views import RescueCaseViewSet, VolunteerViewSet
from services.views import (
    BookingViewSet as ServiceBookingViewSet,
    GroomingViewSet,
    ServiceViewSet,
    SittingViewSet,
)
from veterinary.views import ClinicViewSet, VetDirectoryView, VetProfileViewSet


router = DefaultRouter()
router.register("pets", PetViewSet, basename="pet")
router.register("roles", RoleViewSet, basename="role")
router.register("vaccinations", VaccinationViewSet, basename="vaccination")
router.register("medical-history", MedicalHistoryViewSet, basename="medical-history")
router.register("vet-profiles", VetProfileViewSet, basename="vet-profile")
router.register("clinics", ClinicViewSet, basename="clinic")
router.register("appointments", AppointmentBookingViewSet, basename="appointment")
router.register("reminders", CareReminderViewSet, basename="reminder")
router.register("adoption-listings", AdoptionListingViewSet, basename="adoption-listing")
router.register("adoption-applications", ApplicationViewSet, basename="adoption-application")
router.register("rescue-cases", RescueCaseViewSet, basename="rescue-case")
router.register("volunteers", VolunteerViewSet, basename="volunteer")
router.register("listings", MarketplaceListingViewSet, basename="marketplace-listing")
router.register("inquiries", InquiryViewSet, basename="marketplace-inquiry")
router.register("services", ServiceViewSet, basename="service")
router.register("grooming", GroomingViewSet, basename="grooming")
router.register("sitting", SittingViewSet, basename="sitting")
router.register("service-bookings", ServiceBookingViewSet, basename="service-booking")
router.register("transactions", TransactionViewSet, basename="transaction")
router.register("posts", PostViewSet, basename="community-post")
router.register("lost-found", LostFoundViewSet, basename="lost-found")
router.register("chats", ChatViewSet, basename="chat")
router.register("messages", MessageViewSet, basename="message")
router.register("notifications", NotificationViewSet, basename="notification")
router.register("admin/audit-logs", AuditLogViewSet, basename="audit-log")
router.register("admin/approvals", ApprovalViewSet, basename="approval")
router.register("admin/analytics", AnalyticsViewSet, basename="analytics")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/me/", CurrentUserView.as_view(), name="current_user"),
    path("api/admin/dashboard/", DashboardAPIView.as_view(), name="admin_dashboard"),
    path(
        "api/admin/appointments/<int:pk>/review/",
        PendingAppointmentReviewAPIView.as_view(),
        name="admin_appointment_review",
    ),
    path("api/vet-directory/", VetDirectoryView.as_view(), name="vet_directory"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
