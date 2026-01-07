# Script para crear proyecto reactpro con arquitectura en capas
# Copia archivos necesarios desde el proyecto HLC actual

$ErrorActionPreference = "Stop"

# Rutas
$baseHLC = "C:\Users\salyr\Desktop\grado\2DO\OPTATIVA\HLC"
$reactProPath = "C:\Users\salyr\Desktop\grado\2DO\OPTATIVA\reactpro"

Write-Host "🚀 Creando proyecto reactpro..." -ForegroundColor Cyan

# 1. Crear estructura de carpetas
Write-Host "`n📁 Creando estructura de directorios..." -ForegroundColor Yellow
$folders = @(
    "dockerfiles\base\pbase",
    "dockerfiles\base\psecurity",
    "dockerfiles\base\admin\usuarios",
    "dockerfiles\base\admin\ssh",
    "dockerfiles\base\admin\sudo",
    "dockerfiles\personal\react",
    "proyectos\react",
    "common"
)

foreach ($folder in $folders) {
    $fullPath = Join-Path $reactProPath $folder
    New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
    Write-Host "  ✓ $folder" -ForegroundColor Green
}

# 2. Copiar archivos Dockerfile y scripts base
Write-Host "`n📋 Copiando archivos de configuración base..." -ForegroundColor Yellow

# ubbase → pbase/Dockerfile
Copy-Item "$baseHLC\devops\docker\caronte\dockerfiles\base\ubbase" `
          "$reactProPath\dockerfiles\base\pbase\Dockerfile"
Write-Host "  ✓ ubbase → pbase/Dockerfile" -ForegroundColor Green

# Carpeta admin completa
Copy-Item "$baseHLC\devops\docker\caronte\dockerfiles\base\admin\*" `
          "$reactProPath\dockerfiles\base\admin\" -Recurse -Force
Write-Host "  ✓ admin/ (completa)" -ForegroundColor Green

# 3. Copiar archivos React
Write-Host "`n📋 Copiando archivos del proyecto React..." -ForegroundColor Yellow

# Dockerfile de React
Copy-Item "$baseHLC\devops\docker\caronte\dockerfiles\react-web\Dockerfile" `
          "$reactProPath\dockerfiles\personal\react\Dockerfile"
Write-Host "  ✓ Dockerfile React" -ForegroundColor Green

# start.sh de React
Copy-Item "$baseHLC\devops\docker\caronte\dockerfiles\react-web\start.sh" `
          "$reactProPath\dockerfiles\personal\react\start.sh"
Write-Host "  ✓ start.sh React" -ForegroundColor Green

# 4. Copiar proyecto React completo
Write-Host "`n📦 Copiando proyecto React completo..." -ForegroundColor Yellow

$reactFiles = @(
    "docker-compose.yml",
    ".env",
    "package.json",
    "vite.config.js",
    "index.html"
)

foreach ($file in $reactFiles) {
    $source = "$baseHLC\devops\docker\caronte\proyectos\react-web\$file"
    if (Test-Path $source) {
        Copy-Item $source "$reactProPath\proyectos\react\$file"
        Write-Host "  ✓ $file" -ForegroundColor Green
    }
}

# Carpeta src/
if (Test-Path "$baseHLC\devops\docker\caronte\proyectos\react-web\src") {
    Copy-Item "$baseHLC\devops\docker\caronte\proyectos\react-web\src" `
              "$reactProPath\proyectos\react\src" -Recurse -Force
    Write-Host "  ✓ src/" -ForegroundColor Green
}

# Carpeta public/
if (Test-Path "$baseHLC\devops\docker\caronte\proyectos\react-web\public") {
    Copy-Item "$baseHLC\devops\docker\caronte\proyectos\react-web\public" `
              "$reactProPath\proyectos\react\public" -Recurse -Force
    Write-Host "  ✓ public/" -ForegroundColor Green
}

# 5. Copiar clave SSH
Write-Host "`n🔑 Copiando clave SSH..." -ForegroundColor Yellow
if (Test-Path "$baseHLC\devops\docker\caronte\common\id_ed25519.pub") {
    Copy-Item "$baseHLC\devops\docker\caronte\common\id_ed25519.pub" `
              "$reactProPath\common\id_ed25519.pub"
    Write-Host "  ✓ id_ed25519.pub" -ForegroundColor Green
}

Write-Host "`n✅ ¡Proyecto reactpro creado exitosamente!" -ForegroundColor Green
Write-Host "`n📂 Ubicación: $reactProPath" -ForegroundColor Cyan
Write-Host "`n📝 Próximos pasos:" -ForegroundColor Yellow
Write-Host "  1. Revisar archivos copiados"
Write-Host "  2. Crear archivos nuevos (psecurity, scripts)"
Write-Host "  3. Modificar Dockerfiles según arquitectura en capas"
Write-Host "  4. Crear init_project.sh y deploy.sh"
Write-Host "  5. Inicializar Git y subir a GitHub"
