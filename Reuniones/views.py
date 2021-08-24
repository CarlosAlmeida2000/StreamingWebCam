from django.shortcuts import render

def vw_index(request):
    return render(request, "index.html")

def vw_sala(request):
    return render(request, "sala.html")