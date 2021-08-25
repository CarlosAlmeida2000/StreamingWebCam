from django.contrib import admin
from django.urls import path

from django.conf import settings
from django.conf.urls.static import static

from Reuniones import views as vw_reunion

urlpatterns = (
    [
        path("", vw_reunion.vw_index, name="index"),
        path("sala", vw_reunion.vw_sala, name="sala"),
        path('admin/', admin.site.urls),
    ]
    + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
)