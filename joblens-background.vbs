Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c npx ts-node worker/index.ts", 0, False
