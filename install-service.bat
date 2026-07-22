@echo off
echo ===================================================
echo     INSTALANDO E CONFIGURANDO SERVICO JOBLENS      
echo ===================================================

echo 1. Instalando PM2 e TS-Node globalmente...
call npm install -g pm2 ts-node typescript

echo.
echo 2. Instalando dependencias do projeto...
call npm install

echo.
echo 3. Parando servico anterior se existir...
call pm2 delete joblens-worker 2>nul

echo.
echo 4. Iniciando o JobLens Worker com PM2...
call pm2 start worker/index.ts --name "joblens-worker" --interpreter ts-node

echo.
echo 5. Salvando lista de processos do PM2...
call pm2 save

echo.
echo 6. Configurando inicializacao automatica com o Windows...
call pm2 startup

echo.
echo ===================================================
echo   SERVICO JOBLENS WORKER INSTALADO COM SUCESSO!   
echo ===================================================
pause
