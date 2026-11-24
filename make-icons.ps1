# Draws the pixel moon buddy app icons into icons/. Run: powershell -File make-icons.ps1
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot 'icons'
New-Item -ItemType Directory -Force $out | Out-Null

$blush = [System.Drawing.ColorTranslator]::FromHtml('#F2C9C9')
$pink = [System.Drawing.ColorTranslator]::FromHtml('#F299A9')
$crimson = [System.Drawing.ColorTranslator]::FromHtml('#8C031C')
$wine = [System.Drawing.ColorTranslator]::FromHtml('#8C1B39')

$moon = @(
  '....####....',
  '..########..',
  '.##########.',
  '.##########.',
  '############',
  '############',
  '############',
  '############',
  '.##########.',
  '.##########.',
  '..########..',
  '....####....'
)

function Draw-Icon([int]$size, [double]$fill, [string]$name) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = 'NearestNeighbor'
  $g.SmoothingMode = 'None'
  $g.Clear($blush)
  # 16 grid cells wide: 12 moon + outline + sparkle room
  $cell = [math]::Floor(($size * $fill) / 16)
  $ox = [math]::Floor(($size - 16 * $cell) / 2) + 2 * $cell
  $oy = [math]::Floor(($size - 16 * $cell) / 2) + 2 * $cell
  $wb = New-Object System.Drawing.SolidBrush $wine
  $pb = New-Object System.Drawing.SolidBrush $pink
  $bb = New-Object System.Drawing.SolidBrush $blush
  $cb = New-Object System.Drawing.SolidBrush $crimson
  function Cell($brush, [double]$x, [double]$y, [double]$w = 1, [double]$h = 1) {
    $g.FillRectangle($brush, [single]($ox + $x * $cell), [single]($oy + $y * $cell), [single]($w * $cell), [single]($h * $cell))
  }
  foreach ($d in @(@(-1, 0), @(1, 0), @(0, -1), @(0, 1))) {
    for ($y = 0; $y -lt 12; $y++) { for ($x = 0; $x -lt 12; $x++) { if ($moon[$y][$x] -eq '#') { Cell $wb ($x + $d[0]) ($y + $d[1]) } } }
  }
  for ($y = 0; $y -lt 12; $y++) { for ($x = 0; $x -lt 12; $x++) { if ($moon[$y][$x] -eq '#') { Cell $pb $x $y } } }
  Cell $wb 3 4 1 2; Cell $wb 8 4 1 2
  Cell $wb 4 7; Cell $wb 7 7; Cell $wb 5 8 2 1
  Cell $bb 1 6 2 1; Cell $bb 9 6 2 1
  # sparkle top right
  Cell $cb 13 -2 1 3; Cell $cb 12 -1 3 1
  $bmp.Save((Join-Path $out $name), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Draw-Icon 512 0.86 'icon-512.png'
Draw-Icon 192 0.86 'icon-192.png'
Draw-Icon 180 0.86 'apple-touch-icon.png'
Draw-Icon 512 0.62 'icon-maskable-512.png'
Get-ChildItem $out | Select-Object Name, Length
