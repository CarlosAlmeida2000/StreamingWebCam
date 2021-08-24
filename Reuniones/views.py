from django.shortcuts import render

def vw_index(request):
    return render(request, "index.html")