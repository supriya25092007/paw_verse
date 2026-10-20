from rest_framework import generics, permissions

from accounts.serializers import CurrentUserSerializer, RegistrationSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegistrationSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = CurrentUserSerializer

    def get_object(self):
        return self.request.user
