#!/bin/bash

echo "Comprobando versión de Python instalada..."
python3 --version

echo "Creando carpeta raíz del proyecto..."
mkdir -p CuervoRide
cd CuervoRide

echo "Clonando repositorio dentro de la raíz del proyecto..."
git clone https://github.com/Sidrac1/Cuervo-ride.git

echo "Creación del entorno virtual..."
python3 -m venv myenv

echo "Activación del entorno virtual..."
source myenv/bin/activate

echo "Entrando a la carpeta del repositorio..."
cd Cuervo-ride/

echo "Instalación de dependencias..."
pip install -r requirements.txt

echo "Entrada a la carpeta principal para realizar las migraciones del proyecto..."
cd CRWeb
python3 manage.py makemigrations
python3 manage.py migrate

echo "Proyecto instalado y corriendo en Bazzite..."
python3 manage.py runserver