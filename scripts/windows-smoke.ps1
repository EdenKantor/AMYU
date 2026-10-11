param(
    [Parameter(Mandatory = $true)][string]$Executable,
    [Parameter(Mandatory = $true)][string]$Report
)
$ErrorActionPreference = 'Stop'
$exe = (Resolve-Path -LiteralPath $Executable).Path
$reportPath = [IO.Path]::GetFullPath($Report)
$process = $null
try {
    # A process/window smoke check only. Visual and interactive acceptance is manual.
    $process = Start-Process -FilePath $exe -PassThru -WindowStyle Hidden
    $deadline = [DateTime]::UtcNow.AddSeconds(25)
    do {
        Start-Sleep -Milliseconds 500
        $process.Refresh()
        if ($process.HasExited) { throw "AMYU exited early with code $($process.ExitCode)." }
    } while ($process.MainWindowHandle -eq 0 -and [DateTime]::UtcNow -lt $deadline)
    if ($process.MainWindowHandle -eq 0) { throw 'AMYU did not expose a native window within 25 seconds.' }
    if ($process.MainWindowTitle -notlike 'AMYU*') { throw "Unexpected native window title: $($process.MainWindowTitle)" }
    Start-Sleep -Seconds 5
    $process.Refresh()
    if ($process.HasExited) { throw 'AMYU exited after creating its native window.' }
    [ordered]@{
        executable = [IO.Path]::GetFileName($exe)
        sha256 = (Get-FileHash -LiteralPath $exe -Algorithm SHA256).Hash.ToLower()
        title = $process.MainWindowTitle
        nativeWindowCreated = $true
        processStayedAlive = $true
        viteRunning = $false
        visualAcceptance = 'not performed by this process smoke check'
    } | ConvertTo-Json | Set-Content -LiteralPath $reportPath
} finally {
    if ($process -and -not $process.HasExited) {
        $null = $process.CloseMainWindow()
        if (-not $process.WaitForExit(5000)) { Stop-Process -Id $process.Id }
    }
}
