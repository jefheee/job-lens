Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c npx tsx worker/index.ts", 0, False
