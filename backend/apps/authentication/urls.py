from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    register_view,
    login_view,
    logout_view,
    user_profile_view,
    change_password_view,
    password_reset_view,
    password_reset_confirm_view
)

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('logout/', logout_view, name='logout'),
    path('user/', user_profile_view, name='user_profile'),
    path('profile/', user_profile_view, name='profile'),
    path('change-password/', change_password_view, name='change_password'),
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', password_reset_view, name='password_reset'),
    path('password-reset-confirm/', password_reset_confirm_view, name='password_reset_confirm'),
]