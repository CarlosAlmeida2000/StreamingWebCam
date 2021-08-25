from django.shortcuts import render
from django.http import request

def vw_index(request):
    return render(request, "index.html")

def vw_sala(request):
    return render(request, "sala.html")

