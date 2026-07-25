#!/bin/bash

echo "Instalación de python3 y actualización de paquetes"
sudo apt update && sudo apt install -y python3 && sudo apt install python3-pip -y && sudo apt install python3-venv -y
sudo apt update -y && sudo apt upgrade -y


echo "Comprobando versión de python instalada"
python3 --version

echo  "creando carpeta raíz del proyecto"
mkdir CuervoRide
cd CuervoRide

echo "clonando repositorio dentro de la raíz del proyecto"
git clone https://github.com/Sidrac1/Cuervo-ride.git

echo "creación del entorno virtual"
python3 -m venv myenv

echo "activación del entorno virtual"
source myenv/bin/activate

echo "instalación de dependencias"
pip install -r requirements.txt

echo "entrada a la carpeta principal para realizar las migraciones del proyecto"
cd CRWeb
python3 manage.py makemigrations
python3 manage.py migrate

python3 manage.py runserver
echo "proyecto instalado y corriendo"
