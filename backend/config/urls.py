"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.conf import settings
from django.conf.urls.static import static
import os

# Serve the frontend index.html from the project root
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '..')


def serve_frontend(request):
    from django.http import FileResponse
    path = os.path.join(FRONTEND_DIR, 'index.html')
    return FileResponse(open(path, 'rb'))


def serve_frontend_file(request, path):
    from django.http import FileResponse, Http404
    import mimetypes
    
    filepath = os.path.join(FRONTEND_DIR, path)
    if os.path.exists(filepath) and os.path.isfile(filepath):
        content_type, _ = mimetypes.guess_type(filepath)
        return FileResponse(open(filepath, 'rb'), content_type=content_type)
    raise Http404


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/trip-planner/', include('trip_planner.urls')),
    path('<path:path>', serve_frontend_file, name='frontend-file'),
    path('', serve_frontend, name='frontend'),
]
