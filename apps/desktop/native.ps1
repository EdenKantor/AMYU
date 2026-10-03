param(
    [ValidateSet('dev', 'build', 'check', 'test', 'fmt')]
    [string]$Command = 'dev'
)

$ErrorActionPreference = 'Stop'
$repoPath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
# Optional repository-local toolchain; work/ is ignored by Git.
# The source repository does not include Rust and falls back to global Rust.
$portableRustPath = [IO.Path]::GetFullPath((Join-Path $repoPath 'work\rust'))
$portableCargoPath = Join-Path $portableRustPath 'cargo'
$portableRustupPath = Join-Path $portableRustPath 'rustup'
$savedEnvironment = @{}
foreach ($variableName in @('PATH', 'CARGO_HOME', 'RUSTUP_HOME', 'CARGO_TARGET_DIR')) {
    $savedEnvironment[$variableName] = [Environment]::GetEnvironmentVariable($variableName, 'Process')
}

$nativeExitCode = 1
Push-Location -LiteralPath $repoPath
try {
    if ((Test-Path -LiteralPath (Join-Path $portableCargoPath 'bin\cargo.exe')) -and
        (Test-Path -LiteralPath $portableRustupPath)) {
        $env:CARGO_HOME = $portableCargoPath
        $env:RUSTUP_HOME = $portableRustupPath
        $env:CARGO_TARGET_DIR = Join-Path $portableRustPath 'target'
        $env:PATH = (Join-Path $portableCargoPath 'bin') + [IO.Path]::PathSeparator + $env:PATH
    }
    elseif (!(Get-Command cargo -ErrorAction SilentlyContinue) -or
            !(Get-Command rustc -ErrorAction SilentlyContinue)) {
        throw "Rust is unavailable. Install the native prerequisites or provide a contained toolchain at $portableRustPath. The source package does not include Rust."
    }

    switch ($Command) {
        'dev' { & pnpm --filter '@amyu/desktop' tauri dev }
        'build' { & pnpm --filter '@amyu/desktop' tauri build }
        'check' { & cargo check --locked --manifest-path 'apps/desktop/src-tauri/Cargo.toml' }
        'test' { & cargo test --locked --manifest-path 'apps/desktop/src-tauri/Cargo.toml' }
        'fmt' { & cargo fmt --check --manifest-path 'apps/desktop/src-tauri/Cargo.toml' }
    }
    $nativeExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
    foreach ($variableName in $savedEnvironment.Keys) {
        [Environment]::SetEnvironmentVariable($variableName, $savedEnvironment[$variableName], 'Process')
    }
}

exit $nativeExitCode
