from django.urls import path

from .views import (
    AIGoalValidationView,
    SubmitGoalView,
    UpdateGoalScoresView,
    CreatePartialGoalView,
    UserGoalMeListCreateView,
    DeleteGoalView
)

urlpatterns = [
    # Dashboard - list user's goals
    path('my-goals/', UserGoalMeListCreateView.as_view(), name='my-goals'),

    # Step 2: Create partial goal with just goal_type
    path('create-partial/', CreatePartialGoalView.as_view(), name='create-partial-goal'),

    # Step 3: Validate user objective with AI
    path('ai-validate/', AIGoalValidationView.as_view(), name='ai-validate'),

    # Step 5: Submit final goal (update partial goal)
    path('submit-goal/<int:goal_id>/', SubmitGoalView.as_view(), name='submit-goal'),

    # Update scores
    path('update-scores/<int:goal_id>/', UpdateGoalScoresView.as_view(), name='update-goal-scores'),

    # Delete goal
    path('delete-goal/<int:goal_id>/', DeleteGoalView.as_view(), name='delete-goal'),
]
