from rest_framework import generics, permissions

from .models import UserMonth
from .permissions import IsOwnerOrAdmin
from .serializers import UserMonthSerializer


# List all months for the authenticated user
# Since months are created automatically, this view is read-only
class UserMonthListView(generics.ListAPIView):
    queryset = UserMonth.objects.all()
    serializer_class = UserMonthSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return UserMonth.objects.none()
        return UserMonth.objects.filter(custom_user=user)


class RetrieveUpdateDestroyUserMonthView(generics.RetrieveUpdateDestroyAPIView):
    # Retrieve, update, and delete a specific month for the authenticated user
    queryset = UserMonth.objects.all()
    serializer_class = UserMonthSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return UserMonth.objects.none()
        return UserMonth.objects.filter(custom_user=self.request.user)
