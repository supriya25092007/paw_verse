from config.api import UserOwnedViewSet
from community.models import LostFound, Post
from community.serializers import LostFoundSerializer, PostSerializer


class PostViewSet(UserOwnedViewSet):
    queryset = Post.objects.select_related("author")
    serializer_class = PostSerializer
    owner_field = "author"


class LostFoundViewSet(UserOwnedViewSet):
    queryset = LostFound.objects.select_related("reporter", "pet")
    serializer_class = LostFoundSerializer
    owner_field = "reporter"
