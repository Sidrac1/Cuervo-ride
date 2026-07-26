# instrucciones de instalación:

El proyecto en github necesita de un entorno virtual pero no está en el repositorio y es necesario crearlo

  
# CREACION DEL ENTORNO VIRTUAL EN WINDOWS

1. crear el entorno: aquí el nombre del entorno es .venv
```
python -m venv .venv 
```

## Activar el entorno virtual
### En PowerShell:

```
.\.venv\Scripts\Activate.ps1 
```
### En CMD
```
.\.venv\Scripts\activate.bat
```

### En Git Bash:
```
source .venv/Scripts/activate
```
  

## ¿Cómo saber si se activó correctamente?

==en la terminal la ruta será así:== 
~~~
(.venv) PS C:\ruta\a\tu\proyecto
~~~
  

# CREACION DEL ENTORNO VIRTUAL EN LINUX

Asegúrate de tener las dependencias necesarias instaladas en tu proyecto.
También puedes instalarlas con la siguiente línea de comandos:

### Comprueba si cuentas con python en tu computadora:
~~~
python3 --version
~~~
### En Ubuntu
~~~
sudo apt-get update
sudo apt-get install python3.6
~~~

### Otras distribuciones
~~~
sudo dnf install python3
~~~
## Instalación de Python3 en ubuntu con instalación del proyecto

~~~
sudo apt update && sudo apt install -y python3 && sudo apt install python3-pip -y && sudo apt install python3-venv -y
sudo apt update -y && sudo apt upgrade -y
python3 --version
mkdir CuervoRide
cd CuervoRide
git clone https://github.com/Sidrac1/Cuervo-ride.git
python3 -m venv myenv
source myenv/bin/activate
pip install -r requirements.txt
cd CRWeb
python3 manage.py makemigrations
python3 manage.py migrate
python3 manage.py runserver
~~~