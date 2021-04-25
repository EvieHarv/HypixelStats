#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

; I don't like all the sleep's I have to use, but the way minecraft handles input is just *weird*

if (WinActive("ahk_exe javaw.exe")) ; We don't want to execute if they're outside.
{
    hk(1)
    Sleep, 50 ; Make sure everything is loaded and ready
    Send, {Ctrl down} ; If they already had something typed into chat we want to get rid of it.
    Sleep, 50 ; Minecraft handles ctrl + a weirdly
    Send, a
    Sleep, 50
    Send, {Ctrl up}
    Sleep, 50
    Send, {BackSpace}
    Sleep, 50
    Send, /
    Sleep, 75
    Send, who
    Sleep, 75
    Send, {Enter}
    Sleep, 15
    hk(0)
    ExitApp
}
else
{
    ExitApp
}

hk(f=0) {  ; By FeiYue
  static allkeys, ExcludeKeys:="LButton,RButton"
  if !allkeys
  {
    s:="||NumpadEnter|Home|End|PgUp|PgDn|Left|Right|Up|Down|Del|Ins|"
    Loop, 254
      k:=GetKeyName(Format("VK{:02X}",A_Index))
        , s.=InStr(s, "|" k "|") ? "" : k "|"
    For k,v in {Control:"Ctrl",Escape:"Esc"}
      s:=StrReplace(s, k, v)
    allkeys:=Trim(s, "|")
  }
  ;------------------
  f:=f ? "On":"Off"
  For k,v in StrSplit(allkeys,"|")
    if v not in %ExcludeKeys%
      Hotkey, *%v%, Block_Input, %f% UseErrorLevel
  Block_Input:
  Return
}