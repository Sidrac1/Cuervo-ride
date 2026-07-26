@echo off
echo Comprobando instalacion de Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python no esta instalado o no esta en el PATH.
    echo Por favor instala Python desde https://www.python.org/ y marca "Add Python to PATH".
    pause
    exit /b
)

echo Comprobando version de Python instalada:
python --version

echo Creando carpeta raiz del proyecto...
if not exist "CuervoRide" mkdir CuervoRide
cd CuervoRide

echo Clonando repositorio dentro de la raiz del proyecto...
git clone https://github.com/Sidrac1/Cuervo-ride.git

echo Creacion del entorno virtual...
python -m venv myenv

echo Activacion del entorno virtual...
call myenv\Scripts\activate.bat

echo Entrando a la carpeta del repositorio...
cd Cuervo-ride

echo Instalacion de dependencias...
pip install -r requirements.txt

echo Entrada a la carpeta principal para realizar las migraciones...
cd CRWeb
python manage.py makemigrations
python manage.py migrate

echo Proyecto instalado y corriendo...
python manage.py runserver
pause