from django.urls import path

from customUser.views import (
    UserListView,
    UserMeView,
    UserMeUpdateView,
    UserMeDeleteView,
    UserDetailView
)
from userday.views import UserDayListCreateView, RetrieveUpdateDestroyUserDayView, CreateRandomUserDayView, \
    MonthlyTrackingDataView, DayDetailsView
from usermonth.views import UserMonthListView, RetrieveUpdateDestroyUserMonthView

urlpatterns = [
    path('', UserListView.as_view(), name='users_list'),  # GET /users/
    path('me/', UserMeView.as_view(), name='users_me_read'),  # GET /users/me/
    path('me/update/', UserMeUpdateView.as_view(), name='users_me_update_partial'),  # PATCH /users/me/update/
    path('me/delete/', UserMeDeleteView.as_view(), name='users_me_delete_delete'),  # DELETE /users/me/delete/
    path('<int:pk>/', UserDetailView.as_view(), name='users_read'),  # GET /users/<id>/
    # path('me/goals/', UserGoalMeListCreateView.as_view(), name='user-goal-me-list-create'),  # GET/POST /users/me/goals/
    # path('me/goals/<int:pk>/', UserGoalDetailView.as_view(), name='user-goal-detail'),  # GET/PUT/PATCH/DELETE /users/me/goals/<id>/
    # path('me/goals/complete-or-expire/', UserGoalCompleteOrExpireView.as_view(), name='user-goal-complete-or-expire'),  # POST /users/me/go
    # path('<int:pk>/goals/', UserGoalUserListView.as_view(), name='user-goal-user-list'),  # GET /users/<id>/goals/ (admin only)
    # path('<int:pk>/goals/<int:goal_pk>/', UserGoalDetailView.as_view(), name='user-goal-detail'),  # GET/PUT/PATCH/DELETE /users/<id>/goals/<goal_id>/
    path('me/days/', UserDayListCreateView.as_view(), name='user-day-list-create'),  # GET/POST /users/me/days/
    path('me/days/<int:pk>/', RetrieveUpdateDestroyUserDayView.as_view(), name='user-day-detail'),
    # GET/PUT/PATCH/DELETE /users/me
    path('me/days/create-random/', CreateRandomUserDayView.as_view(), name='create-random-user-day'),
    # POST /users/me/days/create-random/
    path('me/days/tracking/<int:year>/<int:month>/', MonthlyTrackingDataView.as_view(), name='monthly-tracking-data'),
    # GET /users/me/days/tracking/2025/1/
    path('me/days/details/<str:date_str>/', DayDetailsView.as_view(), name='day-details'),
    # GET /users/me/days/details/2025-07-29/
    # path('<int:pk>/days/<int:day_pk>/', RetrieveUpdateDestroyUserDayView.as_view(), name='user-day-detail-admin'),  # GET/PUT/PATCH/DELETE /users/<id>/days/<day_id>/ (admin only)
    path('me/months/', UserMonthListView.as_view(), name='user-month-list-create'),  # GET/POST /users/me/months/
    path('me/months/<int:pk>/', RetrieveUpdateDestroyUserMonthView.as_view(), name='user-month-detail'),
    # GET/PUT/PATCH/DELETE /users/me/months/<id>/
    # path('<int:pk>/months/<int:month_pk>/', RetrieveUpdateDestroyUserMonthView.as_view(), name='user-month-detail-admin'),  # GET/PUT/PATCH/DELETE /users/<id>/months/<month_id>/ (admin only)
]
